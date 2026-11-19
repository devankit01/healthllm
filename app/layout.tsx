import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "HealthLLM — Open Health AI Hub",
  description: "Browse 329 health LLMs, 266 datasets, run reproducible evals, and contribute your model in one pull request.",
  openGraph: {
    title: "HealthLLM — Open Health AI Hub",
    description: "The open hub for health AI — models, datasets, and reproducible benchmarks.",
    url: "https://healthxllm.netlify.app",
    siteName: "HealthLLM",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <div className="ph-banner">
          <a
            href="https://www.producthunt.com/products/healthllm?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-healthllm"
            target="_blank"
            rel="noopener noreferrer"
            className="ph-banner-link"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1321769&theme=light&t=1795080035942"
              alt="HealthLLM on Product Hunt"
              width={120}
              height={26}
            />
          </a>
        </div>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
