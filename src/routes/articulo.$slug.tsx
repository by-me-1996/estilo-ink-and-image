import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { getPost, formatDate } from "@/lib/blog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/articulo/$slug")({
  loader: async ({ params }) => {
    const post = await getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Studio Journal` },
          { name: "description", content: loaderData.excerpt },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.excerpt },
          { property: "og:type", content: "article" },
        ]
      : [{ title: "Artículo no disponible" }, { name: "robots", content: "noindex" }],
  }),
  component: Article,
  notFoundComponent: () => (
    <div className="py-32 text-center">
      <p className="font-script text-5xl text-primary">No encontrado</p>
      <Link to="/" className="btn-line mt-8">Volver</Link>
    </div>
  ),
});

function Article() {
  const post = Route.useLoaderData();
  const { user } = useAuth();
  const router = useRouter();

  async function remove() {
    if (!confirm("¿Eliminar este artículo?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Artículo eliminado");
    router.navigate({ to: "/" });
  }

  return (
    <article>
      <header className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <p className="eyebrow text-muted-foreground">{post.category} · {formatDate(post.created_at)}</p>
        <h1 className="mt-8 font-display text-4xl leading-tight md:text-6xl">{post.title}</h1>
        {post.excerpt && <p className="mx-auto mt-8 max-w-xl text-lg italic text-muted-foreground">{post.excerpt}</p>}
      </header>
      {post.coverSrc && (
        <div className="mx-auto max-w-5xl px-6">
          <img src={post.coverSrc} alt={post.title} className="max-h-[80vh] w-full object-cover" />
        </div>
      )}
      <div className="mx-auto max-w-2xl space-y-7 px-6 py-16 text-lg leading-[1.85]">
        {post.blocks.map((b, i) =>
          b.type === "img" ? (
            b.src && (
              <figure key={i} className="-mx-6 py-4 md:-mx-24">
                <img src={b.src} alt={b.alt} className="w-full" />
                {b.alt && <figcaption className="eyebrow mt-3 text-center text-muted-foreground">{b.alt}</figcaption>}
              </figure>
            )
          ) : (
            <p key={i} className="whitespace-pre-line first:first-letter:float-left first:first-letter:mr-3 first:first-letter:font-display first:first-letter:text-7xl first:first-letter:leading-[0.8] first:first-letter:text-primary">
              {b.text}
            </p>
          ),
        )}
      </div>
      <div className="mx-auto flex max-w-2xl items-center justify-between border-t border-border px-6 pt-8">
        <Link to="/" className="eyebrow">← Todos los artículos</Link>
        {user?.id === post.author_id && (
          <button onClick={remove} className="eyebrow text-destructive">Eliminar</button>
        )}
      </div>
    </article>
  );
}
