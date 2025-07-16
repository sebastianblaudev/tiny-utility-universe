
import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
      className
    )}
    {...props}
  >
    <div className="overflow-hidden">{children}</div>
  </CollapsiblePrimitive.CollapsibleContent>
));
CollapsibleContent.displayName = "CollapsibleContent";

const CollapsibleTriggerIcon = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger> & {
    title?: string;
  }
>(({ className, children, title, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    className={cn(
      "flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-left rounded-md hover:bg-primary/10",
      className
    )}
    {...props}
  >
    {title && <span>{title}</span>}
    {children}
    <ChevronDown className="w-4 h-4 transition-transform duration-200 ui-open:rotate-180" />
  </CollapsiblePrimitive.CollapsibleTrigger>
));
CollapsibleTriggerIcon.displayName = "CollapsibleTriggerIcon";

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleTriggerIcon };
