import { router } from "expo-router";
import { useEffect } from "react";

export default function SellScreen() {
  useEffect(() => {
    router.replace({ pathname: "/trade/buy" as any, params: { mode: "sell" } });
  }, []);
  return null;
}
