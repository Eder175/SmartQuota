import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | "default"
    | "secondary"
    | "success"
    | "destructive"
    | "warning"
    | "info"
    | "outline"
    | "ghost"
    | "link"
  size?: "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg"
  loading?: boolean
  asChild?: boolean
}

const buttonVariants = {
  default: "bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none transition-all duration-200",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200",
  success: "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200",
  destructive: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200",
  warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md hover:from-yellow-600 hover:to-orange-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200",
  info: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200",
  outline: "border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200",
  ghost: "text-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200",
  link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200",
}

const buttonSizes = {
  default: "px-4 py-2 rounded-md text-sm font-medium min-h-[2.5rem]",
  sm: "px-3 py-1.5 rounded-md text-xs font-medium min-h-[2rem]",
  lg: "px-6 py-3 rounded-lg text-base font-semibold min-h-[3rem]",
  xl: "px-8 py-4 rounded-xl text-lg font-bold shadow-lg min-h-[3.5rem]",
  icon: "h-10 w-10 rounded-md flex items-center justify-center",
  "icon-sm": "h-8 w-8 rounded-md flex items-center justify-center",
  "icon-lg": "h-12 w-12 rounded-lg flex items-center justify-center",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background relative overflow-hidden",
          buttonVariants[variant],
          buttonSizes[size],
          loading && "cursor-not-allowed opacity-70",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        <span className={cn("flex items-center gap-2", loading && "invisible")}>
          {children}
        </span>
      </button>
    )
  }
)

Button.displayName = "Button"