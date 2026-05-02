interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'neutral'
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const styles: Record<string, string> = {
    success: 'bg-success-bg text-success-text',
    neutral: 'bg-[rgba(104,107,130,0.12)] text-[#484b5e]',
  }

  return (
    <span
      className={`inline-flex items-center rounded-badge px-2 py-0.5 text-sm font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  )
}
