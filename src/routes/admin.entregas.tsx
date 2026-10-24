import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, ChevronLeft, ChevronRight, Loader2, Sparkles, Check, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Assinante, Entrega, PageTitle, StatusBadge, WaButton } from "@/components/admin/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addDays,
  formatDate,
  gerarAgendaSemana,
  isPlanoId,
  LABELS,
  PLANOS,
  startOfWeekMonday,
  toISODate,
} from "@/lib/ritmo";

export const Route = createFileRoute("/admin/entregas")({ component: EntregasPage });

type EntregaComAssinante = Entrega & { assinante?: Assinante | null };

const DIAS_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

function getMensagemEntrega(tipo: string, nome: string) {
  if (tipo === "plano_semanal") {
    return `Oi, ${nome}! Segue o seu plano de estudos do Ritmo para esta semana. Vamos com tudo! 💪`;
  }
  if (tipo === "chamada") {
    return `Oi, ${nome}! Preparado para o nosso alinhamento semanal do Ritmo hoje?`;
  }
  return `Oi, ${nome}! Como estão os estudos hoje? Conseguiu cumprir as metas do dia? 📚`;
}

export function EntregasPage() {
  const qc = useQueryClient();
  const [currentMonday, setCurrentMonday] = useState(() => startOfWeekMonday(new Date()));
  const [generating, setGenerating] = useState(false);

  const startStr = toISODate(currentMonday);
  const endStr = toISODate(addDays(currentMonday, 6));

  const { data: entregas = [], isLoading } = useQuery({
    queryKey: ["entregas", startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select("*, assinante:assinantes(*)")
        .gte("data", startStr)
        .lte("data", endStr)
        .order("data", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as EntregaComAssinante[];
    },
  });

  const { data: assinantesAtivos = [] } = useQuery({
    queryKey: ["assinantes-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assinantes")
        .select("*")
        .eq("status", "ativo");
      if (error) throw error;
      return data as Assinante[];
    },
  });

  const handleGerarAgenda = async () => {
    if (assinantesAtivos.length === 0) {
      toast.error("Nenhum assinante ativo encontrado para gerar agenda.");
      return;
    }
    setGenerating(true);

    const ativosComPlano = assinantesAtivos
      .filter((a) => isPlanoId(a.plano))
      .map((a) => ({ id: a.id, plano: a.plano as "essencial" | "foco" | "intensivo" }));

    const itens = gerarAgendaSemana(ativosComPlano, currentMonday);

    // Evitar duplicados conferindo o que já existe na semana
    const existentesMap = new Set(
      entregas.map((e) => `${e.assinante_id}_${e.tipo}_${e.data}`)
    );

    const novos = itens.filter(
      (item) => !existentesMap.has(`${item.assinante_id}_${item.tipo}_${item.data}`)
    );

    if (novos.length === 0) {
      setGenerating(false);
      toast.info("A agenda desta semana já foi gerada completamente.");
      return;
    }

    const { error } = await supabase.from("entregas").insert(
      novos.map((n) => ({
        assinante_id: n.assinante_id,
        tipo: n.tipo,
        data: n.data,
        status: "pendente",
      }))
    );
    setGenerating(false);

    if (error) {
      toast.error("Erro ao gerar agenda.");
      return;
    }

    toast.success(`${novos.length} tarefas geradas para esta semana!`);
    qc.invalidateQueries({ queryKey: ["entregas"] });
  };

  const handleUpdateStatus = async (entregaId: string, novoStatus: string) => {
    const { error } = await supabase
      .from("entregas")
      .update({ status: novoStatus })
      .eq("id", entregaId);
    if (error) {
      toast.error("Erro ao atualizar entrega.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["entregas"] });
  };

  const nextWeek = () => setCurrentMonday((d) => addDays(d, 7));
  const prevWeek = () => setCurrentMonday((d) => addDays(d, -7));
  const thisWeek = () => setCurrentMonday(startOfWeekMonday(new Date()));

  return (
    <div className="space-y-6">
      <PageTitle title="Entregas & Agenda">
        <Button
          onClick={handleGerarAgenda}
          disabled={generating}
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Gerar agenda da semana
        </Button>
      </PageTitle>

      {/* Controles de Semana */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-primary" />
          <span className="font-semibold text-sm sm:text-base">
            Semana de {formatDate(currentMonday)} até {formatDate(addDays(currentMonday, 6))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="size-4 mr-1" /> Anterior
          </Button>
          <Button variant="ghost" size="sm" onClick={thisWeek}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            Próxima <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DIAS_SEMANA.map((diaNome, idx) => {
            const dataDia = toISODate(addDays(currentMonday, idx));
            const itensDoDia = entregas.filter((e) => e.data === dataDia);
            const isHoje = dataDia === toISODate(new Date());

            return (
              <Card
                key={dataDia}
                className={isHoje ? "border-primary ring-1 ring-primary/30" : ""}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      {diaNome}
                      {isHoje && (
                        <Badge variant="default" className="text-[10px] uppercase">
                          Hoje
                        </Badge>
                      )}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(dataDia)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-2.5">
                  {itensDoDia.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Nenhuma atividade
                    </p>
                  ) : (
                    itensDoDia.map((item) => {
                      const ass = item.assinante;
                      const planoNome = ass && isPlanoId(ass.plano) ? PLANOS[ass.plano].nome : "";
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-border/80 bg-background/60 p-3 space-y-2 text-sm shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-sm leading-tight">
                                {ass ? ass.nome : "Assinante"}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                                  {LABELS.tipoEntrega[item.tipo] ?? item.tipo}
                                </Badge>
                                {planoNome && (
                                  <span className="text-[11px] text-muted-foreground">
                                    {planoNome}
                                  </span>
                                )}
                              </div>
                            </div>
                            <StatusBadge
                              value={item.status}
                              label={LABELS.entregaStatus[item.status] ?? item.status}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/40">
                            {ass ? (
                              <WaButton
                                phone={ass.whatsapp}
                                message={getMensagemEntrega(item.tipo, ass.nome)}
                                size="sm"
                              />
                            ) : (
                              <div />
                            )}

                            <div className="flex items-center gap-1">
                              {item.status !== "feito" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-success hover:bg-success/15"
                                  title="Marcar como Feito"
                                  onClick={() => handleUpdateStatus(item.id, "feito")}
                                >
                                  <Check className="size-4" />
                                </Button>
                              )}
                              {item.status !== "pendente" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-muted-foreground hover:bg-muted"
                                  title="Marcar como Pendente"
                                  onClick={() => handleUpdateStatus(item.id, "pendente")}
                                >
                                  <Clock className="size-4" />
                                </Button>
                              )}
                              {item.status !== "sem_resposta" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-destructive hover:bg-destructive/15"
                                  title="Marcar como Sem Resposta"
                                  onClick={() => handleUpdateStatus(item.id, "sem_resposta")}
                                >
                                  <XCircle className="size-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
