/**
 * Wrapper-View flavour of `useTourTarget` for cases where attaching a ref to
 * the existing element is awkward.
 *
 *   <TourTarget id="bell"><NotificationIcon /></TourTarget>
 */
import React from "react";
import { View, type ViewProps } from "react-native";
import { useTourTarget } from "./useTourTarget";
import type { TourRegistrableId } from "./TourProvider";

export function TourTarget({ id, children, ...rest }: ViewProps & { id: TourRegistrableId }) {
  const ref = useTourTarget(id);
  return (
    <View ref={ref} collapsable={false} {...rest}>
      {children}
    </View>
  );
}
