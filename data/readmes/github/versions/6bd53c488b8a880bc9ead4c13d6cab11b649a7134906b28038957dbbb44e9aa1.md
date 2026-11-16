<h1 align="center">
  <a href="https://openorange.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/images/readme-logo-dark.svg">
      <img src="docs/images/readme-logo.svg" width="350" height="72" alt="OpenOrange">
    </picture>
  </a>
</h1>

<p align="center"><strong>Run Cloudflare Workers anywhere: AWS, Google Cloud, Azure, or your own servers.</strong></p>

<p align="center">The same developer experience, without the runtime limits, for a fraction of the bill.</p>

<p align="center">
  <a href="https://openorange.dev/docs/">Docs</a> ·
  <a href="https://openorange.dev/docs/deploy/">Deploy</a> ·
  <a href="https://openorange.dev/docs/migrate/">Migrate</a> ·
  <a href="https://openorange.dev/docs/bindings/">Bindings</a> ·
  <a href="examples/">Examples</a> ·
  <a href="https://rivet.dev/discord">Discord</a>
</p>

## What is OpenOrange

OpenOrange runs your existing Cloudflare Workers project on AWS, Google Cloud, Azure or your own servers, with no changes to your code. It's built with four goals:

- **Zero refactoring, zero-downtime migration**: your Workers and Durable Objects run as they are, and your data moves off Cloudflare while your app keeps serving.
- **The same developer experience**: `wrangler dev` becomes `orange dev`, and everything underneath is open source and self-hostable.
- **Simpler bills**: you pay for the machines you run on, not Cloudflare's metering or an enterprise contract. Compute is 4.8× cheaper and storage 8.7× cheaper.
- **Built for scale**: storage is backed by S3, so scaling out is a matter of adding machines.

## Quickstart

You need a Worker project with a `wrangler.jsonc`, `wrangler.json`, or `wrangler.toml` (or use [`examples/hello-durable-object`](examples/hello-durable-object)), Node.js 22 or later, and pnpm. Deploying also needs Docker.

### Use a coding agent

Paste this into your coding agent (Claude Code, Codex, Cursor, …) from your Worker project:

```text
First, add the Rivet MCP (https://mcp.rivet.dev/mcp) to this agent, and ask me to approve the Rivet sign-in. Then run this project's Cloudflare Worker on Rivet with OpenOrange: ask me where it should run (on my machine, on a Rivet cluster, or on my own Rivet Engine), read https://github.com/rivet-dev/open-orange/blob/main/README.md and follow its quickstart. Do not change my app code.
```

### Step 1: Install

Install the `orange` CLI globally, then run it in your Worker project. Your code and your Wrangler configuration do not change.

```sh
pnpm add -g open-orange
```

### Step 2: Run your Worker

Your Worker answers on `http://localhost:8787`. Each Durable Object runs as a Rivet Actor with its own SQLite database, kept in `.open-orange/`.

```sh
$ orange dev
  Binding       Resource         Runs on
  env.COUNTER   Durable Object   Rivet Actor · Counter

● Ready in 4.6s
  Local         http://127.0.0.1:8787
```

### Step 3: Deploy

`orange deploy` builds an image of your Worker and rolls it out to a Rivet cluster, then prints its public URL.

```sh
$ orange login
$ orange link --cluster <cluster-name>
$ orange deploy
✓ Deployed my-worker
  URL     https://api.example.com
```

See the [deploy guide](https://openorange.dev/docs/deploy/), or [self-host it](#self-host).

## Migrate your data without downtime

`orange migrate` moves your Durable Objects off Cloudflare with zero downtime.

<p align="center">
  <a href="https://releases.rivet.dev/openorange/migrate.mp4"><img src="https://releases.rivet.dev/openorange/migrate.gif" width="480" alt="The cutover: all traffic moves from Cloudflare to OpenOrange while each Durable Object copies itself"></a>
</p>

See the [migration guide](https://openorange.dev/docs/migrate/) for every step, rollback, and what cannot move.

## Run it where you want

Next to your database, in the cloud and region you choose.

- **Rivet Cloud**, fully managed: a dedicated cluster on AWS or Google Cloud, in the region you choose. Operated by Rivet.
- **BYOC**, your cloud and our ops: your AWS, Google Cloud or Azure account. Operated by Rivet over an outbound connection.
- **Self-hosted**, open source under Apache 2.0: any cloud, Hetzner, on-prem or air-gapped. Operated by you.

### Self-host

1. **Build the Docker image.** `orange deploy --dry-run` writes the build and calls no API. Push the image to a registry your servers can pull from.

   ```sh
   orange deploy --dry-run --outdir out
   docker build --platform linux/amd64 -f out/Dockerfile -t my-worker out/context
   ```

2. **Run the Rivet control plane.** Follow Rivet's guide for your platform: [Kubernetes](https://rivet.dev/docs/deploy/self-host/control-plane/kubernetes/), [AWS ECS](https://rivet.dev/docs/deploy/self-host/control-plane/aws-ecs/), [Docker Compose](https://rivet.dev/docs/deploy/self-host/control-plane/docker-compose/), [Hetzner](https://rivet.dev/docs/deploy/self-host/control-plane/hetzner/), [Railway](https://rivet.dev/docs/deploy/self-host/control-plane/railway/), [Render](https://rivet.dev/docs/deploy/self-host/control-plane/render/), [a VM](https://rivet.dev/docs/deploy/self-host/control-plane/vm/).
3. **Run your image as worker nodes.** Point each container at the control plane with `RIVET_ENDPOINT`, following Rivet's guide for your platform: [Kubernetes](https://rivet.dev/docs/deploy/self-host/nodes/kubernetes/), [AWS ECS](https://rivet.dev/docs/deploy/self-host/nodes/aws-ecs/), [Docker Compose](https://rivet.dev/docs/deploy/self-host/nodes/docker-compose/), [Hetzner](https://rivet.dev/docs/deploy/self-host/nodes/hetzner/), [Railway](https://rivet.dev/docs/deploy/self-host/nodes/railway/), [Render](https://rivet.dev/docs/deploy/self-host/nodes/render/), [a VM](https://rivet.dev/docs/deploy/self-host/nodes/vm/).

See [self-hosting](https://openorange.dev/docs/deploy/#self-host) in the deploy guide.

## How pricing compares

Cloudflare's meters, priced on raw AWS: Graviton EC2 in us-east-1 with 40% headroom, and S3 in your account. See [the cost model](https://openorange.dev/#cost).

| | Cloudflare | OpenOrange | |
|---|---|---|---|
| Durable Object compute | $0.045 per GB-hour | $0.0094 per GB-hour | 4.8× cheaper |
| Durable Object storage | $0.20 per GB-month | $0.023 per GB-month | 8.7× cheaper |
| SQLite writes | $1.00 per million rows | about $0.18 per million | 5.7× cheaper |

## No runtime limits

128 MB is all the memory a Cloudflare Worker gets. OpenOrange runs your Workers and Durable Objects on machines you choose, so the limits are your hardware's.

| Limit | Cloudflare Workers Paid | OpenOrange |
|---|---|---|
| Memory per Worker or Durable Object | 128 MB | Up to your machine's memory. The Node.js heap is up to about 4 GB by default, and configurable. |
| CPU time per request | 30 s default, 5 min max | No cap |
| Cron, queue and alarm handlers | 15 min wall time | No cap |
| Open connections per request | 6 at once | OS limits |
| Storage per Durable Object | 10 GB | No cap |
| Worker bundle | 64 MiB | No cap |
| Node.js | `nodejs_compat` subset | Stock Node.js |

## Architecture

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/architecture-dark.png">
    <img src="docs/images/architecture.png" width="760" alt="Your Docker containers, in any cloud, connect out to the Rivet control plane, which keeps state in S3">
  </picture>
</p>

- **Your containers** run your Workers and Durable Objects, in any cloud or on your own servers.
- **Rivet** places each Durable Object on a container and routes requests to it.
- **S3** stores each object's SQLite data.

See [Architecture](https://openorange.dev/docs/architecture/).

## Supported bindings

| Cloudflare binding | Status | Runs on |
|---|---|---|
| [Durable Objects](https://openorange.dev/docs/bindings/durable-objects/) | Partial | One Rivet Actor for each object, with its own SQLite database |
| [KV](https://openorange.dev/docs/bindings/kv/), [D1](https://openorange.dev/docs/bindings/d1/), [Rate Limiting](https://openorange.dev/docs/bindings/rate-limiting/) | Drop-in | Rivet Actors |
| [Cache](https://openorange.dev/docs/bindings/cache/) | Partial | One Rivet Actor for each cache name |
| [Queues](https://openorange.dev/docs/bindings/queues/) | Drop-in | One Rivet Actor for each queue |
| [Workflows](https://openorange.dev/docs/bindings/workflows/) | Partial | Cloudflare's own Workflows engine, with one Rivet Actor for each instance |
| [Cron Triggers](https://openorange.dev/docs/bindings/cron-triggers/) | Drop-in | A Rivet Actor |
| [Tail Workers](https://openorange.dev/docs/bindings/tail-workers/) | Partial | Rivet Durable Streams |
| [R2](https://openorange.dev/docs/bindings/r2/) | Pluggable | A Rivet Actor, or Amazon S3, Google Cloud Storage, Cloudflare R2 or MinIO |
| [Worker Loader](https://openorange.dev/docs/bindings/worker-loader/) | Partial | A separate process in an agentOS VM |
| [Workers AI](https://openorange.dev/docs/bindings/workers-ai/) | Pluggable | OpenRouter, OpenAI, or any OpenAI-compatible endpoint |
| [Send Email](https://openorange.dev/docs/bindings/email/) | Pluggable | Amazon SES, or any SMTP server |
| [Browser Rendering](https://openorange.dev/docs/bindings/browser-rendering/) | Pluggable | Browserbase, or any Chrome DevTools endpoint |
| [Hyperdrive](https://openorange.dev/docs/bindings/hyperdrive/) | Drop-in | Your Postgres or MySQL database, with a direct connection |
| [Sandbox](https://openorange.dev/docs/bindings/sandbox/) | Pluggable | E2B, Daytona, Freestyle, agentOS, or a local directory |
| Analytics Engine | Not supported | `writeDataPoint()` drops each data point |
| Vectorize, Images, Media, Stream, Pipelines, AI Search, mTLS certificates, VPC, and legacy blobs | Not supported | Calls throw |

**Drop-in** runs as on Cloudflare. **Pluggable** runs on a provider you configure. **Partial** runs with known differences, listed on each binding's page. See [binding configuration](https://openorange.dev/docs/bindings/configuration/) for every Wrangler key and the variables each provider needs, and [Compatibility](https://openorange.dev/docs/compatibility/) for the test results.

## Questions

<details>
<summary><strong>Wait, wasn't Cloudflare supposed to be cheaper?</strong></summary>

For small, spiky Workers, it often is: the free tier and per-request pricing are hard to beat. The meters add up once Durable Objects stay busy. The same GB-hours on Graviton EC2 cost about a fifth as much, and writes cost a fraction of that.

</details>

<details>
<summary><strong>Is OpenOrange a fork of Cloudflare?</strong></summary>

No. OpenOrange implements the Workers API on Node.js and maps each Cloudflare service onto Rivet. It uses Wrangler to read your configuration, and it reuses some MIT-licensed Cloudflare code, such as the Workflows engine. It does not run workerd.

</details>

<details>
<summary><strong>Why not just run workerd directly?</strong></summary>

workerd is Cloudflare's runtime, not its platform. KV, D1, R2, Queues, Workflows and the Cache API are bindings that call services you have to build, and Durable Objects keep their data on one machine with nothing to place, replicate or scale them. See [OpenOrange vs workerd](https://openorange.dev/vs-workerd/).

</details>

<details>
<summary><strong>Do I need to learn Rivet?</strong></summary>

No. Rivet is the control plane underneath. You use the `orange` CLI and your Wrangler configuration.

</details>

<details>
<summary><strong>What does it cost?</strong></summary>

OpenOrange is Apache 2.0 and free. Self-host Rivet and your cloud bill is the only bill. Rivet Cloud and BYOC pricing is at [rivet.dev/pricing](https://rivet.dev/pricing).

</details>

<details>
<summary><strong>What happens to the data already in KV, Durable Objects and R2?</strong></summary>

`orange migrate` moves Durable Objects while your app serves, with no downtime. D1 databases are interrupted for a few minutes while they copy. R2 is S3-compatible, so `rclone` or `aws s3 sync` moves buckets.

</details>

<details>
<summary><strong>Does it run at the edge?</strong></summary>

It runs wherever you deploy it, in as many regions as you want. Most backends talk to one database, and running next to it is faster than running at the edge.

</details>

<details>
<summary><strong>Who maintains OpenOrange?</strong></summary>

[Rivet](https://rivet.dev). OpenOrange is not affiliated with or endorsed by Cloudflare, Inc.

</details>

## Compare

- [OpenOrange vs Cloudflare Durable Objects](https://openorange.dev/vs-durable-objects/): limits, latency, residency, and moving off.
- [OpenOrange vs workerd](https://openorange.dev/vs-workerd/): a runtime for one Worker, versus your whole app in production.
- [OpenOrange vs celld](https://openorange.dev/vs-celld/): runtime limits, live migration, integrations, and support.
- [OpenOrange vs Rivet](https://openorange.dev/vs-rivet/): when to use Rivet directly, and how to combine them.
- [OpenOrange vs Miniflare](https://openorange.dev/vs-miniflare/): a local simulator, versus production.

## Resources

- [Deploy guide](https://openorange.dev/docs/deploy/): Rivet Cloud, self-hosting, variables, secrets, and rollback.
- [Migration guide](https://openorange.dev/docs/migrate/): how to cut over, how to roll back, and what cannot move.
- [Bindings](https://openorange.dev/docs/bindings/): one page for each binding and runtime API, with its known differences.
- [Architecture](https://openorange.dev/docs/architecture/): how OpenOrange runs your Worker on Rivet.
- [Examples](examples/): Workers that you can copy, with no OpenOrange imports.
- [Real projects](packages/cloudflare-conformance/real-projects): open-source Workers run through `orange dev`, with what works and what does not.
- [Discord](https://rivet.dev/discord): questions and support.

## License

[Apache-2.0](LICENSE)
