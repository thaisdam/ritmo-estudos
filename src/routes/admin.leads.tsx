import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Eye, Loader2, MessageCircle, Search, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AssinanteDialog,
  Lead,
  PageTitle,
  StatusBadge,
  WaButton,
  leadToAssinante,
} from "@/components/admin/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, LABELS, PLANOS, isPlanoId } from "@/lib/ritmo";

export const Route = createFileRoute("/admin/leads")({ component: LeadsPage });

function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [anotacoes, setAnotacoes] = useState("");
  const [savingAnotacoes, setSavingAnotacoes] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = statusFilter === "todos" || l.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      l.nome.toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term) ||
      l.curso.toLowerCase().includes(term) ||
      l.instituicao.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setAnotacoes(lead.anotacoes || "");
  };

  const handleUpdateStatus = async (leadId: string, novoStatus: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ status: novoStatus })
      .eq("id", leadId);
    if (error) {
      toast.error("Erro ao atualizar status do lead.");
      return;
    }
    toast.success("Status atualizado!");
    qc.invalidateQueries({ queryKey: ["leads"] });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: novoStatus });
    }
  };

  const handleSaveAnotacoes = async () => {
    if (!selectedLead) return;
    setSavingAnotacoes(true);
    const { error } = await supabase
      .from("leads")
      .update({ anotacoes })
      .eq("id", selectedLead.id);
    setSavingAnotacoes(false);
    if (error) {
      toast.error("Erro ao salvar anotações.");
      return;
    }
    toast.success("Anotações salvas com sucesso!");
    qc.invalidateQueries({ queryKey: ["leads"] });
    setSelectedLead({ ...selectedLead, anotacoes });
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Leads">
        <span className="text-sm text-muted-foreground self-center">
          Total: {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
        </span>
      </PageTitle>

      {/* Filtros e Busca */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail, curso ou instituição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(LABELS.leadStatus).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Leads */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Nenhum lead encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Instituição / Curso</TableHead>
                  <TableHead>Plano de interesse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const planoInfo = isPlanoId(lead.plano_interesse)
                    ? PLANOS[lead.plano_interesse]
                    : null;
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(lead.created_at)}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {lead.nome}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.instituicao} · {lead.curso} ({lead.periodo}º)
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">
                          {planoInfo ? planoInfo.nome : lead.plano_interesse}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          value={lead.status}
                          label={LABELS.leadStatus[lead.status] ?? lead.status}
                        />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <WaButton
                            phone={lead.whatsapp}
                            message={`Oi, ${lead.nome}! Aqui é do Ritmo. Vi que você montou seu plano de estudos no nosso site!`}
                          />
                          {lead.status !== "convertido" && (
                            <Button
                              size="icon"
                              variant="outline"
                              title="Converter em assinante"
                              onClick={() => setConvertingLead(lead)}
                            >
                              <UserCheck className="size-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Ver detalhes"
                            onClick={() => handleOpenLead(lead)}
                          >
                            <Eye className="size-4" />
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

      {/* Detalhes do Lead (Sheet) */}
      <Sheet open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <SheetContent className="max-h-screen overflow-y-auto sm:max-w-md">
          {selectedLead && (
            <div className="space-y-6 py-2">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold">{selectedLead.nome}</SheetTitle>
                <div className="flex items-center gap-2 pt-1">
                  <StatusBadge
                    value={selectedLead.status}
                    label={LABELS.leadStatus[selectedLead.status] ?? selectedLead.status}
                  />
                  <span className="text-xs text-muted-foreground">
                    Cadastrado em {formatDateTime(selectedLead.created_at)}
                  </span>
                </div>
              </SheetHeader>

              <div className="space-y-4 text-sm divide-y divide-border">
                {/* Contato & Identificação */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Contato & Faculdade
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">WhatsApp:</span>{" "}
                      <span className="font-medium">{selectedLead.whatsapp}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">E-mail:</span>{" "}
                      <span className="font-medium break-all">{selectedLead.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Instituição:</span>{" "}
                      <span className="font-medium">{selectedLead.instituicao}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Curso:</span>{" "}
                      <span className="font-medium">{selectedLead.curso} ({selectedLead.periodo}º)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Turno:</span>{" "}
                      <span className="font-medium">{LABELS.turno[selectedLead.turno] ?? selectedLead.turno}</span>
                    </div>
                  </div>
                </div>

                {/* Rotina de Estudos */}
                <div className="space-y-2 pt-4">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Rotina & Disponibilidade
                  </h3>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <p>
                      <strong className="text-muted-foreground">Horas livres/dia:</strong>{" "}
                      {selectedLead.horas_livres}h
                    </p>
                    <p>
                      <strong className="text-muted-foreground">Trabalha/estágio:</strong>{" "}
                      {selectedLead.trabalha
                        ? `Sim (${selectedLead.horas_trabalho ?? 0}h/semana)`
                        : "Não"}
                    </p>
                    <p>
                      <strong className="text-muted-foreground">Curso de idioma:</strong>{" "}
                      {selectedLead.faz_idioma
                        ? `Sim (${selectedLead.idioma_detalhes || "não detalhado"})`
                        : "Não"}
                    </p>
                    {selectedLead.cursos_complementares && (
                      <p>
                        <strong className="text-muted-foreground">Cursos extras:</strong>{" "}
                        {selectedLead.cursos_complementares}
                      </p>
                    )}
                    <p>
                      <strong className="text-muted-foreground">Melhor horário check-in:</strong>{" "}
                      {LABELS.horario[selectedLead.horario_checkin] ?? selectedLead.horario_checkin}
                    </p>
                  </div>
                </div>

                {/* Objetivos e Dificuldades */}
                <div className="space-y-2 pt-4">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Objetivos & Dificuldades
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div>
                      <strong className="text-muted-foreground">Dificuldades relatadas:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLead.dificuldades?.map((dif) => (
                          <span
                            key={dif}
                            className="inline-block rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                          >
                            {dif}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedLead.proximas_provas && (
                      <p>
                        <strong className="text-muted-foreground">Próximas provas:</strong>{" "}
                        {selectedLead.proximas_provas}
                      </p>
                    )}
                    <p>
                      <strong className="text-muted-foreground">Objetivo principal:</strong>{" "}
                      {selectedLead.objetivo}
                    </p>
                  </div>
                </div>

                {/* Status e Ações */}
                <div className="space-y-3 pt-4">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Gerenciar Lead
                  </h3>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Alterar Status</label>
                    <Select
                      value={selectedLead.status}
                      onValueChange={(val) => handleUpdateStatus(selectedLead.id, val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LABELS.leadStatus).map(([k, l]) => (
                          <SelectItem key={k} value={k}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Anotações internas</label>
                    <Textarea
                      rows={3}
                      value={anotacoes}
                      onChange={(e) => setAnotacoes(e.target.value)}
                      placeholder="Ex: Aluno tem prova de Cálculo semana que vem, fechar plano Foco..."
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveAnotacoes}
                      disabled={savingAnotacoes}
                      className="w-full"
                    >
                      {savingAnotacoes ? (
                        <Loader2 className="size-4 animate-spin mr-1" />
                      ) : (
                        <Check className="size-4 mr-1" />
                      )}
                      Salvar anotações
                    </Button>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button asChild className="w-full bg-success hover:bg-success/90">
                      <a
                        href={`https://wa.me/55${selectedLead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Oi, ${selectedLead.nome}! Aqui é do Ritmo. Vi que você montou seu plano de estudos no nosso site!`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="size-4 mr-2" />
                        Conversar no WhatsApp
                      </a>
                    </Button>

                    {selectedLead.status !== "convertido" && (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => {
                          setConvertingLead(selectedLead);
                          setSelectedLead(null);
                        }}
                      >
                        <UserCheck className="size-4 mr-2" />
                        Converter em Assinante
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de Conversão em Assinante */}
      {convertingLead && (
        <AssinanteDialog
          open={!!convertingLead}
          onOpenChange={(o) => !o && setConvertingLead(null)}
          initial={leadToAssinante(convertingLead)}
          onSaved={() => {
            handleUpdateStatus(convertingLead.id, "convertido");
            setConvertingLead(null);
          }}
        />
      )}
    </div>
  );
}
