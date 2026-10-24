# 🛡️ Security Policy

## Supported Versions

Only the latest release of `soroban-agentkit` is actively supported with security patches and critical bug fixes.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take the security of `soroban-agentkit` and on-chain user funds seriously. If you discover a potential security vulnerability or private key leakage risk, please report it privately.

**Please DO NOT create a public GitHub issue for security vulnerabilities.**

### Disclosure Process

1. Email the core maintainer directly at [guptakumarranjeet150@gmail.com](mailto:guptakumarranjeet150@gmail.com) with the subject line `[SECURITY] Vulnerability Report - soroban-agentkit`.
2. Include detailed reproduction steps, proof-of-concept (PoC) code, and impact analysis.
3. You will receive an acknowledgment within 24 hours.
4. Once verified, a security patch will be prepared and published under an expedited release.

## Security Best Practices for AI Agents

- **Never Hardcode Secrets**: Always supply private keys via environment variables or hardware key vaults.
- **Enforce Transaction Caps**: Configure maximum spend limits on agent keypairs.
- **Simulation Validation**: Always utilize Soroban simulation RPC dry-runs before submitting state-modifying smart contract calls.
