import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Figure from '@/components/blog/Figure';

/**
 * How Markdown renders inside a blog article. Required at the project root
 * by @next/mdx.
 *
 * - The article title is the page's only H1, so a "#" heading in the body is
 *   rendered as an H2. Articles should start their sections at "##".
 * - Headings get an id from their text, so sections can be linked to
 *   directly (/blog/slug#section-name).
 * - Links to other sites open in a new tab; links within Vioniche do not.
 * - <Figure> is available in every article without an import, for images
 *   that need next/image sizing and a caption.
 */

const text = (node: ReactNode): string =>
  typeof node === 'string' || typeof node === 'number'
    ? String(node)
    : Array.isArray(node)
      ? node.map(text).join('')
      : node && typeof node === 'object' && 'props' in node
        ? text((node.props as { children?: ReactNode }).children)
        : '';

const id = (children: ReactNode) =>
  text(children).toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');

const heading = (Tag: 'h2' | 'h3' | 'h4') =>
  function Heading({ children, ...rest }: ComponentPropsWithoutRef<'h2'>) {
    return <Tag id={id(children)} {...rest}>{children}</Tag>;
  };

function Anchor({ href = '', children, ...rest }: ComponentPropsWithoutRef<'a'>) {
  const external = /^https?:\/\//.test(href) && !href.startsWith('https://www.vioniche.com');
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
  ) : (
    <a href={href} {...rest}>{children}</a>
  );
}

const components: MDXComponents = {
  h1: heading('h2'),
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  a: Anchor,
  Figure,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
