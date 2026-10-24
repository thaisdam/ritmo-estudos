import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, MessageCircle, Waves, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_DEFAULT_URL } from "@/lib/ritmo";
import { cn } from "@/lib/utils";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Ritmo, página inicial">
      <span className="grid size-9 place-items-center rounded-xl bg-hero text-primary-foreground shadow-elegant">
        <Waves className="size-5" />
      </span>
      <span className={cn("font-display text-xl font-extrabold", light ? "text-night-foreground" : "text-foreground")}>
        Ritmo
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#planos", label: "Planos" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <Button asChild variant="hero">
            <Link to="/montar-plano">Montar meu plano</Link>
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Abrir menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border bg-card px-4 py-4 md:hidden" aria-label="Menu mobile">
          <div className="flex flex-col gap-3">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-1 font-medium">
                {n.label}
              </a>
            ))}
            <Button asChild variant="hero" className="mt-2">
              <Link to="/montar-plano">Montar meu plano</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-night text-night-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo light />
          <p className="text-sm opacity-70">Faculdade, inglês e cursos no mesmo ritmo.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm md:items-end">
          <a href={WHATSAPP_DEFAULT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
            Fale com a gente no WhatsApp
          </a>
          <p className="opacity-70">© {new Date().getFullYear()} Ritmo · Uberlândia-MG</p>
          <Link to="/admin/login" className="text-xs opacity-40 hover:opacity-80">
            Área do admin
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_DEFAULT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-whatsapp text-success-foreground shadow-elegant transition-transform hover:scale-110"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pt-16">{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
    </div>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
