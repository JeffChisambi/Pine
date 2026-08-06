import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

export default function SellScreen() {
  // Forward the selected stock through to the trade screen — dropping it
  // previously made Sell open on the default stock with no ownership context.
  const params = useLocalSearchParams<{ ticker?: string }>();

  useEffect(() => {
    router.replace({
      pathname: "/trade/buy" as any,
      params: { mode: "sell", ...(params.ticker ? { ticker: params.ticker } : {}) },
    });
  }, [params.ticker]);

  return null;
}
