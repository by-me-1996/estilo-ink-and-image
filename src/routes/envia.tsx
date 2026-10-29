import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET } from "@/lib/blog";

export const Route = createFileRoute("/envia")({
  head: () => ({
    meta: [
      { title: "Envíame tu historia — STUDIO By me 1996" },
      { name: "description", content: "¿Tienes algo que contar? Envía tu artículo e imágenes a STUDIO By me 1996." },
      { property: "og:title", content: "Envíame tu historia — STUDIO By me 1996" },
      { property: "og:description", content: "¿Tienes algo que contar? Envía tu artículo e imágenes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Envia,
});

function Envia() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const image_paths: string[] = [];
      for (const f of files) {
        const ext = f.name.split(".").pop() || "jpg";
        const path = `submissions/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
        if (error) throw error;
        image_paths.push(path);
      }
      const { error } = await supabase.from("submissions").insert({ name, email, title, message, image_paths });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error("No se pudo enviar: " + (err as Error).message);
    }
    setBusy(false);
  }

  if (sent)
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="font-script text-6xl text-primary">¡Gracias!</p>
        <p className="mt-6 text-muted-foreground">He recibido tu historia. La leeré con calma.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-8 px-6 py-20">
      <div className="text-center">
        <p className="eyebrow text-muted-foreground">Colabora</p>
        <h1 className="font-script mt-2 text-6xl text-primary">Si tienes algo que contar,</h1>
        <p className="font-display mt-2 text-2xl uppercase tracking-[0.15em]">envíamelo</p>
      </div>
      <input className="field" required maxLength={120} placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field" required type="email" maxLength={255} placeholder="Tu correo" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="field font-display text-2xl" required maxLength={200} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="field min-h-[16rem] leading-relaxed" required maxLength={20000} placeholder="Tu historia…" value={message} onChange={(e) => setMessage(e.target.value)} />
      <label className="block cursor-pointer border border-dashed border-input bg-card p-6 text-center">
        <span className="eyebrow text-muted-foreground">
          {files.length ? `${files.length} imagen(es) seleccionada(s)` : "Añadir imágenes (hasta 6)"}
        </span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))} />
      </label>
      <div className="flex justify-end">
        <button className="btn-ink" disabled={busy}>{busy ? "Enviando…" : "Enviar"}</button>
      </div>
    </form>
  );
}
