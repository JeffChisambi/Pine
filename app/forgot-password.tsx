import { guardedBack } from "@/utils/navigation";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const BORDER_LIGHT = "#EBEBEB";
const MUTED = "#9CA3AF";
const BG_INPUT = "#F4F4F4";

// ── Country list ──────────────────────────────────────────────────
type Country = { flag: string; code: string; name: string; dial: string };
const COUNTRIES: Country[] = [
  // Featured / regional first
  { flag: "🇲🇼", code: "MW", name: "Malawi",           dial: "+265"  },
  { flag: "🇳🇬", code: "NG", name: "Nigeria",          dial: "+234"  },
  { flag: "🇬🇭", code: "GH", name: "Ghana",            dial: "+233"  },
  { flag: "🇿🇦", code: "ZA", name: "South Africa",     dial: "+27"   },
  { flag: "🇿🇲", code: "ZM", name: "Zambia",           dial: "+260"  },
  { flag: "🇿🇼", code: "ZW", name: "Zimbabwe",         dial: "+263"  },
  { flag: "🇲🇿", code: "MZ", name: "Mozambique",       dial: "+258"  },
  { flag: "🇹🇿", code: "TZ", name: "Tanzania",         dial: "+255"  },
  { flag: "🇰🇪", code: "KE", name: "Kenya",            dial: "+254"  },
  { flag: "🇺🇬", code: "UG", name: "Uganda",           dial: "+256"  },
  { flag: "🇧🇼", code: "BW", name: "Botswana",         dial: "+267"  },
  { flag: "🇳🇦", code: "NA", name: "Namibia",          dial: "+264"  },
  { flag: "🇬🇧", code: "GB", name: "United Kingdom",   dial: "+44"   },
  { flag: "🇺🇸", code: "US", name: "United States",    dial: "+1"    },
  // Alphabetical world list
  { flag: "🇦🇫", code: "AF", name: "Afghanistan",      dial: "+93"   },
  { flag: "🇦🇱", code: "AL", name: "Albania",          dial: "+355"  },
  { flag: "🇩🇿", code: "DZ", name: "Algeria",          dial: "+213"  },
  { flag: "🇦🇸", code: "AS", name: "American Samoa",   dial: "+1684" },
  { flag: "🇦🇩", code: "AD", name: "Andorra",          dial: "+376"  },
  { flag: "🇦🇴", code: "AO", name: "Angola",           dial: "+244"  },
  { flag: "🇦🇷", code: "AR", name: "Argentina",        dial: "+54"   },
  { flag: "🇦🇲", code: "AM", name: "Armenia",          dial: "+374"  },
  { flag: "🇦🇺", code: "AU", name: "Australia",        dial: "+61"   },
  { flag: "🇦🇹", code: "AT", name: "Austria",          dial: "+43"   },
  { flag: "🇦🇿", code: "AZ", name: "Azerbaijan",       dial: "+994"  },
  { flag: "🇧🇸", code: "BS", name: "Bahamas",          dial: "+1242" },
  { flag: "🇧🇭", code: "BH", name: "Bahrain",          dial: "+973"  },
  { flag: "🇧🇩", code: "BD", name: "Bangladesh",       dial: "+880"  },
  { flag: "🇧🇪", code: "BE", name: "Belgium",          dial: "+32"   },
  { flag: "🇧🇿", code: "BZ", name: "Belize",           dial: "+501"  },
  { flag: "🇧🇯", code: "BJ", name: "Benin",            dial: "+229"  },
  { flag: "🇧🇹", code: "BT", name: "Bhutan",           dial: "+975"  },
  { flag: "🇧🇴", code: "BO", name: "Bolivia",          dial: "+591"  },
  { flag: "🇧🇦", code: "BA", name: "Bosnia",           dial: "+387"  },
  { flag: "🇧🇷", code: "BR", name: "Brazil",           dial: "+55"   },
  { flag: "🇧🇳", code: "BN", name: "Brunei",           dial: "+673"  },
  { flag: "🇧🇬", code: "BG", name: "Bulgaria",         dial: "+359"  },
  { flag: "🇧🇫", code: "BF", name: "Burkina Faso",     dial: "+226"  },
  { flag: "🇧🇮", code: "BI", name: "Burundi",          dial: "+257"  },
  { flag: "🇨🇻", code: "CV", name: "Cabo Verde",       dial: "+238"  },
  { flag: "🇰🇭", code: "KH", name: "Cambodia",         dial: "+855"  },
  { flag: "🇨🇲", code: "CM", name: "Cameroon",         dial: "+237"  },
  { flag: "🇨🇦", code: "CA", name: "Canada",           dial: "+1"    },
  { flag: "🇨🇫", code: "CF", name: "Central African Republic", dial: "+236" },
  { flag: "🇹🇩", code: "TD", name: "Chad",             dial: "+235"  },
  { flag: "🇨🇱", code: "CL", name: "Chile",            dial: "+56"   },
  { flag: "🇨🇳", code: "CN", name: "China",            dial: "+86"   },
  { flag: "🇨🇴", code: "CO", name: "Colombia",         dial: "+57"   },
  { flag: "🇰🇲", code: "KM", name: "Comoros",          dial: "+269"  },
  { flag: "🇨🇬", code: "CG", name: "Congo",            dial: "+242"  },
  { flag: "🇨🇷", code: "CR", name: "Costa Rica",       dial: "+506"  },
  { flag: "🇭🇷", code: "HR", name: "Croatia",          dial: "+385"  },
  { flag: "🇨🇺", code: "CU", name: "Cuba",             dial: "+53"   },
  { flag: "🇨🇾", code: "CY", name: "Cyprus",           dial: "+357"  },
  { flag: "🇨🇿", code: "CZ", name: "Czech Republic",   dial: "+420"  },
  { flag: "🇩🇰", code: "DK", name: "Denmark",          dial: "+45"   },
  { flag: "🇩🇯", code: "DJ", name: "Djibouti",         dial: "+253"  },
  { flag: "🇩🇴", code: "DO", name: "Dominican Republic", dial: "+1809" },
  { flag: "🇪🇨", code: "EC", name: "Ecuador",          dial: "+593"  },
  { flag: "🇪🇬", code: "EG", name: "Egypt",            dial: "+20"   },
  { flag: "🇸🇻", code: "SV", name: "El Salvador",      dial: "+503"  },
  { flag: "🇬🇶", code: "GQ", name: "Equatorial Guinea",dial: "+240"  },
  { flag: "🇪🇷", code: "ER", name: "Eritrea",          dial: "+291"  },
  { flag: "🇪🇪", code: "EE", name: "Estonia",          dial: "+372"  },
  { flag: "🇸🇿", code: "SZ", name: "Eswatini",         dial: "+268"  },
  { flag: "🇪🇹", code: "ET", name: "Ethiopia",         dial: "+251"  },
  { flag: "🇫🇯", code: "FJ", name: "Fiji",             dial: "+679"  },
  { flag: "🇫🇮", code: "FI", name: "Finland",          dial: "+358"  },
  { flag: "🇫🇷", code: "FR", name: "France",           dial: "+33"   },
  { flag: "🇬🇦", code: "GA", name: "Gabon",            dial: "+241"  },
  { flag: "🇬🇲", code: "GM", name: "Gambia",           dial: "+220"  },
  { flag: "🇬🇪", code: "GE", name: "Georgia",          dial: "+995"  },
  { flag: "🇩🇪", code: "DE", name: "Germany",          dial: "+49"   },
  { flag: "🇬🇷", code: "GR", name: "Greece",           dial: "+30"   },
  { flag: "🇬🇹", code: "GT", name: "Guatemala",        dial: "+502"  },
  { flag: "🇬🇳", code: "GN", name: "Guinea",           dial: "+224"  },
  { flag: "🇬🇼", code: "GW", name: "Guinea-Bissau",    dial: "+245"  },
  { flag: "🇬🇾", code: "GY", name: "Guyana",           dial: "+592"  },
  { flag: "🇭🇹", code: "HT", name: "Haiti",            dial: "+509"  },
  { flag: "🇭🇳", code: "HN", name: "Honduras",         dial: "+504"  },
  { flag: "🇭🇰", code: "HK", name: "Hong Kong",        dial: "+852"  },
  { flag: "🇭🇺", code: "HU", name: "Hungary",          dial: "+36"   },
  { flag: "🇮🇸", code: "IS", name: "Iceland",          dial: "+354"  },
  { flag: "🇮🇳", code: "IN", name: "India",            dial: "+91"   },
  { flag: "🇮🇩", code: "ID", name: "Indonesia",        dial: "+62"   },
  { flag: "🇮🇷", code: "IR", name: "Iran",             dial: "+98"   },
  { flag: "🇮🇶", code: "IQ", name: "Iraq",             dial: "+964"  },
  { flag: "🇮🇪", code: "IE", name: "Ireland",          dial: "+353"  },
  { flag: "🇮🇱", code: "IL", name: "Israel",           dial: "+972"  },
  { flag: "🇮🇹", code: "IT", name: "Italy",            dial: "+39"   },
  { flag: "🇯🇲", code: "JM", name: "Jamaica",          dial: "+1876" },
  { flag: "🇯🇵", code: "JP", name: "Japan",            dial: "+81"   },
  { flag: "🇯🇴", code: "JO", name: "Jordan",           dial: "+962"  },
  { flag: "🇰🇿", code: "KZ", name: "Kazakhstan",       dial: "+7"    },
  { flag: "🇰🇼", code: "KW", name: "Kuwait",           dial: "+965"  },
  { flag: "🇰🇬", code: "KG", name: "Kyrgyzstan",       dial: "+996"  },
  { flag: "🇱🇦", code: "LA", name: "Laos",             dial: "+856"  },
  { flag: "🇱🇻", code: "LV", name: "Latvia",           dial: "+371"  },
  { flag: "🇱🇧", code: "LB", name: "Lebanon",          dial: "+961"  },
  { flag: "🇱🇸", code: "LS", name: "Lesotho",          dial: "+266"  },
  { flag: "🇱🇷", code: "LR", name: "Liberia",          dial: "+231"  },
  { flag: "🇱🇾", code: "LY", name: "Libya",            dial: "+218"  },
  { flag: "🇱🇹", code: "LT", name: "Lithuania",        dial: "+370"  },
  { flag: "🇱🇺", code: "LU", name: "Luxembourg",       dial: "+352"  },
  { flag: "🇲🇬", code: "MG", name: "Madagascar",       dial: "+261"  },
  { flag: "🇲🇾", code: "MY", name: "Malaysia",         dial: "+60"   },
  { flag: "🇲🇻", code: "MV", name: "Maldives",         dial: "+960"  },
  { flag: "🇲🇱", code: "ML", name: "Mali",             dial: "+223"  },
  { flag: "🇲🇹", code: "MT", name: "Malta",            dial: "+356"  },
  { flag: "🇲🇷", code: "MR", name: "Mauritania",       dial: "+222"  },
  { flag: "🇲🇺", code: "MU", name: "Mauritius",        dial: "+230"  },
  { flag: "🇲🇽", code: "MX", name: "Mexico",           dial: "+52"   },
  { flag: "🇲🇩", code: "MD", name: "Moldova",          dial: "+373"  },
  { flag: "🇲🇳", code: "MN", name: "Mongolia",         dial: "+976"  },
  { flag: "🇲🇪", code: "ME", name: "Montenegro",       dial: "+382"  },
  { flag: "🇲🇦", code: "MA", name: "Morocco",          dial: "+212"  },
  { flag: "🇲🇲", code: "MM", name: "Myanmar",          dial: "+95"   },
  { flag: "🇳🇵", code: "NP", name: "Nepal",            dial: "+977"  },
  { flag: "🇳🇱", code: "NL", name: "Netherlands",      dial: "+31"   },
  { flag: "🇳🇿", code: "NZ", name: "New Zealand",      dial: "+64"   },
  { flag: "🇳🇮", code: "NI", name: "Nicaragua",        dial: "+505"  },
  { flag: "🇳🇪", code: "NE", name: "Niger",            dial: "+227"  },
  { flag: "🇰🇵", code: "KP", name: "North Korea",      dial: "+850"  },
  { flag: "🇲🇰", code: "MK", name: "North Macedonia",  dial: "+389"  },
  { flag: "🇳🇴", code: "NO", name: "Norway",           dial: "+47"   },
  { flag: "🇴🇲", code: "OM", name: "Oman",             dial: "+968"  },
  { flag: "🇵🇰", code: "PK", name: "Pakistan",         dial: "+92"   },
  { flag: "🇵🇦", code: "PA", name: "Panama",           dial: "+507"  },
  { flag: "🇵🇬", code: "PG", name: "Papua New Guinea", dial: "+675"  },
  { flag: "🇵🇾", code: "PY", name: "Paraguay",         dial: "+595"  },
  { flag: "🇵🇪", code: "PE", name: "Peru",             dial: "+51"   },
  { flag: "🇵🇭", code: "PH", name: "Philippines",      dial: "+63"   },
  { flag: "🇵🇱", code: "PL", name: "Poland",           dial: "+48"   },
  { flag: "🇵🇹", code: "PT", name: "Portugal",         dial: "+351"  },
  { flag: "🇵🇷", code: "PR", name: "Puerto Rico",      dial: "+1787" },
  { flag: "🇶🇦", code: "QA", name: "Qatar",            dial: "+974"  },
  { flag: "🇷🇴", code: "RO", name: "Romania",          dial: "+40"   },
  { flag: "🇷🇺", code: "RU", name: "Russia",           dial: "+7"    },
  { flag: "🇷🇼", code: "RW", name: "Rwanda",           dial: "+250"  },
  { flag: "🇸🇦", code: "SA", name: "Saudi Arabia",     dial: "+966"  },
  { flag: "🇸🇳", code: "SN", name: "Senegal",          dial: "+221"  },
  { flag: "🇷🇸", code: "RS", name: "Serbia",           dial: "+381"  },
  { flag: "🇸🇱", code: "SL", name: "Sierra Leone",     dial: "+232"  },
  { flag: "🇸🇬", code: "SG", name: "Singapore",        dial: "+65"   },
  { flag: "🇸🇰", code: "SK", name: "Slovakia",         dial: "+421"  },
  { flag: "🇸🇮", code: "SI", name: "Slovenia",         dial: "+386"  },
  { flag: "🇸🇴", code: "SO", name: "Somalia",          dial: "+252"  },
  { flag: "🇸🇸", code: "SS", name: "South Sudan",      dial: "+211"  },
  { flag: "🇰🇷", code: "KR", name: "South Korea",      dial: "+82"   },
  { flag: "🇪🇸", code: "ES", name: "Spain",            dial: "+34"   },
  { flag: "🇱🇰", code: "LK", name: "Sri Lanka",        dial: "+94"   },
  { flag: "🇸🇩", code: "SD", name: "Sudan",            dial: "+249"  },
  { flag: "🇸🇷", code: "SR", name: "Suriname",         dial: "+597"  },
  { flag: "🇸🇪", code: "SE", name: "Sweden",           dial: "+46"   },
  { flag: "🇨🇭", code: "CH", name: "Switzerland",      dial: "+41"   },
  { flag: "🇸🇾", code: "SY", name: "Syria",            dial: "+963"  },
  { flag: "🇹🇼", code: "TW", name: "Taiwan",           dial: "+886"  },
  { flag: "🇹🇯", code: "TJ", name: "Tajikistan",       dial: "+992"  },
  { flag: "🇹🇭", code: "TH", name: "Thailand",         dial: "+66"   },
  { flag: "🇹🇱", code: "TL", name: "Timor-Leste",      dial: "+670"  },
  { flag: "🇹🇬", code: "TG", name: "Togo",             dial: "+228"  },
  { flag: "🇹🇹", code: "TT", name: "Trinidad & Tobago",dial: "+1868" },
  { flag: "🇹🇳", code: "TN", name: "Tunisia",          dial: "+216"  },
  { flag: "🇹🇷", code: "TR", name: "Turkey",           dial: "+90"   },
  { flag: "🇹🇲", code: "TM", name: "Turkmenistan",     dial: "+993"  },
  { flag: "🇺🇦", code: "UA", name: "Ukraine",          dial: "+380"  },
  { flag: "🇦🇪", code: "AE", name: "United Arab Emirates", dial: "+971" },
  { flag: "🇺🇾", code: "UY", name: "Uruguay",          dial: "+598"  },
  { flag: "🇺🇿", code: "UZ", name: "Uzbekistan",       dial: "+998"  },
  { flag: "🇻🇪", code: "VE", name: "Venezuela",        dial: "+58"   },
  { flag: "🇻🇳", code: "VN", name: "Vietnam",          dial: "+84"   },
  { flag: "🇾🇪", code: "YE", name: "Yemen",            dial: "+967"  },
];

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);

  const fullPhone = selectedCountry.dial + phoneNumber.trim();
  const canSubmit = phoneNumber.trim().length > 0 && !loading;

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dial.includes(countrySearch)
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { authApi } = require("../services/api");
      await authApi.forgotPassword(fullPhone);
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: WHITE }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* ── Country picker modal ── */}
      <Modal visible={showCountryPicker} animationType="slide" statusBarTranslucent>
        <View style={[styles.pickerScreen, { paddingTop: topPad }]}>
          {/* Header */}
          <View style={styles.pickerHeader}>
            <TouchableOpacity
              style={styles.pickerBackBtn}
              onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M15 19l-7-7 7-7" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Select Country</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search row */}
          <View style={styles.pickerSearchRow}>
            <View style={styles.pickerSearchBox}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                <Path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke={MUTED} strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search"
                placeholderTextColor={MUTED}
                value={countrySearch}
                onChangeText={setCountrySearch}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Math.max(bottomPad, 24) }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.countryRow}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryPicker(false);
                  setCountrySearch("");
                }}
              >
                <View style={styles.countryFlagCircle}>
                  <Text style={styles.countryRowFlag}>{item.flag}</Text>
                </View>
                <Text style={styles.countryRowName}>{item.code} - {item.name}</Text>
                <Text style={styles.countryRowDial}>{item.dial}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

          {/* ── Top nav bar ── */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.7}
              onPress={() => guardedBack("/login")}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M5 12l7 7M5 12l7-7"
                  stroke={DARK}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/signup")}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* ── Heading ── */}
          <View style={styles.headingSection}>
            <Text style={styles.headline}>
              {sent ? "OTP Sent!" : "Password Forgotten"}
            </Text>
            <Text style={styles.subheadline}>
              {sent
                ? "We've sent an OTP to your phone number. Check your messages."
                : "Please enter your phone number associated with your Pine account"}
            </Text>
          </View>

          {!sent && (
            <>
              {/* ── Phone row ── */}
              <View style={styles.phoneRow}>
                {/* Country code selector */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.countryBox}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={styles.countryLabel}>Country code</Text>
                  <View style={styles.countryInner}>
                    <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryDialText}>{selectedCountry.dial}</Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M6 9l6 6 6-6"
                        stroke={MUTED}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </TouchableOpacity>

                {/* Phone number input with floating label */}
                <View style={[styles.phoneInputWrap, phoneFocused && styles.phoneInputWrapFocused]}>
                  <Text style={[styles.phoneFloatingLabel, phoneFocused && styles.phoneFloatingLabelFocused]}>
                    Phone Number
                  </Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone Number"
                    placeholderTextColor="transparent"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    value={phoneNumber}
                    onChangeText={(t) => { setPhoneNumber(t.replace(/[^0-9]/g, "")); setErrorMsg(""); }}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                  />
                </View>
              </View>

              {/* ── Hint text ── */}
              <View style={styles.hintWrap}>
                <Text style={styles.hintText}>
                  Please double-check the number as request will be sent to the number.
                </Text>
              </View>

              {/* ── Error ── */}
              {errorMsg ? (
                <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
                  <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* ── Next button ── */}
              <View style={styles.ctaWrap}>
                <TouchableOpacity
                  style={[styles.nextBtn, !canSubmit && { opacity: 0.5 }]}
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {loading ? (
                    <ActivityIndicator color={WHITE} size="small" />
                  ) : (
                    <Text style={styles.nextBtnText}>Next</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {sent && (
            <View style={styles.ctaWrap}>
              <TouchableOpacity
                style={styles.nextBtn}
                activeOpacity={0.85}
                onPress={() => guardedBack("/login")}
              >
                <Text style={styles.nextBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },

  // ── Top bar ─────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  signUpLink: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: TEAL,
  },

  // ── Heading ─────────────────────────────────────────────────────
  headingSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 30,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 38,
    marginBottom: 10,
  },
  subheadline: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    lineHeight: 22,
  },

  // ── Phone row ───────────────────────────────────────────────────
  phoneRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  countryBox: {
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    height: 60,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  countryLabel: {
    position: "absolute",
    top: -9,
    left: 12,
    backgroundColor: WHITE,
    paddingHorizontal: 4,
    fontSize: 10,
    fontFamily: "PlusJakartaSans_500Medium",
    color: MUTED,
    zIndex: 1,
  },
  countryInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  flagText: {
    fontSize: 18,
    lineHeight: 22,
  },
  countryDialText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: DARK,
  },

  // ── Phone input with floating label ─────────────────────────────
  phoneInputWrap: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    backgroundColor: WHITE,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  phoneInputWrapFocused: {
    borderColor: TEAL,
  },
  phoneFloatingLabel: {
    position: "absolute",
    top: -9,
    left: 12,
    backgroundColor: WHITE,
    paddingHorizontal: 4,
    fontSize: 10,
    fontFamily: "PlusJakartaSans_500Medium",
    color: MUTED,
    zIndex: 1,
  },
  phoneFloatingLabelFocused: {
    color: TEAL,
  },
  phoneInput: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },

  // ── Hint ────────────────────────────────────────────────────────
  hintWrap: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  hintText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    lineHeight: 20,
  },

  // ── CTA ─────────────────────────────────────────────────────────
  ctaWrap: {
    paddingHorizontal: 24,
  },
  nextBtn: {
    height: 58,
    backgroundColor: TEAL,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: WHITE,
  },

  // ── Country picker modal ─────────────────────────────────────────
  pickerScreen: {
    flex: 1,
    backgroundColor: WHITE,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
  },
  pickerSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  pickerSearchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_INPUT,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },
  pickerCancelText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_500Medium",
    color: DARK,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  countryFlagCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BG_INPUT,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  countryRowFlag: {
    fontSize: 22,
  },
  countryRowName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_500Medium",
    color: DARK,
  },
  countryRowDial: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },
});
