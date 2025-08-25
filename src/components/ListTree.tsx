
import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListTreeProps {
  items: any[];
  collapsible?: boolean;
  indentLevel?: number;
}

export const ListTree: React.FC<ListTreeProps> = ({ 
  items, 
  collapsible = true,
  indentLevel = 0 
}) => {
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({});

  const toggleItem = (index: number) => {
    if (!collapsible) return;
    
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!items?.length) {
    return null;
  }

  return (
    <ul className={cn(
      "space-y-1", 
      indentLevel > 0 && "ml-4 mt-1 border-l border-gray-200 pl-4"
    )}>
      {items.map((item, index) => {
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openItems[index];
        const label = item.label || item.name;
        
        return (
          <li key={index} className="relative">
            {hasChildren && collapsible ? (
              <Collapsible open={isOpen} onOpenChange={() => toggleItem(index)}>
                <div className="flex items-center">
                  <CollapsibleTrigger asChild>
                    <button 
                      className="inline-flex items-center text-left rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 mr-1 opacity-70" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1 opacity-70" />
                      )}
                      <span className="font-medium">{label}</span>
                    </button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <ListTree 
                    items={item.children} 
                    collapsible={collapsible} 
                    indentLevel={indentLevel + 1} 
                  />
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className={`flex items-center ${hasChildren ? 'font-medium' : ''}`}>
                {hasChildren && !collapsible && (
                  <span className="inline-block w-4 mr-1" />
                )}
                <span>{label}</span>
              </div>
            )}
            
            {hasChildren && !collapsible && (
              <ListTree 
                items={item.children} 
                collapsible={false} 
                indentLevel={indentLevel + 1} 
              />
            )}
          </li>
        );
      })}
    </ul>
  );
};
