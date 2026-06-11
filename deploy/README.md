# iValuate deployment

The serving workloads run on `role=serving` (VPS A). The ML workload runs on
`role=data-processing` (VPS B). MySQL remains on the VPS A host.

Create `ivaluate-secrets` before applying the manifests. Required keys:

- `DB_USER`, `DB_PASSWORD`
- `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DB`
- `JWT_SECRET`
- `SMTP_USER`, `SMTP_PASS`, optionally `MAIL_FROM`

GitHub Actions CD additionally requires:

- `VPS_A_HOST`
- `VPS_A_SSH_KEY`
- `GHCR_PULL_TOKEN`

The Predict Price repository additionally requires `VPS_B_HOST` and
`VPS_B_SSH_KEY` so its workflow can fetch the production model artifact before
building the ML image.

The first local deployment uses `localhost/*:local` images imported into K3s.
After GHCR is enabled, change the deployments to the GHCR image tags and add an
image pull secret if the packages are private.
