# Setup GitHub Actions per Calcolo RMSE Sicuro

## 🎯 Obiettivo
Usare GitHub Actions e GitHub Secrets per calcolare il RMSE senza esporre i valori actual nel codice.

## 📋 Passo 1: Aggiungi il Secret ACTUAL_VALUES

1. Vai su GitHub → Il tuo repository → **Settings** → **Secrets and variables** → **Actions**
2. Clicca **New repository secret**
3. **Name**: `ACTUAL_VALUES`
4. **Secret**: `0.3,1,3,-1` (i tuoi valori actual separati da virgola)
5. Clicca **Add secret**

## 🔑 Passo 2: Crea un GitHub Token

Per permettere al frontend di triggerare il workflow, hai due opzioni:

### Opzione A: GitHub Personal Access Token (semplice ma meno sicuro)

1. Vai su GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Clicca **Generate new token (classic)**
3. Dai un nome (es. "RMSE Calculator")
4. Seleziona scope: `repo` (solo per questo repository)
5. Clicca **Generate token**
6. **COPIA IL TOKEN** (lo vedrai solo una volta!)

### Opzione B: GitHub App (più sicuro, consigliato per produzione)

1. Vai su GitHub → **Settings** → **Developer settings** → **GitHub Apps**
2. Clicca **New GitHub App**
3. Configura:
   - **Name**: RMSE Calculator
   - **Homepage URL**: Il tuo sito
   - **Webhook**: Lascia vuoto
   - **Repository permissions**: 
     - Contents: Read & write
     - Actions: Read
   - **Subscribe to events**: repository_dispatch
4. Crea l'app e genera un private key
5. Installa l'app sul tuo repository

## 🔧 Passo 3: Configura il Token nel Codice

### Se usi Personal Access Token:

1. Aggiungi il token come secret GitHub:
   - Vai su **Settings** → **Secrets and variables** → **Actions**
   - Crea un nuovo secret: `GITHUB_TOKEN` = (il tuo token)

2. Modifica `Datachallenge/private/leaderboard.html`:
   ```javascript
   const GITHUB_TOKEN = '${{ secrets.GITHUB_TOKEN }}'; // Questo non funziona nel frontend!
   ```

**PROBLEMA**: I secrets GitHub non sono accessibili nel frontend JavaScript!

### Soluzione: Usa un Proxy Endpoint

Crea un endpoint serverless (Cloudflare Worker, Vercel Function, etc.) che:
1. Riceve le predictions dal frontend
2. Usa il token GitHub per triggerare il workflow
3. Restituisce il risultato

Oppure, usa un approccio diverso:

## 🚀 Soluzione Alternativa: Webhook Pubblico

1. Crea un webhook GitHub che triggera il workflow
2. Il frontend chiama questo webhook
3. Il workflow calcola il RMSE e aggiorna un file JSON
4. Il frontend legge il file JSON aggiornato

## 📝 Implementazione Consigliata

Per ora, il workflow è configurato per essere triggerato manualmente o via `repository_dispatch`.

**Per testare manualmente:**
1. Vai su **Actions** → **Calculate RMSE for Submissions**
2. Clicca **Run workflow**
3. Inserisci:
   - **team_id**: `aau26_team1`
   - **predictions_json**: `[0.5, 1.2, 2.8, -0.5]`
4. Clicca **Run workflow**

Il workflow calcolerà il RMSE e aggiornerà `Datachallenge/assets/leaderboard-data.json`.

## 🔐 Sicurezza

- ✅ I valori actual sono in GitHub Secrets (non visibili pubblicamente)
- ✅ Il calcolo avviene lato server (GitHub Actions)
- ⚠️ Per triggerare da frontend, serve un token o un proxy endpoint
- ✅ Il file `leaderboard-data.json` può essere pubblico (contiene solo RMSE, non i valori actual)

## 🎯 Prossimi Passi

1. Configura il secret `ACTUAL_VALUES`
2. Testa il workflow manualmente
3. Implementa un proxy endpoint per triggerare da frontend (opzionale)
4. Aggiorna il frontend per leggere `leaderboard-data.json` invece di calcolare localmente

