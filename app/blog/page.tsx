import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import PostCard from '@/components/blog/PostCard';
import { CATEGORIES } from '@/lib/blog/model';
import { getPosts } from '@/lib/blog/posts';
import { ORGANIZATION, SITE_URL, absolute } from '@/lib/site';

const TITLE = 'Vioniche Blog — SEO, Web Development & Automation';
const DESCRIPTION =
  'Practical writing from Vioniche on website development, technical SEO, automation and AI — how modern websites are built, found and kept running.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/blog' },
  openGraph: { type: 'website', url: '/blog', siteName: 'Vioniche', title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary', site: '@vionicheweb', title: TITLE, description: DESCRIPTION },
};

export default async function BlogIndex() {
  const posts = await getPosts();
  const [lead, ...rest] = posts;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${SITE_URL}/blog#blog`,
        name: 'Vioniche Blog',
        description: DESCRIPTION,
        url: absolute('/blog'),
        inLanguage: 'en',
        publisher: ORGANIZATION,
        // Listed only once there is something to list.
        ...(posts.length && {
          blogPost: posts.map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: absolute(p.url),
            datePublished: p.published,
            ...(p.updated && { dateModified: p.updated }),
          })),
        }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Vioniche', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: absolute('/blog') },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="bl-head" aria-labelledby="bl-title">
        <div className="wrap">
          <div className="reveal">
            <span className="eyebrow">Blog</span>
            <h1 id="bl-title" className="bl-title">Insights on Websites, <b>SEO &amp; Automation</b></h1>
            <p className="lead bl-intro">
              Notes from the work of building websites: how they are developed, how search engines
              find and understand them, and how automation and AI keep them running with less manual
              effort.
            </p>
          </div>
          <ul className="bl-topics reveal" aria-label="Topics">
            {CATEGORIES.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </section>

      <section className="bl-list" aria-label="Articles">
        <div className="wrap">
          {lead ? (
            <>
              <PostCard post={lead} featured priority />
              {rest.length > 0 && (
                <div className="bl-grid">
                  {rest.map((p) => <PostCard key={p.slug} post={p} />)}
                </div>
              )}
            </>
          ) : (
            // Honest about being new, rather than padded with placeholder posts.
            <div className="bl-empty reveal">
              <h2>The first articles are being written.</h2>
              <p>
                In the meantime, the <a href="/case-studies/born21">Born21 case study</a> shows the
                kind of work they will draw on.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
