import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { guardedBack } from "@/utils/navigation";
import { useSupportThread, useReplyTicket } from "@/hooks/useSupport";
import { logHandledError, type SupportAttachment, type SupportMessage, type SupportTicketThread } from "@/services/api";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function statusStyle(status: SupportTicketThread["status"]) {
  switch (status) {
    case "OPEN": return { bg: "rgba(245,158,11,0.14)", fg: "#B45309", label: "Open" };
    case "IN_REVIEW": return { bg: "rgba(59,130,246,0.14)", fg: "#2563EB", label: "In review" };
    case "RESOLVED": return { bg: "rgba(69,179,105,0.16)", fg: "#2F8F52", label: "Resolved" };
    case "CLOSED": return { bg: "rgba(156,163,175,0.18)", fg: "#6B7280", label: "Closed" };
    default: return { bg: "rgba(156,163,175,0.18)", fg: "#6B7280", label: status };
  }
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function TicketScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const bottomPad = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 10);
  const c = useColors();

  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const { data: thread, isLoading, isError, refetch } = useSupportThread(id);
  const reply = useReplyTicket(id ?? "");

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<SupportAttachment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  useEffect(() => {
    if (thread?.messages?.length) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [thread?.messages?.length]);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      setAttachment({ uri: a.uri, name: a.fileName ?? `screenshot-${Date.now()}.jpg`, type: a.mimeType ?? "image/jpeg" });
    } catch (err) {
      logHandledError("Ticket attach", err);
    }
  };

  const send = async () => {
    const body = text.trim();
    if ((!body && !attachment) || reply.isPending || !id) return;
    setText("");
    const toSend = attachment;
    setAttachment(null);
    try {
      await reply.mutateAsync({ message: body || "(screenshot)", attachment: toSend ?? undefined });
    } catch (err) {
      logHandledError("Ticket reply", err);
      setText(body); // restore on failure
    }
  };

  const s = thread ? statusStyle(thread.status) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => guardedBack("/help")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Feather name="chevron-left" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>{thread?.subject ?? "Report"}</Text>
          {thread && (
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 1 }}>
              #{thread.reference} · opened {fmtDay(thread.createdAt)}
            </Text>
          )}
        </View>
        {s && (
          <View style={{ backgroundColor: s.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: s.fg }}>{s.label}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={TEAL} /></View>
      ) : isError || !thread ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: MUTED, textAlign: "center" }}>Couldn't load this report.</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: GREEN }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} colors={[TEAL]} />}
        >
          {thread.messages.map((m) => <Bubble key={m.id} m={m} c={c} />)}
        </ScrollView>
      )}

      {/* Composer */}
      {thread && (
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: bottomPad, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
          <TouchableOpacity onPress={pickImage} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: c.card }}>
            <Feather name="paperclip" size={18} color={MUTED} />
          </TouchableOpacity>
          <View style={{ flex: 1, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 22, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 10 : 4, minHeight: 44, justifyContent: "center" }}>
            {attachment && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Image source={{ uri: attachment.uri }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>Screenshot attached</Text>
                <TouchableOpacity onPress={() => setAttachment(null)} hitSlop={8}><Feather name="x" size={14} color={MUTED} /></TouchableOpacity>
              </View>
            )}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a reply…"
              placeholderTextColor={MUTED}
              multiline
              style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: c.text, padding: 0, maxHeight: 120 }}
            />
          </View>
          <TouchableOpacity
            onPress={send}
            disabled={(!text.trim() && !attachment) || reply.isPending}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", opacity: (!text.trim() && !attachment) || reply.isPending ? 0.5 : 1 }}
          >
            {reply.isPending ? <ActivityIndicator color={WHITE} size="small" /> : <Feather name="send" size={18} color={WHITE} />}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Bubble({ m, c }: { m: SupportMessage; c: ReturnType<typeof useColors> }) {
  if (m.authorType === "SYSTEM") {
    return (
      <View style={{ alignItems: "center", marginVertical: 2 }}>
        <View style={{ backgroundColor: c.muted, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: c.mutedForeground }}>{m.body}</Text>
        </View>
      </View>
    );
  }

  const mine = m.authorType === "USER";
  return (
    <View style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
      {!mine && m.authorName && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, marginLeft: 4 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c.muted, alignItems: "center", justifyContent: "center" }}>
            <Feather name="user" size={11} color={c.mutedForeground} />
          </View>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: c.text }}>{m.authorName}</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED }}>Support</Text>
        </View>
      )}
      <View style={{
        maxWidth: "82%",
        backgroundColor: mine ? TEAL : c.card,
        borderWidth: mine ? 0 : 1,
        borderColor: c.border,
        borderRadius: 16,
        borderBottomRightRadius: mine ? 4 : 16,
        borderBottomLeftRadius: mine ? 16 : 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}>
        {!!m.attachmentUrl && (
          <Image source={{ uri: m.attachmentUrl }} style={{ width: 200, height: 140, borderRadius: 10, marginBottom: m.body ? 8 : 0, backgroundColor: mine ? "rgba(255,255,255,0.15)" : c.muted }} resizeMode="cover" />
        )}
        {!!m.body && (
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, lineHeight: 21, color: mine ? WHITE : c.text }}>{m.body}</Text>
        )}
      </View>
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginTop: 4, marginHorizontal: 4 }}>{fmtTime(m.createdAt)}</Text>
    </View>
  );
}
