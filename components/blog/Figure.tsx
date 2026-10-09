import Image from 'next/image';

/**
 * An image inside an article, used from MDX as
 *
 *   <Figure src="/blog/slug/diagram.jpg" alt="…" width={1600} height={900} caption="…" />
 *
 * Width and height are required so the page does not shift as it loads, and
 * alt is required because an article image usually carries meaning the text
 * relies on. Quality 82, as elsewhere on the site, keeps interface text in
 * screenshots legible.
 */
export default function Figure({
  src,
  alt,
  width,
  height,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}) {
  return (
    <figure className="bl-figure">
      <Image src={src} alt={alt} width={width} height={height} quality={82} sizes="(min-width: 860px) 760px, 92vw" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
