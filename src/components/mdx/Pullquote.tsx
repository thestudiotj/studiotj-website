interface PullquoteProps {
  children: React.ReactNode
  attribution?: string
}

export default function Pullquote({ children, attribution }: PullquoteProps) {
  return (
    <blockquote
      className="my-8 border-l-4 pl-6"
      style={{ borderColor: 'var(--accent)' }}
    >
      <p className="font-display text-2xl md:text-3xl leading-snug italic" style={{ color: 'var(--accent)' }}>
        {children}
      </p>
      {attribution && (
        <cite className="mt-3 block text-sm text-muted not-italic font-mono tracking-wide">
          — {attribution}
        </cite>
      )}
    </blockquote>
  )
}
