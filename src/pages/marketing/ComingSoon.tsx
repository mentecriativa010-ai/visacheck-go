import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

interface ComingSoonProps {
  title: string;
  seoDescription: string;
}

export default function ComingSoon({ title, seoDescription }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-[#F7F4EC] font-body flex flex-col">
      <SEO title={`${title} — VISAcheck GO`} description={seoDescription} />
      <MarketingNavbar />

      <main className="flex-1 flex items-center justify-center px-6 py-24 text-center">
        <div className="max-w-md">
          <p className="font-mono-custom text-sm text-[#22C79A] mb-4">EM CONSTRUÇÃO</p>
          <h1 className="font-marketing-display text-3xl text-[#0F2A4A] mb-4">{title}</h1>
          <p className="text-[#0F2A4A]/70 leading-relaxed mb-8">
            Essa página ainda está sendo construída. Enquanto isso, você já
            pode testar o VISAcheck GO gratuitamente.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center rounded-full bg-[#0F2A4A] text-[#F7F4EC] px-7 py-3.5 font-medium hover:bg-[#153A63] transition-colors"
          >
            Testar grátis
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
