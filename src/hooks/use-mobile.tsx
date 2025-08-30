
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Función para verificar si el dispositivo es móvil
    const checkMobile = () => {
      // Considera tanto el ancho de la ventana como el userAgent para mejor detección
      const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileWidth || isMobileDevice)
    }

    // Configura el listener de cambio de tamaño
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkMobile)
    
    // Verificación inicial
    checkMobile()
    
    // Limpieza del listener
    return () => mql.removeEventListener("change", checkMobile)
  }, [])

  return !!isMobile
}
