import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUNÉ Piercing Boutique",
  description: "Вебзастосунок електронної комерції товарів для пірсингу"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
