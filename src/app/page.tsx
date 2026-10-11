import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { StudyLoop } from "@/components/marketing/study-loop";
import { FeatureHighlights } from "@/components/marketing/feature-highlights";
import { CtaSection } from "@/components/marketing/cta-section";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <StudyLoop />
        <FeatureHighlights />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
