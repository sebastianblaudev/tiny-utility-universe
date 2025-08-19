
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  productId?: string;
  saveToDatabase?: boolean;
}

const predefinedColors = [
  '#f87171', // red
  '#fb923c', // orange
  '#facc15', // yellow
  '#a3e635', // lime
  '#4ade80', // green
  '#2dd4bf', // teal
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#818cf8', // indigo
  '#a78bfa', // violet
  '#e879f9', // purple
  '#f472b6', // pink
];

const ColorPicker: React.FC<ColorPickerProps> = ({ 
  color, 
  onChange, 
  className = '',
  productId,
  saveToDatabase = false
}) => {
  const [open, setOpen] = React.useState(false);

  // Creating a standalone function to handle the color selection and database operations
  const handleColorChange = async (newColor: string) => {
    try {
      // First update the local state through the onChange prop
      onChange(newColor);
      
      // Close the popover
      setOpen(false);
      
      // If saveToDatabase is true and we have a productId, save the color to the database
      if (saveToDatabase && productId) {
        // Show loading toast
        toast.loading('Guardando color...', { id: 'saving-color' });
        
        // Update the color in the products table
        const { error } = await supabase
          .from('products')
          .update({ color: newColor })
          .eq('id', productId);
          
        if (error) {
          console.error('Error saving color to products table:', error);
          toast.error('Error al guardar el color', { id: 'saving-color' });
          return;
        }
        
        // Check if color already exists in product_colors table
        const { data: existingColors, error: fetchError } = await supabase
          .from('product_colors')
          .select('*')
          .eq('product_id', productId)
          .eq('color_code', newColor);
          
        if (fetchError) {
          console.error('Error checking existing colors:', fetchError);
        }
        
        // If color doesn't exist in product_colors, add it
        if (!existingColors || existingColors.length === 0) {
          const { error: colorError } = await supabase
            .from('product_colors')
            .insert({
              product_id: productId,
              color_code: newColor,
              is_default: true,
            });
            
          if (colorError) {
            console.error('Error saving to product_colors:', colorError);
          } else {
            console.log('Color saved to product_colors successfully');
          }
        } else {
          // If color exists, update it to be the default
          const { error: updateError } = await supabase
            .from('product_colors')
            .update({ is_default: true })
            .eq('product_id', productId)
            .eq('color_code', newColor);
            
          if (updateError) {
            console.error('Error updating default color:', updateError);
          } else {
            console.log('Default color updated successfully');
          }
        }
        
        toast.success('Color guardado correctamente', { id: 'saving-color' });
      }
    } catch (err) {
      console.error('Exception saving color:', err);
      toast.error('Error al guardar el color', { id: 'saving-color' });
    }
  };

  // Stopping event propagation properly
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  // Ensuring proper event handling for content click
  const handleContentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Creating a specialized color button handler
  const handleColorButtonClick = (e: React.MouseEvent, colorValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleColorChange(colorValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button"
          variant="outline" 
          className={`w-10 h-10 rounded-md p-0 border-2 ${className}`} 
          style={{ backgroundColor: color || '#e2e8f0' }}
          onClick={handleTriggerClick}
        >
          <span className="sr-only">Choose color</span>
          <Palette className="h-4 w-4 text-slate-400 absolute bottom-0 right-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" onClick={handleContentClick}>
        <div className="grid grid-cols-4 gap-2">
          {predefinedColors.map((colorValue) => (
            <Button
              key={colorValue}
              type="button"
              variant="outline"
              className="w-10 h-10 rounded-md p-0 border-2"
              style={{ backgroundColor: colorValue }}
              onClick={(e) => handleColorButtonClick(e, colorValue)}
            >
              <span className="sr-only">{colorValue}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;
