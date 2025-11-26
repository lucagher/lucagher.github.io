// Supabase Edge Function to get leaderboard data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call database function to get leaderboard
    console.log('Calling get_leaderboard RPC...')
    const { data, error } = await supabase.rpc('get_leaderboard')
    
    console.log('RPC response:', { data, error, dataType: typeof data })

    if (error) {
      console.error('Error calling get_leaderboard:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle case where data might be a JSON string or an object
    let result = data
    if (typeof data === 'string') {
      try {
        result = JSON.parse(data)
        console.log('Parsed JSON string result:', result)
      } catch (e) {
        console.error('Error parsing data as JSON:', e, 'Data was:', data)
        return new Response(
          JSON.stringify({ error: 'Invalid response format from database' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Ensure result is an object
    if (!result || typeof result !== 'object') {
      console.error('Invalid result type:', typeof result, 'Value:', result)
      return new Response(
        JSON.stringify({ error: 'Invalid response from database function' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Returning leaderboard data:', result)
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in get-leaderboard function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

