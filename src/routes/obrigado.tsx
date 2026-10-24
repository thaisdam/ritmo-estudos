import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, MessageCircle, Repeat } from "lucide-react";
import { PublicLayout } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { WHATSAPP_NUMBER, WHATSAPP_DEFAULT_URL, mensagemObrigado } from "@/lib/ritmo";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Recebemos sua rotina! | Ritmo" },
      { name: "description", content: "Agora é só chamar no WhatsApp para fechar seu plano de estudos semanal." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Recebemos sua rotina! | Ritmo" },
      { property: "og:description", content: "Chame no WhatsApp para fechar seu plano." },
    ],
  }),
  component: Obrigado,
});

function Obrigado() {
  const lead = useRouterState({ select: (s) => s.location.state.lead });
  const primeiro = lead?.nome.split(" ")[0];
  const href = lead
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagemObrigado(lead))}`
    : WHATSAPP_DEFAULT_URL;

  const passos = [
    { icon: MessageCircle, t: "Chame no WhatsApp", d: "Conversamos rapidinho para entender os detalhes e fechar o plano." },
    { icon: CalendarCheck, t: "Receba seu primeiro plano", d: "Depois do Pix, seu plano semanal chega no WhatsApp." },
    { icon: Repeat, t: "Check-ins e ajustes", d: "Toda semana a gente acompanha e ajusta o que precisar." },
  ];

  return (
    <PublicLayout>
      <section className="bg-soft">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-hero text-3xl shadow-elegant">🎉</div>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            Recebemos sua rotina{primeiro ? `, ${primeiro}` : ""}! 🎉
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Agora é só chamar no WhatsApp para fechar seu plano.</p>
          <Button asChild variant="whatsapp" size="xl" className="mt-8 h-14 px-10 text-lg">
            <a href={href} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-5!" /> Falar no WhatsApp
            </a>
          </Button>

          <div className="mt-14 text-left">
            <h2 className="mb-4 text-xl font-bold">Próximos passos</h2>
            <ol className="space-y-3">
              {passos.map((p, i) => (
                <li key={p.t} className="flex gap-4 rounded-2xl bg-card p-5 shadow-soft">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <p.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{i + 1}. {p.t}</p>
                    <p className="text-sm text-muted-foreground">{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Link to="/" className="mt-10 inline-block text-sm font-medium text-primary hover:underline">
            ← Voltar para o início
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
