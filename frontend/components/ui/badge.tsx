import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-105 shadow-sm hover:shadow-md",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 shadow-sm hover:shadow-md",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:scale-105 shadow-sm hover:shadow-md",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:scale-105",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600 hover:scale-105 shadow-sm hover:shadow-md",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105 shadow-sm hover:shadow-md",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 shadow-sm hover:shadow-md",
        gradient: "border-transparent bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg hover:scale-105 shadow-md",
        glass: "backdrop-blur-md bg-white/10 border-white/20 text-foreground hover:bg-white/20 hover:scale-105 shadow-lg",
        neon: "border-transparent bg-cyan-500 text-white hover:bg-cyan-600 hover:scale-105 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70",
        minimal: "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs rounded-full",
        sm: "px-2 py-0.5 text-xs rounded-md",
        lg: "px-3 py-1 text-sm rounded-lg",
        xl: "px-4 py-1.5 text-base rounded-xl",
      },
      animation: {
        none: "",
        pulse: "animate-pulse-slow",
        bounce: "animate-bounce-gentle",
        ping: "animate-ping",
        spin: "animate-spin",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, animation, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, animation }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
