# Setup Supabase per Data Challenge

Questa guida spiega come configurare Supabase per il calcolo veloce dell'RMSE nella data challenge.

## Vantaggi di Supabase rispetto a GitHub Actions

- ⚡ **Velocità**: Calcolo RMSE istantaneo (meno di 1 secondo vs 30-90 secondi)
- 🔒 **Sicurezza**: Actual values memorizzati nel database, non accessibili pubblicamente
- 📊 **Real-time**: Leaderboard aggiornato immediatamente
- 🚀 **Scalabilità**: Gestisce molte submission simultanee

## Prerequisiti

1. Account Supabase (gratuito): https://supabase.com
2. Accesso al repository GitHub per configurare i secrets

## Passo 1: Creare un progetto Supabase

1. Vai su https://supabase.com e crea un account (se non ce l'hai)
2. Clicca su "New Project"
3. Compila i dettagli:
   - **Name**: `data-challenge-leaderboard` (o un nome a tua scelta)
   - **Database Password**: Scegli una password forte (salvala!)
   - **Region**: Scegli la regione più vicina ai tuoi utenti
4. Clicca "Create new project"
5. Attendi che il progetto sia pronto (circa 2 minuti)

## Passo 2: Eseguire le migrazioni SQL

1. Nel dashboard Supabase, vai su **SQL Editor** (icona nel menu laterale)
2. Apri il file `supabase/migrations/001_initial_schema.sql`
3. Copia tutto il contenuto e incollalo nell'editor SQL
4. Clicca "Run" per eseguire la migrazione
5. Verifica che le tabelle siano state create:
   - Vai su **Table Editor** nel menu laterale
   - Dovresti vedere: `actual_values`, `submissions`, `leaderboard`

## Passo 3: Inserire i valori actual (ground truth)

**Metodo A: Usando SQL Editor (Consigliato)**

1. Nel dashboard Supabase, vai su **SQL Editor**
2. Esegui questo SQL (sostituisci i valori con i tuoi valori reali):
   ```sql
   DELETE FROM actual_values;
   INSERT INTO actual_values (values_array)
   VALUES (ARRAY[0.3, 1, 3, -1]::REAL[]);
   ```
3. Clicca "Run" per eseguire

**Metodo B: Usando Table Editor**

1. Nel dashboard Supabase, vai su **Table Editor**
2. Seleziona la tabella `actual_values`
3. Clicca "Insert row" o "Insert" → "Insert row"
4. Nel campo `values_array`, inserisci i valori actual come array PostgreSQL:
   - Esempio: Se i valori sono `0.3, 1, 3, -1`, inserisci: `{0.3, 1, 3, -1}`
   - **IMPORTANTE**: Usa la sintassi array PostgreSQL con parentesi graffe `{}`
5. Clicca "Save" per salvare

**Nota**: Puoi inserire solo una riga. Se devi aggiornare i valori, modifica la riga esistente o esegui di nuovo il DELETE + INSERT.

## Passo 4: Deploy delle Edge Functions

**Nota**: Le Edge Functions sono già deployate automaticamente. Se necessario, puoi deployarle manualmente:

1. Nel dashboard Supabase, vai su **Edge Functions**
2. Per ogni funzione (`calculate-rmse`, `get-leaderboard`, `reset-leaderboard`):
   - Clicca "Create a new function" (se non esiste)
   - Copia il contenuto del file corrispondente da `supabase/functions/[nome-funzione]/index.ts`
   - Incolla nel codice
   - Clicca "Deploy"

## Passo 5: Ottenere le credenziali

1. Nel dashboard Supabase, vai su **Settings** → **API**
2. Trova le seguenti informazioni:
   - **Project URL**: `https://xxxxx.supabase.co` (questa è la `SUPABASE_URL`)
   - **anon public key**: (questa è la `SUPABASE_ANON_KEY`)

## Passo 6: Configurare GitHub Secrets

1. Vai al tuo repository GitHub
2. Vai su **Settings** → **Secrets and variables** → **Actions**
3. Aggiungi i seguenti secrets:

   - **SUPABASE_URL**: Il Project URL da Supabase (es. `https://xxxxx.supabase.co`)
   - **SUPABASE_ANON_KEY**: La chiave anon public da Supabase

## Passo 7: Aggiornare il workflow di deploy

Il workflow `.github/workflows/deploy-pages.yml` è già configurato per leggere `SUPABASE_URL` e `SUPABASE_ANON_KEY` dai secrets e includerli in `credential-hashes.js`.

Dopo aver aggiunto i secrets, triggera manualmente il workflow:
1. Vai su **Actions** nel repository GitHub
2. Seleziona il workflow "Deploy GitHub Pages"
3. Clicca "Run workflow" → "Run workflow"

## Passo 8: Verificare il setup

1. Apri il sito su GitHub Pages
2. Accedi come team
3. Prova a caricare un file CSV con predictions
4. Dovresti vedere il risultato RMSE immediatamente (meno di 1 secondo)

## Troubleshooting

### Errore: "Supabase not configured"
- Verifica che `SUPABASE_URL` e `SUPABASE_ANON_KEY` siano configurati nei GitHub Secrets
- Verifica che il workflow di deploy sia stato eseguito dopo aver aggiunto i secrets

### Errore: "Actual values not configured"
- Verifica che la tabella `actual_values` contenga una riga con i valori
- Verifica che il formato dell'array sia corretto: `{0.3, 1, 3, -1}`

### Errore: "Function not found" o 404
- Verifica che le Edge Functions siano state deployate correttamente
- Controlla i log delle funzioni nel dashboard Supabase (Edge Functions → Logs)

### Leaderboard non si aggiorna
- Apri la console del browser (F12) e controlla gli errori
- Verifica che le Edge Functions siano accessibili pubblicamente (CORS configurato)

## Sicurezza

- ✅ I valori `actual_values` sono protetti da Row Level Security (RLS)
- ✅ Solo il service role può leggere/scrivere `actual_values`
- ✅ Le submission sono pubbliche (chiunque può inserire), ma i valori actual restano segreti
- ✅ Il calcolo RMSE avviene server-side, quindi i valori actual non sono mai esposti al client

## Costi

Supabase offre un piano gratuito generoso:
- 500 MB database storage
- 2 GB bandwidth
- 2 milioni di Edge Function invocations al mese

Per una data challenge con poche centinaia di submission, il piano gratuito è più che sufficiente.

