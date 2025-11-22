# Setup Completo: GitHub Actions + Cloudflare Proxy

## 🎯 Soluzione Finale

Abbiamo creato un sistema a due componenti:
1. **GitHub Actions Workflow** - Calcola RMSE usando GitHub Secrets (valori actual sicuri)
2. **Cloudflare Worker Proxy** - Interfaccia sicura tra frontend e GitHub API

## 📋 Setup Passo-Passo

### Passo 1: Configura GitHub Secrets

1. Vai su GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**
2. Aggiungi questi secrets:
   - `ACTUAL_VALUES` = `0.3,1,3,-1` (i tuoi valori actual)
   - `TOKEN_SECRET` = (un Personal Access Token con permessi `repo`)

**Per creare GITHUB_TOKEN:**
- GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token → Seleziona scope `repo` → Generate
- **COPIA IL TOKEN** (lo vedrai solo una volta!)

### Passo 2: Deploy Cloudflare Worker Proxy

1. Installa Wrangler:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Vai nella directory:
   ```bash
   cd cloudflare-worker
   ```

3. Deploy il proxy:
   ```bash
   wrangler deploy github-proxy.js --name github-proxy
   ```

4. Imposta i secrets in Cloudflare Dashboard:
   - Workers & Pages → github-proxy → Settings → Variables
   - Aggiungi secrets:
     - `GITHUB_TOKEN` = (lo stesso token che hai messo in TOKEN_SECRET su GitHub)
     - `REPO_OWNER` = `lucagher` (opzionale, default)
     - `REPO_NAME` = `lucagher.github.io` (opzionale, default)

5. **COPIA L'URL DEL WORKER** (es. `https://github-proxy.YOUR_SUBDOMAIN.workers.dev`)

### Passo 3: Configura il Frontend

1. Apri `Datachallenge/private/leaderboard.html`
2. Trova questa riga (circa riga 485):
   ```javascript
   const PROXY_ENDPOINT = null;
   ```
3. Sostituisci con l'URL del tuo worker:
   ```javascript
   const PROXY_ENDPOINT = 'https://github-proxy.YOUR_SUBDOMAIN.workers.dev';
   ```

### Passo 4: Commit e Push

```bash
git add Datachallenge/private/leaderboard.html
git commit -m "Configure GitHub Actions proxy endpoint"
git push origin tip
```

## ✅ Verifica

1. Vai sul tuo sito
2. Fai login come team
3. Sottometti una predizione CSV
4. Dovresti vedere "Submission received! RMSE is being calculated..."
5. Dopo 10-15 secondi, aggiorna la pagina per vedere il nuovo score

## 🔐 Sicurezza

- ✅ Valori actual in GitHub Secrets (non accessibili pubblicamente)
- ✅ GitHub Token nel Cloudflare Worker secret (non esposto nel codice)
- ✅ Calcolo RMSE lato server (GitHub Actions)
- ✅ Nessun valore actual nel codice frontend o nel repository

## 🛠️ Troubleshooting

### Il workflow non si triggera
- Verifica che `GITHUB_TOKEN` sia configurato in Cloudflare
- Controlla i logs del Cloudflare Worker
- Verifica che il token GitHub abbia permessi `repo`

### Il RMSE non viene calcolato
- Controlla GitHub Actions → Calculate RMSE for Submissions
- Verifica che `ACTUAL_VALUES` sia configurato come secret
- Controlla i logs del workflow

### Il file leaderboard-data.json non si aggiorna
- Verifica che il workflow abbia permessi `contents: write`
- Controlla che il commit venga fatto correttamente
- Il file potrebbe richiedere qualche secondo per essere aggiornato

## 📝 File Importanti

- `.github/workflows/calculate-rmse.yml` - Workflow GitHub Actions
- `cloudflare-worker/github-proxy.js` - Proxy endpoint
- `Datachallenge/private/leaderboard.html` - Frontend che chiama il proxy
- `GITHUB-ACTIONS-SETUP.md` - Documentazione dettagliata

## 🎉 Fatto!

Ora hai un sistema completamente sicuro dove:
- I valori actual sono protetti in GitHub Secrets
- Il calcolo avviene lato server
- Nessun valore sensibile è esposto nel codice pubblico

