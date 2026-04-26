interface Spec {
  label: string;
  value: string;
}

interface ItemSpecsProps {
  specs: Spec[];
}

export default function ItemSpecs({ specs }: ItemSpecsProps) {
  if (specs.length === 0) return null;

  return (
    <section className="border-t border-dust/30 pt-8 mb-10">
      <h2 className="font-display text-2xl text-ink mb-6">Specs</h2>
      <dl className="divide-y divide-dust/20">
        {specs.map((spec) => (
          <div key={spec.label} className="py-3 grid grid-cols-2 gap-4">
            <dt className="text-sm text-muted">{spec.label}</dt>
            <dd className="text-sm text-ink">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
