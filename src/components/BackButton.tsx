
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function BackButton() {
  return (
    <Link to="/">
      <Button
        variant="outline"
        size="icon"
        className="bg-[#1A1A1A] hover:bg-[#252525] hover:border-orange-500 border-[#333333]"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    </Link>
  )
}
