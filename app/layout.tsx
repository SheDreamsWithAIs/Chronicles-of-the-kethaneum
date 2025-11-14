import type { Metadata } from "next";
import { Crimson_Text, Dancing_Script, Cinzel } from "next/font/google";
import { AudioProvider } from "@/components/AudioProvider";
import "./globals.css";

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Chronicles of the Kethaneum",
  description: "A co-creative word-puzzle adventure across realms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${crimsonText.variable} ${dancingScript.variable} ${cinzel.variable} antialiased`}
      >
        <AudioProvider>
          <div id="game-container" className="min-h-screen">
            {children}
          </div>
        </AudioProvider>
      </body>
    </html>
  );
}
