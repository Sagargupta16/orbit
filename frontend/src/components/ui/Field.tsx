import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

// 16px text on phones: iOS Safari zooms the page when a smaller field gets focus.
export const inputClass =
  'h-10 w-full rounded-control border border-border-hairline bg-surface px-3 text-base text-text-primary sm:text-sm placeholder:text-text-placeholder focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60'

interface FieldShellProps {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-badge-error-fg">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, id, className = '', ...rest }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <input id={fieldId} aria-invalid={Boolean(error)} className={`${inputClass} ${className}`} {...rest} />
    </FieldShell>
  )
}

export function DateField(props: Omit<TextFieldProps, 'type'>) {
  return <TextField type="date" {...props} />
}

export function NumberField(props: Omit<TextFieldProps, 'type'>) {
  return <TextField type="number" inputMode="numeric" {...props} />
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export function TextArea({ label, hint, error, id, className = '', rows = 3, ...rest }: TextAreaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`${inputClass} h-auto py-2 ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
  hint?: string
  error?: string
}

export function SelectField({ label, options, hint, error, id, className = '', ...rest }: SelectFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <select id={fieldId} className={`${inputClass} ${className}`} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
