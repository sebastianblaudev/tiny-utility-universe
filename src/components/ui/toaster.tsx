
import * as React from "react"
import { Toaster as Sonner } from "sonner"
import { useTheme } from "next-themes"

interface ToasterProps {
  className?: string
}

export function Toaster({ className, ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner 
      theme={theme as "light" | "dark" | "system"}
      className={className}
      position="top-left"
      toastOptions={{
        classNames: {
          toast:
            "group border-border bg-background text-foreground flex flex-col gap-1 p-4 rounded-md shadow-lg",
          title: "font-semibold",
          description: "text-muted-foreground text-sm",
          actionButton:
            "bg-primary text-primary-foreground text-xs px-3 py-1 rounded-md",
          cancelButton:
            "bg-muted text-muted-foreground text-xs px-3 py-1 rounded-md",
          error:
            "destructive group border-destructive bg-destructive text-destructive-foreground",
          success: "bg-green-500 text-white",
        },
        duration: 4000, // Default duration for all toasts (4 seconds)
      }}
      {...props}
    />
  )
}
