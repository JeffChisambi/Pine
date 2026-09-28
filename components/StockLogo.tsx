/**
 * The ticker logo badge used wherever a stock is listed.
 *
 * Lifted out of the market screen so the market list, its search sheet and
 * the compare screen all draw the same badge: the local artwork when we ship
 * one for that counter, otherwise a coloured circle with the first three
 * letters. `size` scales the whole badge; the image sits slightly inside the
 * ring, as it always has on the market list.
 */
import React from "react";
import { Image, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { getStockLogo } from "@/utils/stock-logos";

/** Fallback circle colours, picked per symbol so a counter keeps its colour. */
export const LOGO_COLORS = ["#164951", "#1A3A6B", "#166534", "#7C3AED", "#B45309", "#BE185D"];

export interface StockLogoProps {
  symbol: string;
  /** Outer diameter; the artwork is inset a little inside the ring. */
  size?: number;
}

export function StockLogo({ symbol, size = 44 }: StockLogoProps) {
  const c = useColors();
  const logo = getStockLogo(symbol);
  const radius = size / 2;
  const inner = Math.round(size * 0.9);

  if (logo) {
    return (
      <View
        style={{
          width: size, height: size, borderRadius: radius,
          backgroundColor: c.card, alignItems: "center", justifyContent: "center",
          overflow: "hidden", borderWidth: 1, borderColor: c.border,
        }}
      >
        <Image source={logo} style={{ width: inner, height: inner, borderRadius: inner / 2 }} resizeMode="contain" />
      </View>
    );
  }

  const bg = LOGO_COLORS[symbol.charCodeAt(0) % LOGO_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontFamily: "PlusJakartaSans_700Bold", fontSize: Math.max(9, Math.round(size * 0.25)) }}>
        {symbol.slice(0, 3)}
      </Text>
    </View>
  );
}
