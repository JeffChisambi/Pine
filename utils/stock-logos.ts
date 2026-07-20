import { ImageSourcePropType } from "react-native";

/**
 * Centralized mapping of stock ticker symbols → local logo images.
 * Every screen that displays a stock logo should use getStockLogo(symbol)
 * instead of rendering a coloured circle with text initials.
 */
const STOCK_LOGO_MAP: Record<string, ImageSourcePropType> = {
  AIRTEL:   require("../assets/images/AIRTEL.png"),
  BHL:      require("../assets/images/BH.png"),
  FDHB:     require("../assets/images/FDH.png"),
  FMBCH:    require("../assets/images/FMBC.png"),
  ICON:     require("../assets/images/ICON.png"),
  ILLOVO:   require("../assets/images/ILOVO.png"),
  MPICO:    require("../assets/images/MPICO.png"),
  NBM:      require("../assets/images/NB.png"),
  NBS:      require("../assets/images/NBS.png"),
  NICO:     require("../assets/images/NICO.png"),
  NITL:     require("../assets/images/NITL.png"),
  OMU:      require("../assets/images/OMU.png"),
  PCL:      require("../assets/images/pc.png"),
  STANDARD: require("../assets/images/Standardbank.png"),
  SUNBIRD:  require("../assets/images/SUNBIRD.png"),
  TNM:      require("../assets/images/TNM.png"),
};

/**
 * Returns the local image source for a given stock symbol,
 * or null if no image is available.
 */
export function getStockLogo(symbol: string): ImageSourcePropType | null {
  return STOCK_LOGO_MAP[symbol.toUpperCase()] ?? null;
}
