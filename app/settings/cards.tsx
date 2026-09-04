import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { DeleteIcon } from "@/components/icons/AppIcons";
import { useColors } from "@/hooks/useColors";
import { guardedBack } from "@/utils/navigation";
import { savedCardsApi } from "../../services/api";

const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const RED = "#EF4444";

type SavedCard = {
  id: string;
  last4: string;
  cardBrand: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
};

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8M3 8h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 15h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={filled ? color : "none"}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrashIcon({ color }: { color: string }) {
  return <DeleteIcon color={color} size={16} />;
}

export default function CardsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const c = useColors();

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchCards = useCallback(() => {
    setLoading(true);
    savedCardsApi.list()
      .then(setCards)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleSetDefault = async (id: string) => {
    setActionId(id);
    try {
      await savedCardsApi.setDefault(id);
      setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
    } catch {
      Alert.alert("Error", "Could not set default card.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = (card: SavedCard) => {
    Alert.alert(
      "Remove card?",
      `Remove ${card.cardBrand} ending in ${card.last4}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setActionId(card.id);
            try {
              await savedCardsApi.remove(card.id);
              setCards((prev) => prev.filter((c) => c.id !== card.id));
            } catch {
              Alert.alert("Error", "Could not remove the card.");
            } finally {
              setActionId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: topPad + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => guardedBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <BackArrow color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Payment Methods</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Saved Cards */}
        <Text style={[styles.sectionLabel, { color: MUTED }]}>SAVED CARDS</Text>

        {loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : cards.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: c.primary + "15" }]}>
              <CardIcon color={c.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No saved cards</Text>
            <Text style={[styles.emptySub, { color: MUTED }]}>
              Cards are saved when you check "Save this card" during a deposit.
            </Text>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={[styles.cardRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.cardIconWrap, { backgroundColor: c.primary + "15" }]}>
                <CardIcon color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.cardTitle, { color: c.text }]}>
                    {card.cardBrand} ••••{card.last4}
                  </Text>
                  {card.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: c.primary + "18" }]}>
                      <Text style={[styles.defaultBadgeText, { color: c.primary }]}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardSub, { color: MUTED }]}>
                  {card.cardholderName} · {card.expiryMonth}/{card.expiryYear}
                </Text>
              </View>
              {actionId === card.id ? (
                <ActivityIndicator color={c.primary} size="small" />
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {!card.isDefault && (
                    <TouchableOpacity onPress={() => handleSetDefault(card.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <StarIcon filled={false} color={MUTED} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(card)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <TrashIcon color={RED} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {/* Info */}
        <View style={styles.infoRow}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke={MUTED} strokeWidth={1.5} />
            <Path d="M12 16v-4M12 8h.01" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[styles.infoText, { color: MUTED }]}>
            Card numbers are encrypted at rest. CVV is never stored — you enter it each time you pay.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
  },
  emptySub: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
  },
  cardSub: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  infoText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
});
