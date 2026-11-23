# DataCat

Self-hosted observability: metrics, logs, distributed traces, dashboards, infrastructure
and alerts in one place. DataCat runs on your infrastructure, stores data in PostgreSQL (or telemetry in
ClickHouse, if you choose; see docs/SELF_HOSTING.md), and accepts OpenTelemetry and Datadog-compatible agent traffic.
No hosted account or external service is required.

## Features

- Metrics explorer, formulas, dashboards and host maps
- Searchable logs with facets, live tail and trace correlation
- APM service catalog, trace explorer and waterfall
- Metric, log and trace monitors with webhook/Slack notifications
- Organizations, local accounts, single-use invites, API/application keys
- OpenTelemetry Collector-based host agent and Node.js/Python instrumentation libraries
- One production process serving the API, web UI, installer and downloads

![DataCat dashboard](docs/images/dashboard.jpg)

## Quick start with Docker Compose

Requirements: Docker Engine with the Compose plugin, Git, and OpenSSL.

```sh
git clone https://github.com/replit/datacat
cd datacat
cp .env.example .env
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 24)/" .env
sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$(openssl rand -hex 32)/" .env
chmod 600 .env
mkdir -p downloads
docker compose up -d --build
```

Open **http://localhost:3000**, create your admin account and organization, then create
an API key under **Organization Settings**. Setup asks for a setup token, printed in the
server log (`docker compose logs datacat | grep "setup token"`) unless you set `DATACAT_SETUP_TOKEN`.
Set `PUBLIC_URL` to your externally reachable HTTPS origin before inviting colleagues or
installing agents remotely.

Agent binaries and SDK packages are separate release assets. Put them (including
`SHA256SUMS`) in `downloads/` to serve them from your instance.

## Sending data

DataCat accepts the Datadog public intake API and OTLP/HTTP:

| Sender | Status |
| --- | --- |
| Datadog Agent 7.56.2 (metrics, logs, check runs, traces) | Tested in CI-style runs |
| Datadog Agent 7.85.4 (metrics, logs, check runs, traces) | Tested with captured payloads; including the newer string-table trace format |
| Datadog Agent 7.57–7.84 | Not tested individually. Agents that send traces in a format DataCat cannot read get a 422, never a silent 202 |
| OpenTelemetry Collector / SDKs (OTLP/HTTP) | `/v1/traces`, `/v1/metrics`, `/v1/logs` (also under `/otlp/v1/*`) |
| DataCat Agent and libraries | Tested in CI |

`GET /api/v1/intake/stats` shows, per intake path, how many items were stored and how many were dropped since the
server started.

Sign-in uses local email/password accounts; members join through single-use invite links.

## From source

Use Node.js **22.15+**, pnpm **10.11.0** and PostgreSQL **14+**. Node 22 also meets
the Node SDK requirement; older Node 20 releases are not supported by the current SDK.

```sh
corepack enable
corepack prepare pnpm@10.11.0 --activate
pnpm install --frozen-lockfile
BASE_PATH=/ pnpm run build:selfhost
# Set DATABASE_URL, SESSION_SECRET and PUBLIC_URL in your environment.
NODE_ENV=production PORT=3000 pnpm start
```

The server migrates its schema automatically before listening. There is no manual
schema push and no separate frontend server.

See **[Self-hosting](docs/SELF_HOSTING.md)** for clean Ubuntu installation, all environment
settings, backups, systemd, agent installation, Node/Python instrumentation and a
webhook monitor walkthrough.

## Development

```sh
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run dev
# In another terminal:
API_PROXY=http://localhost:3000 PORT=5173 pnpm --filter @workspace/web run dev
```

The API needs `DATABASE_URL`; use a separate development database.
The agent is built with Go 1.26.11+:

```sh
bash agent/build.sh
DESTDIR="$PWD/dist/downloads" bash agent/release.sh
```

Tests:

```sh
pnpm --filter @workspace/api-server test     # server unit tests
DATACAT_URL=http://localhost:3000 DATACAT_SETUP_TOKEN=<token> bash scripts/e2e.sh   # end-to-end known-answer checks against a fresh install
```

CI (`.github/workflows/ci.yml`) runs typechecks, unit tests, dependency and vulnerability audits, the end-to-end
checks on both storage options, the library and agent tests, a Docker build and a secrets scan on every pull request.

Runnable examples are in [`examples/`](examples). See [Contributing](CONTRIBUTING.md), [Security](SECURITY.md) and the [Changelog](CHANGELOG.md).

## Benchmarks

`bench/kit` sends metrics, logs and traces through DataCat and checks every answer against a known value; it reports
throughput, query latency and how long data takes to become searchable, for both storage options. The other folders
in [`bench/`](bench) hold the correctness, resilience, alerting, soak and isolation tests; raw results behind the
published numbers are in [`bench/evidence/`](bench/evidence).

## License

[Apache License 2.0](LICENSE). Third-party dependencies retain their own licenses.
DataCat is an independent project, not affiliated with or endorsed by Datadog, Inc. Datadog is a trademark of
Datadog, Inc.; it is named here only to describe protocol compatibility.
