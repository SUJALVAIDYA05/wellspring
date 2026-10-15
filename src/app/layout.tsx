import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Quality Healthcare",
    default: "Quality Healthcare — Care You Can Trust",
  },
  description:
    "Explore departments, meet our doctors, and request an appointment with our clinical care team.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
