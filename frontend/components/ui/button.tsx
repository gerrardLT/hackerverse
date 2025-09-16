import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:scale-[1.02] active:scale-[0.98]",
        gradient: "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border-0 shadow-lg hover:shadow-2xl transition-all duration-500",
        "gradient-outline": "border-2 border-transparent bg-gradient-to-r from-primary to-secondary bg-clip-border text-transparent bg-clip-text hover:text-primary-foreground hover:bg-clip-padding hover:scale-[1.02] active:scale-[0.98] relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary before:to-secondary before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:-z-10",
        glass: "backdrop-blur-md bg-white/10 border border-white/20 text-foreground hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl",
        neon: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] border-0",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
