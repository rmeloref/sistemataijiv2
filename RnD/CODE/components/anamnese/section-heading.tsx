type Props = { title: string; description?: string }

export function SectionHeading({ title, description }: Props) {
  return (
    <div className="pb-3 border-b border-border">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  )
}
