import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/acceso")({
  head: () => ({
    meta: [
      { title: "Acceso — Studio Journal" },
      { name: "description", content: "Entra para escribir y publicar artículos." },
      { property: "og:title", content: "Acceso — Studio Journal" },
      { property: "og:description", content: "Entra para escribir y publicar artículos." },
    ],
  }),
  component: Acceso,
});

function Acceso() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/escribir" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    if (mode === "up" && !res.data.session) toast.success("Revisa tu correo para confirmar la cuenta.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("No se pudo entrar con Google");
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <p className="eyebrow text-center text-muted-foreground">Para autores</p>
      <h1 className="font-script mt-4 text-center text-6xl text-primary">{mode === "in" ? "Bienvenida" : "Crear cuenta"}</h1>
      <form onSubmit={submit} className="mt-12 space-y-6">
        <input className="field" type="email" required placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" required minLength={6} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-ink w-full" disabled={busy}>{mode === "in" ? "Entrar" : "Registrarme"}</button>
      </form>
      <button onClick={google} className="btn-line mt-4 w-full">Continuar con Google</button>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="eyebrow mt-8 block w-full text-center text-muted-foreground">
        {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
      </button>
    </div>
  );
}
