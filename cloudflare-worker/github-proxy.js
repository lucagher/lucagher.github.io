/**
 * Cloudflare Worker Proxy for GitHub Actions
 * 
 * This worker acts as a secure proxy between the frontend and GitHub API.
 * It stores the GitHub token server-side (as a secret) so it's never exposed to clients.
 * 
 * Deploy this worker and set GITHUB_TOKEN as a secret in Cloudflare dashboard.
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
      return new Response('Method not allowed', { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
      // Get GitHub token from environment secret
      const githubToken = env.GITHUB_TOKEN;
      if (!githubToken) {
        return new Response(JSON.stringify({ error: 'GitHub token not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Get request body
      const body = await request.json();
      const { team_id, predictions_json } = body;

      if (!team_id || !predictions_json) {
        return new Response(JSON.stringify({ error: 'Missing team_id or predictions_json' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Configure repository (you can make this configurable via env vars)
      const repoOwner = env.REPO_OWNER || 'lucagher';
      const repoName = env.REPO_NAME || 'lucagher.github.io';

      // Trigger GitHub Actions workflow via repository_dispatch
      const githubResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'RMSE-Calculator-Proxy',
          },
          body: JSON.stringify({
            event_type: 'calculate-rmse',
            client_payload: {
              team_id: team_id,
              predictions_json: predictions_json,
            },
          }),
        }
      );

      if (!githubResponse.ok) {
        const errorText = await githubResponse.text();
        return new Response(JSON.stringify({ 
          error: 'Failed to trigger workflow',
          details: errorText 
        }), {
          status: githubResponse.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Return success
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Workflow triggered successfully. RMSE will be calculated shortly.' 
      }), {
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

