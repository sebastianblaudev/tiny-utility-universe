
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleMenuProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const CollapsibleMenu: React.FC<CollapsibleMenuProps> = ({ 
  title, 
  children, 
  defaultOpen = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`rounded-md border border-gray-200 dark:border-gray-800 ${className}`}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-md">
        <span>{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 pt-2 text-sm">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleMenu;
