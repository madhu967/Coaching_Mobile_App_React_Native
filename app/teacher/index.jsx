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
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
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
      const res = await loginTeacher(email.trim(), password);
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
      style={{ flex: 1, backgroundColor: Colors.BG_LIGHT }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Link */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/auth/Signin")}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.BLACK} />
          <Text style={styles.backBtnText}>Back to Student Sign In</Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.headerBox}>
          <Text style={styles.headerSub}>Faculty & Instructor Access</Text>
          <Text style={styles.title}>Teacher Portal</Text>
          <Text style={styles.subtitle}>
            Manage live masterclasses, assignments & cohort attendance
          </Text>
        </View>

        {/* ===============================================================
            HERO IMAGE BANNER AT TOP OF FORM (Internet Education Photo)
            =============================================================== */}
        <View style={styles.heroImageWrapper}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&auto=format&fit=crop&q=80",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroImageBadge}>
            <Ionicons name="school" size={12} color={Colors.BLACK} />
            <Text style={styles.heroImageBadgeText}>Faculty Console</Text>
          </View>
        </View>

        {/* Quick Demo Credential Helper Pill */}
        <TouchableOpacity
          onPress={handleFillDemo}
          style={styles.demoFillCard}
          activeOpacity={0.85}
        >
          <View style={styles.demoFillTop}>
            <View style={styles.demoLimeDot} />
            <Text style={styles.demoFillTitle}>Demo Faculty Account (Tap to Fill)</Text>
          </View>
          <Text style={styles.demoFillCred}>sarah.jenkins@coachingguru.com • Teacher@123</Text>
        </TouchableOpacity>

        {/* Input Form Card */}
        <View style={styles.formCard}>
          {/* Email Address */}
          <Text style={styles.inputLabel}>Teacher Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={Colors.MUTED} />
            <TextInput
              placeholder="e.g. sarah.jenkins@coachingguru.com"
              placeholderTextColor={Colors.MUTED}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInput}
            />
          </View>

          {/* Password */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.MUTED} />
            <TextInput
              placeholder="Enter faculty password"
              placeholderTextColor={Colors.MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.textInput}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={Colors.MUTED}
              />
            </TouchableOpacity>
          </View>

          {/* Submit Button (Pitch Black Capsule with Electric Lime Arrow Circle) */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleTeacherLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Authenticating..." : "Sign In to Faculty Studio"}
            </Text>
            <View style={styles.submitArrowCircle}>
              <Ionicons name="arrow-forward" size={14} color={Colors.BLACK} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Portal Switcher Divider */}
        <View style={styles.portalDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Other Portals</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.portalRow}>
          <TouchableOpacity
            onPress={() => router.push("/auth/Signin")}
            style={styles.portalBtnStudent}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={16} color={Colors.BLACK} />
            <Text style={styles.portalStudentText}>Student Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={styles.portalBtnAdmin}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="#0284c7" />
            <Text style={styles.portalAdminText}>Admin Console</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 14 : 44,
    paddingBottom: 40,
    backgroundColor: Colors.BG_LIGHT,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
  },
  headerBox: {
    marginBottom: 16,
  },
  headerSub: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: Colors.BLACK,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.MUTED,
    marginTop: 4,
    lineHeight: 20,
  },

  /* Hero Image Banner */
  heroImageWrapper: {
    width: "100%",
    height: 150,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 13, 15, 0.4)",
  },
  heroImageBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIME, // Electric Lime Tag
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  heroImageBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.BLACK,
  },

  /* Demo Fill Card */
  demoFillCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  demoFillTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  demoLimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.LIME,
  },
  demoFillTitle: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
  },
  demoFillCred: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 2,
    marginLeft: 14,
  },

  /* Form Card */
  formCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputLabel: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.CHIP_BG,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.BLACK,
  },

  /* Submit Button */
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BLACK,
    borderRadius: 18,
    height: 52,
    marginTop: 20,
    gap: 10,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.WHITE,
    letterSpacing: 0.2,
  },
  submitArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.LIME,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Portal Divider */
  portalDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.BORDER,
  },
  dividerText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  /* Portal Row */
  portalRow: {
    flexDirection: "row",
    gap: 10,
  },
  portalBtnStudent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.WHITE,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    gap: 6,
  },
  portalStudentText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
  },
  portalBtnAdmin: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.WHITE,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bae6fd",
    gap: 6,
  },
  portalAdminText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#0284c7",
  },
});
