import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Assinante, Entrega, Lead, Lembrete, PageTitle, WaButton } from "@/components/admin/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addDays,
  formatBRL,
  formatDate,
  formatDateTime,
  LABELS,
  startOfWeekMonday,
  toISODate,
} from "@/lib/ritmo";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/")({ component: DashboardPage });

type EntregaComAssinante = Entrega & { assinante?: Assinante | null };

function DashboardPage() {
  const qc = useQueryClient();
  const now = new Date();
  const hojeStr = toISODate(now);
  const seteDiasAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const segSemana = startOfWeekMonday(now);
  const domSemana = addDays(segSemana, 6);

  // Queries
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });

  const { data: assinantes = [], isLoading: loadingAssinantes } = useQuery({
    queryKey: ["assinantes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assinantes").select("*");
      if (error) throw error;
      return (data || []) as Assinante[];
    },
  });

  const { data: entregasSemana = [], isLoading: loadingEntregas } = useQuery({
    queryKey: ["entregas-semana", toISODate(segSemana), toISODate(domSemana)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select("*, assinante:assinantes(*)")
        .gte("data", toISODate(segSemana))
        .lte("data", toISODate(domSemana));
      if (error) throw error;
      return (data || []) as unknown as EntregaComAssinante[];
    },
  });

  const { data: lembretes = [], isLoading: loadingLembretes } = useQuery({
    queryKey: ["lembretes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lembretes")
        .select("*, assinante:assinantes(*)");
      if (error) throw error;
      return (data || []) as unknown as (Lembrete & { assinante?: Assinante | null })[];
    },
  });

  const isLoading = loadingLeads || loadingAssinantes || loadingEntregas || loadingLembretes;

  // Cálculos de métricas
  const leadsNovos = leads.filter((l) => l.created_at >= seteDiasAtras).length;
  const assinantesAtivos = assinantes.filter((a) => a.status === "ativo");
  const receitaMensal = assinantesAtivos.reduce((acc, a) => acc + (Number(a.valor_mensal) || 0), 0);
  const entregasPendentes = entregasSemana.filter((e) => e.status === "pendente").length;
  const checkinsHoje = entregasSemana.filter(
    (e) => e.data === hojeStr && e.tipo === "check_in"
  );
  const lembretesAtrasados = lembretes.filter(
    (l) => !l.concluido && new Date(l.data_hora) < now && l.data_hora.slice(0, 10) !== hojeStr
  );

  // Atividades de hoje
  const entregasHoje = entregasSemana.filter((e) => e.data === hojeStr);
  const lembretesHoje = lembretes.filter(
    (l) => !l.concluido && l.data_hora.slice(0, 10) === hojeStr
  );

  const handleMarcarEntregaFeita = async (id: string) => {
    await supabase.from("entregas").update({ status: "feito" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["entregas-semana"] });
  };

  const handleMarcarLembreteFeito = async (id: string) => {
    await supabase.from("lembretes").update({ concluido: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["lembretes"] });
  };

  // Dados para o gráfico de leads por plano
  const leadsPorPlano = [
    { plano: "Essencial", leads: leads.filter((l) => l.plano_interesse === "essencial").length },
    { plano: "Foco", leads: leads.filter((l) => l.plano_interesse === "foco").length },
    { plano: "Intensivo", leads: leads.filter((l) => l.plano_interesse === "intensivo").length },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/leads">
            Ver leads <ArrowUpRight className="size-4 ml-1" />
          </Link>
        </Button>
      </PageTitle>

      {/* Grid de Métricas Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Novos (7 dias)
            </CardTitle>
            <UserPlus className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{leadsNovos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total geral: {leads.length} leads cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinantes Ativos
            </CardTitle>
            <Users className="size-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{assinantesAtivos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Base com plano regular ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal Estimada
            </CardTitle>
            <DollarSign className="size-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{formatBRL(receitaMensal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma dos planos dos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregas Pendentes (Semana)
            </CardTitle>
            <CalendarCheck className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{entregasPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Planos semanais, check-ins e chamadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Check-ins Hoje
            </CardTitle>
            <TrendingUp className="size-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{checkinsHoje.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cobranças de constância para hoje
            </p>
          </CardContent>
        </Card>

        <Card className={lembretesAtrasados.length > 0 ? "border-destructive/40 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lembretes Atrasados
            </CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-destructive">
              {lembretesAtrasados.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tarefas com prazo ultrapassado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid com Atividades de Hoje e Gráfico */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Atividades de Hoje */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>Atividades de Hoje ({formatDate(hojeStr)})</span>
              <Badge variant="outline" className="font-normal text-xs">
                {entregasHoje.length + lembretesHoje.length} pendentes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {entregasHoje.length === 0 && lembretesHoje.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Tudo tranquilo por hoje! Nenhuma entrega ou lembrete pendente. 🎉
              </div>
            ) : (
              <>
                {/* Entregas do dia */}
                {entregasHoje.map((ent) => (
                  <div
                    key={ent.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm bg-card/60"
                  >
                    <div>
                      <div className="font-semibold text-sm">
                        {ent.assinante ? ent.assinante.nome : "Assinante"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {LABELS.tipoEntrega[ent.tipo] ?? ent.tipo} · {ent.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ent.assinante && (
                        <WaButton
                          phone={ent.assinante.whatsapp}
                          message={`Oi, ${ent.assinante.nome}! Como estão os estudos hoje?`}
                        />
                      )}
                      {ent.status !== "feito" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-success gap-1"
                          onClick={() => handleMarcarEntregaFeita(ent.id)}
                        >
                          <Check className="size-3.5" /> Feito
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Lembretes do dia */}
                {lembretesHoje.map((lem) => (
                  <div
                    key={lem.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm bg-card/60"
                  >
                    <div>
                      <div className="font-semibold text-sm">{lem.titulo}</div>
                      <div className="text-xs text-muted-foreground">
                        Lembrete {lem.assinante ? `· ${lem.assinante.nome}` : ""}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-success gap-1"
                      onClick={() => handleMarcarLembreteFeito(lem.id)}
                    >
                      <Check className="size-3.5" /> Concluir
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Interesse por Plano */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Interesse dos Leads por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsPorPlano}>
                  <XAxis dataKey="plano" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1b2e", borderRadius: "12px", border: "none", color: "#fff" }}
                  />
                  <Bar dataKey="leads" fill="#6d5ef5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
