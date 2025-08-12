import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'btn-base rounded-lg font-semibold transition-all duration-200'
    
    const variants = {
      primary: 'bg-primary-500 hover:bg-primary-400 text-background neon-glow',
      secondary: 'bg-surface hover:bg-neutral-700 text-text-primary border border-neutral-600',
      outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-background',
      ghost: 'text-text-primary hover:bg-surface',
    }
    
    const sizes = {
      sm: 'px-16 py-8 text-14',
      md: 'px-24 py-12 text-16',
      lg: 'px-32 py-16 text-18',
    }
    
    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
