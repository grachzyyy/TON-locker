# locker

## Project structure

- `src/main.tact` – source code of contract
- `src/main.spec.ts` – test suite
- `deploy.ts` – script for deploying the contract
- `tact.config.json` – compiler settings

## How to use

- `yarn build` – build `.ts` API for contract
- `yarn test` – build contracts and run jest tests
- `yarn fmt` – fix source code formatting
- `yarn lint` – run semantic checks with `misti` linter
- `yarn verifier:testnet` – deploy contract to testnet
- `yarn verifier:mainnet` – deploy contract to mainnet
- `yarn fmt:check` – check source code formatting (for CI)
