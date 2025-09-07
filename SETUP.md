# Setup Guide for Civic Auth Integration

## Prerequisites

1. **Civic Auth Account**: Sign up at [https://auth.civic.com](https://auth.civic.com)
2. **OnchainKit API Key**: Get your API key from [OnchainKit](https://onchainkit.xyz)

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```bash
# Civic Auth Configuration
NEXT_PUBLIC_CIVIC_CLIENT_ID=your_civic_client_id_here

# OnchainKit Configuration
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=your_project_name_here
NEXT_PUBLIC_ICON_URL=your_icon_url_here
NEXT_PUBLIC_URL=your_app_url_here

# Frame metadata
NEXT_PUBLIC_APP_HERO_IMAGE=your_hero_image_url_here
NEXT_PUBLIC_SPLASH_IMAGE=your_splash_image_url_here
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=your_splash_background_color_here

# Redis config (optional - for notifications)
REDIS_URL=your_redis_url_here
REDIS_TOKEN=your_redis_token_here
```

## Getting Your Civic Client ID

1. Go to [https://auth.civic.com](https://auth.civic.com)
2. Sign up or log in to your account
3. Create a new application
4. Copy the Client ID from your application settings
5. Add it to your `.env.local` file as `NEXT_PUBLIC_CIVIC_CLIENT_ID`

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## What's Changed

- **Authentication**: Users now sign in with Civic Auth instead of connecting wallets
- **User Button**: The traditional "Connect Wallet" button is replaced with Civic's UserButton
- **User Context**: Components use `useUser()` from Civic Auth instead of `useAccount()` from wagmi
- **Seamless Experience**: Users get a smooth authentication flow without wallet management complexity

## Testing the Integration

1. Click the "Sign In" button in the top-left corner
2. Complete the Civic Auth flow
3. Once signed in, you'll see your user information
4. The transaction section will be enabled for signed-in users

## Troubleshooting

- **"Client ID not found"**: Make sure you've set `NEXT_PUBLIC_CIVIC_CLIENT_ID` in your `.env.local` file
- **Build errors**: Ensure all dependencies are installed with `npm install`
- **Authentication issues**: Verify your Civic Client ID is correct and your app is properly configured in the Civic dashboard
