import type { Metadata } from "next";
import { Cinzel, Lato } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Primary Font: Cinzel - classical Roman inscriptions, Christian architecture
const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700', '800', '900'],
});

// Secondary Font: Lato - clean, modern sans-serif for body text
const lato = Lato({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lato',
  weight: ['300', '400', '700', '900'],
});

export const metadata: Metadata = {
  title: {
    default: "CSTG CRM",
    template: "%s | CSTG CRM",
  },
  description: "Real estate CRM platform for managing contacts, deals, and communications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lato.variable} ${cinzel.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
