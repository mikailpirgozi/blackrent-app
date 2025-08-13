import { ElementDetailVozidla } from "../../../components/anima/sections/ElementDetailVozidla";

interface Props {
  params: {
    id: string;
  };
}

export default function VozidloDetailPage({ params }: Props) {
  return <ElementDetailVozidla vehicleId={params.id} />;
}

export const metadata = {
  title: "Detail vozidla - BlackRent",
  description: "Detailné informácie o vozidle, cenové relácie, špecifikácie a možnosť rezervácie.",
};
