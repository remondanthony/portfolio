import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import ArticleView from '@/components/blog/ArticleView';
import BlogCtaPopup from '@/components/blog/BlogCtaPopup';
import { resolveCta } from '@/lib/blog/cta';
import { AUTHORS } from '@/lib/blog/model';
import { getPost, getPosts, getRelated } from '@/lib/blog/posts';
import { ORGANIZATION, SITE_URL, absolute } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

/** Every published article is built ahead of time; anything else is a 404. */
export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getPost(slug);
  if (!found) return {};
  const { post } = found;
  const title = `${post.title} | Vioniche`;
  const image = post.image && { url: post.image.src, width: post.image.width, height: post.image.height, alt: post.image.alt };

  return {
    title,
    description: post.description,
    alternates: { canonical: post.canonical ?? post.url },
    // Drafts only render in development; this keeps a stray preview out of any index.
    ...(post.draft && { robots: { index: false, follow: false } }),
    openGraph: {
      type: 'article',
      url: post.url,
      siteName: 'Vioniche',
      title,
      description: post.description,
      publishedTime: post.published,
      ...(post.updated && { modifiedTime: post.updated }),
      section: post.category,
      tags: post.tags,
      ...(image && { images: [image] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      site: '@vionicheweb',
      title,
      description: post.description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function Article({ params }: Props) {
  const { slug } = await params;
  const found = await getPost(slug);
  if (!found) notFound();
  const { post, Content } = found;

  const related = await getRelated(post);
  const author = AUTHORS[post.author];

  // Only fields the article actually declares. No ratings, no invented dates.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${absolute(post.url)}#article`,
        headline: post.title,
        description: post.description,
        url: absolute(post.url),
        mainEntityOfPage: post.canonical ?? absolute(post.url),
        datePublished: post.published,
        dateModified: post.updated ?? post.published,
        ...(post.image && { image: absolute(post.image.src) }),
        articleSection: post.category,
        keywords: post.tags,
        wordCount: post.wordCount,
        inLanguage: 'en',
        author: author.type === 'Organization' ? { '@id': ORGANIZATION['@id'] } : { '@type': 'Person', name: author.name },
        publisher: ORGANIZATION,
        isPartOf: { '@id': `${SITE_URL}/blog#blog` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Vioniche', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: absolute('/blog') },
          { '@type': 'ListItem', position: 3, name: post.title, item: absolute(post.url) },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <ArticleView post={post} related={related}>
        <Content />
      </ArticleView>

      {/* Public articles only — ArticleView is shared with the admin preview,
          so the popup is mounted here rather than inside it. */}
      {/* Keyed by slug: a different article is always a fresh popup. */}
      {!post.draft && <BlogCtaPopup key={post.slug} {...resolveCta(post.cta)} />}
    </>
  );
}
