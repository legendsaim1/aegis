import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["700"],
});

export const metadata = {
  metadataBase: new URL("https://aegis.app"),
  title: "AEGIS — AI-based Exam Grading & Insight System",
  description:
    "Upload handwritten answer sheets, get instant AI-powered grading with confidence scores, analytics, and copy detection. Built for educators.",
  keywords: ["exam grading", "AI", "OCR", "handwriting recognition", "education", "Gemini"],
  openGraph: {
    title: "AEGIS — Grade Smarter with AI",
    description: "Instant AI-powered grading with confidence scores, analytics, and copy detection.",
    url: "https://aegis.app",
    siteName: "AEGIS",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AEGIS AI Grading System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AEGIS — Grade Smarter with AI",
    description: "Instant AI-powered grading with confidence scores.",
    images: ["/og-image.jpg"],
  },
};

import { ToastProvider } from "@/hooks/useToast";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

