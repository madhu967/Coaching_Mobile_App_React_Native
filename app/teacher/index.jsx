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
import { loginTeacher } from "../../services/teacherAuth";

export default function TeacherLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTeacherLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both teacher email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginTeacher(email, password);
      if (res.success) {
        router.replace("/teacher/dashboard");
      } else {
        Alert.alert("Authentication Failed", res.message);
      }
    } catch (err) {
      console.error("Teacher login error:", err);
      Alert.alert("Error", "An unexpected error occurred during faculty login.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("sarah.jenkins@coachingguru.com");
    setPassword("Teacher@123");
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

        {/* Header Icon & Title */}
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={44} color="#16a34a" />
          </View>
          <Text style={styles.title}>Faculty Portal</Text>
          <Text style={styles.subtitle}>
            Authorized Teacher & Instructor Access
          </Text>
        </View>

        {/* Credentials Info Helper */}
        <TouchableOpacity
          onPress={handleFillDemo}
          style={styles.infoCard}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="key-outline" size={16} color="#16a34a" />
            <Text style={styles.infoCardTitle}>Sample Faculty Account (Tap to Fill)</Text>
          </View>
          <Text style={styles.infoCardDetail}>Email: sarah.jenkins@coachingguru.com</Text>
          <Text style={styles.infoCardDetail}>Password: Teacher@123</Text>
          <Text style={styles.infoCardSub}>
            New teachers are registered directly by Admin in Admin Console.
          </Text>
        </TouchableOpacity>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Teacher Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.GRAY} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="faculty@coachingguru.com"
              placeholderTextColor="#9ca3af"
              style={styles.textInput}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 18 }]}>Password</Text>
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

          <View style={{ marginTop: 24 }}>
            <Button
              text="Authenticate & Enter Portal"
              type="fill"
              onPress={handleTeacherLogin}
              loading={loading}
            />
          </View>
        </View>

        <Text style={styles.footerNotice}>
          🎓 Manage live classes, grade assignments & monitor student performance
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
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
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
  infoCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  infoCardTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#16a34a",
  },
  infoCardDetail: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#1e293b",
    marginTop: 3,
  },
  infoCardSub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#166534",
    marginTop: 6,
    fontStyle: "italic",
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
