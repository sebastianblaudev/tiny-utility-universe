
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error listing buckets', 
        error: listError 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    
    const bucketExists = buckets?.some(b => b.name === 'bkpid')
    
    if (!bucketExists) {
      // Create the bucket
      const { data, error: createError } = await supabase.storage.createBucket('bkpid', {
        public: false,
      })
      
      if (createError) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Error creating bucket', 
          error: createError 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }
      
      // Execute SQL to create RLS policies
      const { error: sqlError } = await supabase.rpc('setup_bucket_policies')
      
      if (sqlError) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Error creating bucket policies', 
          error: sqlError 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Backup bucket created with proper permissions',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Backup bucket already exists',
      bucketExists
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Unexpected error', 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
