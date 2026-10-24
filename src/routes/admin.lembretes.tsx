import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, CheckCircle2, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Assinante, Lembrete, PageTitle } from "@/components/admin/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/ritmo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/lembretes")({ component: LembretesPage });

type LembreteComAssinante = Lembrete & { assinante?: Assinante | null };

export function LembretesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("hoje");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Formulário de novo lembrete
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataHora, setDataHora] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [assinanteId, setAssinanteId] = useState<string>("nenhum");

  const { data: lembretes = [], isLoading } = useQuery({
    queryKey: ["lembretes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lembretes")
        .select("*, assinante:assinantes(*)")
        .order("data_hora", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as LembreteComAssinante[];
    },
  });

  const { data: assinantes = [] } = useQuery({
    queryKey: ["assinantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assinantes")
        .select("id, nome")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleToggleConcluido = async (l: Lembrete) => {
    const { error } = await supabase
      .from("lembretes")
      .update({ concluido: !l.concluido })
      .eq("id", l.id);
    if (error) {
      toast.error("Erro ao atualizar lembrete.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["lembretes"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("lembretes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir lembrete.");
      return;
    }
    toast.success("Lembrete excluído.");
    qc.invalidateQueries({ queryKey: ["lembretes"] });
  };

  const handleSalvar = async () => {
    if (!titulo.trim()) {
      toast.error("O título do lembrete é obrigatório.");
      return;
    }
    setBusy(true);
    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      data_hora: new Date(dataHora).toISOString(),
      assinante_id: assinanteId === "nenhum" ? null : assinanteId,
      concluido: false,
    };
    const { error } = await supabase.from("lembretes").insert(payload);
    setBusy(false);

    if (error) {
      toast.error("Erro ao salvar lembrete.");
      return;
    }

    toast.success("Lembrete criado com sucesso!");
    setTitulo("");
    setDescricao("");
    setAssinanteId("nenhum");
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["lembretes"] });
  };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const atrasados = lembretes.filter(
    (l) => !l.concluido && new Date(l.data_hora) < now && l.data_hora.slice(0, 10) !== todayStr
  );
  const hoje = lembretes.filter(
    (l) => !l.concluido && l.data_hora.slice(0, 10) === todayStr
  );
  const proximos = lembretes.filter(
    (l) => !l.concluido && new Date(l.data_hora) > now && l.data_hora.slice(0, 10) !== todayStr
  );
  const concluidos = lembretes.filter((l) => l.concluido);

  return (
    <div className="space-y-6">
      <PageTitle title="Lembretes">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4 mr-2" /> Novo lembrete
        </Button>
      </PageTitle>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="hoje" className="gap-1.5">
            Hoje <span className="text-xs opacity-75">({hoje.length})</span>
          </TabsTrigger>
          <TabsTrigger value="proximos" className="gap-1.5">
            Próximos <span className="text-xs opacity-75">({proximos.length})</span>
          </TabsTrigger>
          <TabsTrigger value="atrasados" className="gap-1.5 text-destructive data-[state=active]:text-destructive">
            Atrasados <span className="text-xs opacity-75">({atrasados.length})</span>
          </TabsTrigger>
          <TabsTrigger value="concluidos" className="gap-1.5">
            Concluídos <span className="text-xs opacity-75">({concluidos.length})</span>
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="hoje">
              <ListaLembretes
                items={hoje}
                onToggle={handleToggleConcluido}
                onDelete={handleDelete}
                emptyMsg="Nenhum lembrete para hoje."
              />
            </TabsContent>
            <TabsContent value="proximos">
              <ListaLembretes
                items={proximos}
                onToggle={handleToggleConcluido}
                onDelete={handleDelete}
                emptyMsg="Nenhum lembrete futuro agendado."
              />
            </TabsContent>
            <TabsContent value="atrasados">
              <ListaLembretes
                items={atrasados}
                onToggle={handleToggleConcluido}
                onDelete={handleDelete}
                emptyMsg="Nenhum lembrete atrasado! 🎉"
                isAtrasado
              />
            </TabsContent>
            <TabsContent value="concluidos">
              <ListaLembretes
                items={concluidos}
                onToggle={handleToggleConcluido}
                onDelete={handleDelete}
                emptyMsg="Nenhum lembrete concluído ainda."
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Modal Novo Lembrete */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lembrete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Cobrar renovação do plano..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data e Hora *</Label>
              <Input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vincular a um Assinante (Opcional)</Label>
              <Select value={assinanteId} onValueChange={setAssinanteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um assinante..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum (lembrete geral)</SelectItem>
                  {assinantes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição / Detalhes</Label>
              <Textarea
                rows={2}
                placeholder="Observações complementares..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={busy}>
              Criar lembrete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListaLembretes({
  items,
  onToggle,
  onDelete,
  emptyMsg,
  isAtrasado,
}: {
  items: LembreteComAssinante[];
  onToggle: (l: Lembrete) => void;
  onDelete: (id: string) => void;
  emptyMsg: string;
  isAtrasado?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card/40">
        {emptyMsg}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((l) => (
        <div
          key={l.id}
          className={cn(
            "flex items-start justify-between gap-3 rounded-2xl border p-4 bg-card shadow-xs transition-all",
            isAtrasado
              ? "border-destructive/40 bg-destructive/5"
              : l.concluido
              ? "opacity-60 bg-muted/20"
              : "border-border"
          )}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggle(l)}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                l.concluido
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/40 hover:border-primary"
              )}
            >
              {l.concluido && <Check className="size-3.5" />}
            </button>
            <div className="space-y-1">
              <div
                className={cn(
                  "font-semibold text-sm leading-tight",
                  l.concluido && "line-through text-muted-foreground"
                )}
              >
                {l.titulo}
              </div>
              {l.descricao && (
                <p className="text-xs text-muted-foreground">{l.descricao}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {isAtrasado ? (
                    <AlertTriangle className="size-3.5 text-destructive" />
                  ) : (
                    <Clock className="size-3.5" />
                  )}
                  {formatDateTime(l.data_hora)}
                </span>
                {l.assinante && (
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    Assinante: {l.assinante.nome}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(l.id)}
            title="Excluir lembrete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
