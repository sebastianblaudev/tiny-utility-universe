
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import { cn } from "@/lib/utils"

interface AspectRatioProps extends React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> {
  className?: string;
  imageUrl?: string;
}

const AspectRatio = AspectRatioPrimitive.Root

const CardImage = ({ imageUrl, className }: { imageUrl?: string, className?: string }) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <AspectRatio ratio={3/2}>
        <img
          src={imageUrl || "/placeholder.svg"}
          alt="Product image"
          className="object-cover w-full h-full rounded-t-md"
        />
      </AspectRatio>
    </div>
  )
}

export { AspectRatio, CardImage }

