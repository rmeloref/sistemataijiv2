import { Label } from '@/components/ui/label'

type Props = {
  id: string
  name: string
  label: string
  defaultValue?: string | null
  placeholder?: string
  rows?: number
}

export function FieldTextarea({ id, name, label, defaultValue, placeholder, rows = 3 }: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        rows={rows}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
      />
    </div>
  )
}
