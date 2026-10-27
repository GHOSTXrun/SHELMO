# NODUVI

The [unified NODUVI page](index.html) contains the source explorer, a rotatable computer-and-cartridge architecture model, the complete whitepaper and an expandable task workbench. The whitepaper appendix preserves the complete original architecture note. Use the reading panel's Print / Save PDF button for an offline copy. The old source and whitepaper URLs redirect to their sections on this page.

A local-first work computer: choose a cartridge, define a task and its permissions, run it, and review a downloadable deliverable. Open the workbench section on the same page to run tasks. The component library, wallet and chain settings remain available inside the embedded system.

## Start the workspace

Requires Node.js 22.16 or newer. No dependency installation is needed for the workspace or its local server.

```sh
npm start
```

Open `http://127.0.0.1:4173`. On Windows, double-click `START-NODUVI.cmd` as an alternative. The server binds only to the local computer. It is a personal workspace, not an authenticated multi-user hosted service.

## Working cartridges

| Cartridge | Execution | Deliverable |
| --- | --- | --- |
| Project Radar | Reads up to five public HTTPS pages; compares text hashes with successful saved baselines | Dated brief, source links, current and previous excerpts |
| Content Studio | Formats verified source notes into a release draft, a short excerpt and a review checklist | Markdown content draft |
| Site Watch | Reads source pages and checks up to three same-origin links per page | HTTP status and sampled link report |

Tasks expose progress logs, cancellation, error states, history, reuse, report preview, Markdown download and deletion. Local tool execution costs $0. Reports distinguish fetched evidence from supplied notes. A fully failed source collection produces a failed task rather than a fabricated report. Pages are fetched as HTML/text; JavaScript rendering and authenticated pages are not supported.

In static browser-only hosting, Studio works and saves tasks in this browser. Radar and Watch require the Node service. Browser and server histories are kept separate and displayed together while connected. Task deletion removes its notes and report; Radar comparison baselines remain in `.noduvi/data.json`. Delete that private local directory while the server is stopped to reset all server history and baselines. No background schedule runs when the server is stopped.

## Optional AI assistance

The default workflows use local rules and public page tools, not a language model. For AI-assisted analysis and writing, copy `.env.example` to `.env`, set a server-side Anthropic API key, an available model identifier, and the current input/output USD-per-million-token rates for your billing tier. Restart the server. Never commit the filled `.env` file; it is ignored and blocked by the static server.

When configured, the workbench enables an explicit consent checkbox for sending task notes and collected excerpts to the provider. Each AI request requires a positive request budget. The server counts tokens first, reserves input headroom, and bounds output tokens before generation; it does not automatically retry paid calls. Displayed costs are estimates calculated from configured rates, and provider billing is authoritative. Token counts can differ from final usage, and cancelling an in-flight request may still incur provider charges. Keep provider account spending limits enabled. No AI request is made for the default $0 mode.

The adapter uses the official [Messages API](https://platform.claude.com/docs/en/api/messages) and [token counting API](https://platform.claude.com/docs/en/build-with-claude/token-counting). No live provider verification is possible without your own configured credentials.

## Validation

```sh
npm test
```

Tests cover network permission and budgets, private address rejection, snapshot changes, failed sources, bounded link checks, cancellation, Studio output, model preflight and usage, and the HTTP task/persistence/download/delete flow. Tests mock provider calls and public pages; they incur no model charges.

## Runtime and protocol source

The existing runtime and Solana reference implementation retain their original `shellwork` protocol identifiers for compatibility. The workspace is an extension of the same project. Chain settlement requires a separately deployed compatible program and actual listings; no production program deployment or transaction is implied by the UI.

### Original runtime documentation

Shellwork is a local-first component runtime with a Solana program for publishing code hashes, listing software licenses, receiving SOL payments, and recording access expiry.

## Project layout

- `repository-files/programs/shellwork/src/lib.rs`: Solana program written with Anchor
- `repository-files/src/`: JavaScript client, license checks, artifact verification and WebAssembly runtime
- `repository-files/app/`: browser system source
- `system/`: generated browser application

## Run locally

Requires Node.js 22 or newer. From `repository-files/`:

```sh
npm ci
npm run verify
npm run demo
```

Serve the repository root over HTTP and open `/system/`. The browser starts in Local Demo mode. In Chain Settings, choose Solana Devnet or Mainnet and enter a deployed Shellwork Program ID to enable onchain purchases. Catalog entries in Local Demo are samples; real purchases require matching published components and listings on the chosen network.

## Build the Solana program

Install Rust, Solana CLI and Anchor 0.32.1 in a Linux, macOS or WSL environment. From `repository-files/` run `anchor build` and `anchor test`. The program ID in `Anchor.toml`, `programs/shellwork/src/lib.rs` and the JavaScript default must match the generated deployment keypair. Keep deployment keys in the ignored `repository-files/target/` directory.

The program uses program-derived accounts for configuration, components, listings and licenses. Paid listings use lamports; purchase renews a time-limited license and transfers SOL to the publisher and protocol treasury in one transaction. The local runtime verifies component bytes and declared permissions before running WebAssembly.

## Status

This is a reference implementation. Audit the onchain program and runtime before handling real-value payments.

[MIT License](LICENSE)
