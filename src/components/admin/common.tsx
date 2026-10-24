import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LABELS, PLANOS, PLANO_IDS, isPlanoId, maskWhatsapp, toISODate, waLink } from "@/lib/ritmo";
import { cn } from "@/lib/utils";

export type Lead = Tables<"leads">;
export type Assinante = Tables<"assinantes">;
export type Entrega = Tables<"entregas">;
export type Lembrete = Tables<"lembretes">;

const TONES: Record<string, string> = {
  novo: "bg-primary-soft text-primary",
  em_contato: "bg-accent/25 text-accent-foreground",
  convertido: "bg-success/15 text-success",
  perdido: "bg-muted text-muted-foreground",
  ativo: "bg-success/15 text-success",
  pausado: "bg-accent/25 text-accent-foreground",
  cancelado: "bg-destructive/10 text-destructive",
  pago: "bg-success/15 text-success",
  pendente: "bg-accent/25 text-accent-foreground",
  feito: "bg-success/15 text-success",
  sem_resposta: "bg-destructive/10 text-destructive",
};
export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", TONES[value])}>
      {label ?? value}
    </Badge>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function WaButton({ phone, message, size = "icon" }: { phone: string; message: string; size?: "icon" | "sm" }) {
  return (
    <Button asChild variant="outline" size={size} className="text-success" title="Abrir WhatsApp">
      <a href={waLink(phone, message)} target="_blank" rel="noopener noreferrer">
        <MessageCircle /> {size === "sm" && "Abrir WhatsApp"}
      </a>
    </Button>
  );
}

type AssForm = Omit<TablesInsert<"assinantes">, "valor_mensal" | "dia_vencimento"> & {
  valor_mensal: string;
  dia_vencimento: string;
};

function emptyForm(): AssForm {
  return {
    nome: "",
    whatsapp: "",
    email: "",
    instituicao: "",
    curso: "",
    plano: "foco",
    valor_mensal: String(PLANOS.foco.preco),
    data_inicio: toISODate(new Date()),
    dia_vencimento: String(new Date().getDate()),
    status: "ativo",
    pagamento_status: "pendente",
    horario_checkin: null,
    observacoes: "",
    lead_id: null,
  };
}

export function leadToAssinante(l: Lead): Partial<AssForm> {
  const plano = isPlanoId(l.plano_interesse) ? l.plano_interesse : "foco";
  return {
    lead_id: l.id,
    nome: l.nome,
    whatsapp: l.whatsapp,
    email: l.email,
    instituicao: l.instituicao,
    curso: l.curso,
    plano,
    valor_mensal: String(PLANOS[plano].preco),
    horario_checkin: l.horario_checkin,
  };
}

export function AssinanteDialog({
  open,
  onOpenChange,
  editing,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: Assinante | null;
  initial?: Partial<AssForm>;
  onSaved?: (a: Assinante) => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState<AssForm>(emptyForm());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) setF({ ...editing, valor_mensal: String(editing.valor_mensal), dia_vencimento: String(editing.dia_vencimento) });
    else setF({ ...emptyForm(), ...initial });
  }, [open, editing, initial]);

  const set = <K extends keyof AssForm>(k: K, v: AssForm[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    const valor = Number(String(f.valor_mensal).replace(",", "."));
    const dia = Number(f.dia_vencimento);
    if (!f.nome?.trim() || !f.whatsapp?.trim()) return toast.error("Nome e WhatsApp são obrigatórios.");
    if (!Number.isFinite(valor) || valor < 0) return toast.error("Valor mensal inválido.");
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) return toast.error("Dia de vencimento deve ser de 1 a 31.");
    setBusy(true);
    const payload = { ...f, valor_mensal: valor, dia_vencimento: dia };
    delete (payload as Partial<Assinante>).id;
    delete (payload as Partial<Assinante>).created_at;
    const res = editing
      ? await supabase.from("assinantes").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("assinantes").insert(payload).select().single();
    setBusy(false);
    if (res.error) {
      toast.error(res.error.code === "23505" ? "Este lead já foi convertido." : "Erro ao salvar assinante.");
      return;
    }
    toast.success(editing ? "Assinante atualizado." : "Assinante criado.");
    qc.invalidateQueries({ queryKey: ["assinantes"] });
    onSaved?.(res.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar assinante" : f.lead_id ? "Converter em assinante" : "Novo assinante"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Nome *"><Input value={f.nome ?? ""} onChange={(e) => set("nome", e.target.value)} /></F>
          <F label="WhatsApp *"><Input value={f.whatsapp ?? ""} onChange={(e) => set("whatsapp", maskWhatsapp(e.target.value))} /></F>
          <F label="E-mail"><Input value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></F>
          <F label="Instituição"><Input value={f.instituicao ?? ""} onChange={(e) => set("instituicao", e.target.value)} /></F>
          <F label="Curso"><Input value={f.curso ?? ""} onChange={(e) => set("curso", e.target.value)} /></F>
          <F label="Plano">
            <Select value={f.plano} onValueChange={(v) => { set("plano", v); if (isPlanoId(v)) set("valor_mensal", String(PLANOS[v].preco)); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PLANO_IDS.map((p) => <SelectItem key={p} value={p}>{PLANOS[p].nome}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Valor mensal (R$)"><Input inputMode="decimal" value={f.valor_mensal} onChange={(e) => set("valor_mensal", e.target.value)} /></F>
          <F label="Data de início"><Input type="date" value={f.data_inicio ?? ""} onChange={(e) => set("data_inicio", e.target.value)} /></F>
          <F label="Dia de vencimento"><Input type="number" min={1} max={31} value={f.dia_vencimento} onChange={(e) => set("dia_vencimento", e.target.value)} /></F>
          <F label="Status">
            <Select value={f.status ?? "ativo"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(LABELS.assStatus).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Pagamento do mês">
            <Select value={f.pagamento_status ?? "pendente"} onValueChange={(v) => set("pagamento_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(LABELS.pagamento).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Horário de check-in">
            <Select value={f.horario_checkin ?? ""} onValueChange={(v) => set("horario_checkin", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{Object.entries(LABELS.horario).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <div className="sm:col-span-2">
            <F label="Observações"><Textarea value={f.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} /></F>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>{f.lead_id && !editing ? "Confirmar conversão" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}
