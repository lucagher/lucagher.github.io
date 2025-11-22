# Setup Rapido - Usando TOKEN_SECRET

## ✅ Cosa hai già fatto:
- Creato `TOKEN_SECRET` in GitHub Secrets ✅
- Creato `ACTUAL_VALUES` in GitHub Secrets (presumibilmente) ✅

## 📋 Cosa devi fare ora:

### 1. Verifica che ACTUAL_VALUES esista
Vai su GitHub → Settings → Secrets and variables → Actions
- Deve esistere: `ACTUAL_VALUES` = `0.3,1,3,-1`
- Se non c'è, crealo!

### 2. Deploy Cloudflare Worker Proxy

Il Cloudflare Worker ha bisogno del token GitHub per triggerare il workflow.

```bash
cd cloudflare-worker
wrangler deploy github-proxy.js --name github-proxy
```

Poi in Cloudflare Dashboard:
- Workers & Pages → github-proxy → Settings → Variables → Secrets
- Aggiungi: `GITHUB_TOKEN` = (il valore che hai messo in TOKEN_SECRET su GitHub)

**IMPORTANTE**: Copia il valore da `TOKEN_SECRET` (GitHub) e mettilo in `GITHUB_TOKEN` (Cloudflare)

### 3. Configura il Frontend

1. Apri `Datachallenge/private/leaderboard.html`
2. Trova: `const PROXY_ENDPOINT = null;`
3. Sostituisci con l'URL del tuo Cloudflare Worker:
   ```javascript
   const PROXY_ENDPOINT = 'https://github-proxy.YOUR_SUBDOMAIN.workers.dev';
   ```

### 4. Test

1. Vai sul sito
2. Login come team
3. Sottometti una predizione
4. Dovresti vedere "Submission received! RMSE is being calculated..."

## 🔍 Verifica che tutto funzioni:

### Test Manuale del Workflow:
1. Vai su GitHub → Actions → "Calculate RMSE for Submissions"
2. Clicca "Run workflow"
3. Inserisci:
   - team_id: `aau26_team1`
   - predictions_json: `[0.5, 1.2, 2.8, -0.5]`
4. Clicca "Run workflow"
5. Verifica che il workflow completi senza errori

### Se il workflow fallisce:
- Controlla che `ACTUAL_VALUES` sia configurato correttamente
- Verifica il formato: `0.3,1,3,-1` (virgole, niente spazi extra)

## 📝 Note:

- `TOKEN_SECRET` in GitHub non è usato dal workflow (il workflow non ha bisogno del token)
- `TOKEN_SECRET` serve solo se vuoi triggerare il workflow manualmente via API
- Il Cloudflare Worker usa il suo secret `GITHUB_TOKEN` (che contiene lo stesso valore di `TOKEN_SECRET`)

## ✅ Checklist Finale:

- [ ] `ACTUAL_VALUES` configurato in GitHub Secrets
- [ ] `TOKEN_SECRET` configurato in GitHub Secrets (già fatto ✅)
- [ ] Cloudflare Worker deployato
- [ ] `GITHUB_TOKEN` configurato in Cloudflare (stesso valore di TOKEN_SECRET)
- [ ] `PROXY_ENDPOINT` configurato in leaderboard.html
- [ ] Test manuale del workflow funziona
- [ ] Test submission dal sito funziona

