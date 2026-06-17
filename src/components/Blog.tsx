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
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { ChevronRight, ChevronLeft, Phone } from "lucide-react";
import { db } from "../lib/firebase";
import { BlogPost } from "../types";
import { STATIC_POSTS } from "../blogPosts";

const BASE_URL = "https://www.aufinauto.cz";

/** Vykreslí tělo článku: "## " = podnadpis, "- " = seznam, jinak odstavec. */
function renderContent(content: string) {
  const blocks = content.split(/\n\s*\n/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="text-2xl md:text-3xl font-bold text-white mt-12 mb-4">
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
    <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] px-6 md:px-8 h-16 md:h-20 flex items-center justify-between shadow-2xl shadow-gold/10">
          <a href="/" className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter uppercase">AUFIN</span>
            <span className="text-gold text-xs font-bold tracking-[0.3em]">AUTO</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-white/70">
            <a href="/#nabidka-aut" className="hover:text-gold transition-colors">Nabídka aut</a>
            <a href="/blog" className="hover:text-gold transition-colors">Blog</a>
            <a href="/#caste-dotazy" className="hover:text-gold transition-colors">Časté dotazy</a>
          </div>
          <a href="/#formular" className="bg-gold text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white transition-all duration-300">
            CHCI AUTO
          </a>
        </div>
      </nav>
      {children}
      <footer className="py-16 border-t border-white/10 bg-black px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 text-sm text-white/40 font-light">
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter uppercase text-white">AUFIN</span>
            <span className="text-gold text-sm font-bold tracking-[0.2em]">AUTO</span>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white/60">AUFI s.r.o.</p>
            <p>IČO: 24398071</p>
            <p>Humpolecká 1886/26, Krč, 140 00 Praha</p>
          </div>
          <nav className="flex flex-col gap-2">
            <a href="/blog" className="hover:text-gold transition-colors">Blog</a>
            <a href="/auta-na-splatky-bez-registru" className="hover:text-gold transition-colors">Auta na splátky bez registru</a>
            <a href="/ochrana-osobnich-udaju" className="hover:text-gold transition-colors">Ochrana osobních údajů</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>(STATIC_POSTS);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)));
        }
      },
      () => {/* offline / chybí oprávnění – ponecháme statické články */}
    );
    return () => unsub();
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
          <div className="max-w-3xl mx-auto px-6 pt-48 pb-32 text-center">
            <Helmet><title>Článek nenalezen | AUFIN AUTO</title><meta name="robots" content="noindex" /></Helmet>
            <h1 className="text-3xl font-bold mb-6">Článek nenalezen</h1>
            <a href="/blog" className="text-gold hover:text-white transition-colors">← Zpět na blog</a>
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
        <article className="max-w-3xl mx-auto px-6 pt-36 md:pt-44 pb-24">
          <a href="/blog" className="inline-flex items-center gap-1 text-white/40 hover:text-gold transition-colors text-sm mb-8">
            <ChevronLeft className="w-4 h-4" /> Zpět na blog
          </a>
          {post.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold tracking-widest uppercase mb-5">
              {post.category}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">{post.title}</h1>
          <div className="text-white/40 text-sm mb-8">{post.author || "AUFIN AUTO"}</div>
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full rounded-3xl border border-white/10 mb-10 object-cover aspect-[16/9]"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="text-white/60 font-light leading-relaxed text-lg">
            {renderContent(post.content)}
          </div>

          <div className="mt-16 bg-dark-card rounded-3xl border border-white/5 p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Hledáte auto na splátky?</h2>
            <p className="text-white/50 font-light mb-8">Vyberte si vůz z naší nabídky – schválení do 30 minut, bez registru.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/#nabidka-aut" className="bg-gold text-black px-8 py-4 rounded-full font-bold hover:bg-white transition-all flex items-center justify-center gap-2">
                NABÍDKA AUT <ChevronRight className="w-5 h-5" />
              </a>
              <a href="tel:+420731562211" className="border border-white/20 hover:border-gold px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" /> +420 731 562 211
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

      <section className="max-w-5xl mx-auto px-6 pt-40 md:pt-52 pb-12 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold tracking-[0.2em] uppercase mb-6">
          Rádce
        </span>
        <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-6">Blog AUFIN AUTO</h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto font-light">
          Praktické články o autech na splátky bez registru – podmínky, financování při exekuci či insolvenci a tipy, na co si dát pozor.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        {published.length === 0 ? (
          <p className="text-center text-white/40 py-20">Zatím zde nejsou žádné články.</p>
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
                className="group bg-dark-card rounded-3xl overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-500 flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden bg-white/5">
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
                    <span className="text-[10px] uppercase tracking-widest text-gold font-bold mb-3">{post.category}</span>
                  )}
                  <h2 className="text-xl font-bold mb-3 leading-snug group-hover:text-gold transition-colors">{post.title}</h2>
                  <p className="text-white/50 text-sm font-light leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-gold text-sm font-bold">
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
