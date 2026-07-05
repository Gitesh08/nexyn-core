import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Nexyn | The AI Memory Engine",
  description: "Scale your AI memory without the noise. Project Nexyn brings dynamic context pruning and neural plasticity to your data infrastructure.",
  keywords: [
    "AI memory",
    "context bloat",
    "vector database optimization",
    "Cognee",
    "knowledge graph",
    "RAG optimization",
    "LLM context window",
    "memory decay",
    "biomimetic AI",
    "semantic search"
  ],
  openGraph: {
    title: "Project Nexyn | The AI Memory Engine",
    description: "Scale your AI memory without the noise. Project Nexyn brings dynamic context pruning and neural plasticity to your data infrastructure.",
    url: "https://nexyn-core.vercel.app",
    siteName: "Nexyn Core",
    images: [
      {
        url: "https://res.cloudinary.com/db7h39kx9/image/upload/v1783248039/nexyn-logo_a3znlo.png",
        width: 1200,
        height: 630,
        alt: "Nexyn Core - Biological Memory for AI",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Nexyn | The AI Memory Engine",
    description: "Scale your AI memory without the noise. Project Nexyn brings dynamic context pruning and neural plasticity to your data infrastructure.",
    images: ["https://res.cloudinary.com/db7h39kx9/image/upload/v1783248039/nexyn-logo_a3znlo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-primary/30 selection:text-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
