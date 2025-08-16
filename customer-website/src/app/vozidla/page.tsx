import { ElementPonukaVozidiel } from "../../components/anima/sections/ElementPonukaVozidiel/ElementPonukaVozidiel";
import { ResponsiveFooter } from "../../components/shared/ResponsiveFooter";

export default function VozidlaPage() {
  return (
    <div className="w-full flex flex-col bg-[#05050a] relative overflow-x-hidden min-h-screen">
      {/* Main content - ponuka vozidiel bez footer */}
      <div className="flex-1">
        <ElementPonukaVozidiel />
      </div>
      
      {/* Responzívny Footer */}
      <ResponsiveFooter />
    </div>
  );
}

export const metadata = {
  title: "Ponuka vozidiel - BlackRent",
  description: "Vyberte si z ponuky vyše 1000+ vozidiel. Bezplatné zrušenie rezervácie, 12 preverených autopožičovní, 36 odberných miest na Slovensku.",
};
