import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-5">
          <Link to="/" className="eyebrow">Inicio</Link>
          <Link to="/lectores" className="eyebrow">Voces de lectores</Link>
        </div>
        <Link to="/" className="text-center leading-none">
          <span className="font-display text-2xl tracking-[0.15em] uppercase">Studio</span>
          <span className="font-script -mt-1 block text-3xl text-primary">By me <span className="font-display text-xs tracking-[0.3em] text-brass">1996</span></span>
        </Link>
        <nav className="flex items-center gap-5">
          {isAdmin ? (
            <>
              <Link to="/escribir" className="eyebrow">Escribir</Link>
              <Link to="/recibidos" className="eyebrow">Recibidos</Link>
            </>
          ) : (
            <Link to="/envia" className="eyebrow text-primary">Envíame tu historia</Link>
          )}
          {user && (
            <button className="eyebrow text-muted-foreground" onClick={() => supabase.auth.signOut()}>
              Salir
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-burgundy py-16 text-center text-cream">
      <p className="font-script text-5xl text-blush">¿Tienes algo que contar?</p>
      <Link to="/envia" className="eyebrow mt-6 inline-block border-b border-blush pb-1 text-blush">Envíamelo</Link>
      <p className="eyebrow mt-10 opacity-70">
        © {new Date().getFullYear()} STUDIO By me 1996 · <Link to="/acceso" className="opacity-60">Autora</Link>
      </p>
    </footer>
  );
}
