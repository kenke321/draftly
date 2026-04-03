import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Draftly – Generate Photography Proposals in 60 Seconds",
  description:
    "Stop spending hours writing client proposals. Draftly uses AI to generate professional photography proposals tailored to your client in under 60 seconds.",
  openGraph: {
    title: "Draftly – Generate Photography Proposals in 60 Seconds",
    description:
      "Stop spending hours writing client proposals. Draftly uses AI to generate professional photography proposals in under 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
