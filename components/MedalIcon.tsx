/**
 * The podium medal, for the top three places on the Board.
 *
 * The supplied artwork has the numeral 1 baked into its path, which only
 * suits first place. The numeral is therefore separated out: the ribbons and
 * the medallion are drawn from the original art, and the place is drawn over
 * it, so second and third get their own number rather than a recoloured one.
 *
 * Colour carries the placing, as it does on a real podium: gold, silver,
 * bronze. The band on the medallion is a darker shade of the same hue rather
 * than a separate colour, so the three read as one set.
 */
import React from "react";
import Svg, { Path, Text as SvgText } from "react-native-svg";

export const MEDAL_COLORS: Record<number, { face: string; edge: string; numeral: string }> = {
  1: { face: "#E0AE2F", edge: "#A8791A", numeral: "#4A330A" },
  2: { face: "#AFB7C0", edge: "#7E868F", numeral: "#2F343A" },
  3: { face: "#C07F46", edge: "#8C5729", numeral: "#3D2413" },
};

/** The two ribbon tails, from the original artwork. */
const RIBBON_LEFT =
  "M9.193 20.037c-1.25 0-1.416-0.584-1.416-0.584l-4.875 9.58 3.909-0.438 2.162 3.25c0 0 4.5-9.393 4.5-9.33-2.33-0.056-1.405-2.415-4.28-2.478z";
const RIBBON_RIGHT =
  "M24.16 19.828c-3.562 0.375-2.838 1.256-3.65 1.943-0.938 1-2.107 0.807-2.107 0.807l5.5 9.455 1.35-3.5 3.846 0.5-4.939-9.205z";
/** The scalloped medallion, with the numeral removed. */
const MEDALLION =
  "M20.182 21.065c0.607-1.020 1.504-1.537 2.691-1.553s1.787-0.617 1.803-1.804c0.016-1.186 0.533-2.083 1.553-2.689s1.24-1.428 0.66-2.463-0.58-2.071 0-3.106 0.359-1.856-0.66-2.463-1.537-1.503-1.553-2.69c-0.016-1.186-0.617-1.787-1.803-1.803-1.188-0.016-2.084-0.533-2.691-1.553-0.605-1.020-1.428-1.24-2.463-0.66s-2.070 0.58-3.105 0-1.856-0.359-2.463 0.66c-0.607 1.020-1.503 1.537-2.69 1.553s-1.787 0.618-1.803 1.804c-0.016 1.187-0.533 2.083-1.553 2.69s-1.24 1.428-0.66 2.463c0.58 1.035 0.58 2.071 0 3.106s-0.359 1.856 0.66 2.463c1.020 0.607 1.537 1.504 1.553 2.689 0.016 1.187 0.617 1.788 1.803 1.804s2.083 0.533 2.69 1.553c0.606 1.020 1.428 1.239 2.463 0.66s2.070-0.579 3.105 0 1.857 0.359 2.463-0.661z";

export interface MedalIconProps {
  /** 1, 2 or 3. Anything else renders nothing. */
  place: number;
  size?: number;
}

export function MedalIcon({ place, size = 32 }: MedalIconProps) {
  const colors = MEDAL_COLORS[place];
  if (!colors) return null;

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path d={RIBBON_LEFT} fill={colors.edge} />
      <Path d={RIBBON_RIGHT} fill={colors.edge} />
      <Path d={MEDALLION} fill={colors.face} stroke={colors.edge} strokeWidth={0.6} />
      <SvgText
        x={16}
        y={15.4}
        fontSize={11}
        fontWeight="bold"
        fill={colors.numeral}
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {place}
      </SvgText>
    </Svg>
  );
}
