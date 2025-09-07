# Civic Auth + MiniKit Template

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain --mini`](), configured with:

- [Civic Auth](https://auth.civic.com) - Web3 authentication and identity management
- [MiniKit](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit](https://www.base.org/builders/onchainkit)
- [Tailwind CSS](https://tailwindcss.com)
- [Next.js](https://nextjs.org/docs)
- [Hardhat](https://hardhat.org) - Ethereum development environment
- [ZetaChain](https://www.zetachain.com) - Cross-chain functionality

## Project Overview

This project implements a cross-chain prediction market platform with automated liquidity management. It features:

- **Civic Auth Integration**: Web3 authentication without traditional wallet connection complexity
- **Cross-Chain Markets**: Prediction markets deployed on both Base Sepolia and ZetaChain
- **Automated Market Making**: DragonSwapManager for liquidity management
- **Identity Verification**: CivicGate contract for proof verification
- **USDC Integration**: Native USDC support for market transactions

## Smart Contracts

### Core Contracts

- **[Market.sol](contracts/Market.sol)**: Prediction market implementation with YES/NO shares
- **[DragonSwapManager.sol](contracts/DragonSwapManager.sol)**: Automated market maker and liquidity manager
- **[CivicGate.sol](contracts/CivicGate.sol)**: Identity verification contract for Civic Auth integration

### Contract Addresses

The deployed contract addresses are saved in the [deployments/](deployments/) directory after each deployment.

## Civic Auth Web3 Integration

This template has been enhanced to use Civic Auth Web3 instead of traditional wallet connection. Users can now sign in with their Civic identity and access Web3 capabilities, providing a seamless authentication experience with embedded wallet functionality.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- [Civic Auth Account](https://auth.civic.com)
- [OnchainKit API Key](https://onchainkit.xyz)

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up your environment variables:

First, get your Civic Auth Client ID:
1. Go to [https://auth.civic.com](https://auth.civic.com) and sign up
2. Create a new application
3. Copy your Client ID

Then, create a `.env.local` file based on [env.example](env.example):

```bash
# Civic Auth Configuration
NEXT_PUBLIC_CIVIC_CLIENT_ID=your_civic_client_id_here

# Shared/OnchainKit variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=chainkestein
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_ICON_URL=http://localhost:3000/logo.png
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here

# Frame metadata
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
NEXT_PUBLIC_APP_ICON=http://localhost:3000/icon.png
NEXT_PUBLIC_APP_SUBTITLE=Cross-chain prediction markets
NEXT_PUBLIC_APP_DESCRIPTION=Decentralized prediction markets with Civic Auth
NEXT_PUBLIC_APP_SPLASH_IMAGE=http://localhost:3000/splash.png
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=#000000
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=defi
NEXT_PUBLIC_APP_HERO_IMAGE=http://localhost:3000/hero.png
NEXT_PUBLIC_APP_TAGLINE=Predict the future with Civic Auth
NEXT_PUBLIC_APP_OG_TITLE=Chainkestein
NEXT_PUBLIC_APP_OG_DESCRIPTION=Cross-chain prediction markets with automated liquidity
NEXT_PUBLIC_APP_OG_IMAGE=http://localhost:3000/hero.png

# Redis config (optional - for notifications)
REDIS_URL=
REDIS_TOKEN=

# Smart Contract Deployment
PRIVATE_KEY=your_private_key_here
CHAIN_ID=60138453033
RPC_URL=https://ethwarsaw.holesky.golemdb.io/rpc
WS_URL=wss://ethwarsaw.holesky.golemdb.io/rpc/ws
```

3. Start the development server:
```bash
npm run dev
```

## Smart Contract Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile smart contracts with Hardhat |
| `npm run deploy` | Deploy contracts to configured network |
| `npm run test` | Run smart contract tests |

### Deployment

#### 1. Deploy to Base Sepolia

```bash
# Compile contracts first
npm run compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

#### 2. Deploy to ZetaChain Testnet

```bash
# Deploy to ZetaChain
npx hardhat run scripts/deploy.js --network zetaTestnet
```

#### 3. Check and Fix Deployment Issues

If you encounter deployment issues, use the check and fix script:

```bash
npx hardhat run scripts/check-and-fix.js --network baseSepolia
```

#### 4. Deploy Additional Markets

To deploy a third market:

```bash
npx hardhat run scripts/deploy-third-market.js --network baseSepolia
```

#### 5. Complete Deployment Setup

To finalize deployment with all market registrations:

```bash
npx hardhat run scripts/complete-deployment.js --network baseSepolia
```

### Contract Verification

#### Verify on Base Sepolia (Etherscan)

```bash
npx hardhat run scripts/verify-all.js --network baseSepolia
```

#### Verify on ZetaChain (Blockscout)

```bash
npx hardhat run scripts/verify-zetachain.js --network zetaTestnet
```

### Network Configuration

The project is configured for multiple networks in [hardhat.config.js](hardhat.config.js):

- **Base Sepolia**: Primary deployment network
- **ZetaChain Testnet**: Cross-chain functionality
- **Golem Holesky**: Custom testnet configuration

### Contract Interaction

The frontend interacts with contracts through:

- **[useZetaChainContracts.ts](app/hooks/useZetaChainContracts.ts)**: React hooks for contract interaction
- **[contracts.ts](src/lib/contracts.ts)**: Contract utilities and helpers

## Template Features

### Frame Configuration
- `.well-known/farcaster.json` endpoint configured for Frame metadata and account association
- Frame metadata automatically added to page headers in [layout.tsx](app/layout.tsx)

### Background Notifications
- Redis-backed notification system using Upstash
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`

### Theming
- Custom theme defined in [theme.css](app/theme.css) with OnchainKit variables
- Pixel font integration with Pixelify Sans
- Dark/light mode support through OnchainKit

### Civic Auth Web3 Provider
The app is wrapped with `CivicAuthProvider` from `@civic/auth-web3/react` in [providers.tsx](app/providers.tsx), which provides:
- User authentication and identity management
- Seamless sign-in/sign-out functionality
- User profile information access
- Web3 capabilities and embedded wallet functionality
- Integration with Civic's identity infrastructure

### MiniKit Provider
The app is also wrapped with `MiniKitProvider` in [providers.tsx](app/providers.tsx), configured with:
- OnchainKit integration
- Access to Frames context
- Sets up Wagmi Connectors
- Sets up Frame SDK listeners
- Applies Safe Area Insets

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── hooks/             # React hooks for contract interaction
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main page component
│   └── providers.tsx      # Auth and Web3 providers
├── contracts/             # Smart contracts
│   ├── CivicGate.sol     # Identity verification
│   ├── Market.sol        # Prediction market logic
│   └── DragonSwapManager.sol # Liquidity management
├── scripts/              # Deployment and utility scripts
│   ├── deploy.js         # Main deployment script
│   ├── verify-all.js     # Contract verification
│   ├── check-and-fix.js  # Deployment troubleshooting
│   └── *.js              # Additional utility scripts
├── deployments/          # Deployment artifacts
├── artifacts/            # Compiled contract artifacts
├── src/lib/              # Frontend utilities
└── config/               # Configuration files
```

## Customization

To get started building your own frame:

1. **Remove Demo Components**:
   - Delete `components/DemoComponents.tsx`
   - Remove demo-related imports from `page.tsx`

2. **Modify Smart Contracts**:
   - Update contract logic in `contracts/`
   - Add new contracts as needed
   - Update deployment scripts

3. **Build Your Frame**:
   - Modify `page.tsx` to create your Frame UI
   - Update theme variables in `theme.css`
   - Adjust MiniKit configuration in `providers.tsx`

4. **Deploy and Verify**:
   - Use deployment scripts to deploy your contracts
   - Verify contracts on block explorers
   - Update frontend contract addresses

## Troubleshooting

### Common Issues

1. **Deployment Failures**: Use `scripts/check-and-fix.js` to diagnose and fix common deployment issues
2. **Market Registration**: Ensure DragonSwapManager is properly authorized before registering markets
3. **USDC Approval**: Check USDC allowances before market transactions
4. **Network Configuration**: Verify RPC URLs and chain IDs in your `.env.local`

### Useful Commands

```bash
# Check contract compilation
npm run compile

# Run tests
npm run test

# Check deployment status
npx hardhat run scripts/check-and-fix.js --network baseSepolia

# View deployment artifacts
ls -la deployments/

# Check contract verification status
npx hardhat verify --network baseSepolia <contract_address> <constructor_args>
```

## Key Changes Made

This template has been modified to integrate Civic Auth Web3:

1. **Replaced Wallet Connection**: Traditional `ConnectWallet` button replaced with Civic Auth Web3's `UserButton`
2. **Updated User Context**: Components use `useUser()` from `@civic/auth-web3/react` instead of `useAccount()` from wagmi
3. **Provider Setup**: Added `CivicAuthProvider` wrapper around `MiniKitProvider`
4. **Web3 Integration**: Added `initialChain={base}` configuration for Web3 capabilities
5. **Transaction Logic**: Updated transaction components for Civic Auth Web3 user context
6. **Smart Contract Integration**: Added comprehensive contract deployment and interaction system

## Learn More

- [Civic Auth Documentation](https://docs.civic.com/auth)
- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ZetaChain Documentation](https://docs.zetachain.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
