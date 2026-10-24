import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlarmClockOff,
  BellRing,
  CalendarCheck,
  Check,
  ClipboardList,
  Layers,
  MessageCircle,
  PauseCircle,
  RefreshCw,
  Sparkles,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicLayout, Reveal } from "@/components/site/SiteChrome";
import { PLANOS, PLANO_IDS, formatBRL } from "@/lib/ritmo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ritmo — Plano de estudos semanal com acompanhamento no WhatsApp" },
      {
        name: "description",
        content:
          "Universitário em Uberlândia? Receba toda semana um plano de estudos feito para a sua rotina e check-ins no WhatsApp. A partir de R$ 29,90/mês.",
      },
      { property: "og:title", content: "Ritmo — Faculdade, inglês e cursos no mesmo ritmo" },
      {
        property: "og:description",
        content: "Plano de estudos semanal personalizado + acompanhamento no WhatsApp para universitários.",
      },
    ],
  }),
  component: Index,
});

function HeroMockup() {
  const dias = [
    { d: "Seg", t: "Revisar Cálculo — cap. 4", ok: true },
    { d: "Ter", t: "Inglês: listening 30 min", ok: true },
    { d: "Qua", t: "Alura React — aulas 4 a 6", ok: false },
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="animate-float rounded-3xl bg-card p-6 text-card-foreground shadow-elegant">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display font-bold">Plano da semana</p>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">26/10 – 01/11</span>
        </div>
        <ul className="space-y-3">
          {dias.map((x) => (
            <li key={x.d} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-2",
                  x.ok ? "border-success bg-success text-success-foreground" : "border-border",
                )}
              >
                {x.ok && <Check className="size-3.5" />}
              </span>
              <span className="w-9 text-xs font-bold text-primary">{x.d}</span>
              <span className={cn("text-sm", x.ok && "text-muted-foreground line-through")}>{x.t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 rounded-full bg-hero" />
        </div>
      </div>
      <div className="absolute -bottom-8 -left-4 max-w-[240px] rounded-2xl rounded-bl-sm bg-card p-3 shadow-soft sm:-left-10">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-success">
          <MessageCircle className="size-3.5" /> Ritmo · agora
        </div>
        <p className="text-sm text-card-foreground">E aí, conseguiu revisar Cálculo hoje? 💪</p>
      </div>
    </div>
  );
}

const DORES = [
  { icon: Layers, t: "Matéria acumulando", d: "Quando você percebe, são três capítulos para a mesma prova." },
  { icon: AlarmClockOff, t: "Prazo esquecido", d: "A entrega era ontem e ninguém te avisou." },
  { icon: PauseCircle, t: "Curso extra parado na aula 3", d: "Você comprou com empolgação e nunca mais abriu." },
];
const PASSOS = [
  { icon: ClipboardList, t: "Conte sua rotina", d: "Preencha um formulário rápido com aulas, cursos, trabalho e objetivos." },
  { icon: CalendarCheck, t: "Receba seu plano semanal", d: "Toda segunda chega no seu WhatsApp um plano feito para a sua semana." },
  { icon: MessageCircle, t: "Check-ins para manter o ritmo", d: "A gente cobra (com carinho) para você não deixar nada para trás." },
];
const RECEBE = [
  { icon: Sparkles, t: "Plano semanal personalizado", d: "Montado a partir da sua grade, não de um modelo pronto." },
  { icon: BellRing, t: "Lembretes de provas e entregas", d: "Nada de ser pego de surpresa." },
  { icon: MessageCircle, t: "Check-ins no WhatsApp", d: "Alguém de verdade acompanhando seu progresso." },
  { icon: RefreshCw, t: "Ajuste toda semana", d: "Semana puxada? O plano se adapta." },
];
const FAQ = [
  { q: "Como pago?", a: "Por Pix, com link enviado pelo WhatsApp depois da conversa." },
  { q: "Posso cancelar?", a: "Sim, a qualquer momento, sem multa." },
  { q: "Serve para qualquer curso?", a: "Sim, o plano é montado a partir da sua grade." },
  { q: "Preciso instalar algum app?", a: "Não, tudo acontece pelo WhatsApp." },
  {
    q: "Quem monta o plano?",
    a: "Uma pessoa de verdade: um estudante de Ciência da Computação que vive essa mesma rotina.",
  },
];

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-extrabold md:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Index() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="size-4 text-accent" /> Para universitários de Uberlândia
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] md:text-6xl">
              Faculdade, inglês e cursos no mesmo ritmo.
            </h1>
            <p className="mt-6 max-w-lg text-lg opacity-90">
              Receba toda semana um plano de estudos feito para a sua rotina e um acompanhamento no WhatsApp para não
              deixar nada para trás.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="accent" size="xl">
                <Link to="/montar-plano">Montar meu plano</Link>
              </Button>
              <Button asChild variant="heroLight" size="xl">
                <a href="#planos">Ver planos</a>
              </Button>
            </div>
          </div>
          <div className="pb-10">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* Dor */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle eyebrow="Soa familiar?" title="O semestre não espera você se organizar" />
        <div className="grid gap-6 md:grid-cols-3">
          {DORES.map((x, i) => (
            <Reveal key={x.t} delay={i * 100}>
              <article className="card-lift h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                <span className="mb-4 grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                  <x.icon />
                </span>
                <h3 className="text-lg font-bold">{x.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-soft py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle eyebrow="Como funciona" title="Três passos para entrar no ritmo" />
          <ol className="grid gap-6 md:grid-cols-3">
            {PASSOS.map((p, i) => (
              <Reveal key={p.t} delay={i * 100}>
                <li className="card-lift relative h-full rounded-2xl bg-card p-6 shadow-soft">
                  <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-primary/10">{i + 1}</span>
                  <span className="mb-4 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <p.icon />
                  </span>
                  <h3 className="text-lg font-bold">{p.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* O que recebe */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle eyebrow="O que você recebe" title="Tudo o que você precisa para não travar" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RECEBE.map((x, i) => (
            <Reveal key={x.t} delay={i * 80}>
              <article className="card-lift h-full rounded-2xl border border-border bg-card p-6">
                <span className="mb-4 grid size-11 place-items-center rounded-xl bg-accent/20 text-accent-foreground">
                  <x.icon className="size-5" />
                </span>
                <h3 className="font-bold">{x.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="scroll-mt-20 bg-night py-20 text-night-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Planos</p>
            <h2 className="text-3xl font-extrabold md:text-4xl">Escolha o seu ritmo</h2>
            <p className="mt-4 opacity-70">Sem fidelidade. Cancele quando quiser.</p>
          </div>
          <div className="grid items-stretch gap-6 md:grid-cols-3">
            {PLANO_IDS.map((id, i) => {
              const p = PLANOS[id];
              const destaque = id === "foco";
              return (
                <Reveal key={id} delay={i * 100}>
                  <article
                    className={cn(
                      "card-lift relative flex h-full flex-col rounded-3xl bg-card p-7 text-card-foreground",
                      destaque && "ring-4 ring-primary md:-translate-y-3",
                    )}
                  >
                    {destaque && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground hover:bg-accent">
                        Mais escolhido
                      </Badge>
                    )}
                    <h3 className="text-xl font-bold">{p.nome}</h3>
                    <p className="text-sm text-muted-foreground">{p.descricao}</p>
                    <p className="mt-5">
                      <span className="font-display text-4xl font-extrabold">{formatBRL(p.preco)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </p>
                    <ul className="my-6 flex-1 space-y-3">
                      {p.itens.map((it) => (
                        <li key={it} className="flex gap-2 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" /> {it}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant={destaque ? "hero" : "heroOutline"} size="xl">
                      <Link to="/montar-plano" search={{ plano: id }}>
                        Quero este
                      </Link>
                    </Button>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle eyebrow="Depoimentos" title="Como é ter alguém no seu pé (do jeito bom)" />
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              n: "Estudante de Engenharia, 3º período",
              t: "Eu fazia inglês, estágio e ainda tentava um curso de Python. Com o plano semanal, finalmente terminei o curso.",
            },
            {
              n: "Estudante de Direito, 6º período",
              t: "A mensagem de check-in na quarta é o que me faz abrir o caderno. Parei de deixar tudo para a véspera.",
            },
          ].map((d, i) => (
            <Reveal key={i} delay={i * 100}>
              <figure className="h-full rounded-2xl border border-dashed border-border bg-card p-6">
                <Badge variant="outline" className="mb-4 text-muted-foreground">
                  Exemplo ilustrativo
                </Badge>
                <Quote className="mb-2 size-6 text-primary/40" />
                <blockquote className="text-foreground">{d.t}</blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">— {d.n}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-soft py-20">
        <div className="mx-auto max-w-3xl px-4">
          <SectionTitle eyebrow="FAQ" title="Perguntas frequentes" />
          <Accordion type="single" collapsible className="rounded-2xl bg-card px-6 shadow-soft">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="rounded-3xl bg-hero px-6 py-14 text-center text-primary-foreground shadow-elegant">
          <h2 className="text-3xl font-extrabold md:text-4xl">Bora colocar o semestre no ritmo?</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">Leva 3 minutos para contar sua rotina. O resto é com a gente.</p>
          <Button asChild variant="accent" size="xl" className="mt-8">
            <Link to="/montar-plano">Montar meu plano</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
