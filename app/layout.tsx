import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Trendbit — Pay to climb for rank your ios app",
  description: "The iOS app leaderboard you pay to climb. No ads, no algorithms, no bias. Your bid decides your rank — every listed iOS app gets direct App Store traffic and a free do-follow backlink.",
  keywords: ["iOS apps", "app leaderboard", "pay to climb", "trendbit", "app store rankings", "dodo payments"],
  openGraph: {
    title: "Trendbit — Pay to climb for rank your ios app",
    description: "The product leaderboard you pay to climb. Bid to rank your iOS app.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <script
          async
          src="https://analyzeuser.com/track.js"
          data-site-id="7566e31e-cc90-44a5-bf37-b2afb89e5271"
        ></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
