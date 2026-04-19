import { Label } from '@/components/ui/label'

type Option = { label: string; value: string }

type Props = {
  label?: string
  options: Option[]
  namePrefix: string
  defaultValues?: string[]
}

export function CheckboxGroup({ label, options, namePrefix, defaultValues = [] }: Props) {
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              name={`${namePrefix}_${opt.value}`}
              defaultChecked={defaultValues.includes(opt.value)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-foreground">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
