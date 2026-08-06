import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import PinVerifyModal from "@/components/PinVerifyModal";
import { useAuth } from "../services/auth-context";

/**
 * Session-wide wallet balance visibility.
 *
 * Rules:
 *  - Hidden by default on every app launch and after every login (state resets
 *    whenever the signed-in user changes; nothing is persisted).
 *  - Every toggle — revealing OR hiding — requires PIN verification. Tapping
 *    the eye icon opens the PIN modal; only a successful PIN flips the state.
 */
interface BalanceVisibilityContextValue {
  /** Whether balances should currently be shown. */
  visible: boolean;
  /** Ask to flip visibility — opens the PIN prompt. */
  requestToggle: () => void;
}

const BalanceVisibilityContext = createContext<BalanceVisibilityContextValue>({
  visible: false,
  requestToggle: () => {},
});

export function BalanceVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Fresh login (or logout) always returns to hidden.
  useEffect(() => {
    setVisible(false);
    setPinOpen(false);
  }, [userId]);

  const requestToggle = useCallback(() => setPinOpen(true), []);

  const value = useMemo(() => ({ visible, requestToggle }), [visible, requestToggle]);

  return (
    <BalanceVisibilityContext.Provider value={value}>
      {children}
      <PinVerifyModal
        visible={pinOpen}
        title="Verify your PIN"
        subtitle={
          visible
            ? "Enter your 4-digit PIN to hide your balance"
            : "Enter your 4-digit PIN to reveal your balance"
        }
        onVerified={() => {
          setPinOpen(false);
          setVisible((v) => !v);
        }}
        onCancel={() => setPinOpen(false)}
      />
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  return useContext(BalanceVisibilityContext);
}
