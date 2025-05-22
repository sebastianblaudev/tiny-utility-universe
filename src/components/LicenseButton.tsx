
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LicenseButtonProps extends ButtonProps {
  isActivated: boolean;
}

const LicenseButton = ({
  isActivated,
  className,
  ...props
}: LicenseButtonProps) => {
  return (
    <Button
      className={cn("flex items-center gap-2", className)}
      variant="default"
      disabled={isActivated}
      {...props}
    >
      <Shield className="w-4 h-4" />
      {isActivated ? "Licencia Activada" : "Activar Licencia"}
    </Button>
  );
};

export default LicenseButton;
