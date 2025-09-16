import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full bg-background text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "h-10 rounded-lg border border-input px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-primary/50 focus-visible:border-primary",
        filled: "h-10 rounded-lg border-0 bg-muted px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted/80 focus-visible:bg-background",
        outlined: "h-10 rounded-lg border-2 border-input px-3 py-2 bg-transparent focus-visible:border-primary focus-visible:ring-0 hover:border-primary/50",
        underlined: "h-10 rounded-none border-0 border-b-2 border-input px-0 py-2 bg-transparent focus-visible:border-primary focus-visible:ring-0 hover:border-primary/50",
        glass: "h-10 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-white/20 hover:bg-white/15",
        minimal: "h-10 rounded-lg border-0 bg-transparent px-3 py-2 hover:bg-muted/50 focus-visible:bg-muted focus-visible:ring-0",
      },
      size: {
        default: "h-10",
        sm: "h-8 px-2 text-xs",
        lg: "h-12 px-4 text-base",
        xl: "h-14 px-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
