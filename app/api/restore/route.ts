import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Esta API permite restaurar datos desde Supabase
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

    // Obtener datos de cada tabla
    const results = await Promise.all(
      tables.map(async (tableName) => {
        const { data, error } = await supabase.from(tableName).select("*").eq("tenant_id", tenantId)

        if (error) {
          return { table: tableName, success: false, error: error.message }
        }

        return { table: tableName, success: true, data }
      }),
    )

    // Verificar si todas las operaciones fueron exitosas
    const allSuccess = results.every((result) => result.success)

    if (allSuccess) {
      return NextResponse.json({
        success: true,
        message: "Restauración completada exitosamente",
        data: results.reduce(
          (acc, { table, data }) => {
            acc[table] = data
            return acc
          },
          {} as Record<string, any>,
        ),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Algunas tablas no pudieron ser restauradas",
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
