import { cn } from '@/lib/utils'
import { forwardRef, useId } from 'react'

export const Input = forwardRef(function Input({ label, error, className, id: idProp, ...props }, ref) {
  const generatedId = useId()
  const id = idProp ?? (label ? generatedId : undefined)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          'w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900',
          'placeholder:text-gray-400 outline-none transition',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  )
})
