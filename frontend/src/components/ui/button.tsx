import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: 
          "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white font-semibold shadow-lg shadow-[#f59e0b]/25 hover:shadow-xl hover:shadow-[#f59e0b]/40 hover:scale-[1.02] active:scale-[0.98] hover:from-[#fcd34d] hover:to-[#fbbf24]",
        destructive:
          "bg-gradient-to-r from-[#ef4444] to-[#f87171] text-white font-semibold shadow-lg shadow-[#ef4444]/25 hover:shadow-xl hover:shadow-[#ef4444]/40 hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-2 border-[#f59e0b]/50 bg-transparent text-[#f59e0b] hover:bg-[#f59e0b]/10 hover:border-[#f59e0b] hover:shadow-lg hover:shadow-[#f59e0b]/20 active:scale-[0.98]",
        secondary:
          "bg-[#fffbeb] text-[#78716c] hover:bg-[#fef3c7] shadow-sm hover:shadow-md active:scale-[0.98]",
        ghost:
          "hover:bg-[#f59e0b]/10 hover:text-[#f59e0b] active:scale-[0.98]",
        link: 
          "text-[#f59e0b] underline-offset-4 hover:underline hover:text-[#d97706]",
        // New fancy variants
        glow:
          "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white font-semibold relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700 shadow-lg shadow-[#f59e0b]/30 hover:shadow-xl hover:shadow-[#f59e0b]/50 active:scale-[0.98]",
        shine:
          "bg-white text-[#f59e0b] font-semibold border border-[#f59e0b]/30 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[#f59e0b]/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-500 hover:border-[#f59e0b]/60 hover:shadow-lg hover:shadow-[#f59e0b]/20 active:scale-[0.98]",
        glass:
          "bg-white/80 backdrop-blur-md border border-[#fde68a] text-[#78716c] hover:bg-white hover:shadow-sneat active:scale-[0.98]",
        neon:
          "bg-transparent border-2 border-[#f59e0b] text-[#f59e0b] font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5),0_0_50px_rgba(245,158,11,0.3)] hover:bg-[#f59e0b]/10 active:scale-[0.98] transition-all duration-300",
        gradient:
          "bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#f97316] bg-[length:200%_100%] text-white font-semibold animate-gradient-x hover:shadow-xl hover:shadow-[#f59e0b]/30 active:scale-[0.98]",
        pulse:
          "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white font-semibold shadow-lg shadow-[#f59e0b]/30 hover:animate-pulse active:scale-[0.98]",
        slideBg:
          "relative overflow-hidden bg-transparent border-2 border-[#f59e0b] text-[#f59e0b] font-semibold before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#fbbf24] before:to-[#f59e0b] before:translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300 hover:text-white [&>*]:relative [&>*]:z-10 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-8 text-base has-[>svg]:px-5",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold has-[>svg]:px-6",
        icon: "size-10 rounded-xl",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
