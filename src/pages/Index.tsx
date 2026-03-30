import HeroSection from "@/components/landing/HeroSection";
import BeliefBreakSection from "@/components/landing/BeliefBreakSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import ProcessSection from "@/components/landing/ProcessSection";
import OfferSection from "@/components/landing/OfferSection";
import UrgencySection from "@/components/landing/UrgencySection";
import FilterSection from "@/components/landing/FilterSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <BeliefBreakSection />
      <ProblemSection />
      <SolutionSection />
      <ProcessSection />
      <OfferSection />
      <UrgencySection />
      <FilterSection />
      <CtaSection />
      <Footer />
    </main>
  );
};

export default Index;
