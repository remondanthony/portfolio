import Image from 'next/image';
import type { ReactNode } from 'react';

/**
 * A screenshot, framed and captioned.
 *
 * The caption is not decoration. Every screenshot on a case study is
 * evidence, and evidence shown without saying what it demonstrates invites
 * the reader to assume more than it shows.
 *
 * Screenshots of dashboards are dense, and at phone width their text is too
 * small to read, so each one links to the full-size file rather than being
 * cropped or scaled until it says something it does not.
 *
 * Quality 82 for the same reason the concept mockups use it: interface text
 * is the first thing to go soft under compression.
 */
export default function Shot({
  src,
  alt,
  width,
  height,
  sizes,
  caption,
  label,
  chrome,
  priority = false,
  zoom = true,
  className = '',
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  caption?: ReactNode;
  /** Small uppercase line above the caption, e.g. the report's name. */
  label?: string;
  /** Draws a quiet browser bar with this address in it. */
  chrome?: string;
  priority?: boolean;
  zoom?: boolean;
  className?: string;
}) {
  return (
    <figure className={`cs-shot reveal ${className}`.trim()}>
      <div className="cs-shot-frame">
        {chrome && (
          <div className="cs-shot-bar" aria-hidden="true">
            <i /><i /><i />
            <span>{chrome}</span>
          </div>
        )}
        <div className="cs-shot-img">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            quality={82}
            priority={priority}
          />
        </div>
      </div>
      {(caption || label || zoom) && (
        <figcaption>
          {label && <span className="cs-shot-label">{label}</span>}
          {caption}
          {zoom && (
            <>
              {' '}
              <a className="cs-shot-zoom" href={src} target="_blank" rel="noopener noreferrer">
                View full size<span className="cs-sr"> (opens in a new tab)</span> ↗
              </a>
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
