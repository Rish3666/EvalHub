import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DevShowcase - AI-Powered Developer Skill Analysis",
    description: "Get AI-generated skill scorecards based on your projects. Upload your GitHub repos and answer intelligent questions to showcase your true technical abilities.",
    keywords: ["developer portfolio", "skill assessment", "AI analysis", "GitHub projects", "technical interview"],
    authors: [{ name: "DevShowcase" }],
    openGraph: {
        title: "DevShowcase - AI-Powered Developer Skill Analysis",
        description: "Get AI-generated skill scorecards based on your projects",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
