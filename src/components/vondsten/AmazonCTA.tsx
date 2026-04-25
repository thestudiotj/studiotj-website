interface AmazonCTAProps {
  url: string;
  label?: string;
  showDisclosurePrefix?: boolean;
}

export default function AmazonCTA({ url, label, showDisclosurePrefix }: AmazonCTAProps) {
  const isPlaceholder = url === "TODO_GENERATE_VIA_SITESTRIPE";

  if (isPlaceholder && process.env.NODE_ENV !== "production") {
    console.warn("[AmazonCTA] amazon_url is TODO_GENERATE_VIA_SITESTRIPE — rendering as disabled");
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
        {label ?? "Bekijk op Amazon"} →
      </a>
      {showDisclosurePrefix && (
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Betaalde link. Als Amazon-partner verdien ik aan in aanmerking komende aankopen.
        </p>
      )}
    </div>
  );
}
