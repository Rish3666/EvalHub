// Build trigger: $(date)
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google"; // Added JetBrains_Mono and Space_Grotesk
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { UserPresenceUpdater } from "@/components/UserPresenceUpdater";
import { AIContextProvider } from "@/components/AIContextProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
});
const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-display",
});

export const metadata: Metadata = {
    title: "EvalHub - AI-Powered Developer Skill Analysis",
    description: "Get AI-generated skill scorecards based on your projects. Upload your GitHub repos and answer intelligent questions to showcase your true technical abilities.",
    keywords: ["developer portfolio", "skill assessment", "AI analysis", "GitHub projects", "technical interview"],
    authors: [{ name: "EvalHub" }],
    openGraph: {
        title: "EvalHub - AI-Powered Developer Skill Analysis",
        description: "Get AI-generated skill scorecards based on your projects",
        type: "website",
        url: "https://evalhub.dev",
        siteName: "EvalHub",
        images: [
            {
                url: "https://evalhub.dev/og.png",
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "EvalHub - AI-Powered Developer Skill Analysis",
        description: "Get AI-generated skill scorecards based on your projects",
        images: ["https://evalhub.dev/og.png"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
            </head>
            <body className={`${inter.className} ${jetbrainsMono.variable} ${spaceGrotesk.variable} min-h-screen bg-background`}>
                <AIContextProvider>
                    <UserPresenceUpdater />
                    {children}
                    <SpeedInsights />
                    <Toaster />
                </AIContextProvider>
                <SpeedInsights />
            </body>
        </html>
    );
}
