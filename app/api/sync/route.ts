import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Esta API permite sincronizar datos con Supabase desde el cliente
export async function POST(request: Request) {
  try {
    const { data, table, tenantId } = await request.json()

    if (!data || !table || !tenantId) {
      return NextResponse.json({ success: false, error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Inicializar cliente de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuración de Supabase no disponible" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          "x-tenant-id": tenantId,
        },
      },
    })

    // Insertar o actualizar datos en Supabase
    const { error } = await supabase.from(table).upsert(data)

    if (error) {
      console.error("Error al sincronizar con Supabase:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Método no permitido" }, { status: 405 })
}
