import Backdrop from "./components/Backdrop";
import World from "./components/World";
import { Desk, Fleet, Footer, Nav, Network, Rules, Storm, Tower } from "./components/Sections";

export default function Home() {
  return (
    <>
      <World />
      <Backdrop />
      <Nav />
      <main>
        <Network />
        <Fleet />
        <Tower />
        <Storm />
        <Desk />
        <Rules />
      </main>
      <Footer />
    </>
  );
}
