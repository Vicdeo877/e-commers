import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { Toaster } from "react-hot-toast";
import ThemeRoot from "@/components/ThemeRoot";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://blissfruitz.com"),
  title: { default: "BlissFruitz | Premium Fresh Fruits Delivery", template: "%s | BlissFruitz" },
  description: "Experience the taste of nature delivered in its purest form. Organic, handpicked, quality-assured fresh fruits from farm to doorstep.",
  keywords: ["fresh fruits", "organic fruits", "buy fruit online", "fruit delivery", "farm fresh", "BlissFruitz"],
  authors: [{ name: "BlissFruitz" }],
  creator: "BlissFruitz",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "BlissFruitz | Farm Fresh Fruits",
    description: "Order premium, farm-fresh, organic fruits delivered straight to your home. Quality guaranteed.",
    siteName: "BlissFruitz",
    images: [{
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "BlissFruitz Premium Fruits",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlissFruitz | Premium Fresh Fruits",
    description: "Farm-fresh organic fruits delivered directly to your doorstep.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col transition-colors`}
      >
        <SiteSettingsProvider>
          <ThemeRoot>
            <AuthProvider>
              <CartProvider>
                <Toaster position="top-right" />
                {children}
              </CartProvider>
            </AuthProvider>
          </ThemeRoot>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
