
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline",
        // Enhanced variant for the add product button in mobile view
        addProduct: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all duration-300 ease-out",
        // Enhanced barcode button variant
        barcode: "bg-zinc-800 text-white hover:bg-zinc-700 shadow-sm backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        // Enhanced inline barcode button variant
        inlineBarcode: "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        // Enhanced sales processing button variant with animated gradient
        processSale: "bg-[#22c55e] text-white hover:bg-[#22c55e]/90 shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all duration-300 ease-out relative overflow-hidden",
        // New glowing variant for important actions
        glowing: "bg-indigo-600 text-white hover:bg-indigo-700 relative overflow-hidden shadow-[0_0_15px_rgba(79,70,229,0.5)] hover:shadow-[0_0_25px_rgba(79,70,229,0.8)] transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0",
        // New fade variant for subtle actions
        fade: "bg-background/80 backdrop-blur-sm text-foreground border border-border hover:bg-background shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        // New variant specifically for "Nueva Venta" button 
        newSale: "bg-[#22c55e] text-white hover:bg-[#22c55e]/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300 ease-out",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
    
    // Add ripple effect
    const handleRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget;
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      
      const ripple = document.createElement('span');
      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
      ripple.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
      ripple.className = 'absolute rounded-full bg-white/30 pointer-events-none animate-ripple';
      
      const existingRipple = button.getElementsByClassName('animate-ripple');
      if (existingRipple.length > 0) {
        existingRipple[0].remove();
      }
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 800);
    };
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "relative overflow-hidden")}
        ref={ref}
        onClick={(e) => {
          handleRipple(e);
          if (props.onClick) {
            props.onClick(e);
          }
        }}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
