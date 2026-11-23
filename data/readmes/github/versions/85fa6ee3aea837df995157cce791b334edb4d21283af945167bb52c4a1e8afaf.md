# Agentic Attack Detections

[![validate](https://github.com/ThreatDefence/agentic-attack-detections/actions/workflows/validate.yml/badge.svg)](https://github.com/ThreatDefence/agentic-attack-detections/actions/workflows/validate.yml)
[![release](https://img.shields.io/github/v/release/ThreatDefence/agentic-attack-detections)](https://github.com/ThreatDefence/agentic-attack-detections/releases)
[![license](https://img.shields.io/github/license/ThreatDefence/agentic-attack-detections)](LICENSE)

Open-source detection rules, hunting queries and indicators for security teams. They cover agentic attack frameworks: tools that hand an intrusion to AI agents, which plan, run real attack tools and keep going until they reach a goal.

Free to use under the MIT license. Fixes, false-positive reports and new indicators are welcome.

## What is here

- **Framework folders.** ARTEX and its AntiFox fork, Cairn, PentAGI, HexStrike, CyberStrikeAI, Strix, Hermes Agent, Agent Zero, RedAmon, Xalgorix and Pentest Swarm AI. Each folder is built from a review of the framework's source code and the public reporting on its use.
- **Shared behaviors.** Rules for what these frameworks have in common, whatever the tool or the model behind it.
- **Indicators and feeds.** One CSV of 572 sourced indicators, and the feeds generated from it.
- **Exposed consoles.** A dated list of addresses where Shodan has seen one of these consoles, in [`exposure/`](exposure). It is a record of what is exposed, not a detection feed.

Formats: KQL for Microsoft Sentinel and Defender XDR, Sigma, Suricata, Zeek, YARA and STIX 2.1, plus WAF rules for Cloudflare, AWS WAF and Azure WAF. Splunk and Elastic are covered by a Splunk app and Elastic rules for ARTEX, and by Sigma conversions for everything else.

## Try it in a minute

With Suricata installed, run the ARTEX rules over the sample capture in this repository:

```bash
git clone https://github.com/ThreatDefence/agentic-attack-detections
cd agentic-attack-detections
mkdir -p out
suricata -r frameworks/artex/tests/artex-sample.pcap -S frameworks/artex/suricata/artex.rules -l out -k none
cat out/fast.log
```

You should see alerts such as:

```text
[1:3800001:1] TD ARTEX user agent artex-<role>/1.0
[1:3800020:1] TD ARTEX placeholder probe path
[1:3800023:2] TD Unsigned alg none JWT in URI
```

The capture is test traffic written from the framework source code and published reports. It is not a recorded intrusion.

## Start here

| You have | Do this |
|---|---|
| Microsoft Sentinel | Upload `feeds/sentinel-watchlist.csv` as a watchlist with the alias `AGENTIC_IOCs` and the search key `value`. Import the analytics rules from `frameworks/*/sentinel/analytics/` and `behaviors/sentinel/analytics/`. Run the hunts in each folder's `hunting-order.md` order |
| Defender XDR | Run the hunts from `frameworks/*/sentinel/hunting/` in advanced hunting. They work where the tables exist |
| Suricata | Add the `.rules` files from `frameworks/*/suricata/` and `behaviors/suricata/`. HTTP rules need cleartext or decrypted traffic. DNS and TLS SNI rules work on encrypted traffic |
| Zeek | Install the behaviors package with `zkg install https://github.com/ThreatDefence/agentic-attack-detections` (or load `behaviors/zeek/agentic-behaviors/` by path), set `server_nets` to your server ranges ([setup](behaviors/zeek/README.md)), load `frameworks/artex/zeek/artex/`, and feed `frameworks/*/zeek/intel/*.intel` to the Intel framework |
| YARA | Scan container layers, home folders, `/tmp` and web roots with `frameworks/*/yara/` |
| Any SIEM with Sigma | Convert `frameworks/*/sigma/` and `behaviors/sigma/` with `sigma convert`, or take the conversions in [`generated/`](generated) |
| Splunk or Elastic | The ARTEX folder has a Splunk app and Elastic rules. For the other frameworks use [`generated/`](generated) |
| A WAF: Cloudflare, AWS WAF or Azure WAF | Deploy the rules in [`waf/`](waf): framework user agents, probe markers and unsigned JWT probes to block, and reported addresses to challenge. A WAF is optional. It adds blocking at the edge to the detections, it doesn't replace them |
| A threat intelligence platform | Import `feeds/stix2.1-bundle.json`, or the per-framework lists in `feeds/by-framework/` |

## Coverage

| | KQL hunts | Sentinel analytics | Sigma | Suricata | YARA | Zeek | Indicators |
|---|---|---|---|---|---|---|---|
| [ARTEX](frameworks/artex) | 31 | 7 | 36 | 43 | 4 | script, intel | 246 |
| [Cairn](frameworks/cairn) | 6 | 2 | 3 | 26 | 6 | intel | 73 |
| [PentAGI](frameworks/pentagi) | 5 | 2 | 3 | 10 | 3 | intel | 39 |
| [HexStrike](frameworks/hexstrike) | 4 | 2 | 3 | 7 | 3 | intel | 22 |
| [CyberStrikeAI](frameworks/cyberstrikeai) | 5 | 2 | 7 | 11 | 4 | intel | 73 |
| [Strix](frameworks/strix) | 3 | 1 | 3 | 5 | 3 | intel | 49 |
| [Hermes Agent](frameworks/hermes) | 4 | 2 | 3 | 7 | 4 | intel | 75 |
| [Agent Zero](frameworks/agent-zero) | 2 | | 1 | 3 | 1 | intel | 8 |
| [RedAmon](frameworks/redamon) | 3 | | 3 | 10 | 1 | intel | 19 |
| [Xalgorix](frameworks/xalgorix) | 3 | | 3 | 10 | 1 | intel | 22 |
| [Pentest Swarm AI](frameworks/pentestswarm) | 3 | | 3 | 11 | 1 | intel | 15 |
| [Shared behaviors](behaviors) | 9 | 2 | 5 | 16 | | package | |

Suricata counts are hand-written rules; each framework also has address rules generated from its indicators. Some indicators belong to more than one framework. ARTEX also has a Splunk app, Elastic rules and ES\|QL queries, and an osquery pack.

## Frameworks

| Framework | What it is | Seen in |
|---|---|---|
| [ARTEX](frameworks/artex) | Go planner and worker agents with a web console. AntiFox is the same code renamed | Storm-0940, Storm-3358, VAPOR PANDA and criminal groups, against Microsoft 365, Okta, AWS, Azure, web applications and Active Directory |
| [Cairn](frameworks/cairn) | Python engine that drives Claude Code, Codex and Pi coding agents in Kali containers | Online retailers, payment sites, Japanese web applications and WSUS servers |
| [PentAGI](frameworks/pentagi) | Go multi-agent platform that runs Kali tools in a container per engagement | Intrusions GTIG and Mandiant reported since August 2026, and a PaperCut exploitation operator's infrastructure |
| [HexStrike](frameworks/hexstrike) | Python MCP server that gives any AI assistant about 150 security tools over an unauthenticated API | NetScaler exploitation discussion in 2025, and intrusions GTIG and Mandiant reported |
| [CyberStrikeAI](frameworks/cyberstrikeai) | Go operator console whose agents run about 90 tools, with its own implants, C2 listeners and webshell manager | FortiGate mass-exploitation infrastructure, an AWS intrusion, and education organizations in Africa and Latin America |
| [Strix](frameworks/strix) | Python AI pentest agent that runs teams of agents in a Kali sandbox, on any model | The retail card-theft campaign Gambit reported, where it found the flaws Cairn exploited |
| [Hermes Agent](frameworks/hermes) | A legitimate general-purpose agent turned into an attack console: approvals off, a bundled jailbreak skill, red-team personas | The Gambit retail operator, the Carbonato Docker botnet, and Thailand's Ministry of Finance |
| [Agent Zero](frameworks/agent-zero) | General-purpose agent in a Kali container with a built-in hacker profile and an open web UI | Threat-actor experimentation GTIG reported, with no published indicators |
| [RedAmon](frameworks/redamon) | Self-hosted penetration testing platform: a web console, a recon pipeline and an agent that exploits from a Kali sandbox with Metasploit | No public report of use in an attack. Covered from its source code |
| [Xalgorix](frameworks/xalgorix) | Go binary with a web dashboard whose agent tests web applications and APIs without approval steps and re-exploits each finding | No public report of use in an attack. Covered from its source code |
| [Pentest Swarm AI](frameworks/pentestswarm) | Go command-line tool that runs recon, exploit and report agents over about 40 security tools | No public report of use in an attack. Covered from its source code |

Each folder has a README, the hunts and rules, and a `source-code-signals.md` that explains what the framework leaves behind and where in its code each signal comes from.

## Behaviors shared by agentic frameworks

[`behaviors/`](behaviors) holds rules that do not depend on any one framework.

| Behavior | Rules |
|---|---|
| An attack tool started under an AI agent CLI (Claude Code, Qwen Code, Kimi CLI, Codex, opencode, Hermes, Cairn's workers), found from the process tree | KQL hunt, Sentinel analytics rule, Sigma |
| Servers calling AI model APIs: Chinese models (DeepSeek, Qwen, GLM, Kimi, MiniMax, Doubao), gateways such as OpenRouter, and Western APIs | KQL hunt, Sigma, Zeek |
| An AI agent's page reader on your application next to attack traffic from the same address | KQL hunt, Sigma, Suricata, Zeek |
| One site probed through hundreds of rotating proxy addresses | KQL hunt, Zeek |
| Configuration and backup file theft, and probes of WSUS administration services | KQL hunt, Sentinel analytics rule, Sigma, Suricata, Zeek |
| Kerberos user enumeration and SMB or WinRM fan-out from one address | KQL hunt, Zeek |
| A server calling back to the address that was probing it | KQL hunt, Suricata (PentAGI worker ports), Zeek |
| AWS credentials used at machine speed from one outside address | KQL hunt |
| Servers looking up out-of-band testing domains (interactsh, Burp Collaborator, dnslog.cn), which means a blind payload ran on them | KQL hunt, Sigma, Suricata, Zeek |

The ARTEX folder also carries behavior hunts that apply to every framework: user agent family bursts (hunt 17), web and database services starting shells (hunt 11), servers calling webhook and tunnel services (hunt 12), scripts written into web folders (hunt 13), and Kerberoasting, DCSync and WinRM fan-out (hunt 16).

## Indicators and feeds

| Path | Contents |
|---|---|
| [`iocs/indicators.csv`](iocs/indicators.csv) | 572 indicators. Each row has its source, confidence, a review date for addresses and the framework it belongs to. This file is the single source for every feed |
| [`feeds/`](feeds) | Generated from the CSV: a STIX 2.1 bundle, a Sentinel watchlist, and plain lists of addresses, domains, URLs, user agents and hashes. The plain lists carry medium and high confidence rows only. Low confidence rows, which include legitimate services such as AI model APIs, need their context, so they stay in the CSV, the watchlist and the STIX bundle. [`feeds/by-framework/`](feeds/by-framework) has the lists per framework |
| [`generated/`](generated) | Every Sigma rule converted to Splunk SPL, Sentinel and Defender XDR KQL, and Elastic ES\|QL and Lucene. [`SUMMARY.md`](generated/SUMMARY.md) shows which rule converted to which backend |
| [`waf/`](waf) | Cloudflare, AWS WAF and Azure WAF rules built from [`waf/signatures.yaml`](waf/signatures.yaml) and the CSV. The [README](waf/README.md) covers when a WAF helps and how to deploy |
| [`tools/`](tools) | Feed builder, WAF builder, release file builder, Sigma converter and validator |
| [`docs/`](docs) | [Adding a framework](docs/adding-a-framework.md) |

Each framework folder also has a Zeek intel file and Suricata address rules, generated from the same CSV.

### Downloads

Each [release](https://github.com/ThreatDefence/agentic-attack-detections/releases) carries the same content as ready-made files. These links always point at the newest release:

| File | Contents |
|---|---|
| [`agentic-attack-detections.rules`](https://github.com/ThreatDefence/agentic-attack-detections/releases/latest/download/agentic-attack-detections.rules) | Every Suricata rule in one file |
| [`agentic-attack-detections-yara.zip`](https://github.com/ThreatDefence/agentic-attack-detections/releases/latest/download/agentic-attack-detections-yara.zip) | The YARA rules, one file per framework |
| [`agentic-attack-detections-stix2.1.json`](https://github.com/ThreatDefence/agentic-attack-detections/releases/latest/download/agentic-attack-detections-stix2.1.json) | The STIX 2.1 bundle |
| [`agentic-attack-detections-indicators.zip`](https://github.com/ThreatDefence/agentic-attack-detections/releases/latest/download/agentic-attack-detections-indicators.zip) | `iocs/indicators.csv` and every feed |
| [`agentic-attack-detections-waf.zip`](https://github.com/ThreatDefence/agentic-attack-detections/releases/latest/download/agentic-attack-detections-waf.zip) | The WAF rules for Cloudflare, AWS WAF and Azure WAF |
| [`SHA256SUMS.txt`](https://github.com/ThreatDefence/agentic-attack-detections/releases/latest/download/SHA256SUMS.txt) | SHA-256 of each file |

To keep the Suricata rules current with `suricata-update`:

```bash
suricata-update add-source agentic-attack-detections https://github.com/ThreatDefence/agentic-attack-detections/releases/latest/download/agentic-attack-detections.rules
suricata-update
```

## How the rules are built and checked

- **From source.** A signature string comes from the framework's code at a named commit, or from a report that published it. `source-code-signals.md` gives the file and line.
- **From reports.** Every indicator names the report it came from, and each value was checked against that report.
- **Tested.** Each Suricata rule has a test flow and a near miss. Every KQL query is parsed with Microsoft's parser and its columns checked. The Zeek packages run against test captures. CI runs the validator and the Suricata tests on every push.
- **Run on real data.** Version 2.7.0 was run over 30 days of production telemetry to remove rules that could not fire and to quiet rules that were noisy.

No rule has been tested against a captured intrusion. Treat every rule as experimental until it has run on your own data.

## Confidence

| Level | Meaning | How to use it |
|---|---|---|
| High | Specific to a framework or its campaigns: its user agents, command lines, paths, prompt strings, probe artifacts, reported C2 and skimmer domains, file hashes | Alert |
| Medium | Seen in a framework's activity but changeable or shared: reported addresses, generic agent user agents, prompt text shared with similar tools | Alert after baselining, or hunt |
| Low | Common or legitimate: AI model APIs, request-collection services, agent CLI user agents, hosting ASNs, proxy providers | Context for another finding only |

Addresses from cloud and VPS providers are reassigned. Every address has a `review_by` date 180 days after it was reported. Addresses past that date are left out of the plain lists, the Zeek intel files and the Suricata address rules; they stay in the CSV and the STIX bundle as history. Check before you block.

## Testing

```bash
pip install -r tools/requirements.txt
python3 tools/validate.py                              # Sigma, KQL, ES|QL, TOML, Splunk, Suricata SIDs, YARA, Zeek, osquery, feeds
python3 -m unittest discover -s tests/feeds            # indicator confidence, expiry and SID policy
python3 tests/sigma/run_tests.py                       # Sigma rules against test events
python3 tests/kql/run_tests.py                         # hunts and analytics against sample rows; needs the Kusto emulator
python3 tools/convert.py                               # regenerate generated/
python3 tools/build_waf.py                             # regenerate waf/
python3 tests/waf/run_tests.py                         # offline checks of the WAF rules on every platform
python3 tools/build_release.py                         # build the release downloads into dist/
python3 tests/suricata/run_tests.py                    # one flow per Suricata rule; needs suricata and openssl
bash frameworks/artex/tests/run_network_tests.sh       # needs zeek and suricata on the PATH
bash behaviors/zeek/tests/run_tests.sh                 # needs zeek on the PATH
```

`validate.py` checks KQL with Microsoft's parser when `dotnet` is installed, and Zeek scripts when `zeek` is.

## Contributing

Pull requests are welcome. The most useful contributions are false-positive reports, missed detections and new indicators with a source. See [CONTRIBUTING.md](CONTRIBUTING.md) for the checks to run, and [docs/adding-a-framework.md](docs/adding-a-framework.md) to add a framework.

Where the project is going is in the [roadmap](ROADMAP.md).

## Getting help

Open an [issue](https://github.com/ThreatDefence/agentic-attack-detections/issues). There are forms for a false positive, a missed detection, a new indicator and a new framework. Describe the shape of the event; never paste customer data. For a security problem in the repository itself, see [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE). Each indicator names its source in `iocs/indicators.csv`. Use them in your own products and feeds.

## Disclaimer

Provided as is, without warranty. A match is a lead, not a verdict. Absence of a match does not mean absence of compromise.

## Credits

Started and maintained by [ThreatDefence](https://threatdefence.com), with fixes from [@jack51706](https://github.com/jack51706), [@tridev-tej](https://github.com/tridev-tej), [@Bropdrop](https://github.com/Bropdrop), [@blitzcrieg1](https://github.com/blitzcrieg1) and [@nerdyhacks](https://github.com/nerdyhacks). Background on ARTEX: the [advisory](https://threatdefence.com/article/artex-agentic-attack-framework-detection-hunting) and the [source code signals article](https://threatdefence.com/article/artex-source-code-signals-deep-hunting).

## History

This repository was `artex-detections`. GitHub redirects the old address. The ARTEX rules moved from the root to [`frameworks/artex/`](frameworks/artex); `iocs/indicators.csv` and `feeds/` kept their paths.
