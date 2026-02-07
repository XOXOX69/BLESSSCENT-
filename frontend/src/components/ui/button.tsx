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
          "bg-gradient-to-r from-[#7367f0] to-[#9e95f5] text-white font-semibold shadow-lg shadow-[#7367f0]/25 hover:shadow-xl hover:shadow-[#7367f0]/40 hover:scale-[1.02] active:scale-[0.98] hover:from-[#8579f2] hover:to-[#aea6f7]",
        destructive:
          "bg-gradient-to-r from-[#ea5455] to-[#f08182] text-white font-semibold shadow-lg shadow-[#ea5455]/25 hover:shadow-xl hover:shadow-[#ea5455]/40 hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-2 border-[#7367f0]/50 bg-transparent text-[#7367f0] hover:bg-[#7367f0]/10 hover:border-[#7367f0] hover:shadow-lg hover:shadow-[#7367f0]/20 active:scale-[0.98]",
        secondary:
          "bg-[#f8f7fa] text-[#5d596c] hover:bg-[#eeedf0] shadow-sm hover:shadow-md active:scale-[0.98]",
        ghost:
          "hover:bg-[#7367f0]/10 hover:text-[#7367f0] active:scale-[0.98]",
        link: 
          "text-[#7367f0] underline-offset-4 hover:underline hover:text-[#5f55e4]",
        // New fancy variants
        glow:
          "bg-gradient-to-r from-[#7367f0] to-[#9e95f5] text-white font-semibold relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700 shadow-lg shadow-[#7367f0]/30 hover:shadow-xl hover:shadow-[#7367f0]/50 active:scale-[0.98]",
        shine:
          "bg-white text-[#7367f0] font-semibold border border-[#7367f0]/30 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[#7367f0]/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-500 hover:border-[#7367f0]/60 hover:shadow-lg hover:shadow-[#7367f0]/20 active:scale-[0.98]",
        glass:
          "bg-white/80 backdrop-blur-md border border-[#e4e6e8] text-[#5d596c] hover:bg-white hover:shadow-sneat active:scale-[0.98]",
        neon:
          "bg-transparent border-2 border-[#7367f0] text-[#7367f0] font-semibold shadow-[0_0_15px_rgba(115,103,240,0.3)] hover:shadow-[0_0_25px_rgba(115,103,240,0.5),0_0_50px_rgba(115,103,240,0.3)] hover:bg-[#7367f0]/10 active:scale-[0.98] transition-all duration-300",
        gradient:
          "bg-gradient-to-r from-[#7367f0] via-[#9e95f5] to-[#00cfe8] bg-[length:200%_100%] text-white font-semibold animate-gradient-x hover:shadow-xl hover:shadow-[#7367f0]/30 active:scale-[0.98]",
        pulse:
          "bg-gradient-to-r from-[#7367f0] to-[#9e95f5] text-white font-semibold shadow-lg shadow-[#7367f0]/30 hover:animate-pulse active:scale-[0.98]",
        slideBg:
          "relative overflow-hidden bg-transparent border-2 border-[#7367f0] text-[#7367f0] font-semibold before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#7367f0] before:to-[#9e95f5] before:translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300 hover:text-white [&>*]:relative [&>*]:z-10 active:scale-[0.98]",
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
