export const WHATSAPP_NUMBER = "5534999999999";
export const WHATSAPP_DEFAULT_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Oi! Quero saber mais sobre o Ritmo.",
)}`;

export type PlanoId = "essencial" | "foco" | "intensivo";

export const PLANOS: Record<
  PlanoId,
  { id: PlanoId; nome: string; preco: number; descricao: string; itens: string[] }
> = {
  essencial: {
    id: "essencial",
    nome: "Essencial",
    preco: 29.9,
    descricao: "Para quem precisa de direção.",
    itens: ["Plano semanal personalizado", "Lembretes de provas e entregas", "1 check-in por semana"],
  },
  foco: {
    id: "foco",
    nome: "Foco",
    preco: 49.9,
    descricao: "Para manter constância de verdade.",
    itens: ["Tudo do Essencial", "3 check-ins por semana (seg, qua, sex)"],
  },
  intensivo: {
    id: "intensivo",
    nome: "Intensivo",
    preco: 89.9,
    descricao: "Para semestres pesados.",
    itens: ["Tudo do Foco", "Check-in de segunda a sexta", "1 chamada de 20 min por semana"],
  },
};
export const PLANO_IDS: PlanoId[] = ["essencial", "foco", "intensivo"];

export function isPlanoId(v: unknown): v is PlanoId {
  return typeof v === "string" && (PLANO_IDS as string[]).includes(v);
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number) => brl.format(v);

export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? parseDate(d) : d;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function formatDateTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${formatDate(date)} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}
/** Parse "aaaa-mm-dd" como data local (sem fuso). */
export function parseDate(s: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}
export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function startOfWeekMonday(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = r.getDay(); // 0 = dom
  r.setDate(r.getDate() - ((dow + 6) % 7));
  return r;
}
export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function maskWhatsapp(value: string) {
  const v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 2) return v.length ? `(${v}` : "";
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}
export function waLink(phone: string, message: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export type TipoEntrega = "plano_semanal" | "check_in" | "chamada";
/** Dias da semana (0 = segunda ... 4 = sexta) de cada tipo de entrega por plano. */
export function agendaDoPlano(plano: PlanoId): { tipo: TipoEntrega; offset: number }[] {
  const items: { tipo: TipoEntrega; offset: number }[] = [{ tipo: "plano_semanal", offset: 0 }];
  const checkins = plano === "essencial" ? [4] : plano === "foco" ? [0, 2, 4] : [0, 1, 2, 3, 4];
  checkins.forEach((o) => items.push({ tipo: "check_in", offset: o }));
  if (plano === "intensivo") items.push({ tipo: "chamada", offset: 2 });
  return items;
}
export function gerarAgendaSemana(
  assinantes: { id: string; plano: PlanoId }[],
  segunda: Date,
): { assinante_id: string; tipo: TipoEntrega; data: string }[] {
  return assinantes.flatMap((a) =>
    agendaDoPlano(a.plano).map((i) => ({
      assinante_id: a.id,
      tipo: i.tipo,
      data: toISODate(addDays(segunda, i.offset)),
    })),
  );
}

export const LABELS = {
  turno: { manha: "Manhã", tarde: "Tarde", noite: "Noite", integral: "Integral" } as Record<string, string>,
  horario: { manha: "Manhã", tarde: "Tarde", noite: "Noite" } as Record<string, string>,
  leadStatus: { novo: "Novo", em_contato: "Em contato", convertido: "Convertido", perdido: "Perdido" } as Record<string, string>,
  assStatus: { ativo: "Ativo", pausado: "Pausado", cancelado: "Cancelado" } as Record<string, string>,
  pagamento: { pago: "Pago", pendente: "Pendente" } as Record<string, string>,
  tipoEntrega: { plano_semanal: "Plano semanal", check_in: "Check-in", chamada: "Chamada" } as Record<string, string>,
  entregaStatus: { pendente: "Pendente", feito: "Feito", sem_resposta: "Sem resposta" } as Record<string, string>,
};

export const INSTITUICOES = ["UFU", "UNITRI", "UNA", "Pitágoras", "ESAMC", "Outra"];
export const DIFICULDADES = [
  "procrastinação",
  "esquecer prazos",
  "não saber priorizar",
  "cansaço",
  "falta de constância",
  "provas acumuladas",
];

export interface LeadResumo {
  nome: string;
  curso: string;
  periodo: number;
  instituicao: string;
  plano: PlanoId;
  horas_livres: number;
  dificuldades: string[];
  proximas_provas?: string;
}
export function mensagemObrigado(l: LeadResumo) {
  return `Oi! Acabei de montar meu plano no Ritmo. Nome: ${l.nome} | Curso: ${l.curso} (${l.periodo}º período) - ${l.instituicao} | Plano: ${PLANOS[l.plano].nome} | Horas livres/dia: ${l.horas_livres} | Dificuldades: ${l.dificuldades.join(", ")} | Próximas provas: ${l.proximas_provas?.trim() || "nenhuma informada"}`;
}
