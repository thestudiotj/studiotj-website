interface AffiliateCTAProps {
  url: string;
  brandName?: string;
  label?: string;
}

export default function AffiliateCTA({ url, brandName, label }: AffiliateCTAProps) {
  const displayLabel = label ?? (brandName ? `View ${brandName}` : "View brand");
  const isPlaceholder = url.includes("TODO");

  if (isPlaceholder && process.env.NODE_ENV !== "production") {
    console.warn("[AffiliateCTA] affiliate_url is a placeholder — rendering as disabled");
  }

  return (
    <div>
      <a
        href={isPlaceholder ? "#" : url}
        rel="sponsored noopener"
        target="_blank"
        className="btn-primary"
        {...(isPlaceholder ? { "aria-disabled": "true" } : {})}
      >
        {displayLabel} →
      </a>
      <p className="text-xs text-muted mt-3 leading-relaxed">Affiliate link.</p>
    </div>
  );
}
