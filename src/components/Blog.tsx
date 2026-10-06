/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Blog – výpis článků (/blog) i detail článku (/blog/:slug).
 * Data se načítají z Firestore kolekce `posts`; dokud žádné nejsou,
 * použijí se startovní články ze STATIC_POSTS.
 */

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { ChevronRight, ChevronLeft, Phone } from "lucide-react";
import { loadPublished } from "../lib/siteData";
import { BlogPost } from "../types";
import { STATIC_POSTS } from "../blogPosts";
import { SiteHeader, SiteFooter, PHONE_DISPLAY, PHONE_HREF } from "./site/Chrome";

const BASE_URL = "https://www.aufinauto.cz";

/** Vykreslí tělo článku: "## " = podnadpis, "- " = seznam, jinak odstavec. */
function renderContent(content: string) {
  const blocks = content.split(/\n\s*\n/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="text-2xl md:text-3xl font-bold text-ink mt-12 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
    }
    const lines = trimmed.split("\n");
    if (lines.every((l) => l.trim().startsWith("- "))) {
      return (
        <ul key={i} className="list-disc pl-6 space-y-2 my-4">
          {lines.map((l, j) => (
            <li key={j}>{l.trim().slice(2)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="my-4">
        {trimmed}
      </p>
    );
  });
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-brand selection:text-ink">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>(STATIC_POSTS);

  useEffect(() => {
    // Publikované články ze souboru /data/posts.json (bez čtení Firestore), viz lib/siteData.ts.
    let alive = true;
    loadPublished<BlogPost>("posts")
      .then((list) => {
        if (alive && list.length) setPosts(list);
      })
      .catch(() => {/* offline / chybí oprávnění – ponecháme statické články */});
    return () => { alive = false; };
  }, []);

  const published = posts.filter((p) => p.isPublished !== false);
  const path = typeof window !== "undefined" ? window.location.pathname : "/blog";
  const slug = path.startsWith("/blog/") ? path.replace(/^\/blog\/|\/$/g, "") : null;

  // ---- Detail článku ----
  if (slug) {
    const post = published.find((p) => p.slug === slug);
    if (!post) {
      return (
        <Shell>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center">
            <Helmet><title>Článek nenalezen | AUFIN AUTO</title><meta name="robots" content="noindex" /></Helmet>
            <h1 className="text-3xl font-bold mb-6">Článek nenalezen</h1>
            <a href="/blog" className="text-brand-deep hover:underline">← Zpět na blog</a>
          </div>
        </Shell>
      );
    }
    const canonical = `${BASE_URL}/blog/${post.slug}`;
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      image: post.coverImage,
      author: { "@type": "Organization", name: post.author || "AUFIN AUTO" },
      publisher: { "@type": "Organization", name: "AUFIN AUTO" },
      description: post.excerpt,
      mainEntityOfPage: canonical,
    };
    return (
      <Shell>
        <Helmet>
          <html lang="cs" />
          <title>{post.seo?.title || `${post.title} | AUFIN AUTO`}</title>
          <meta name="description" content={post.seo?.description || post.excerpt} />
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.excerpt} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonical} />
          <meta property="og:image" content={post.coverImage} />
          <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        </Helmet>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-20">
          <a href="/blog" className="inline-flex items-center gap-1 text-ink/60 hover:text-brand-deep transition-colors text-sm mb-8">
            <ChevronLeft className="w-4 h-4" /> Zpět na blog
          </a>
          {post.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-brand-soft text-brand-deep text-xs font-bold tracking-wider uppercase mb-5">
              {post.category}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">{post.title}</h1>
          <div className="text-ink/60 text-sm mb-8">{post.author || "AUFIN AUTO"}</div>
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full rounded-3xl border border-line mb-10 object-cover aspect-[16/9]"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="text-ink/80 leading-relaxed text-lg">
            {renderContent(post.content)}
          </div>

          <div className="mt-16 bg-sand rounded-3xl border border-line p-6 sm:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Hledáte auto na splátky?</h2>
            <p className="text-ink/70 mb-8">Vyberte si vůz z naší nabídky – schválení do 30 minut, bez registru.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/#nabidka-aut" className="btn-primary">
                Auta na splátky <ChevronRight className="w-5 h-5" />
              </a>
              <a href={PHONE_HREF} className="btn-secondary">
                <Phone className="w-5 h-5" /> {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </article>
      </Shell>
    );
  }

  // ---- Výpis článků ----
  return (
    <Shell>
      <Helmet>
        <html lang="cs" />
        <title>Blog – rádce o autech na splátky | AUFIN AUTO</title>
        <meta
          name="description"
          content="Rádce a praktické články o autech na splátky bez registru – podmínky, insolvence, smlouvy a tipy, jak na financování vozu."
        />
        <link rel="canonical" href={`${BASE_URL}/blog`} />
        <meta property="og:title" content="Blog AUFIN AUTO – rádce o autech na splátky" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/blog`} />
      </Helmet>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-10 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-brand-soft text-brand-deep text-xs font-bold tracking-wider uppercase mb-5">
          Rádce
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">Blog AUFIN AUTO</h1>
        <p className="text-lg text-ink/75 max-w-2xl mx-auto">
          Praktické články o autech na splátky bez registru – podmínky, financování při exekuci či insolvenci a tipy, na co si dát pozor.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {published.length === 0 ? (
          <p className="text-center text-ink/60 py-20">Zatím zde nejsou žádné články.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {published.map((post, i) => (
              <motion.a
                key={post.id}
                href={`/blog/${post.slug}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-card rounded-3xl overflow-hidden border border-line hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden bg-sand">
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  {post.category && (
                    <span className="text-xs uppercase tracking-wider text-brand-deep font-bold mb-3">{post.category}</span>
                  )}
                  <h2 className="text-xl font-bold mb-3 leading-snug group-hover:text-brand-deep transition-colors">{post.title}</h2>
                  <p className="text-ink/70 text-sm leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-brand-deep text-sm font-bold">
                    Číst článek <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
