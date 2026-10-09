/**
 * Structured data as a server-rendered script tag.
 *
 * "<" is escaped so no string inside the data — an article title, say — can
 * close the script element early.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
