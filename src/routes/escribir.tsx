import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify, uploadImage } from "@/lib/blog";

export const Route = createFileRoute("/escribir")({
  head: () => ({
    meta: [
      { title: "Escribir — Studio Journal" },
      { name: "description", content: "Redacta y publica un nuevo artículo con imágenes." },
      { property: "og:title", content: "Escribir — Studio Journal" },
      { property: "og:description", content: "Redacta y publica un nuevo artículo con imágenes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Escribir,
});

function Escribir() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Journal");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inlineRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  if (loading) return null;
  if (!user)
    return (
      <div className="py-32 text-center">
        <p className="font-script text-5xl text-primary">Solo para autores</p>
        <Link to="/acceso" className="btn-ink mt-8">Acceder</Link>
      </div>
    );

  async function insertImage(file: File) {
    setUploading(true);
    try {
      const path = await uploadImage(file, user!.id);
      const pos = textRef.current?.selectionStart ?? content.length;
      const snippet = `\n\n![${file.name.replace(/\.[^.]+$/, "")}](${path})\n\n`;
      setContent((c) => c.slice(0, pos) + snippet + c.slice(pos));
      toast.success("Imagen añadida al texto");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setUploading(false);
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const cover_url = cover ? await uploadImage(cover, user!.id) : null;
      const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("posts").insert({
        author_id: user!.id, title, category, excerpt, content, cover_url, slug,
      });
      if (error) throw error;
      toast.success("Artículo publicado");
      navigate({ to: "/articulo/$slug", params: { slug } });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={publish} className="mx-auto max-w-3xl space-y-10 px-6 py-20">
      <div className="text-center">
        <p className="eyebrow text-muted-foreground">Nuevo artículo</p>
        <h1 className="font-script mt-2 text-6xl text-primary">Escribir</h1>
      </div>

      <label className="block">
        <span className="eyebrow text-muted-foreground">Imagen de portada</span>
        <div className="mt-3 flex aspect-[16/9] items-center justify-center overflow-hidden border border-dashed border-input bg-card">
          {cover ? (
            <img src={URL.createObjectURL(cover)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="eyebrow text-muted-foreground">Seleccionar imagen</span>
          )}
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
      </label>

      <input className="field font-display text-4xl" required placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="field eyebrow" placeholder="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} />
      <textarea className="field resize-none italic" rows={2} placeholder="Entradilla breve" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />

      <div>
        <div className="flex items-center justify-between">
          <span className="eyebrow text-muted-foreground">Texto · separa párrafos con una línea en blanco</span>
          <button type="button" className="eyebrow text-primary" onClick={() => inlineRef.current?.click()} disabled={uploading}>
            {uploading ? "Subiendo…" : "+ Insertar imagen"}
          </button>
          <input ref={inlineRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ""; }} />
        </div>
        <textarea ref={textRef} className="field mt-3 min-h-[24rem] text-lg leading-relaxed" required value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <button className="btn-ink" disabled={busy || uploading}>{busy ? "Publicando…" : "Publicar"}</button>
      </div>
    </form>
  );
}
