import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { guardedBack } from "@/utils/navigation";
import { useCreateTicket } from "@/hooks/useSupport";
import { getErrorMessage, logHandledError, type SupportCategory, type SupportAttachment } from "@/services/api";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const RED = "#EF4770";

const CATEGORIES: { key: SupportCategory; label: string }[] = [
  { key: "DEPOSITS", label: "Deposits" },
  { key: "WITHDRAWALS", label: "Withdrawals" },
  { key: "TRADING", label: "Trading" },
  { key: "TREASURY", label: "Treasury bills" },
  { key: "ACCOUNT", label: "Account" },
  { key: "OTHER", label: "Something else" },
];

const MAX_LEN = 1000;

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const bottomPad = Platform.OS === "web" ? 24 : Math.max(insets.bottom, 16);
  const c = useColors();

  const params = useLocalSearchParams<{
    category?: string; txId?: string; txLabel?: string; txSub?: string;
  }>();

  const [category, setCategory] = useState<SupportCategory>(
    (CATEGORIES.find((x) => x.key === params.category)?.key) ?? "DEPOSITS",
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<SupportAttachment | null>(null);
  const [relatedTx, setRelatedTx] = useState<{ id: string; label?: string; sub?: string } | null>(
    params.txId ? { id: params.txId, label: params.txLabel, sub: params.txSub } : null,
  );

  const create = useCreateTicket();
  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && !create.isPending;

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Allow photo access to attach a screenshot.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const name = a.fileName ?? `screenshot-${Date.now()}.jpg`;
      const type = a.mimeType ?? "image/jpeg";
      setAttachment({ uri: a.uri, name, type });
    } catch (err) {
      logHandledError("Report attach", err);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const thread = await create.mutateAsync({
        category,
        subject: subject.trim(),
        message: message.trim(),
        relatedTransactionId: relatedTx?.id,
        attachment: attachment ?? undefined,
      });
      router.replace({ pathname: "/help/ticket" as any, params: { id: thread.ticketId } });
    } catch (err) {
      logHandledError("Report submit", err);
      Alert.alert("Couldn't send report", getErrorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, gap: 6 }}>
        <TouchableOpacity onPress={() => guardedBack("/help")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Feather name="chevron-left" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text }}>Send a Report</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {/* Category */}
        <Label c={c}>WHAT'S THIS ABOUT?</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const active = cat.key === category;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.8}
                onPress={() => setCategory(cat.key)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1,
                  backgroundColor: active ? c.primary : c.card,
                  borderColor: active ? c.primary : c.border,
                }}
              >
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: active ? WHITE : c.text }}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Related transaction */}
        {relatedTx && (
          <>
            <Label c={c}>RELATED TRANSACTION <Text style={{ color: MUTED }}>(optional)</Text></Label>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.muted, alignItems: "center", justifyContent: "center" }}>
                <Feather name="credit-card" size={18} color={c.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{relatedTx.label ?? "Transaction"}</Text>
                {!!relatedTx.sub && <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 2 }}>{relatedTx.sub}</Text>}
              </View>
              <TouchableOpacity onPress={() => setRelatedTx(null)} hitSlop={8}>
                <Feather name="x" size={18} color={MUTED} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Subject */}
        <Label c={c}>SUBJECT</Label>
        <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, height: 52, justifyContent: "center" }}>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Briefly, what went wrong?"
            placeholderTextColor={MUTED}
            maxLength={140}
            style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 15, color: c.text, padding: 0 }}
          />
        </View>

        {/* Describe */}
        <Label c={c}>DESCRIBE THE ISSUE</Label>
        <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, minHeight: 150 }}>
          <TextInput
            value={message}
            onChangeText={(t) => setMessage(t.slice(0, MAX_LEN))}
            placeholder="Tell us what happened, including amounts, dates and anything you've already tried."
            placeholderTextColor={MUTED}
            multiline
            textAlignVertical="top"
            style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: c.text, lineHeight: 22, minHeight: 110, padding: 0 }}
          />
          <Text style={{ alignSelf: "flex-end", fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 4 }}>{message.length} / {MAX_LEN}</Text>
        </View>

        {/* Attachment */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          {attachment ? (
            <View style={{ width: 84, height: 84, borderRadius: 12, overflow: "hidden" }}>
              <Image source={{ uri: attachment.uri }} style={{ width: "100%", height: "100%" }} />
              <TouchableOpacity
                onPress={() => setAttachment(null)}
                style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="x" size={13} color={WHITE} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.7}
              style={{ width: 84, height: 84, borderRadius: 12, borderWidth: 1, borderColor: c.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: c.card }}
            >
              <Feather name="camera" size={20} color={MUTED} />
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginTop: 4 }}>Attach</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Submit */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: bottomPad, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={submit}
          disabled={!canSubmit}
          style={{ height: 54, borderRadius: 27, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", opacity: canSubmit ? 1 : 0.5 }}
        >
          {create.isPending ? <ActivityIndicator color={WHITE} /> : (
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE }}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Label({ children, c }: { children: React.ReactNode; c: ReturnType<typeof useColors> }) {
  return <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, letterSpacing: 0.5, color: MUTED, marginTop: 22, marginBottom: 10 }}>{children}</Text>;
}
