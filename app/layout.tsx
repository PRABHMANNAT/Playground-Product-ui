import type { Metadata } from "next";
import "./globals.css";
import "./refinement.css";
export const metadata: Metadata = {
    title: "Playground — Build with evidence",
    description: "Investigate the past. Test the assumptions. Validate with people. A business validation workspace for founders and product teams.",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
    },
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="en">
      <body className="antialiased">{children}</body>
    </html>);
}
