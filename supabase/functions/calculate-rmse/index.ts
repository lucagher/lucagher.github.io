// Supabase Edge Function for RMSE Calculation
// This function handles prediction submissions and calculates RMSE server-side

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
    // Initialize Supabase client
    const supabaseUrl = (globalThis as any).Deno?.env.get('SUPABASE_URL')
    const supabaseServiceKey = (globalThis as any).Deno?.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body = await req.json()
    console.log('Received request body:', body)
    const { team_id, predictions } = body

    // Validate inputs
    if (!team_id || !predictions) {
      return new Response(
        JSON.stringify({ error: 'team_id and predictions are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!Array.isArray(predictions)) {
      return new Response(
        JSON.stringify({ error: 'predictions must be an array' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate predictions are numbers
    const predictionsFloat = predictions.map(p => {
      const num = parseFloat(p)
      if (isNaN(num)) {
        throw new Error(`Invalid prediction value: ${p}`)
      }
      return num
    })

    // Call database function to submit predictions and calculate RMSE
    console.log('Calling submit_predictions with:', {
      team_id,
      predictionsCount: predictionsFloat.length,
      predictions: predictionsFloat
    })
    
    const { data, error } = await supabase.rpc('submit_predictions', {
      p_team_id: team_id,
      p_predictions: predictionsFloat
    })

    console.log('RPC response:', { data, error })

    if (error) {
      console.error('Error calling submit_predictions:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
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
          JSON.stringify({ success: false, error: 'Invalid response format from database' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Ensure result has the correct structure
    if (!result || typeof result !== 'object') {
      console.error('Invalid result type:', typeof result, 'Value:', result)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid response from database function' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Ensure success field is present
    const normalizedResult = result as Record<string, unknown> & { success?: boolean }

    if (normalizedResult.success === undefined) {
      normalizedResult.success = true
    }

    console.log('Returning result:', normalizedResult)
    return new Response(
      JSON.stringify(normalizedResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in calculate-rmse function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

