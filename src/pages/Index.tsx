import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import ProcessSection from "@/components/landing/ProcessSection";
import AuthoritySection from "@/components/landing/AuthoritySection";
import AudienceSection from "@/components/landing/AudienceSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ProcessSection />
      <AuthoritySection />
      <AudienceSection />
      <CtaSection />
      <Footer />
    </main>
  );
};

export default Index;
