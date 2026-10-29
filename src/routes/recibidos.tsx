import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BUCKET, formatDate, slugify } from "@/lib/blog";

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

type Item = {
  id: string; name: string; email: string; title: string; message: string;
  created_at: string; status: string; image_paths: string[]; images: string[];
};

function Recibidos() {
  const { user, isAdmin, loading } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [tab, setTab] = useState<"pending" | "draft">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase.from("submissions").select("*").neq("status", "published").order("created_at", { ascending: false });
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

  async function setStatus(id: string, status: "draft" | "pending") {
    const { error } = await supabase.from("submissions").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems((i) => i?.map((x) => (x.id === id ? { ...x, status } : x)) ?? null);
    toast.success(status === "draft" ? "Guardado en borradores" : "Movido a recibidos");
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este envío?")) return;
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems((i) => i?.filter((x) => x.id !== id) ?? null);
  }

  async function publish(it: Item) {
    setBusyId(it.id);
    try {
      // Copy images into the author's public folder so readers can see them
      const newPaths: string[] = [];
      for (const p of it.image_paths) {
        const dest = `${user!.id}/${p.split("/").pop()}`;
        const { error } = await supabase.storage.from(BUCKET).copy(p, dest);
        if (error) throw error;
        newPaths.push(dest);
      }
      const [cover, ...inline] = newPaths;
      const content = [it.message, ...inline.map((p) => `![](${p})`)].join("\n\n");
      const excerpt = it.message.replace(/\s+/g, " ").slice(0, 180) + (it.message.length > 180 ? "…" : "");
      const slug = `${slugify(it.title)}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("posts").insert({
        author_id: user!.id, title: it.title, excerpt, content, cover_url: cover ?? null, slug,
        category: "Voces de lectores", source: "community", contributor_name: it.name,
      });
      if (error) throw error;
      await supabase.from("submissions").update({ status: "published" }).eq("id", it.id);
      setItems((i) => i?.filter((x) => x.id !== it.id) ?? null);
      toast.success("Publicado en Voces de lectores");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusyId(null);
  }

  if (loading) return null;
  if (!isAdmin)
    return (
      <div className="py-32 text-center">
        <p className="font-script text-5xl text-primary">Solo para la autora</p>
        <Link to="/acceso" className="btn-ink mt-8">Acceder</Link>
      </div>
    );

  const shown = items?.filter((x) => x.status === tab) ?? [];
  const count = (s: string) => items?.filter((x) => x.status === s).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-center">
        <p className="eyebrow text-muted-foreground">Bandeja</p>
        <h1 className="font-script mt-2 text-6xl text-primary">Recibidos</h1>
        <div className="mt-8 flex justify-center gap-8">
          {(["pending", "draft"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`eyebrow border-b pb-1 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              {t === "pending" ? "Nuevos" : "Borradores"} ({count(t)})
            </button>
          ))}
        </div>
      </div>
      {items && shown.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">{tab === "pending" ? "No hay historias nuevas." : "No tienes borradores."}</p>
      )}
      <div className="mt-12 space-y-12">
        {shown.map((it) => (
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
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={() => publish(it)} disabled={busyId === it.id} className="btn-ink">
                {busyId === it.id ? "Publicando…" : "Publicar"}
              </button>
              {it.status === "pending" ? (
                <button onClick={() => setStatus(it.id, "draft")} className="btn-line">Guardar en borradores</button>
              ) : (
                <button onClick={() => setStatus(it.id, "pending")} className="btn-line">Volver a nuevos</button>
              )}
              <button onClick={() => remove(it.id)} className="eyebrow ml-auto text-destructive">Eliminar</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
