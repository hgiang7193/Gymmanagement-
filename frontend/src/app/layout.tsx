import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "MYFIT Web MVP",
  description: "Operational web console for MYFIT MVP.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <AppProviders>
          <AuthProvider>{children}</AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
