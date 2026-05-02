import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'subtle' | 'secondary'
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-button px-4 py-[13px] text-base font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

  const variants: Record<string, string> = {
    primary: 'bg-brand text-white hover:opacity-90',
    outline: 'border border-brand-dark text-brand-dark bg-white hover:bg-brand-subtle',
    subtle: 'bg-brand-subtle text-brand hover:opacity-90',
    secondary: 'bg-[rgba(148,151,169,0.08)] text-near-black hover:opacity-90',
  }

  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
