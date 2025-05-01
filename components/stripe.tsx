"use client"

import type React from "react"

interface StripeProps {
  children: React.ReactNode
  options: {
    mode: "payment" | "subscription"
    amount: number
    currency: string
    successUrl?: string
    cancelUrl?: string
  }
  className?: string
}

export function Stripe({ children, options, className }: StripeProps) {
  return <div className={className}>{children}</div>
}
