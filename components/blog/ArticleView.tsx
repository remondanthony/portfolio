import Image from 'next/image';
import type { ReactNode } from 'react';
import PostCard from '@/components/blog/PostCard';
import BlogCta from '@/components/blog/BlogCta';
import { AUTHORS, type Post } from '@/lib/blog/model';
import { CASE_STUDIES, SERVICES } from '@/lib/blog/links';
import { formatDate } from '@/lib/blog/format';

/**
 * An article as readers see it: header, image, body, the case-study and
 * service links, related articles and the closing call.
 *
 * Shared by the public article route and the admin preview, so a preview is
 * the real page rather than an approximation of it. Pure markup — no data
 * loading — which is what lets the admin render it in the browser too.
 *
 * `imageSrc` lets the editor preview an image that has been chosen but not
 * yet committed; it is shown unoptimised because it is not a file on the site.
 */
export default function ArticleView({
  post,
  children,
  related,
  imageSrc,
}: {
  post: Post;
  children: ReactNode;
  related: Post[];
  imageSrc?: string;
}) {
  const author = AUTHORS[post.author];
  const caseStudies = (post.caseStudies ?? []).map((k) => CASE_STUDIES[k]).filter(Boolean);
  const services = (post.services ?? []).map((k) => SERVICES[k]).filter(Boolean);

  return (
    <>
      <article className="bl-article">
        <header className="bl-art-head wrap">
          <div className="reveal">
            <nav className="eyebrow bl-crumb" aria-label="Breadcrumb">
              <a href="/blog">Blog</a>
              <span aria-hidden="true">/</span>
              <span>{post.category}</span>
              {post.draft && <span className="bl-draft">Draft</span>}
            </nav>
            <h1 className="bl-art-title">{post.title}</h1>
            <p className="bl-art-dek">{post.description}</p>
            <p className="bl-art-meta">
              <span>By {author.name}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.published}>{formatDate(post.published)}</time>
              {post.updated && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
            </p>
          </div>
          {post.image && (
            <figure className="bl-art-image reveal">
              <Image
                src={imageSrc ?? post.image.src}
                alt={post.image.alt}
                width={post.image.width}
                height={post.image.height}
                sizes="(min-width: 1280px) 1152px, 92vw"
                quality={82}
                priority
                unoptimized={Boolean(imageSrc)}
              />
            </figure>
          )}
        </header>

        <div className="wrap">
          <div className="bl-prose">{children}</div>

          {(caseStudies.length > 0 || services.length > 0) && (
            <aside className="bl-next" aria-label="From Vioniche">
              {caseStudies.map((c) => (
                <a key={c.href} className="bl-next-card bl-next-card--case" href={c.href}>
                  <span className="bl-cat">Case study</span>
                  <span className="bl-next-title">{c.title}</span>
                  <span className="bl-next-text">{c.text}</span>
                  <span className="bl-next-go">Read the case study <span aria-hidden="true">→</span></span>
                </a>
              ))}
              {services.map((s) => (
                <a key={s.href} className="bl-next-card" href={s.href}>
                  <span className="bl-cat">Vioniche</span>
                  <span className="bl-next-title">{s.title}</span>
                  <span className="bl-next-text">{s.text}</span>
                  <span className="bl-next-go">Learn more <span aria-hidden="true">→</span></span>
                </a>
              ))}
            </aside>
          )}

          {post.tags.length > 0 && (
            <p className="bl-tags"><span>Filed under</span> {post.tags.join(' · ')}</p>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="bl-related" aria-labelledby="bl-related">
          <div className="wrap">
            <h2 id="bl-related" className="title">Keep <b>reading.</b></h2>
            <div className="bl-grid">
              {related.map((p) => <PostCard key={p.slug} post={p} as="h3" />)}
            </div>
          </div>
        </section>
      )}

      <BlogCta />
    </>
  );
}
