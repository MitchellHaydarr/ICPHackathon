# Atlas ICP Project

A decentralized application built on the Internet Computer Protocol that monitors Bitcoin prices and simulates trading actions using AI.

## Features

- **Bitcoin Price Monitoring**: Real-time monitoring of Bitcoin prices with configurable thresholds
- **AI-Driven Trading Simulation**: Simulates trading actions based on price movements
- **Portfolio Management**: Track ICP investments and balance changes
- **Secure Bitcoin Integration**: Uses Internet Computer's threshold ECDSA for Bitcoin transactions
- **Modern React UI**: Built with React, Tailwind CSS, and TypeScript

## Backend Canisters

- **AI Canister (Rust)**: Handles Bitcoin price monitoring, threshold settings, and mock Bitcoin transactions
- **Store Canister (Motoko)**: Manages portfolio balances, deposits, and withdrawals

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [DFX](https://sdk.dfinity.org/docs/quickstart/local-quickstart.html) (v0.12.0 or later)
- [Rust](https://www.rust-lang.org/tools/install) with wasm32-unknown-unknown target

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd atlas
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start a local Internet Computer replica:
   ```
   dfx start --background
   ```

4. Deploy the canisters:
   ```
   dfx deploy
   ```

### Development

- Start the frontend development server:
  ```
  npm run dev
  ```

- Run tests:
  ```
  dfx test
  ```

## Project Structure

```
atlas/
├── src/
│   ├── ai_canister/         # Rust AI canister code
│   └── store_canister/      # Motoko store canister code
├── frontend/
│   ├── src/
│   │   ├── api/             # API handlers for canister interactions
│   │   ├── components/      # React components
│   │   └── declarations/    # Generated canister interfaces
│   ├── assets/              # Static assets
│   └── package.json         # Frontend dependencies
└── dfx.json                 # DFX configuration
```

## License

MIT
