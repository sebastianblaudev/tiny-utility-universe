
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
    const { business_email } = await req.json()

    if (!business_email) {
      return new Response(
        JSON.stringify({ error: 'Email de negocio es requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get business info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('email', business_email)
      .single()

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: 'Negocio no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Calculate license status
    const now = new Date()
    let isActive = business.is_active || false
    let isValid = business.is_valid || false
    let daysLeft = 0

    // Check trial period if applicable
    if (business.license_expires_at) {
      const expiryDate = new Date(business.license_expires_at)
      daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
      
      // Update validity based on expiry
      isValid = isValid && daysLeft > 0
    }

    return new Response(
      JSON.stringify({
        name: business.name,
        email: business.email,
        isActive,
        isValid,
        daysLeft,
        membershipActive: isActive && isValid,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
