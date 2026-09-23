/**
 * The width a screen actually has to lay out in.
 *
 * On phones that is the window. On tablets the whole app sits in a centred,
 * phone-width column (see PhoneFrame in app/_layout.tsx), so the window is
 * two or three times wider than anything a screen may draw into. Charts, the
 * tab bar, paged carousels and full-width illustrations that read
 * `Dimensions.get("window").width` spilled out of that column; they read
 * this instead.
 */
import { createContext, useContext } from "react";
import { useWindowDimensions } from "react-native";

/** Set by PhoneFrame; null wherever the frame is not in play (phones). */
export const LayoutWidthContext = createContext<number | null>(null);

export function useLayoutWidth(): number {
  const framed = useContext(LayoutWidthContext);
  const { width } = useWindowDimensions();
  return framed ?? width;
}
