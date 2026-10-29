import { createFileRoute, Link } from "@tanstack/react-router";
import { listPosts, formatDate } from "@/lib/blog";

export const Route = createFileRoute("/lectores")({
  head: () => ({
    meta: [
      { title: "Voces de lectores — STUDIO By me 1996" },
      { name: "description", content: "Historias e imágenes enviadas por los lectores de STUDIO By me 1996." },
      { property: "og:title", content: "Voces de lectores — STUDIO By me 1996" },
      { property: "og:description", content: "Historias e imágenes enviadas por los lectores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: () => listPosts("community"),
  component: Lectores,
});

function Lectores() {
  const posts = Route.useLoaderData();
  return (
    <>
      <section className="bg-blush/40 px-6 py-20 text-center">
        <p className="eyebrow text-muted-foreground">Vuestras historias</p>
        <h1 className="font-script mt-4 text-7xl text-primary">Voces de lectores</h1>
        <Link to="/envia" className="btn-ink mt-10">Si tienes algo que contar, envíamelo</Link>
      </section>
      {posts.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">Pronto aparecerán aquí las primeras historias.</p>
      ) : (
        <section className="mx-auto grid max-w-6xl gap-x-10 gap-y-16 px-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to="/articulo/$slug" params={{ slug: p.slug }} className="group">
              <div className="overflow-hidden">
                {p.coverSrc ? (
                  <img src={p.coverSrc} alt={p.title} className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="aspect-[3/4] w-full bg-muted" />
                )}
              </div>
              <p className="eyebrow mt-5 text-muted-foreground">{formatDate(p.created_at)}</p>
              <h3 className="mt-3 font-display text-2xl leading-snug group-hover:text-primary">{p.title}</h3>
              {p.contributor_name && <p className="font-script mt-1 text-2xl text-primary">por {p.contributor_name}</p>}
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
