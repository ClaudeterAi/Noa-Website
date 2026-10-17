import type { ReactNode } from "react";
import type { L, Locale } from "@/content/types";
import { pick } from "@/content/registry";

/**
 * Renders a bilingual field with the light markup the registry uses:
 *   "\n"      → line break
 *   **text**  → <strong>
 *   *text*    → <em>
 */
export function Rich({ l, locale }: { l: L; locale: Locale }) {
  return <>{renderInline(pick(l, locale))}</>;
}

export function renderInline(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = s.split("\n");
  lines.forEach((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
    parts.forEach((p, pi) => {
      const key = `${li}-${pi}`;
      if (p.startsWith("**")) out.push(<strong key={key}>{p.slice(2, -2)}</strong>);
      else if (p.startsWith("*")) out.push(<em key={key}>{p.slice(1, -1)}</em>);
      else out.push(p);
    });
    if (li < lines.length - 1) out.push(<br key={`br-${li}`} />);
  });
  return out;
}
