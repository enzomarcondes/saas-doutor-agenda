import "./globals.css";

import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { ThemeProvider } from "@/app/(protected)/_components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/providers/react-query";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dontosys",
  description: "Gerenciamento de clínica odontológica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} antialiased`}>
        <ThemeProvider>
          <ReactQueryProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </ReactQueryProvider>
          <Toaster position="bottom-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
