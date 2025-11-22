# Guida al Test del Sistema RMSE

## ✅ Checklist Pre-Test

Prima di testare, verifica che:

- [ ] `ACTUAL_VALUES` configurato in GitHub Secrets = `0.3,1,3,-1`
- [ ] `TOKEN_SECRET` configurato in GitHub Secrets = (il tuo token GitHub)
- [ ] `GITHUB_TOKEN` configurato in Cloudflare = (stesso valore di TOKEN_SECRET)
- [ ] Worker deployato: https://github-proxy.luca-gherardini.workers.dev
- [ ] Codice aggiornato e pushato

## 🧪 Test 1: Test Manuale del Workflow GitHub Actions

### Passo 1: Vai su GitHub Actions
1. Apri il tuo repository su GitHub
2. Clicca su **Actions** (in alto)
3. Cerca "Calculate RMSE for Submissions" nel menu laterale
4. Clicca sul workflow

### Passo 2: Esegui il Workflow Manualmente
1. Clicca su **Run workflow** (pulsante in alto a destra)
2. Inserisci:
   - **team_id**: `aau26_team1`
   - **predictions_json**: `[0.5, 1.2, 2.8, -0.5]`
3. Clicca **Run workflow**

### Passo 3: Verifica il Risultato
1. Clicca sul workflow run appena creato
2. Espandi "Calculate RMSE"
3. Dovresti vedere:
   - ✅ "Calculate RMSE" completato
   - ✅ "Update leaderboard data" completato
   - ✅ "Commit and push leaderboard update" completato

### Passo 4: Verifica il File Aggiornato
1. Vai su **Code** → **Datachallenge** → **assets**
2. Cerca `leaderboard-data.json`
3. Dovresti vedere qualcosa come:
   ```json
   {
     "aau26_team1": {
       "score": 0.123456,
       "entries": 1,
       "lastSubmission": "2025-11-22T..."
     }
   }
   ```

## 🧪 Test 2: Test dal Sito Web

### Passo 1: Prepara un File CSV di Test
Crea un file `test-predictions.csv` con:
```
0.5
1.2
2.8
-0.5
```

### Passo 2: Login come Team
1. Vai sul tuo sito GitHub Pages
2. Vai su `/Datachallenge/login.html`
3. Login con una password team (es. `P-valuepirates_ism1`)

### Passo 3: Vai alla Leaderboard
1. Clicca su **Leaderboard** nel menu
2. Dovresti vedere la tabella con i 5 team

### Passo 4: Sottometti una Predizione
1. Nella sezione "Submit Predictions", clicca **Choose File**
2. Seleziona il file `test-predictions.csv` che hai creato
3. Clicca **Upload Predictions**

### Passo 5: Verifica il Comportamento
Dovresti vedere:
- ✅ Messaggio: "Submission received! RMSE is being calculated by GitHub Actions..."
- ✅ Il pulsante diventa "Submitting..." e poi torna normale
- ⏳ Dopo 10-15 secondi, aggiorna la pagina (F5)
- ✅ Dovresti vedere il tuo score aggiornato nella leaderboard

## 🔍 Test 3: Verifica Cloudflare Worker

### Test Diretto del Worker
Apri il terminale e esegui:

```bash
curl -X POST https://github-proxy.luca-gherardini.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "aau26_team1",
    "predictions_json": "[0.5, 1.2, 2.8, -0.5]"
  }'
```

**Risposta attesa:**
```json
{
  "success": true,
  "message": "Workflow triggered successfully. RMSE will be calculated shortly."
}
```

**Se vedi errori:**
- `GitHub token not configured` → Verifica che `GITHUB_TOKEN` sia configurato in Cloudflare
- `Failed to trigger workflow` → Verifica che `TOKEN_SECRET` sia corretto in GitHub

## 🐛 Troubleshooting

### Il workflow non si triggera
- Verifica che `TOKEN_SECRET` in GitHub sia corretto
- Controlla i logs del Cloudflare Worker nel dashboard
- Verifica che il token abbia permessi `repo`

### Il RMSE non viene calcolato
- Controlla GitHub Actions → "Calculate RMSE for Submissions" → Vedi se ci sono errori
- Verifica che `ACTUAL_VALUES` sia configurato correttamente
- Controlla il formato: deve essere `0.3,1,3,-1` (virgole, niente spazi extra)

### Il file leaderboard-data.json non si aggiorna
- Verifica che il workflow abbia completato con successo
- Controlla che il commit sia stato fatto (vedi nella tab "Commits")
- Il file potrebbe richiedere qualche secondo per essere aggiornato

### Errore "Submission received" ma niente succede
- Aspetta 10-15 secondi (il workflow ha bisogno di tempo)
- Aggiorna manualmente la pagina (F5)
- Controlla GitHub Actions per vedere se il workflow è in esecuzione

## ✅ Test Completato con Successo Se:

1. ✅ Il workflow GitHub Actions completa senza errori
2. ✅ Il file `leaderboard-data.json` viene aggiornato
3. ✅ La leaderboard sul sito mostra il nuovo score
4. ✅ Il Cloudflare Worker risponde correttamente

## 🎉 Pronto per la Produzione!

Se tutti i test passano, il sistema è pronto! I valori actual sono protetti e il RMSE viene calcolato in modo sicuro lato server.

