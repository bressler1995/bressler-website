import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button font-heading inline-flex shrink-0 items-center justify-center rounded-lg border bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus:ring-[3px] focus:ring-primary/50 dark:focus:ring-primary/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Every variant sets its own border colour. The base deliberately does
        // not, because buttonVariants() is sometimes used without cn() — with
        // two border-colour classes present and no tailwind-merge to resolve
        // them, CSS source order silently picks the winner.
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        outline:
          "focus:ring-secondary/50 dark:focus:ring-secondary/30 border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        // Reads the --secondary-* tokens rather than hardcoding a colour, so a
        // slate section can retarget them (a slate button on slate vanishes).
        secondary:
          "focus:ring-secondary/50 dark:focus:ring-secondary/30 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active aria-expanded:bg-secondary-active aria-expanded:text-secondary-foreground",
        // Hover and open/pressed states use the secondary pair rather than
        // muted — muted is a passive surface, and a control responding to the
        // pointer should read as the same family as a secondary button. No
        // dark: override needed: --secondary is already per-theme.
        ghost:
          "focus:ring-secondary/50 dark:focus:ring-secondary/30 border-transparent hover:bg-secondary hover:text-secondary-foreground active:bg-secondary-active active:text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 focus:ring-destructive/50 dark:focus:ring-destructive/30 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      // Size scale. `default` and `lg` are the standard, comfortable sizes;
      // `xs` and `sm` are the compact variants for dense UI (nav bars, toolbars,
      // table rows). Each step changes height *and* horizontal padding — the
      // upstream scale kept px-2.5 across default and lg, so `lg` never read as
      // a larger button.
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-5",
        // Icon sizes mirror the heights above so mixed rows line up.
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
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
