import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BUCKET, formatDate } from "@/lib/blog";

export const Route = createFileRoute("/recibidos")({
  head: () => ({
    meta: [
      { title: "Recibidos — STUDIO By me 1996" },
      { name: "description", content: "Historias enviadas por los lectores." },
      { property: "og:title", content: "Recibidos — STUDIO By me 1996" },
      { property: "og:description", content: "Historias enviadas por los lectores." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Recibidos,
});

type Item = { id: string; name: string; email: string; title: string; message: string; created_at: string; images: string[] };

function Recibidos() {
  const { isAdmin, loading } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase.from("submissions").select("*").order("created_at", { ascending: false });
      if (error) { toast.error(error.message); return; }
      const paths = data.flatMap((d) => d.image_paths);
      const map: Record<string, string> = {};
      if (paths.length) {
        const { data: s } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
        s?.forEach((x) => { if (x.path && x.signedUrl) map[x.path] = x.signedUrl; });
      }
      setItems(data.map((d) => ({ ...d, images: d.image_paths.map((p) => map[p]).filter(Boolean) as string[] })));
    })();
  }, [isAdmin]);

  async function remove(id: string) {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((i) => i?.filter((x) => x.id !== id) ?? null);
  }

  if (loading) return null;
  if (!isAdmin)
    return (
      <div className="py-32 text-center">
        <p className="font-script text-5xl text-primary">Solo para la autora</p>
        <Link to="/acceso" className="btn-ink mt-8">Acceder</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-center">
        <p className="eyebrow text-muted-foreground">Bandeja</p>
        <h1 className="font-script mt-2 text-6xl text-primary">Recibidos</h1>
      </div>
      {items?.length === 0 && <p className="mt-16 text-center text-muted-foreground">Aún no has recibido historias.</p>}
      <div className="mt-12 space-y-12">
        {items?.map((it) => (
          <article key={it.id} className="border-t border-border pt-8">
            <p className="eyebrow text-muted-foreground">{formatDate(it.created_at)} · {it.name} · <a href={`mailto:${it.email}`} className="text-primary">{it.email}</a></p>
            <h2 className="mt-3 font-display text-3xl">{it.title}</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed">{it.message}</p>
            {it.images.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {it.images.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" className="aspect-square w-full object-cover" /></a>
                ))}
              </div>
            )}
            <button onClick={() => remove(it.id)} className="eyebrow mt-6 text-muted-foreground">Eliminar</button>
          </article>
        ))}
      </div>
    </div>
  );
}
