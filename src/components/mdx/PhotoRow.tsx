interface PhotoRowProps {
  children: React.ReactNode
}

export default function PhotoRow({ children }: PhotoRowProps) {
  return (
    <div className="my-6 flex gap-2 items-start">
      {children}
    </div>
  )
}
