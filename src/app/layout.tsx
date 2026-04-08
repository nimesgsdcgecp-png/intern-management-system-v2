import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { ReduxProvider } from "@/lib/redux/ReduxProvider";
import { NotificationCenter } from "@/components/features/NotificationCenter";
import { ThemeProvider } from "@/components/providers/ThemeProvider";


const outfit = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Intern Management System",
  description: "Complete Intern Management System using Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReduxProvider>
            <SessionProviderWrapper>
              {children}
              <NotificationCenter />
            </SessionProviderWrapper>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
