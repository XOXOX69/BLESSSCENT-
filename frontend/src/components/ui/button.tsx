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
          "bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] hover:from-yellow-300 hover:to-amber-400",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] hover:from-red-400 hover:to-rose-500",
        outline:
          "border-2 border-yellow-400/50 bg-transparent text-yellow-600 hover:bg-yellow-400/10 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98]",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow-md active:scale-[0.98]",
        ghost:
          "hover:bg-yellow-400/10 hover:text-yellow-600 active:scale-[0.98]",
        link: 
          "text-yellow-600 underline-offset-4 hover:underline hover:text-yellow-500",
        // New fancy variants
        glow:
          "bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700 shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-400/50 active:scale-[0.98]",
        shine:
          "bg-black text-yellow-400 font-semibold border border-yellow-400/30 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-yellow-400/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-500 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98]",
        glass:
          "bg-white/20 backdrop-blur-md border border-white/30 text-gray-800 hover:bg-white/40 hover:shadow-lg shadow-black/5 active:scale-[0.98]",
        neon:
          "bg-transparent border-2 border-yellow-400 text-yellow-400 font-semibold shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:shadow-[0_0_25px_rgba(250,204,21,0.5),0_0_50px_rgba(250,204,21,0.3)] hover:bg-yellow-400/10 active:scale-[0.98] transition-all duration-300",
        gradient:
          "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-[length:200%_100%] text-black font-semibold animate-gradient-x hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98]",
        pulse:
          "bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold shadow-lg shadow-yellow-500/30 hover:animate-pulse active:scale-[0.98]",
        slideBg:
          "relative overflow-hidden bg-transparent border-2 border-yellow-400 text-yellow-400 font-semibold before:absolute before:inset-0 before:bg-gradient-to-r before:from-yellow-400 before:to-amber-500 before:translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300 hover:text-black [&>*]:relative [&>*]:z-10 active:scale-[0.98]",
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
