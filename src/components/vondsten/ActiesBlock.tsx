import { MDXRemote } from "next-mdx-remote/rsc";
import type { Actie } from "@/lib/vondsten/schemas";

interface ActiesBlockProps {
  acties: Actie[];
}

export default function ActiesBlock({ acties }: ActiesBlockProps) {
  if (acties.length === 0) return null;

  return (
    <section className="border border-dust/40 bg-dust/10 px-6 py-6 mb-10">
      <h2 className="font-display text-2xl text-ink mb-6">Acties</h2>
      <div className="space-y-6">
        {acties.map((actie) => (
          <div key={actie.name}>
            <p className="font-medium text-ink mb-1">{actie.name}</p>
            <p className="text-xs text-muted tracking-widest uppercase mb-3">
              {actie.display_label} · {actie.source}
            </p>
            <div className="text-sm text-muted leading-relaxed">
              <MDXRemote source={actie.body} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
