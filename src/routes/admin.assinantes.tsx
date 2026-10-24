import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Search, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Assinante,
  AssinanteDialog,
  PageTitle,
  StatusBadge,
  WaButton,
} from "@/components/admin/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL, formatDate, LABELS, PLANOS, isPlanoId } from "@/lib/ritmo";

export const Route = createFileRoute("/admin/assinantes")({ component: AssinantesPage });

function AssinantesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [planoFilter, setPlanoFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssinante, setEditingAssinante] = useState<Assinante | null>(null);

  const { data: assinantes = [], isLoading } = useQuery({
    queryKey: ["assinantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assinantes")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as Assinante[];
    },
  });

  const filtered = assinantes.filter((a) => {
    const matchesStatus = statusFilter === "todos" || a.status === statusFilter;
    const matchesPlano = planoFilter === "todos" || a.plano === planoFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      a.nome.toLowerCase().includes(term) ||
      (a.email && a.email.toLowerCase().includes(term)) ||
      (a.curso && a.curso.toLowerCase().includes(term)) ||
      (a.instituicao && a.instituicao.toLowerCase().includes(term));
    return matchesStatus && matchesPlano && matchesSearch;
  });

  const handleTogglePagamento = async (a: Assinante) => {
    const novoStatus = a.pagamento_status === "pago" ? "pendente" : "pago";
    const { error } = await supabase
      .from("assinantes")
      .update({ pagamento_status: novoStatus })
      .eq("id", a.id);
    if (error) {
      toast.error("Erro ao alterar status de pagamento.");
      return;
    }
    toast.success(`Pagamento marcado como ${novoStatus}.`);
    qc.invalidateQueries({ queryKey: ["assinantes"] });
  };

  const handleDelete = async (a: Assinante) => {
    if (!window.confirm(`Tem certeza que deseja remover o assinante ${a.nome}? Todas as entregas associadas serão excluídas.`)) {
      return;
    }
    const { error } = await supabase.from("assinantes").delete().eq("id", a.id);
    if (error) {
      toast.error("Erro ao excluir assinante.");
      return;
    }
    toast.success("Assinante removido com sucesso.");
    qc.invalidateQueries({ queryKey: ["assinantes"] });
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Assinantes">
        <Button onClick={() => { setEditingAssinante(null); setDialogOpen(true); }}>
          <Plus className="size-4 mr-2" />
          Novo assinante
        </Button>
      </PageTitle>

      {/* Filtros e Busca */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail, curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {Object.entries(LABELS.assStatus).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={planoFilter} onValueChange={setPlanoFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos planos</SelectItem>
              <SelectItem value="essencial">Essencial</SelectItem>
              <SelectItem value="foco">Foco</SelectItem>
              <SelectItem value="intensivo">Intensivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Assinantes */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Nenhum assinante encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome & Contato</TableHead>
                  <TableHead>Curso / Faculdade</TableHead>
                  <TableHead>Plano & Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mês Atual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const planoInfo = isPlanoId(a.plano) ? PLANOS[a.plano] : null;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-semibold">{a.nome}</div>
                        <div className="text-xs text-muted-foreground">{a.whatsapp}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{a.curso || "Não informado"}</div>
                        <div className="text-xs text-muted-foreground">{a.instituicao || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {planoInfo ? planoInfo.nome : a.plano}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatBRL(a.valor_mensal)}/mês
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        Dia {a.dia_vencimento}
                        <div className="text-xs text-muted-foreground">
                          desde {formatDate(a.data_inicio)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          value={a.status}
                          label={LABELS.assStatus[a.status] ?? a.status}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 px-2 text-xs"
                          onClick={() => handleTogglePagamento(a)}
                          title="Clique para alternar entre Pago e Pendente"
                        >
                          {a.pagamento_status === "pago" ? (
                            <>
                              <CheckCircle2 className="size-3.5 text-success" />
                              <span className="text-success font-medium">Pago</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="size-3.5 text-amber-500" />
                              <span className="text-amber-500 font-medium">Pendente</span>
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <WaButton
                            phone={a.whatsapp}
                            message={`Oi, ${a.nome}! Tudo certo com a sua rotina de estudos esta semana?`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Editar"
                            onClick={() => {
                              setEditingAssinante(a);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            title="Excluir"
                            onClick={() => handleDelete(a)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal de criação / edição */}
      <AssinanteDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingAssinante(null);
        }}
        editing={editingAssinante}
      />
    </div>
  );
}
