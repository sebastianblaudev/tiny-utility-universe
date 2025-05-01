import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Esta API permite realizar respaldos completos a Supabase
export async function POST(request: Request) {
  try {
    const { tenantId, tables } = await request.json()

    if (!tenantId || !tables || !Array.isArray(tables)) {
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

    // Procesar cada tabla
    const results = await Promise.all(
      tables.map(async ({ name, data }) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          return { table: name, success: true, message: "No hay datos para sincronizar" }
        }

        // Eliminar datos existentes para esta tabla y tenant
        await supabase.from(name).delete().eq("tenant_id", tenantId)

        // Insertar nuevos datos
        const { error } = await supabase.from(name).insert(data.map((item) => ({ ...item, tenant_id: tenantId })))

        if (error) {
          return { table: name, success: false, error: error.message }
        }

        return { table: name, success: true }
      }),
    )

    // Verificar si todas las operaciones fueron exitosas
    const allSuccess = results.every((result) => result.success)

    if (allSuccess) {
      return NextResponse.json({
        success: true,
        message: "Respaldo completado exitosamente",
        details: results,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Algunas tablas no pudieron ser respaldadas",
          details: results,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Método no permitido" }, { status: 405 })
}
