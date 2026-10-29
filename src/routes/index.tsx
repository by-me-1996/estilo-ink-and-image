import { createFileRoute, Link } from "@tanstack/react-router";
import { listPosts, formatDate } from "@/lib/blog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STUDIO By me 1996 — Artículos e imágenes" },
      { name: "description", content: "Un diario editorial de artículos, ideas e imágenes." },
      { property: "og:title", content: "STUDIO By me 1996 — Artículos e imágenes" },
      { property: "og:description", content: "Un diario editorial de artículos, ideas e imágenes." },
    ],
  }),
  loader: () => listPosts("mine"),
  component: Index,
});

function Index() {
  const posts = Route.useLoaderData();
  const [featured, ...rest] = posts;
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="eyebrow text-muted-foreground">Diario editorial</p>
        <h1 className="mt-8 font-display text-6xl uppercase leading-[0.9] md:text-8xl">Studio</h1>
        <p className="font-script -mt-4 text-6xl text-primary md:-mt-6 md:text-8xl">By me</p>
        <p className="eyebrow mt-4 text-brass">— 1996 —</p>
        <p className="eyebrow mx-auto mt-10 max-w-md leading-relaxed">
          Artículos, imágenes y notas sobre aquello que merece una mirada lenta
        </p>
      </section>

      {posts.length === 0 && (
        <div className="mx-auto max-w-xl border-t border-border px-6 py-20 text-center">
          <p className="font-script text-4xl text-primary">Aún en blanco</p>
          <p className="mt-4 text-muted-foreground">Todavía no hay artículos publicados.</p>
          <Link to="/envia" className="btn-ink mt-8">Si tienes algo que contar, envíamelo</Link>
        </div>
      )}

      {featured && (
        <section className="bg-olive text-cream">
          <Link to="/articulo/$slug" params={{ slug: featured.slug }} className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
            {featured.coverSrc ? (
              <img src={featured.coverSrc} alt={featured.title} className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="aspect-[4/5] w-full bg-blush/30" />
            )}
            <div>
              <p className="eyebrow text-blush">{featured.category} · {formatDate(featured.created_at)}</p>
              <h2 className="mt-6 font-display text-4xl leading-tight md:text-5xl">{featured.title}</h2>
              <p className="mt-6 leading-relaxed opacity-80">{featured.excerpt}</p>
              <span className="eyebrow mt-8 inline-block border-b border-blush pb-1 text-blush">Leer artículo</span>
            </div>
          </Link>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mx-auto grid max-w-6xl gap-x-10 gap-y-16 px-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link key={p.id} to="/articulo/$slug" params={{ slug: p.slug }} className="group">
              <div className="overflow-hidden">
                {p.coverSrc ? (
                  <img src={p.coverSrc} alt={p.title} className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="aspect-[3/4] w-full bg-muted" />
                )}
              </div>
              <p className="eyebrow mt-5 text-muted-foreground">{p.category} · {formatDate(p.created_at)}</p>
              <h3 className="mt-3 font-display text-2xl leading-snug group-hover:text-primary">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
