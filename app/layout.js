import { Inter, Playfair_Display } from "next/font/google";
import { LanguageProvider } from "./LanguageContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });

export const metadata = {
  title: "VedaVision | High-Fidelity Ayurvedic Intelligence",
  description: "A world-class AI system identifying Ayurvedic items and revealing deep traditional knowledge.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} dark`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
