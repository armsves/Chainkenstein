# Civic Auth + MiniKit Template

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain --mini`](), configured with:

- [Civic Auth](https://auth.civic.com) - Web3 authentication and identity management
- [MiniKit](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit](https://www.base.org/builders/onchainkit)
- [Tailwind CSS](https://tailwindcss.com)
- [Next.js](https://nextjs.org/docs)

## Civic Auth Web3 Integration

This template has been enhanced to use Civic Auth Web3 instead of traditional wallet connection. Users can now sign in with their Civic identity and access Web3 capabilities, providing a seamless authentication experience with embedded wallet functionality.

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. Set up your environment variables:

First, you'll need to get your Civic Auth Client ID:
1. Go to [https://auth.civic.com](https://auth.civic.com) and sign up
2. Create a new application
3. Copy your Client ID

Then, create a `.env.local` file in your project root with the following variables:

```bash
# Civic Auth Configuration
NEXT_PUBLIC_CIVIC_CLIENT_ID=your_civic_client_id_here

# Shared/OnchainKit variables (set up by `npx create-onchain --mini`)
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_URL=
NEXT_PUBLIC_ICON_URL=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Frame metadata
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
NEXT_PUBLIC_APP_ICON=
NEXT_PUBLIC_APP_SUBTITLE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_APP_SPLASH_IMAGE=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=
NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

# Redis config
REDIS_URL=
REDIS_TOKEN=
```

3. Start the development server:
```bash
npm run dev
```

## Template Features

### Frame Configuration
- `.well-known/farcaster.json` endpoint configured for Frame metadata and account association
- Frame metadata automatically added to page headers in `layout.tsx`

### Background Notifications
- Redis-backed notification system using Upstash
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`

### Theming
- Custom theme defined in `theme.css` with OnchainKit variables
- Pixel font integration with Pixelify Sans
- Dark/light mode support through OnchainKit

### Civic Auth Web3 Provider
The app is wrapped with `CivicAuthProvider` from `@civic/auth-web3/react` in `providers.tsx`, which provides:
- User authentication and identity management
- Seamless sign-in/sign-out functionality
- User profile information access
- Web3 capabilities and embedded wallet functionality
- Integration with Civic's identity infrastructure

### MiniKit Provider
The app is also wrapped with `MiniKitProvider` in `providers.tsx`, configured with:
- OnchainKit integration
- Access to Frames context
- Sets up Wagmi Connectors
- Sets up Frame SDK listeners
- Applies Safe Area Insets

## Customization

To get started building your own frame, follow these steps:

1. Remove the DemoComponents:
   - Delete `components/DemoComponents.tsx`
   - Remove demo-related imports from `page.tsx`

2. Start building your Frame:
   - Modify `page.tsx` to create your Frame UI
   - Update theme variables in `theme.css`
   - Adjust MiniKit configuration in `providers.tsx`

3. Add your frame to your account:
   - Cast your frame to see it in action
   - Share your frame with others to start building your community

## Key Changes Made

This template has been modified to integrate Civic Auth Web3:

1. **Replaced Wallet Connection**: The traditional `ConnectWallet` button has been replaced with Civic Auth Web3's `UserButton`
2. **Updated User Context**: Components now use `useUser()` from `@civic/auth-web3/react` instead of `useAccount()` from wagmi
3. **Provider Setup**: Added `CivicAuthProvider` from `@civic/auth-web3/react` wrapper around the existing `MiniKitProvider`
4. **Web3 Integration**: Added `initialChain={base}` configuration for Web3 capabilities
5. **Transaction Logic**: Updated transaction components to work with Civic Auth Web3 user context
6. **Dependencies**: Installed `@civic/auth-web3` and `@solana/wallet-adapter-react` for full Web3 support

## Learn More

- [Civic Auth Documentation](https://docs.civic.com/auth)
- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
