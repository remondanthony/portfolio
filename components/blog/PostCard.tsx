import Image from 'next/image';
import type { Post } from '@/lib/blog/model';
import { formatDate } from '@/lib/blog/format';

/**
 * One article, as a card. The same panel, hairline and lift as the project
 * card on the homepage, so the blog reads as part of the same site.
 *
 * The heading level is a prop: the cards are the main items on /blog (h2)
 * but sit under a "Keep reading" heading on an article page (h3).
 *
 * The whole card is one link. The title is the link's text; the image is
 * decorative here because the title says what the article is.
 */
export default function PostCard({
  post,
  as: Heading = 'h2',
  featured = false,
  priority = false,
}: {
  post: Post;
  as?: 'h2' | 'h3';
  featured?: boolean;
  priority?: boolean;
}) {
  const date = post.updated ?? post.published;
  return (
    <article className={`bl-card reveal${featured ? ' bl-card--featured' : ''}`}>
      <a href={post.url} className="bl-card-link">
        <div className="bl-card-media">
          {post.image ? (
            <Image
              src={post.image.src}
              alt=""
              width={post.image.width}
              height={post.image.height}
              sizes={featured ? '(min-width: 1280px) 700px, (min-width: 900px) 56vw, 92vw' : '(min-width: 1280px) 380px, (min-width: 900px) 30vw, 92vw'}
              priority={priority}
            />
          ) : (
            <span className="bl-card-noimg" aria-hidden="true">{post.category}</span>
          )}
        </div>
        <div className="bl-card-body">
          <span className="bl-cat">
            {post.category}
            {post.draft && <span className="bl-draft">Draft</span>}
          </span>
          <Heading className="bl-card-title">{post.title}</Heading>
          <p className="bl-card-excerpt">{post.excerpt}</p>
          <p className="bl-card-meta">
            <time dateTime={date}>{post.updated ? `Updated ${formatDate(date)}` : formatDate(date)}</time>
            <span aria-hidden="true"> · </span>
            {post.readingMinutes} min read
          </p>
        </div>
      </a>
    </article>
  );
}
