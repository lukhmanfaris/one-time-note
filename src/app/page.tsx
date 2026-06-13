import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { SecuritySection } from "@/components/landing/security-section";
import { UseCases } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <InteractiveDemo />
      <SecuritySection />
      <UseCases />
      <Pricing />
      <Footer />
    </>
  );
}
