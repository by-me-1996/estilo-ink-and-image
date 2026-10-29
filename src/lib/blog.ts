import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "blog-images";
const IMG_RE = /^!\[(.*?)\]\((.+?)\)$/;

export type Post = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string | null;
  category: string;
  source: string;
  contributor_name: string | null;
  created_at: string;
};

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 70) || "articulo"
  );
}

async function signPaths(paths: string[]) {
  const map: Record<string, string> = {};
  const toSign = [...new Set(paths.filter((p) => p && !p.startsWith("http")))];
  if (toSign.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(toSign, 60 * 60 * 24 * 7);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
    });
  }
  return (p: string | null) => (p ? (p.startsWith("http") ? p : (map[p] ?? null)) : null);
}

export async function listPosts(source: "mine" | "community" = "mine") {
  const { data, error } = await supabase.from("posts").select("*").eq("source", source).order("created_at", { ascending: false });
  if (error) throw error;
  const posts = (data ?? []) as Post[];
  const sign = await signPaths(posts.map((p) => p.cover_url ?? ""));
  return posts.map((p) => ({ ...p, coverSrc: sign(p.cover_url) }));
}

export type Block = { type: "p"; text: string } | { type: "img"; alt: string; src: string | null };

export async function getPost(slug: string) {
  const { data, error } = await supabase.from("posts").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const post = data as Post;
  const raw = post.content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const imgPaths = raw.map((b) => b.match(IMG_RE)?.[2] ?? "");
  const sign = await signPaths([post.cover_url ?? "", ...imgPaths]);
  const blocks: Block[] = raw.map((b) => {
    const m = b.match(IMG_RE);
    return m ? { type: "img", alt: m[1] ?? "", src: sign(m[2] ?? null) } : { type: "p", text: b };
  });
  return { ...post, coverSrc: sign(post.cover_url), blocks };
}

export async function uploadImage(file: File, userId: string) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}
