/**
 * KYC Bank Details screen.
 *
 * Collects the user's bank account details (for the CSD account opening form).
 * Inserted between proof-of-residency and KYC processing.
 * The user can skip this step — bank details are not required for KYC approval.
 *
 * Flow: upload-id → selfie → proof-of-residency → HERE → under-review
 */
import { guardedBack } from "@/utils/navigation";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { kycApi } from "../../services/api";

const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

const MALAWI_BANKS = [
  "National Bank of Malawi",
  "Standard Bank Malawi",
  "FDH Bank",
  "NBS Bank",
  "First Capital Bank",
  "CDH Investment Bank",
  "Ecobank Malawi",
  "MyBucks Banking Corporation",
  "Opportunity Bank",
];

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BankIcon({ color }: { color: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function KycBankDetailsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const c = useColors();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const canSubmit = bankName.trim().length > 0 && accountNumber.trim().length >= 10 && accountName.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !applicationId) return;
    setProcessing(true);
    try {
      await kycApi.submitBankAccount(applicationId, bankName.trim(), accountNumber.trim(), accountName.trim());
      await kycApi.process(applicationId);
      router.replace("/kyc/under-review" as any);
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      let msg = "Submission failed. Please try again.";
      if (status >= 500) {
        msg = "Something went wrong on our end. Your documents were saved — please try submitting again.";
      } else if (typeof err?.message === "string" && !err.message.includes("HTTP")) {
        msg = err.message;
      }
      Alert.alert("Submission Failed", msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = async () => {
    if (!applicationId) return;
    setSkipping(true);
    try {
      await kycApi.process(applicationId);
      router.replace("/kyc/under-review" as any);
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      let msg = "Submission failed. Please try again.";
      if (status >= 500) {
        msg = "Something went wrong on our end. Your documents were saved — please try submitting again.";
      } else if (typeof err?.message === "string" && !err.message.includes("HTTP")) {
        msg = err.message;
      }
      Alert.alert("Submission Failed", msg);
    } finally {
      setSkipping(false);
    }
  };

  const busy = processing || skipping;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => guardedBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <BackArrow color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Bank Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <View style={[styles.illustrationCircle, { backgroundColor: c.primary + "15" }]}>
            <BankIcon color={c.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: c.text }]}>Add your bank account</Text>
        <Text style={[styles.subtitle, { color: MUTED }]}>
          This is used for the securities account opening form. Your broker needs your bank details to process trades.
        </Text>

        {/* Bank name */}
        <Text style={[styles.fieldLabel, { color: c.text }]}>Bank Name</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => setShowBankPicker(!showBankPicker)}
          activeOpacity={0.7}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: bankName ? c.text : MUTED, flex: 1 }}>
            {bankName || "Select your bank"}
          </Text>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d={showBankPicker ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        {showBankPicker && (
          <View style={[styles.pickerList, { backgroundColor: c.card, borderColor: c.border }]}>
            {MALAWI_BANKS.map((bank) => (
              <TouchableOpacity
                key={bank}
                style={[styles.pickerItem, bankName === bank && { backgroundColor: c.primary + "12" }]}
                onPress={() => { setBankName(bank); setShowBankPicker(false); }}
                activeOpacity={0.7}
              >
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: bankName === bank ? c.primary : c.text }}>
                  {bank}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Account number */}
        <Text style={[styles.fieldLabel, { color: c.text, marginTop: 18 }]}>Account Number</Text>
        <View style={[styles.input, { backgroundColor: c.card, borderColor: c.border }]}>
          <TextInput
            style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: c.text, padding: 0 }}
            placeholder="Enter account number"
            placeholderTextColor={MUTED}
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ""))}
            maxLength={20}
            editable={!busy}
          />
        </View>

        {/* Account name */}
        <Text style={[styles.fieldLabel, { color: c.text, marginTop: 18 }]}>Account Holder Name</Text>
        <View style={[styles.input, { backgroundColor: c.card, borderColor: c.border }]}>
          <TextInput
            style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: c.text, padding: 0 }}
            placeholder="Name as it appears on the account"
            placeholderTextColor={MUTED}
            autoCapitalize="words"
            value={accountName}
            onChangeText={setAccountName}
            editable={!busy}
          />
        </View>

        {/* Info note */}
        <View style={styles.noteRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[styles.noteText, { color: MUTED }]}>
            This is your bank account number, not your card details. It will be included in your CSD account opening form.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: c.primary }, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={canSubmit ? 0.88 : 1}
          disabled={busy}
        >
          {processing ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          activeOpacity={0.7}
          disabled={busy}
        >
          {skipping ? (
            <ActivityIndicator color={MUTED} size="small" />
          ) : (
            <Text style={[styles.skipText, { color: MUTED }]}>Skip for now</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  illustrationWrap: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  illustrationCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  fieldLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  pickerList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  noteText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
  },
});
