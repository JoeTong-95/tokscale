import Link from "next/link";
import { companyPath } from "@/lib/capital";

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Renders story paragraphs. Supports `[text](company:slug)` for company pages
 * and `[text](https://...)` for external pages; everything else is plain text.
 */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, target] = match;
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    if (target.startsWith("company:")) {
      parts.push(
        <Link key={start} href={companyPath(target.slice("company:".length))}>
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a key={start} href={target} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    last = start + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function StoryBody({ sections }: { sections: Array<{ heading: string; paragraphs: string[] }> }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>
              <RichText text={paragraph} />
            </p>
          ))}
        </section>
      ))}
    </>
  );
}
