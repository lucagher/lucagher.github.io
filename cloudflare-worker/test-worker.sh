#!/bin/bash
# Script di test per il Cloudflare Worker
# Usa: ./test-worker.sh YOUR_WORKER_URL

if [ -z "$1" ]; then
    echo "Usage: ./test-worker.sh https://rmse-calculator.YOUR_SUBDOMAIN.workers.dev"
    exit 1
fi

WORKER_URL=$1

echo "Testing Cloudflare Worker at: $WORKER_URL"
echo ""

# Test con predizioni di esempio
echo "Sending test predictions: [0.5, 1.2, 2.8, -0.5]"
echo ""

response=$(curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -d '{"predictions": [0.5, 1.2, 2.8, -0.5]}')

echo "Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Verifica che la risposta contenga "rmse"
if echo "$response" | grep -q "rmse"; then
    echo "✅ Worker funziona correttamente!"
else
    echo "❌ Errore: la risposta non contiene 'rmse'"
    echo "Verifica che:"
    echo "  1. Il worker sia stato deployato"
    echo "  2. Il secret ACTUAL_VALUES sia configurato"
    echo "  3. L'URL sia corretto"
fi

