# Guida al Deploy del Cloudflare Worker per RMSE Calculator

## 📋 Prerequisiti

1. Account Cloudflare (gratuito) - [Registrati qui](https://dash.cloudflare.com/sign-up)
2. Node.js installato sul tuo computer (versione 18 o superiore)

## 🚀 Passo 1: Installa Wrangler CLI

Apri il terminale e esegui:

```bash
npm install -g wrangler
```

Verifica l'installazione:
```bash
wrangler --version
```

## 🔐 Passo 2: Login a Cloudflare

Esegui:
```bash
wrangler login
```

Si aprirà il browser per autorizzare Wrangler. Clicca "Allow" per autorizzare.

## 📁 Passo 3: Vai nella Directory del Worker

```bash
cd cloudflare-worker
```

## ⚙️ Passo 4: Configura il Worker

Il file `wrangler.toml` è già configurato. Se vuoi cambiare il nome del worker, modifica la prima riga:

```toml
name = "rmse-calculator"  # Puoi cambiare questo nome
```

## 🚀 Passo 5: Deploy del Worker

Esegui:
```bash
wrangler deploy
```

**Nota:** Se è la prima volta, ti chiederà di creare il worker. Rispondi "yes".

Dopo il deploy, vedrai un output simile a:
```
✨  Deployed to https://rmse-calculator.YOUR_SUBDOMAIN.workers.dev
```

**COPIA QUESTO URL** - ti servirà dopo!

## 🔒 Passo 6: Imposta il Secret con i Valori Actual

1. Vai su [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Clicca su **Workers & Pages** nel menu laterale
3. Clicca sul tuo worker (dovrebbe chiamarsi `rmse-calculator`)
4. Vai su **Settings** → **Variables**
5. Scorri fino a **Secrets** e clicca **Add secret**
6. Nome: `ACTUAL_VALUES`
7. Valore: `0.3,1,3,-1` (i tuoi valori actual separati da virgola)
8. Clicca **Save**

## 🔗 Passo 7: Aggiorna l'URL nel Codice

1. Apri `Datachallenge/private/leaderboard.html`
2. Trova questa riga (circa riga 484):
   ```javascript
   const RMSE_ENDPOINT_URL = null;
   ```
3. Sostituisci `null` con l'URL del tuo worker (quello che hai copiato al Passo 5):
   ```javascript
   const RMSE_ENDPOINT_URL = 'https://rmse-calculator.YOUR_SUBDOMAIN.workers.dev';
   ```
4. Salva il file

## ✅ Passo 8: Test del Worker

Puoi testare il worker direttamente dal terminale:

```bash
curl -X POST https://rmse-calculator.YOUR_SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"predictions": [0.5, 1.2, 2.8, -0.5]}'
```

Dovresti ricevere una risposta JSON con il valore RMSE:
```json
{"rmse": 0.123456}
```

## 🎯 Passo 9: Commit e Push

```bash
cd ..
git add Datachallenge/private/leaderboard.html
git commit -m "Configure Cloudflare Worker endpoint for secure RMSE calculation"
git push origin tip
```

## 🔍 Verifica Finale

1. Vai sul tuo sito GitHub Pages
2. Fai login come team
3. Prova a sottomettere una predizione
4. Il RMSE dovrebbe essere calcolato dal worker (non più dal codice client)

## 🛠️ Troubleshooting

### Errore: "Worker not found"
- Verifica che il worker sia stato deployato correttamente
- Controlla il nome del worker in `wrangler.toml`

### Errore: "ACTUAL_VALUES is not defined"
- Verifica che il secret sia stato impostato correttamente nel dashboard
- Il nome deve essere esattamente `ACTUAL_VALUES` (maiuscole)

### Errore CORS
- Il worker è già configurato per CORS, ma se hai problemi, verifica che l'URL nel codice sia corretto

### Vuoi aggiornare i valori actual?
1. Vai su Cloudflare Dashboard → Workers & Pages → Il tuo worker → Settings → Variables
2. Modifica il secret `ACTUAL_VALUES`
3. Il worker userà automaticamente i nuovi valori

## 📝 Note Importanti

- **I valori actual sono ora SICURI** - non sono più accessibili pubblicamente
- Il worker è gratuito fino a 100.000 richieste al giorno
- Puoi monitorare l'uso nel dashboard Cloudflare
- Il worker è veloce (edge computing) e disponibile globalmente

## 🎉 Fatto!

Ora i valori actual sono protetti e i team non possono più vederli nel codice sorgente!

