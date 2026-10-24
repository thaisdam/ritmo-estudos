import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CalendarDays, LayoutDashboard, Loader2, LogOut, Menu, ShieldX, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel | Ritmo" },
      { name: "description", content: "Painel de administração do Ritmo." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel | Ritmo" },
      { property: "og:description", content: "Painel de administração do Ritmo." },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/leads", label: "Leads", icon: UserPlus },
  { to: "/admin/assinantes", label: "Assinantes", icon: Users },
  { to: "/admin/entregas", label: "Entregas", icon: CalendarDays },
  { to: "/admin/lembretes", label: "Lembretes", icon: Bell },
] as const;

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Logo light />
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            activeOptions={{ exact: "exact" in n }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-primary! text-sidebar-primary-foreground!" }}
          >
            <n.icon className="size-4" /> {n.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/admin/login" });
        }}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent"
      >
        <LogOut className="size-4" /> Sair
      </button>
    </div>
  );
}

function AdminLayout() {
  const { session, isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/admin/login" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-soft px-4">
        <div className="max-w-sm rounded-3xl bg-card p-8 text-center shadow-soft">
          <ShieldX className="mx-auto mb-4 size-12 text-destructive" />
          <h1 className="text-2xl font-extrabold">Acesso negado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A conta {user?.email} ainda não tem permissão de administrador.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/admin/login" });
            }}
          >
            Sair
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 bg-sidebar md:block">
        <SidebarNav />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <span className="font-display font-bold">Ritmo · Painel</span>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
