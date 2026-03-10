import { Inter, Playfair_Display } from "next/font/google";
import { LanguageProvider } from "./LanguageContext";
import PWARegister from "./components/PWARegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });

export const metadata = {
  title: "VedaVision | High-Fidelity Ayurvedic Intelligence",
  description: "A world-class AI system identifying Ayurvedic items and revealing deep traditional knowledge.",
  manifest: "/manifest.json",
  themeColor: "#2dd4a8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VedaVision",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} dark`}>
        <PWARegister />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
