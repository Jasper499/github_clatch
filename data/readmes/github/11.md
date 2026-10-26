<p align="center">
  <img src="banner.jpg" alt="php2shell — CVE-2026-109618 / CVE-2026-109619" width="100%">
</p>

# php2shell — CVE-2026-109618 / CVE-2026-109619

> **Critical Advisory (CVSS v4.0: 9.2 - Critical):** On October 20, details of two pre-auth Remote Code Execution (RCE) flaws in the PHP core leaked online ahead of coordinated disclosure. Exploitation allows arbitrary command execution straight from the web server.

---

## Table of Contents

- [Overview](#overview)
  - [Root Cause](#root-cause)
  - [Verification & Targets](#verification--targets)
- [Affected PHP Versions](#affected-php-versions)
- [Threat Landscape & Detection Guidance](#threat-landscape--detection-guidance)
  - [Behavioral Indicators & Suspicious Child Processes](#behavioral-indicators--suspicious-child-processes)
  - [Monitoring Recommendation](#monitoring-recommendation)
- [Action Items for Organizations](#action-items-for-organizations)
- [Proof of Concept (PoC)](#proof-of-concept-poc)
  - [Exploit Architecture & Stages](#exploit-architecture--stages)
  - [Target Requirements](#target-requirements)
  - [Usage & Parameters](#usage--parameters)
  - [Profiles & Offsets](#profiles--offsets)
- [Mitigation & Source Patching](#mitigation--source-patching)
  - [1. Configuration Mitigation (Immediate Stopgap)](#1-configuration-mitigation-immediate-stopgap)
  - [2. Automated Quick-Fix Script](#2-automated-quick-fix-script)
  - [3. Source Code Patch (`session-upload-progress-counters.patch`)](#3-source-code-patch-session-upload-progress-counterspatch)
  - [4. Cloudflare WAF Custom Rules](#4-cloudflare-waf-custom-rules)
  - [5. FrankenPHP Caddyfile Configuration](#5-frankenphp-caddyfile-configuration)
  - [6. Lighttpd Configuration](#6-lighttpd-configuration)
  - [7. Apache Mitigation (ModSecurity & .htaccess)](#7-apache-mitigation-modsecurity--htaccess)
- [Disclaimer](#disclaimer)

---

### Overview

`php2shell` refers to two critical vulnerabilities (CVE-2026-109618 & CVE-2026-109619) affecting core PHP functionality. The primary demonstrated vector is a heap use-after-free (UAF) in the PHP core session upload progress mechanism leading to arbitrary code execution (`zend_call_function` / `system()`).

- **Severity:** Critical (CVSS v4.0: 9.2)
- **Impacted Versions:** Reports indicate PHP versions 5, 6, 7, and 8 may be affected. Fixes are primarily expected for currently supported PHP 8 branches, leaving end-of-life (EOL) versions (PHP 5.x, 7.x, 8.0, 8.1) exposed without official vendor patches.
- **Industry Tracking:** Confirmed by security researchers (watchTowr reproduced CVE-2026-109618; monitoring by Huntress and Florian Roth / process-watcher).

#### Root Cause
PHP's upload progress handler (`php_session_rfc1867_callback` in `ext/session/session.c`) stores two raw `zval *` bucket pointers (`post_bytes_processed` and `current_file_bytes_processed`) directly in live `HashTable` structures.

During request processing:
1. **Trigger:** A standard multipart `POST` request activates progress tracking with default configuration values (`session.upload_progress.enabled = 1`).
2. **Free:** A progress update cycle re-reads session data. The function `zend_hash_update()` destroys the previous data tree using the destructor `zval_ptr_dtor`, freeing the memory block.
3. **Reclaim:** The freed bucket memory is reclaimed. The dangling pointer is redirected to crafted `zend_fcall_info` and `zend_internal_function` structures.
4. **Execution:** PHP calls `zend_call_function()`, resulting in arbitrary system command execution.

#### Verification & Targets
- Confirmed on standard `php-src` builds (including versions 8.4.4 and 8.2.34).
- Uses symbol offsets (`--syms`) between `zval_ptr_dtor` and `zend_call_function` to adapt to distribution-specific binary layouts (e.g., Debian Bookworm, Ubuntu Noble, Ubuntu Jammy).

---

### Affected PHP Versions

The following table summarizes the PHP versions affected by **CVE-2026-109618** and **CVE-2026-109619**, along with their support and patch statuses:

| PHP Branch | Status | Affected Versions | Fixed / Secure Version | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **PHP 8.5** | Supported (Active) | < 8.5.12 | **8.5.12** | Emergency security release published |
| **PHP 8.4** | Supported (Active) | < 8.4.27 | **8.4.27** | Emergency security release published |
| **PHP 8.3** | Supported (Active) | < 8.3.36 | **8.3.36** | Emergency security release published |
| **PHP 8.2** | Supported (Security Only) | < 8.2.35 | **8.2.35** | Emergency security release published |
| **PHP 8.1** | End of Life (EOL) | All 8.1.x versions | No Official Patch (EOL) | Set `session.upload_progress.enabled = Off` or use ELS/distro backports |
| **PHP 8.0** | End of Life (EOL) | All 8.0.x versions | No Official Patch (EOL) | Official support ended; configuration mitigation is mandatory |
| **PHP 7.x** | End of Life (EOL) | All 7.0 - 7.4 versions | No Official Patch (EOL) | Core `ext/session` logic vulnerable; urgent mitigation or upgrade required |
| **PHP 5.x** | End of Life (EOL) | 5.4.0+ (with RFC1867 progress tracking) | No Official Patch (EOL) | Official support ended; isolate host or disable upload progress |

> [!WARNING]
> PHP 8.1 and older End-of-Life (EOL) versions **do not receive** official security patches from the PHP Foundation. For these environments, immediately apply [`session.upload_progress.enabled = Off`](#1-configuration-mitigation-immediate-stopgap) or rebuild PHP from source using the provided C source patch.

---

### Threat Landscape & Detection Guidance

Exploitation of `php2shell` typically manifests as anomalous child processes spawned directly by PHP worker processes (`php-fpm`, `php-cgi`, `php-cgi.exe`, `httpd`, `apache2`).

#### Behavioral Indicators & Suspicious Child Processes
Monitor and alert on PHP worker processes executing:
- **Interactive Shells:** `/bin/sh`, `/bin/bash`, `cmd.exe`, `powershell.exe`
- **Script Interpreters:** `python`, `perl`
- **Network / Transfer Utilities:** `curl`, `wget`, `nc`, `certutil.exe`
- **Common Reverse Shell Patterns:** `/dev/tcp/`, `fsockopen`, `mkfifo`
- **Immediate Reconnaissance Commands:** `whoami`, `id`, `uname -a`, `ipconfig`

#### Monitoring Recommendation
For Linux-based web environments without an endpoint detection agent, tools like Florian Roth's free [process-watcher](https://github.com/Neo23x0/process-watcher) can be run in observe mode to flag unusual child process spawning in real time.

---

### Action Items for Organizations

1. **Inventory All PHP Environments:**
   - Public-facing web servers running applications like WordPress, Drupal, Joomla, or Magento.
   - Internal appliances, hosting panels (cPanel, Plesk), and bundled standalone binaries (`php.exe`, `php-cgi.exe`).
2. **Prepare for Patch Windows:**
   - Official emergency patches from PHP and downstream Linux distributions are scheduled for release around **Wednesday, October 21 at 14:00 UTC (10:00 AM ET)**.
   - Apply vendor updates immediately once released.
3. **Isolate End-of-Life (EOL) Installations:**
   - Environments running unsupported versions (PHP 5.x, 7.x, 8.0, 8.1) may not receive official upstream backports.
   - Restrict access via VPN, apply strict WAF rules, or disable public internet exposure.
4. **Incident Response & Investigation:**
   - If suspicious child processes or unexpected files are detected, isolate the host and preserve web server/PHP logs.
   - Inspect web roots and temporary directories (`/tmp`, `/var/tmp`) for dropped webshells or transient execution artifacts.

---

### Proof of Concept (PoC)

A fully automated one-click remote exploit targeting **CVE-2026-109618** is available in [`poc_109618.py`](poc_109618.py). The exploit bypasses ASLR remotely using plain HTTP requests to achieve reliable arbitrary command execution.

#### Exploit Architecture & Stages

The attack chain consists of four sequential stages over HTTP:

1. **Stage 0 — HTTP Worker Rotation:** Aborts the current prefork worker over HTTP to ensure a clean heap state in the newly spawned worker child.
2. **Stage 1 — Heap Base Leak:** Induces an out-of-memory (OOM) condition via an oversized multipart field (`--huge-mb`, default `12MB`) to trigger uninitialized memory leakage through `Set-Cookie: PHPSESSID`, extracting the Zend MM 2MB-aligned chunk base.
3. **Stage 2 — Libphp Base Leak:** Exploits session serialization / HashTable allocation alignment to leak the `ZVAL_PTR_DTOR` function pointer via `Set-Cookie`, computing the base address of `libphp.so`.
4. **Stage 3 — Fake Reference & Arbitrary Execution:** Forges a fake `HashTable` structure embedded inside a 167-byte `zend_string` with `pDestructor` pointed directly to `zif_system` in `libphp.so`. The crafted reference overwrites `PS(http_session_vars)`. When PHP frees the session data, `zif_system` executes the supplied command.

> [!NOTE]
> The command is embedded directly inside a 167-byte live `zend_string` carrier (0x98 header + NUL byte limit), restricting inline command strings to **maximum 14 bytes** (`MAX_CMD = 14`). For longer commands, chain through a short trigger such as `sh</tmp/c` (8 bytes) or `sh</out/c`.

#### Target Requirements

The default exploit profile targets mod_php under Apache prefork with the following settings:
- `display_errors = 1`
- `memory_limit = 8M` (or sufficiently lower than `--huge-mb`)
- `max_input_vars = 1000`
- `session.use_cookies = 1`, `session.use_strict_mode = 0`
- `session.upload_progress.enabled = 1`
- Single-worker / prefork process model

#### Usage & Parameters

##### Basic Execution
```bash
# Default command execution against target URL
python3 poc_109618.py -u http://127.0.0.1:8088/index.php

# Execute a custom command (max 14 bytes) and verify via local proof file
python3 poc_109618.py -u http://127.0.0.1:8088/index.php -c 'id>/out/p1' --proof-file out/p1

# Execute command writing to webroot and verify via HTTP GET fetch
python3 poc_109618.py -u http://127.0.0.1:8088/index.php -c 'id>p1.txt' --fetch /p1.txt
```

##### Command-Line Options
| Option | Description | Default |
| :--- | :--- | :--- |
| `-u`, `--url` | **(Required)** Target PHP endpoint URL | `None` |
| `-c`, `--cmd` | Command to execute (maximum 14 bytes) | `id>/out/p1` |
| `--proof-file` | Path to local proof file to check post-exploitation; `''` disables | `out/p1` |
| `--fetch` | Relative HTTP path to `GET` after exploitation (e.g. if writing to webroot) | `""` |
| `--profile` | Target build profile: `bookworm` (official `php:8.4.26-apache`) or `lab` (Apache 2.4.68) | `bookworm` |
| `--zif-offset` | Offset of `zif_system` in `libphp.so` (hex format e.g. `0x43a870`) | Loaded from offsets file |
| `--dtor-offset` | Offset of `ZVAL_PTR_DTOR` in `libphp.so` (hex format e.g. `0x613c50`) | Loaded from offsets file |
| `--htdata-offset` | Chunk-relative offset of the 167-byte live string carrier | Profile dependent (`0x690d8` or `0x6e0d8`) |
| `--offsets-file` | Path to load/store derived `libphp` offsets | `out/offsets.env` |
| `--docker-container`| Docker container name to automatically derive offsets on localhost | `php2shell-target` |
| `--no-auto-offsets` | Disable automatic offset extraction via Docker helper | `False` |
| `--huge-mb` | Size in MB of the OOM payload; must exceed target `memory_limit` | `12` |
| `--timeout` | Per-request network socket timeout in seconds | `30.0` |
| `--retries` | Number of attempts per leak stage (stage 3 runs `retries + 2`) | `3` |
| `--no-pre-rotate` | Skip the initial worker rotation (Stage 0) | `False` |
| `--no-retry-rotate` | Do not rotate workers between failed stage attempts | `False` |
| `-q`, `--quiet` | Suppress verbose output logging | `False` |

#### Profiles & Offsets

The exploit script supports profile-based presets:
- **`--profile bookworm` (Default):** Calibrated for the official Docker library image `php:8.4.26-apache` running on Debian 12 (Bookworm) with Apache 2.4.69.
- **`--profile lab`:** Calibrated for custom/minimal Apache 2.4.68 builds.

When targeting local Docker containers (`127.0.0.1` / `localhost`), the script can automatically extract binary symbol offsets directly from the running container using `docker/offsets.py` and cache them in `out/offsets.env`. For remote targets where binary layout differs from Debian 12, provide `--zif-offset` and `--dtor-offset` manually.

---

### Mitigation & Source Patching

Until official vendor packages are updated in your repositories, you can protect your environments using configuration changes, automated scripts, or by compiling PHP with the included source patch.

#### 1. Configuration Mitigation (Immediate Stopgap)
The vulnerability relies on PHP's session upload progress mechanism (`session.upload_progress.enabled`), which is enabled by default. Disabling this directive neutralizes the attack vector while preserving regular file upload functionality:

In your `php.ini`:
```ini
session.upload_progress.enabled = Off
```

Or for PHP-FPM pool configurations (e.g., `/etc/php/*/fpm/pool.d/www.conf`):
```ini
php_admin_flag[session.upload_progress.enabled] = off
```

After modifying the configuration, reload/restart your web services (e.g. `systemctl reload php-fpm` or `systemctl reload apache2`).

#### 2. Automated Quick-Fix Script
A mitigation helper script is available under the [`quick-fix/`](quick-fix/) directory:

- **Check Current Status:**
  ```bash
  sudo ./quick-fix/run.sh --check
  ```
- **Apply Mitigation (Dry Run):**
  ```bash
  sudo ./quick-fix/run.sh --dry-run
  ```
- **Apply Mitigation:**
  ```bash
  sudo ./quick-fix/run.sh
  ```
- **Revert Changes:**
  ```bash
  sudo ./quick-fix/run.sh --revert
  ```

#### 3. Source Code Patch (`session-upload-progress-counters.patch`)
If you build PHP from source or maintain custom distribution packages, a C-level source patch is provided under [`patch/session-upload-progress-counters.patch`](patch/session-upload-progress-counters.patch).

**What the patch fixes:**
The patch resolves the root cause in `ext/session/session.c` and `ext/session/php_session.h`. Instead of maintaining vulnerable, raw `zval *` bucket pointers (`post_bytes_processed` and `current_file_bytes_processed`) into dynamic `HashTable` structures (which become dangling pointers when the hash table is cleared or re-allocated during upload progress updates), the patch:
- Stores counters as direct `zend_long` primitives.
- Introduces `php_session_rfc1867_sync_counters()` to safely resolve and update array entries without dangling references.

**How to Apply the Patch:**

1. Navigate to the root of your `php-src` source directory:
   ```bash
   cd /path/to/php-src
   ```

2. Test applying the patch (dry-run):
   ```bash
   # Using git (if building from a git clone)
   git apply --check /path/to/patch/session-upload-progress-counters.patch

   # OR using GNU patch
   patch -p1 --dry-run < /path/to/patch/session-upload-progress-counters.patch
   ```

3. Apply the patch:
   ```bash
   # Using git
   git apply /path/to/patch/session-upload-progress-counters.patch

   # OR using GNU patch
   patch -p1 < /path/to/patch/session-upload-progress-counters.patch
   ```

4. Recompile and install PHP:
   ```bash
   ./buildconf --force   # if needed
   ./configure <your-options>
   make -j"$(nproc)"
   sudo make install
   ```

5. Restart your PHP runtime / web services:
   ```bash
   sudo systemctl restart php-fpm
   # or
   sudo systemctl restart apache2
   ```

##### Community Backports for EOL Versions (PHP 5.6, 7.4, 8.0, 8.1)

For legacy systems that cannot immediately upgrade to supported PHP 8.2+ releases (e.g. legacy OpenCart, WordPress, or control panels running on PHP 5.6, 7.4, 8.0, or 8.1), dedicated backports combining the official PHP Group OOM fix with the root-cause counter sync are available:
- 👉 **Repository:** [Anton-Barinov/php2shell-patches](https://github.com/Anton-Barinov/php2shell-patches)
- Includes automated build scripts to compile isolated, side-by-side runtimes into `/opt/php-<ver>-patched` without overwriting system packages, plus multi-PHP FPM pool hardening tools.

#### 4. Cloudflare WAF Custom Rules
Recommended Cloudflare WAF rule templates to filter malicious traffic are located in the [`cloudflare-rule-fix/`](cloudflare-rule-fix/) directory:
- **Comprehensive multipart blocking (excluding legitimate upload routes)**
- **Enterprise plan `PHP_SESSION_UPLOAD_PROGRESS` request body inspection**
- *Note: Blocking requests based solely on the `PHPSESSID` cookie is strongly discouraged as it breaks valid user sessions.* Refer to [cloudflare-rule-fix/README.md](cloudflare-rule-fix/README.md) for full rule syntax and details.

#### 5. FrankenPHP Caddyfile Configuration
To disable the session upload progress mechanism globally in FrankenPHP environments, a Caddyfile snippet is provided.

Add the contents of [`frankenphp/Caddyfile-snippet`](frankenphp/Caddyfile-snippet) to your global Caddyfile block:
```caddyfile
{
    frankenphp {
        php_ini session.upload_progress.enabled 0
    }
}
```

#### 6. Lighttpd Configuration
For environments running Lighttpd, you can block multipart requests (`POST`, `PUT`, `PATCH`) on virtual hosts or directories that do not accept file uploads using [`lighttpd/php2shell.conf`](lighttpd/php2shell.conf):

```lighttpd
$HTTP["request-method"] =~ "^(POST|PUT|PATCH)$" {
    $REQUEST_HEADER["Content-Type"] =~ "(?i)^\s*multipart/form-data([;,[:space:]]|$)" {
        url.access-deny = ( "" )
    }
}
```

#### 7. Apache Mitigation (ModSecurity & .htaccess)
Two mitigation options are provided for Apache environments:

- **ModSecurity Rule:** Block requests containing the `PHP_SESSION_UPLOAD_PROGRESS` parameter using [`apache/modsecurity-php2shell.conf`](apache/modsecurity-php2shell.conf):
  ```apache
  SecRequestBodyAccess On
  SecRule ARGS_NAMES "@streq PHP_SESSION_UPLOAD_PROGRESS" \
      "id:1026109618,phase:2,t:none,deny,status:403,log,\
      msg:'php2shell: PHP_SESSION_UPLOAD_PROGRESS field blocked (CVE-2026-109618/109619)'"
  ```

- **`.htaccess` / mod_rewrite Rule:** For directories that do not require file uploads, block multipart requests before they reach the PHP interpreter using [`apache/.htaccess`](apache/.htaccess):
  ```apache
  RewriteEngine On
  RewriteCond %{REQUEST_METHOD} ^(POST|PUT|PATCH)$ [NC]
  RewriteCond %{HTTP:Content-Type} ^[[:space:]]*multipart/form-data([;,[:space:]]|$) [NC]
  RewriteRule ^ - [F,L]
  ```

---

### Disclaimer

This project is intended strictly for educational purposes and authorized security research. Use only in environments you own or have explicit permission to test.

---

### Author & Contact

- **Website:** [https://enes.dev](https://enes.dev)
- **Twitter / X:** [@enes_dev](https://x.com/enes_dev)

