import BottlesGif from "../../public/beers_17904034.gif";
import CansGif from "../../public/beer-can_8701104.gif";
import WasteBin from "../../public/ewaste_19009413.gif";
import KMA from "../../public/kma.png";
import KNUSTshs from "../../public/knust-shs.png";
import Bloomberg from "../../public/bloomberg.png";
export const useAssets = () => {
  return {
    icons: { bottleGif: BottlesGif, canGif: CansGif, wasteBin: WasteBin },
    images: { kma: KMA, knustshs: KNUSTshs, bloomberg: Bloomberg },
  };
};
