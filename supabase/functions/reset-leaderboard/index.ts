/// <reference path="../types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?dts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Optional admin secret verification
    const adminSecret = Deno.env.get('ADMIN_RESET_SECRET')
    if (adminSecret) {
      const headerSecret = req.headers.get('x-admin-secret')
      if (!headerSecret || headerSecret !== adminSecret) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized reset request' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call database function to reset leaderboard
    const { data, error } = await supabase.rpc('reset_leaderboard')

    if (error) {
      console.error('Error calling reset_leaderboard:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify(data ?? { success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in reset-leaderboard function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
