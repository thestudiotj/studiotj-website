interface Make {
  label: string;
  value: string;
}

interface BrandMakesProps {
  makes: Make[];
}

export default function BrandMakes({ makes }: BrandMakesProps) {
  if (makes.length === 0) return null;

  return (
    <section className="border-t border-dust/30 pt-8 mb-10">
      <h2 className="font-display text-2xl text-ink mb-6">What they make</h2>
      <dl className="divide-y divide-dust/20">
        {makes.map((make) => (
          <div key={make.label} className="py-3 grid grid-cols-2 gap-4">
            <dt className="text-sm text-muted">{make.label}</dt>
            <dd className="text-sm text-ink">{make.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
