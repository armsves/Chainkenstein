"use client";

import { useUser } from "@civic/auth-web3/react";
import { ReactNode, useState, useEffect, useCallback } from "react";
import { useAccount, useBalance, useSignMessage, useConnect } from "wagmi";
import Image from "next/image";
import { useAutoConnect } from "@civic/auth-web3/wagmi";

const useNotification = () => {
  return useCallback(async (notification: { title: string; body: string }) => {
    // Mock notification - replace with actual notification system
    console.log('Notification:', notification);
    if ('Notification' in window) {
      new Notification(notification.title, { body: notification.body });
    }
  }, []);
};  

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)]",
    secondary:
      "bg-[var(--app-gray)] hover:bg-[var(--app-gray-dark)] text-[var(--app-foreground)]",
    outline:
      "border border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] text-[var(--app-accent)]",
    ghost:
      "hover:bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

function Card({
  title,
  children,
  className = "",
  onClick,
}: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
} 

export function Home() {
  return (
    <div className="space-y-6 animate-fade-in">
      <TransactionCard />
    </div>
  );
}

type IconProps = {
  name: "heart" | "star" | "check" | "plus" | "arrow-right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const icons = {
    heart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Heart</title>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    star: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Star</title>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    check: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Check</title>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    plus: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Plus</title>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    "arrow-right": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Arrow Right</title>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  };

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {icons[name]}
    </span>
  );
}

function TransactionCard() {
  const { user } = useUser();
  useAutoConnect();
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending } = useSignMessage();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const sendNotification = useNotification();

  // Get ETH balance
  const ethBalance = useBalance({ address });

  // Get USDC balance (Base network USDC contract address)
  const usdcBalance = useBalance({
    address,
    token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base
  });

  // Debug logging
  useEffect(() => {
    console.log("Balance Debug Info:", {
      address,
      isConnected,
      ethBalance: ethBalance.data,
      usdcBalance: usdcBalance.data,
      hasAddress: !!address,
    });
  }, [address, isConnected, ethBalance.data, usdcBalance.data]);

  // Get the embedded wallet connector
  const embeddedWalletConnector = connectors.find(connector =>
    connector.name.toLowerCase().includes('embedded') ||
    connector.name.toLowerCase().includes('civic')
  );

  const handleConnectWallet = useCallback(async () => {
    if (!embeddedWalletConnector) {
      console.error("Embedded wallet connector not found");
      await sendNotification({
        title: "Wallet Error",
        body: "Embedded wallet connector not available.",
      });
      return;
    }

    try {
      await connect({ connector: embeddedWalletConnector });
      await sendNotification({
        title: "Wallet Connected! 🎉",
        body: "Embedded wallet connected successfully.",
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      await sendNotification({
        title: "Connection Failed",
        body: "Failed to connect wallet. Please try again.",
      });
    }
  }, [embeddedWalletConnector, connect, sendNotification]);

  const handleSignTransaction = useCallback(async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    if (!isConnected || !address) {
      console.error("Wallet not connected");
      await sendNotification({
        title: "Wallet Not Connected",
        body: "Please connect your wallet to sign transactions.",
      });
      return;
    }

    try {
      const message = `Hello from ${user.name || user.email || 'Civic Auth User'}! This is a test message signed on ${new Date().toISOString()}`;
      const signature = await signMessageAsync({ message });
      setLastSignature(signature);

      console.log("Message signed:", message);
      console.log("Signature:", signature);
      console.log("Address:", address);

      await sendNotification({
        title: "Transaction Signed! 🎉",
        body: `Successfully signed message with wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

    } catch (error) {
      console.error("Error signing transaction:", error);
      await sendNotification({
        title: "Signing Failed",
        body: "Failed to sign the transaction. Please try again.",
      });
    }
  }, [user, isConnected, address, signMessageAsync, sendNotification]);

  type BalanceData = {
    decimals: number;
    formatted: string;
    symbol: string;
    value: bigint;
  };
  
  // Proper balance formatting function
  const formatBalance = (balanceData: BalanceData) => {
    if (!balanceData || !balanceData.value) return "0";
    
    // Use the formatted value from wagmi which handles decimals properly
    const formattedValue = parseFloat(balanceData.formatted);
    
    if (formattedValue === 0) return "0";
    if (formattedValue < 0.0001) return "<0.0001";
    
    // Format with appropriate decimal places based on token
    if (balanceData.symbol === 'USDC') {
      return formattedValue.toFixed(2); // 2 decimals for USDC
    }
    return formattedValue.toFixed(6); // 6 decimals for ETH
  };

  return (
    <Card title="Sign EVM Transaction">
      <div className="space-y-4">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <Image
            src="/Chainkestein.png"
            alt="Chainkestein Logo"
            width={120}
            height={120}
            className="rounded-lg shadow-lg"
            priority
          />
        </div>

        <p className="text-[var(--app-foreground-muted)] mb-4">
          Experience the power of Civic Auth Web3 by signing a message. This demonstrates
          EVM transaction signing capabilities with your Civic identity.
        </p>

        <div className="flex flex-col items-center space-y-4">
          {user ? (
            <>
              <div className="text-center">
                <p className="text-sm text-[var(--app-foreground)]">
                  Signed in as: <strong>{user.name || user.email || 'Civic User'}</strong>
                </p>
              </div>

              {!isConnected ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleConnectWallet}
                  disabled={isConnecting || !embeddedWalletConnector}
                  className="min-w-[200px]"
                >
                  {isConnecting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    "Connect Embedded Wallet"
                  )}
                </Button>
              ) : (
                <div className="space-y-3 w-full">
                  <div className="text-center">
                    <p className="text-sm text-green-400">Wallet Connected</p>
                    <p className="text-xs text-[var(--app-foreground-muted)]">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                  
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSignTransaction}
                    disabled={isPending}
                    className="w-full"
                  >
                    {isPending ? "Signing..." : "Sign Message"}
                  </Button>
                </div>
              )}

              {lastSignature && (
                <div className="text-xs text-green-400 text-center">
                  Message signed successfully!
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="text-[var(--app-foreground-muted)]">
                Please sign in with Civic to continue
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
