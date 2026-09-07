# Contributing to Soroban AgentKit

Thank you for your interest in contributing to **Soroban AgentKit**! This project is an open-source AI Agent framework for the Stellar and Soroban ecosystem, designed to empower autonomous agents to seamlessly interact with smart contracts and payments.

## 🚀 Quickstart for Contributors

### 1. Prerequisites
- Node.js `v20.x` or `v22.x`
- npm `v10.x`+

### 2. Setup
```bash
git clone https://github.com/Ranjeet2063/soroban-agentkit.git
cd soroban-agentkit
npm install
```

### 3. Verification & Testing
Before submitting a pull request, ensure all validations pass cleanly:
```bash
# Typecheck
npm run typecheck

# Build TypeScript
npm run build

# Run unit tests
npm test
```

## 📋 Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names:
   - `feat/feature-name`
   - `fix/issue-description`
   - `docs/documentation-update`
2. **Issue Linking**: Always link the associated issue in your PR description (e.g. `Closes #1`).
3. **Zero Breaking Changes**: Ensure existing unit tests remain 100% green and add new tests covering your additions.
4. **Clean Commits**: Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`).

## 🦊 GrantFox & Bounty Submissions
If you are contributing as part of a GrantFox campaign:
- Ensure you have proposed your approach on the associated GrantFox issue before submitting a PR.
- PRs that pass automated CI checks and fulfill acceptance criteria will be promptly reviewed and merged by the maintainers.

## 📄 License
By contributing to Soroban AgentKit, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).
