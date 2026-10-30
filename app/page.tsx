import Hero from "./components/Hero";
import Journey from "./components/Journey";
import { Agents, Console, Finale, Footer, Marquee, Nav, Trust } from "./components/Sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Journey />
        <Agents />
        <Console />
        <Trust />
        <Finale />
      </main>
      <Footer />
    </>
  );
}
