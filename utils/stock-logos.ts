import { ImageSourcePropType } from "react-native";

/**
 * Centralized mapping of stock ticker symbols → local logo images.
 * Every screen that displays a stock logo should use getStockLogo(symbol)
 * instead of rendering a coloured circle with text initials.
 */
const STOCK_LOGO_MAP: Record<string, ImageSourcePropType> = {
  AIRTEL:   require("../assets/images/airtel.png"),
  BHL:      require("../assets/images/bhl.png"),
  FDHB:     require("../assets/images/fdh.webp"),
  FMBCH:    require("../assets/images/fmbch.png"),
  ICON:     require("../assets/images/icon_logo.png"),
  ILLOVO:   require("../assets/images/illovo.png"),
  MPICO:    require("../assets/images/mpico.jpg"),
  NBM:      require("../assets/images/nationalbank.jpg"),
  NBS:      require("../assets/images/nbs.png"),
  NICO:     require("../assets/images/nico.png"),
  NITL:     require("../assets/images/nitl.png"),
  OMU:      require("../assets/images/oldmutual.jpg"),
  PCL:      require("../assets/images/pcl.png"),
  STANDARD: require("../assets/images/standard.png"),
  SUNBIRD:  require("../assets/images/sunbird.png"),
  TNM:      require("../assets/images/tnm.png"),
};

/**
 * Returns the local image source for a given stock symbol,
 * or null if no image is available.
 */
export function getStockLogo(symbol: string): ImageSourcePropType | null {
  return STOCK_LOGO_MAP[symbol.toUpperCase()] ?? null;
}
