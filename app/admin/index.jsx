import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import Button from "../../components/Shared/Button";
import { loginAdmin, getAdminCredentials } from "../../services/adminAuth";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const creds = getAdminCredentials();

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both admin email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin(email, password);
      if (res.success) {
        router.replace("/admin/dashboard");
      } else {
        Alert.alert("Access Denied", res.message);
      }
    } catch (err) {
      console.error("Admin login error:", err);
      Alert.alert("Error", "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: Colors.WHITE }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Link */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/auth/Signin")}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back to Sign In</Text>
        </TouchableOpacity>

        {/* Shield Icon & Header */}
        <View style={styles.headerBox}>
          <View style={styles.shieldIconCircle}>
            <Ionicons name="shield-checkmark" size={46} color={Colors.PRIMARY} />
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>
            Authorized Administrator Access Only
          </Text>
        </View>

        {/* Credentials Card / Helper */}
        <TouchableOpacity
          onPress={handleFillDemo}
          style={styles.envInfoCard}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="key-outline" size={16} color={Colors.PRIMARY} />
            <Text style={styles.envInfoTitle}>Credentials from .env (Tap to Fill)</Text>
          </View>
          <Text style={styles.envInfoDetail}>Email: {creds.email}</Text>
          <Text style={styles.envInfoDetail}>Password: ••••••••••</Text>
        </TouchableOpacity>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Admin Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.GRAY} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="admin@coachingguru.com"
              placeholderTextColor="#9ca3af"
              style={styles.textInput}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 18 }]}>Admin Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.GRAY} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="••••••••••••"
              placeholderTextColor="#9ca3af"
              style={styles.textInput}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.GRAY}
              />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 26 }}>
            <Button
              text="Authenticate & Enter"
              type="fill"
              onPress={handleAdminLogin}
              loading={loading}
            />
          </View>
        </View>

        <Text style={styles.footerNotice}>
          🔒 Secure Administrative Console protected by environment authentication
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
    gap: 6,
  },
  backBtnText: {
    color: Colors.PRIMARY,
    fontFamily: "outfit-bold",
    fontSize: 14,
  },
  headerBox: {
    alignItems: "center",
    marginBottom: 24,
  },
  shieldIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#e8f2ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  title: {
    fontFamily: "outfit-bold",
    fontSize: 28,
    color: "#1e293b",
  },
  subtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
  },
  envInfoCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  envInfoTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.PRIMARY,
  },
  envInfoDetail: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#475569",
    marginTop: 3,
  },
  formCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  inputLabel: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#334155",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    color: "#1e293b",
    fontFamily: "outfit",
    fontSize: 15,
  },
  footerNotice: {
    textAlign: "center",
    fontFamily: "outfit",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 26,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
});
