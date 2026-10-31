import Planet from "./components/Planet";
import { Agents, Closing, Hero, Nav, Network, Trust, WorkstationSection } from "./components/Sections";

export default function Home() {
  return (
    <>
      <Planet />
      <Nav />
      <main className="relative z-[1]">
        <Hero />
        <WorkstationSection />
        <Agents />
        <Network />
        <Trust />
        <Closing />
      </main>
    </>
  );
}
