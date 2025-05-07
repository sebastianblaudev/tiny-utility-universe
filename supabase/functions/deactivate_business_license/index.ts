
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Parse request body
    const { p_business_id } = await req.json()

    if (!p_business_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID de negocio es requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get business info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', p_business_id)
      .single()

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ success: false, message: 'Negocio no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Deactivate license
    const now = new Date()

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        is_active: false,
        is_valid: false,
        updated_at: now.toISOString()
      })
      .eq('id', p_business_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Error al desactivar la licencia' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Licencia desactivada correctamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error al procesar la solicitud' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
