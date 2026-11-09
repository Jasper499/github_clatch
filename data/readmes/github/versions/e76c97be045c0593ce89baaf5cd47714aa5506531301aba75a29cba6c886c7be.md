# satmux

TCP multiplexer and `1-RTT` HTTP/TLS relay for geostationary (GEO) inflight Wi-Fi (Inmarsat GX, Viasat, Panasonic, SITA). Pure Python 3 stdlib, zero external dependencies.

Measured inflight over Inmarsat GX Ka-band (`~620 ms` RTT, SITA `AS206433` Amsterdam ground station):

```text
  ORIGIN (6× PARALLEL)  RAW CABIN WI-FI (:443)    1-RTT BBR + ZLIB MUX    SPEEDUP
  ────────────────────  ────────────────────────  ──────────────────────  ─────────
  GitHub Repo           ████████████    TIMEOUT  ███░░░░░░░░░    4.66s  FIXED ✓
  GitHub API            ████████████  TCP RESET  ██░░░░░░░░░░    2.66s  FIXED ✓
  Hacker News           ████████████    TIMEOUT  ██░░░░░░░░░░    2.28s  FIXED ✓
  MDN Docs              ████████░░░░     12.01s  ██░░░░░░░░░░    2.30s     5.2×
  Cloudflare            ██░░░░░░░░░░      2.97s  █░░░░░░░░░░░    1.40s     2.1×
  PyPI JSON API         █████░░░░░░░      7.09s  ██░░░░░░░░░░    2.64s     2.7×
  ──────────────────────────────────────────────────────────────────────────────────
  6-Origin Burst:    19.13s (3/6 failed)  →  5.35s (0/6 failed)   [3.6× faster · -76% TTFB]
```

## Problem

Non-Starlink inflight Wi-Fi usually breaks on three things unrelated to raw bandwidth:

1. **Onboard `:443` middleboxes and DNS interception.** Cabin gateways intercept `:53` DNS and run a transparent `:443` split-TCP proxy (PEP) whose state table drops connections under load (`Connection reset by peer` / TLS timeouts on `github.com`, `api.github.com`, package registries). Non-443 TCP ports pass through untouched.
2. **Handshake round-trips (`~620 ms` per GEO hop).** Every new origin normally pays multiple satellite round-trips (DNS + TCP + TLS) before transferring payload bytes.
3. **Cubic congestion collapse.** Cabin Wi-Fi packet loss causes standard TCP to halve `cwnd` repeatedly, leaving most of your per-seat token-bucket cap unused.

## How it works

```text
Direct (:443):
  laptop ──▶ cabin DNS + :443 PEP ══(3–4 GEO RTTs)══▶ ground ──▶ origin  (frequent TCP resets)

satmux (:8444):
  laptop ══(12 persistent TCP :8444 BBR + zlib pipes)══▶ ground VM ──(2 ms)──▶ origin
```

- **Persistent non-443 carrier pool (`:8444`):** Keeps 12 pre-warmed TCP connections open to a Linux VM near the satellite ground station, bypassing the cabin `:443` proxy and onboard DNS. Streams are scheduled onto the carrier with the lowest recent byte load so idle browser keepalives do not cause head-of-line queueing.
- **0-RTT stream open (`127.0.0.1:1080` SOCKS5 / `127.0.0.1:8080` HTTP CONNECT):** Returns `OK` locally in `<1 ms` and sends `FT_OPEN` + TLS `ClientHello` in the same TCP burst, saving one full satellite RTT while preserving end-to-end TLS from the laptop.
- **1-RTT ground fetch (`127.0.0.1:8081`):** Sends an encrypted (`BLAKE2b-512` stream + `HMAC-SHA256`) request frame over a warm carrier. The ground VM performs DNS, verified TLS 1.3, and HTTP redirects on fiber (`~2–5 ms`) and compresses plaintext responses with `zlib` before crossing the satellite link.
- **`git` and `gh` CLI routing:** Go binaries such as `gh` ignore macOS `scutil` proxies. `satmux` exposes a `0600` local Unix socket (`/tmp/satmux-gh-tls.sock`) wired to `gh`'s `http_unix_socket` that wraps requests in verified end-to-end TLS on the laptop and tunnels them over SOCKS5, fixing already-running coding agents without restarting them.
- **BBR + `MSS 1280`:** Ground-to-cabin sockets enable `TCP_CONGESTION=bbr` and `TCP_MAXSEG=1280`.

## Limits

- **Latency floor (`~580–650 ms`):** Speed-of-light propagation to geostationary orbit (`35,786 km`) does not change; `satmux` removes extra round-trips, not the physical RTT of one hop.
- **Per-seat shaper (`~4–5 Mbps` typical):** Cabin routers police total bandwidth per client lease. Compressible traffic (HTML, JSON, code, APIs) exceeds that rate in effective throughput via `zlib`; already-compressed binaries (`.mp4`, `.zip`) stay bounded by the seat cap (though BBR + parallel `satmux-get` keep throughput near the ceiling).
- **Single paid session:** Uses your authenticated cabin Wi-Fi lease; it does not bypass captive portals.

## Setup

### 1. Ground VM

Rent a small Linux VM (`$0.01–$0.03/h`, Python 3.9+, open TCP port `8444`) close to where the satellite downlinks to fiber. Check `curl ipinfo.io` on raw cabin Wi-Fi first to see the egress country/ASN:

- **Emirates / Middle East & European flights (Inmarsat GX / SITA `AS206433`):** Amsterdam, Frankfurt, or Hetzner EU (downlink lands in the Netherlands).
- **North America:** `us-east` or `us-west`.
- **Asia-Pacific:** Singapore or Tokyo.

Pause UDP VPNs (Tailscale/WireGuard) inflight—blocked UDP retry traffic competes for cabin airtime.

### 2. Run

With a coding agent:

> Spin up a temporary Ubuntu VM near my current satellite egress IP, start `https://github.com/Th0rgal/satmux` on port `8444`, connect the local 12-carrier client, enable `bin/satmux-macos on`, and run `bin/satmux-bench`.

Or manually:

```bash
# 1. Laptop: generate PSK
git clone https://github.com/Th0rgal/satmux.git && cd satmux
openssl rand -hex 32 > mux.psk && chmod 600 mux.psk

# 2. Ground VM: start server
scp satmux.py mux.psk root@<SERVER_IP>:/root/
ssh root@<SERVER_IP> 'nohup env SATMUX_PSK=$(cat /root/mux.psk) python3 /root/satmux.py server --port 8444 >/var/log/satmux.log 2>&1 &'

# 3. Laptop: start client + enable macOS / git / gh routing
SATMUX_PSK=$(cat mux.psk) python3 satmux.py client --host <SERVER_IP> --port 8444 --carriers 12 &
./bin/satmux-macos on <SERVER_IP>
```

Benchmark or run parallel range downloads:

```bash
./bin/satmux-bench
./bin/satmux-get https://example.com/archive.tar.gz
```

### 3. Teardown after landing

```bash
./bin/satmux-macos off
```

Restores macOS Wi-Fi proxy settings, `~/.gitconfig`, `gh` `http_unix_socket`, and `launchctl` env vars, then destroy the temporary VM.

## License

MIT
