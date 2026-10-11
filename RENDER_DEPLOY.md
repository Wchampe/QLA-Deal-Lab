# Render deployment

This project is now prepared as a Render Node web service. Render supplies the
`PORT`; `server.js` listens on `0.0.0.0`, serves the interface, and accepts API
requests only from the configured same origin.

## GitHub → Render

1. Commit and push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository. Render will
   read `render.yaml`, or create a **Web Service** with:
   - build command: `npm install --ignore-scripts`
   - start command: `npm start`
   - health check path: `/api/health`
3. After the service has a public hostname, set `ALLOWED_HOSTS` to that host,
   such as `qla-deal-lab.onrender.com`, without `https://`. If Render exposes
   `RENDER_EXTERNAL_HOSTNAME`, the service accepts that hostname as well.
4. Open the resulting `https://...onrender.com/` URL.

## What works on the first deployment

The static interface, browser-local workspace, financial calculations, workflow,
and endpoints that use public sources can run without Ollama. The Blueprint
sets `QLA_DISABLE_OLLAMA=1`, so health checks do not wait for a local model and
the local AI panels clearly report that hosted AI is disabled. The hosted
service does not have the local Windows Ollama process; add a deliberate remote
model adapter later if you want hosted AI. Do not put Ollama credentials or
private source files in the repository.

Brave and SAM access can be configured with Render environment variables if you
choose to use those APIs:

- `BRAVE_API_KEY` or `BRAVE_SEARCH_API_KEY`
- `SAM_API_KEY`
- `QLA_SEC_USER_AGENT`

The Windows DPAPI credential file under `private/` is not portable to Render;
use environment variables there. Render's free filesystem is ephemeral, while
the browser workspace remains in each user's local browser storage. Add a
managed database or persistent disk before treating hosted data as durable.

This deployment hosts the interface and research APIs. It does not send
outreach, bypass restricted sites, or execute acquisition transactions.
