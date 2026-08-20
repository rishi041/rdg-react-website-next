import Home from "@/features/portfolio/components/Home";
import About from "@/features/portfolio/components/About";
import Skills from "@/features/portfolio/components/Skills";
import Qualification from "@/features/portfolio/components/Qualification";
// import Services from "@/features/portfolio/components/Services";
import Portfolio from "@/features/portfolio/components/Portfolio";
// import Testimonial from "@/features/portfolio/components/Testimonial";
import ProjectInMind from "@/features/portfolio/components/ProjectInMind";
import ContactMe from "@/features/portfolio/components/ContactMe";

export const metadata = { title: "Portfolio — Rushikesh Ganorkar" };

// 📘 The personal portfolio — all original sections stacked on one page.
// Their #about/#contact hash links keep working because the target sections
// live on this same page.
export default function PortfolioPage() {
  return (
    <main className="main">
      <Home />
      <About />
      <Skills />
      <Qualification />
      {/* <Services /> */}
      <Portfolio />
      {/* <Testimonial /> */}
      <ProjectInMind />
      <ContactMe />
    </main>
  );
}
