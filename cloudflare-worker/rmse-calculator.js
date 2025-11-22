/**
 * Cloudflare Worker to calculate RMSE without exposing actual values
 * 
 * Deploy this to Cloudflare Workers (free tier available)
 * Set ACTUAL_VALUES as a secret in Cloudflare Workers dashboard
 * Format: comma-separated values, e.g., "0.3,1,3,-1"
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Get actual values from environment secret
      const actualValuesStr = env.ACTUAL_VALUES || '0.3,1,3,-1';
      const actualValues = actualValuesStr.split(',').map(v => parseFloat(v.trim()));

      // Get predictions from request body
      const body = await request.json();
      const predictions = body.predictions;

      if (!Array.isArray(predictions)) {
        return new Response(JSON.stringify({ error: 'Predictions must be an array' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (predictions.length !== actualValues.length) {
        return new Response(JSON.stringify({ 
          error: `Predictions must have ${actualValues.length} values, but got ${predictions.length}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Calculate RMSE
      let sumSquaredErrors = 0;
      for (let i = 0; i < actualValues.length; i++) {
        const error = actualValues[i] - predictions[i];
        sumSquaredErrors += error * error;
      }
      const meanSquaredError = sumSquaredErrors / actualValues.length;
      const rmse = Math.sqrt(meanSquaredError);

      // Return only RMSE (not actual values)
      return new Response(JSON.stringify({ rmse: rmse }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};

