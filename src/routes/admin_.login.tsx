import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar no painel | Ritmo" },
      { name: "description", content: "Acesso restrito à administração do Ritmo." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Entrar no painel | Ritmo" },
      { property: "og:description", content: "Acesso restrito à administração do Ritmo." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});

function Login() {
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin" });
  }, [loading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setBusy(true);
    const { error } =
      mode === "entrar"
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp({ ...parsed.data, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login") ? "E-mail ou senha incorretos." :
        error.message.includes("already registered") ? "Este e-mail já tem conta. Entre com ela." :
        "Não foi possível continuar. Tente de novo.",
      );
      return;
    }
    toast.success(mode === "entrar" ? "Bem-vindo(a) de volta!" : "Conta criada!");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-soft px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-elegant">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="mb-6 text-center text-2xl font-extrabold">Painel do Ritmo</h1>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "entrar" | "criar")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entrar">Entrar</TabsTrigger>
            <TabsTrigger value="criar">Criar conta</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" autoComplete={mode === "entrar" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {mode === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-primary">← Voltar ao site</Link>
      </div>
    </main>
  );
}
