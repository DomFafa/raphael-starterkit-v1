import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import { generateSEOMetadata, generateRobotsMeta } from "@/utils/seo";
import { AnalyticsProvider } from "@/components/analytics-provider";
import Script from "next/script";
import "./globals.css";

const baseUrl = process.env.BASE_URL
  ? `https://${process.env.BASE_URL}`
  : "http://localhost:3000";

// Generate SEO metadata
const seoMetadata = generateSEOMetadata(
  "ChineseName.club - AI Chinese Name Generator",
  "Discover your perfect Chinese name with our AI-powered generator. Get personalized names based on your personality, with cultural significance and detailed meanings.",
  baseUrl
);

const robots = generateRobotsMeta();

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: seoMetadata.title,
  description: seoMetadata.description,
  keywords: seoMetadata.keywords,
  openGraph: seoMetadata.openGraph,
  twitter: seoMetadata.twitter,
  alternates: seoMetadata.alternates,
  robots,
  other: {
    'theme-color': '#000000',
    'msapplication-TileColor': '#000000',
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <AnalyticsProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative min-h-screen">
              <Header user={user} />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>

          {/* Structured Data for SEO */}
          <Script
            id="structured-data-main"
            type="application/ld+json"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(seoMetadata.structuredData, null, 2),
            }}
          />

          <Script
            id="structured-data-faq"
            type="application/ld+json"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(seoMetadata.faqData, null, 2),
            }}
          />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
