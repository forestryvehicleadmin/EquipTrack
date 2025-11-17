# Firestore & Secret Manager Setup (short guide)

This project expects the Firebase service account JSON to be available either as:

- `FIREBASE_SECRET_NAME` environment variable containing the full JSON payload (used by Cloud Run when mapping a Secret Manager secret to an env var), or
- `FIREBASE_SERVICE_ACCOUNT_PATH` pointing to a local JSON file (used for local development).

Quick Cloud Console steps

1. Enable APIs
   - APIs & Services → Library → Enable: "Cloud Firestore API" and "Secret Manager API".

2. Create Firestore
   - Firestore → Create database → choose "Native mode" and pick a region.

3. Create Service Account
   - IAM & Admin → Service accounts → Create service account
   - Name: `equiptrack-firebase-sa` (suggested)

4. Grant Firestore access to the service account
   - Grant `roles/datastore.user` or `roles/datastore.owner` depending on required permissions.

5. Create a JSON key and upload to Secret Manager
   - Service accounts → select the account → Keys → Add Key → Create new key → JSON → download file.
   - Secret Manager → Create Secret → Name: `firebase-service-account` → Paste JSON as the secret value.

6. Grant Secret Access
   - Give the Cloud Build service account and your Cloud Run runtime/service account the role `roles/secretmanager.secretAccessor` on the secret.

7. Deploy
   - Cloud Build will use `cloudbuild.yaml` which maps the secret into the build and deploy steps. At runtime Cloud Run will receive the secret as `FIREBASE_SECRET_NAME` when deployed with:
     ```
     --set-secrets=FIREBASE_SECRET_NAME=firebase-service-account:latest
     ```

Local development

- Save the JSON to `./.secrets/firebase-service-account.json` (add to `.gitignore`).
- Create `.env.local` with:
  ```
  FIREBASE_SERVICE_ACCOUNT_PATH=./.secrets/firebase-service-account.json
  ```
- Install admin SDK and run dev:
  ```bash
  npm install firebase-admin
  npm run dev
  ```

Debugging tips

- If you see `FIREBASE_SECRET_NAME appears to be an unresolved placeholder`, it means the env var contains a token like `$FIREBASE_...` — usually a substitution failure in Cloud Build. Ensure the secret exists and the Cloud Build SA has access to it.
- To avoid exposing secrets in logs, prefer writing the secret to a file (the repo's `Dockerfile` already writes the build ARG to `/tmp/firebase-service-account.json` during build when available).

