import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  DIFICULDADES,
  INSTITUICOES,
  LABELS,
  PLANOS,
  PLANO_IDS,
  formatBRL,
  isPlanoId,
  maskWhatsapp,
  type PlanoId,
} from "@/lib/ritmo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/montar-plano")({
  validateSearch: (s: Record<string, unknown>): { plano?: PlanoId } => ({
    plano: isPlanoId(s.plano) ? s.plano : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Monte seu plano de estudos | Ritmo" },
      {
        name: "description",
        content: "Conte sua rotina de faculdade, idiomas e cursos em 4 passos e receba um plano de estudos semanal personalizado.",
      },
      { property: "og:title", content: "Monte seu plano de estudos | Ritmo" },
      { property: "og:description", content: "Conte sua rotina em 4 passos e receba um plano semanal no WhatsApp." },
    ],
  }),
  component: MontarPlano,
});

const req = (m = "Campo obrigatório") => z.string().trim().min(1, m);
const schema = z
  .object({
    nome: req("Informe seu nome completo").min(3, "Nome muito curto").max(120),
    whatsapp: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "WhatsApp inválido. Ex.: (34) 99999-9999"),
    email: req("Informe seu e-mail").email("E-mail inválido").max(255),
    instituicao: req("Selecione a instituição"),
    instituicao_outra: z.string().max(120).optional(),
    curso: req("Informe seu curso").max(120),
    periodo: req("Selecione o período"),
    turno: req("Selecione o turno"),
    faz_idioma: z.enum(["sim", "nao"]),
    idioma_detalhes: z.string().max(300).optional(),
    cursos_complementares: z.string().max(500).optional(),
    trabalha: z.enum(["sim", "nao"]),
    horas_trabalho: z.string().optional(),
    horas_livres: z.number().min(1).max(6),
    dificuldades: z.array(z.string()).min(1, "Escolha pelo menos uma dificuldade"),
    proximas_provas: z.string().max(1000).optional(),
    objetivo: req("Conte seu objetivo principal").max(300),
    horario_checkin: req("Escolha um horário"),
    plano: z.enum(["essencial", "foco", "intensivo"], { required_error: "Escolha um plano" }),
    consentimento: z.boolean().refine((v) => v, "É preciso concordar para continuar"),
  })
  .superRefine((v, ctx) => {
    if (v.instituicao === "Outra" && !v.instituicao_outra?.trim())
      ctx.addIssue({ code: "custom", path: ["instituicao_outra"], message: "Informe a instituição" });
    if (v.faz_idioma === "sim" && !v.idioma_detalhes?.trim())
      ctx.addIssue({ code: "custom", path: ["idioma_detalhes"], message: "Informe o idioma e os dias" });
    if (v.trabalha === "sim") {
      const h = Number(v.horas_trabalho);
      if (!v.horas_trabalho || !Number.isInteger(h) || h < 1 || h > 80)
        ctx.addIssue({ code: "custom", path: ["horas_trabalho"], message: "Informe as horas por semana (1 a 80)" });
    }
  });
type FormData = z.infer<typeof schema>;

const STEPS: { title: string; fields: FieldPath<FormData>[] }[] = [
  { title: "Sobre você", fields: ["nome", "whatsapp", "email", "instituicao", "instituicao_outra", "curso", "periodo"] },
  { title: "Sua rotina", fields: ["turno", "faz_idioma", "idioma_detalhes", "cursos_complementares", "trabalha", "horas_trabalho", "horas_livres"] },
  { title: "Seus objetivos", fields: ["dificuldades", "proximas_provas", "objetivo", "horario_checkin"] },
  { title: "Seu plano", fields: ["plano", "consentimento"] },
];

function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="font-semibold">
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Choice({ options, value, onChange }: { options: { v: string; l: string }[]; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors",
            value === o.v ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:border-primary/40",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function MontarPlano() {
  const { plano } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      nome: "",
      whatsapp: "",
      email: "",
      instituicao: "",
      instituicao_outra: "",
      curso: "",
      periodo: "",
      turno: "",
      faz_idioma: "nao",
      idioma_detalhes: "",
      cursos_complementares: "",
      trabalha: "nao",
      horas_trabalho: "",
      horas_livres: 2,
      dificuldades: [],
      proximas_provas: "",
      objetivo: "",
      horario_checkin: "",
      plano: plano ?? "foco",
      consentimento: false,
    },
  });
  const { register, control, watch, formState: { errors }, trigger, handleSubmit } = form;
  const v = watch();

  const next = async () => {
    const ok = await trigger(STEPS[step].fields);
    if (ok) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = async (d: FormData) => {
    setSending(true);
    const instituicao = d.instituicao === "Outra" ? d.instituicao_outra!.trim() : d.instituicao;
    const { error } = await supabase.from("leads").insert({
      nome: d.nome.trim(),
      whatsapp: d.whatsapp,
      email: d.email.trim(),
      instituicao,
      curso: d.curso.trim(),
      periodo: Number(d.periodo),
      turno: d.turno,
      faz_idioma: d.faz_idioma === "sim",
      idioma_detalhes: d.faz_idioma === "sim" ? d.idioma_detalhes?.trim() : null,
      cursos_complementares: d.cursos_complementares?.trim() || null,
      trabalha: d.trabalha === "sim",
      horas_trabalho: d.trabalha === "sim" ? Number(d.horas_trabalho) : null,
      horas_livres: d.horas_livres,
      dificuldades: d.dificuldades,
      proximas_provas: d.proximas_provas?.trim() || null,
      objetivo: d.objetivo.trim(),
      horario_checkin: d.horario_checkin,
      plano_interesse: d.plano,
      consentimento_lgpd: d.consentimento,
    });
    setSending(false);
    if (error) {
      toast.error("Não foi possível enviar agora. Tente de novo em instantes.");
      return;
    }
    navigate({
      to: "/obrigado",
      state: {
        lead: {
          nome: d.nome.trim(),
          curso: d.curso.trim(),
          periodo: Number(d.periodo),
          instituicao,
          plano: d.plano,
          horas_livres: d.horas_livres,
          dificuldades: d.dificuldades,
          proximas_provas: d.proximas_provas,
        },
      },
    });
  };

  return (
    <PublicLayout>
      <section className="bg-soft">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <h1 className="text-center text-3xl font-extrabold md:text-4xl">Monte seu plano</h1>
          <p className="mt-2 text-center text-muted-foreground">Leva uns 3 minutos. Quanto mais detalhes, melhor o plano.</p>

          <div className="mt-8">
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span className="text-primary">
                Etapa {step + 1} de 4 · {STEPS[step].title}
              </span>
              <span className="text-muted-foreground">{Math.round(((step + 1) / 4) * 100)}%</span>
            </div>
            <Progress value={((step + 1) / 4) * 100} className="h-2" />
            <ol className="mt-3 hidden grid-cols-4 gap-2 sm:grid">
              {STEPS.map((s, i) => (
                <li key={s.title} className={cn("text-center text-xs", i <= step ? "font-semibold text-primary" : "text-muted-foreground")}>
                  {s.title}
                </li>
              ))}
            </ol>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 space-y-6 rounded-3xl bg-card p-6 shadow-soft md:p-8"
            noValidate
          >
            {step === 0 && (
              <>
                <Field label="Nome completo *" error={errors.nome?.message} htmlFor="nome">
                  <Input id="nome" autoComplete="name" {...register("nome")} />
                </Field>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="WhatsApp *" error={errors.whatsapp?.message} htmlFor="whatsapp">
                    <Controller
                      control={control}
                      name="whatsapp"
                      render={({ field }) => (
                        <Input
                          id="whatsapp"
                          inputMode="tel"
                          placeholder="(34) 99999-9999"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(e) => field.onChange(maskWhatsapp(e.target.value))}
                        />
                      )}
                    />
                  </Field>
                  <Field label="E-mail *" error={errors.email?.message} htmlFor="email">
                    <Input id="email" type="email" autoComplete="email" {...register("email")} />
                  </Field>
                </div>
                <Field label="Instituição *" error={errors.instituicao?.message}>
                  <Controller
                    control={control}
                    name="instituicao"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {INSTITUICOES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                {v.instituicao === "Outra" && (
                  <Field label="Qual instituição? *" error={errors.instituicao_outra?.message} htmlFor="inst_outra">
                    <Input id="inst_outra" {...register("instituicao_outra")} />
                  </Field>
                )}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Curso *" error={errors.curso?.message} htmlFor="curso">
                    <Input id="curso" placeholder="Ex.: Engenharia Civil" {...register("curso")} />
                  </Field>
                  <Field label="Período *" error={errors.periodo?.message}>
                    <Controller
                      control={control}
                      name="periodo"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => (
                              <SelectItem key={i} value={String(i + 1)}>{i + 1}º período</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Turno da faculdade *" error={errors.turno?.message}>
                  <Controller control={control} name="turno" render={({ field }) => (
                    <Choice value={field.value} onChange={field.onChange}
                      options={Object.entries(LABELS.turno).map(([k, l]) => ({ v: k, l }))} />
                  )} />
                </Field>
                <Field label="Faz curso de idiomas?">
                  <Controller control={control} name="faz_idioma" render={({ field }) => (
                    <Choice value={field.value} onChange={field.onChange} options={[{ v: "sim", l: "Sim" }, { v: "nao", l: "Não" }]} />
                  )} />
                </Field>
                {v.faz_idioma === "sim" && (
                  <Field label="Qual idioma e em quais dias? *" error={errors.idioma_detalhes?.message} htmlFor="idioma">
                    <Input id="idioma" placeholder="Ex.: Inglês, terça e quinta" {...register("idioma_detalhes")} />
                  </Field>
                )}
                <Field label="Cursos complementares online" error={errors.cursos_complementares?.message} htmlFor="cc">
                  <Textarea id="cc" placeholder="Ex.: Alura de React, curso de SQL" {...register("cursos_complementares")} />
                </Field>
                <Field label="Trabalha ou faz estágio?">
                  <Controller control={control} name="trabalha" render={({ field }) => (
                    <Choice value={field.value} onChange={field.onChange} options={[{ v: "sim", l: "Sim" }, { v: "nao", l: "Não" }]} />
                  )} />
                </Field>
                {v.trabalha === "sim" && (
                  <Field label="Quantas horas por semana? *" error={errors.horas_trabalho?.message} htmlFor="ht">
                    <Input id="ht" type="number" min={1} max={80} {...register("horas_trabalho")} />
                  </Field>
                )}
                <Field label={`Horas livres por dia para estudar *: ${v.horas_livres}h`}>
                  <Controller control={control} name="horas_livres" render={({ field }) => (
                    <Slider min={1} max={6} step={1} value={[field.value]} onValueChange={(x) => field.onChange(x[0])} className="py-2" />
                  )} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>1h</span><span>6h</span></div>
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Maiores dificuldades *" error={errors.dificuldades?.message}>
                  <Controller control={control} name="dificuldades" render={({ field }) => (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {DIFICULDADES.map((d) => {
                        const on = field.value.includes(d);
                        return (
                          <button type="button" key={d}
                            onClick={() => field.onChange(on ? field.value.filter((x) => x !== d) : [...field.value, d])}
                            className={cn("flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium capitalize transition-colors",
                              on ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/40")}>
                            <span className={cn("grid size-5 place-items-center rounded-md border-2", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                              {on && <Check className="size-3" />}
                            </span>
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  )} />
                </Field>
                <Field label="Próximas provas ou entregas" error={errors.proximas_provas?.message} htmlFor="pp">
                  <Textarea id="pp" placeholder="Ex.: Cálculo II em 05/11, trabalho de Física em 12/11" {...register("proximas_provas")} />
                </Field>
                <Field label="Objetivo principal do semestre *" error={errors.objetivo?.message} htmlFor="obj">
                  <Input id="obj" placeholder="Ex.: Passar em Cálculo II sem exame" {...register("objetivo")} />
                </Field>
                <Field label="Melhor horário para check-in *" error={errors.horario_checkin?.message}>
                  <Controller control={control} name="horario_checkin" render={({ field }) => (
                    <Choice value={field.value} onChange={field.onChange}
                      options={Object.entries(LABELS.horario).map(([k, l]) => ({ v: k, l }))} />
                  )} />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Escolha o plano *" error={errors.plano?.message}>
                  <Controller control={control} name="plano" render={({ field }) => (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {PLANO_IDS.map((id) => (
                        <button type="button" key={id} onClick={() => field.onChange(id)}
                          className={cn("rounded-2xl border-2 p-4 text-left transition-all",
                            field.value === id ? "border-primary bg-primary-soft shadow-elegant" : "border-border hover:border-primary/40")}>
                          <p className="font-display font-bold">{PLANOS[id].nome}</p>
                          <p className="text-lg font-extrabold text-primary">{formatBRL(PLANOS[id].preco)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                          <p className="mt-1 text-xs text-muted-foreground">{PLANOS[id].itens.at(-1)}</p>
                        </button>
                      ))}
                    </div>
                  )} />
                </Field>
                <div className="rounded-2xl bg-muted p-5 text-sm">
                  <p className="mb-3 font-display font-bold">Resumo</p>
                  <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                    {[
                      ["Nome", v.nome],
                      ["WhatsApp", v.whatsapp],
                      ["E-mail", v.email],
                      ["Instituição", v.instituicao === "Outra" ? v.instituicao_outra : v.instituicao],
                      ["Curso", `${v.curso} · ${v.periodo}º período`],
                      ["Turno", LABELS.turno[v.turno]],
                      ["Idiomas", v.faz_idioma === "sim" ? v.idioma_detalhes : "Não"],
                      ["Trabalho", v.trabalha === "sim" ? `${v.horas_trabalho}h/semana` : "Não"],
                      ["Horas livres/dia", `${v.horas_livres}h`],
                      ["Check-in", LABELS.horario[v.horario_checkin]],
                      ["Dificuldades", v.dificuldades.join(", ")],
                      ["Objetivo", v.objetivo],
                    ].map(([k, val]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="font-medium">{val || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="space-y-2">
                  <Controller control={control} name="consentimento" render={({ field }) => (
                    <label className="flex cursor-pointer items-start gap-3 text-sm">
                      <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} className="mt-0.5" />
                      <span>Concordo em ser contatado pelo WhatsApp e com o uso dos meus dados para montar meu plano (LGPD).</span>
                    </label>
                  )} />
                  {errors.consentimento && <p className="text-sm text-destructive">{errors.consentimento.message}</p>}
                </div>
              </>
            )}

            <div className="flex justify-between gap-3 pt-2">
              {step > 0 ? (
                <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft /> Voltar
                </Button>
              ) : <span />}
              {step < 3 ? (
                <Button type="button" variant="hero" size="xl" onClick={next}>
                  Continuar <ArrowRight />
                </Button>
              ) : (
                <Button type="submit" variant="hero" size="xl" disabled={sending}>
                  {sending ? <Loader2 className="animate-spin" /> : <Check />} Enviar minha rotina
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
