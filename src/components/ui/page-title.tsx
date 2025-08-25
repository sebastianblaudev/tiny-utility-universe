
import React from "react";
import { cn } from "@/lib/utils";

interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  title?: string;
  description?: string;
  subtitle?: string;
}

export function PageTitle({
  children,
  title,
  description,
  subtitle,
  className,
  ...props
}: PageTitleProps) {
  return (
    <div className="mb-8">
      <h1 className={cn("text-3xl font-bold tracking-tight", className)} {...props}>
        {title || children}
      </h1>
      {description && <p className="text-muted-foreground mt-2">{description}</p>}
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  );
}
