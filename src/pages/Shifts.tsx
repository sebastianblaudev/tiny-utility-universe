
import { ShiftManager } from "@/components/shifts/ShiftManager"
import { BackButton } from "@/components/BackButton"

export default function Shifts() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto p-4 relative">
        <BackButton />
        <div className="max-w-md mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6">Apertura y Cierre de Caja</h1>
          <ShiftManager />
        </div>
      </div>
    </div>
  );
}
