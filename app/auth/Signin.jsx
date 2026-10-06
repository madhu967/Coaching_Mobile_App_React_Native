import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  Alert,
  Platform,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { UserDetailContext } from "../../context/UserDetailContext";

const Signin = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setUserDetail } = useContext(UserDetailContext);
  const [loading, setLoading] = useState(false);

  const onSignInClick = async () => {
    if (!email.trim() || !password.trim()) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Please enter email and password", ToastAndroid.SHORT);
      } else {
        Alert.alert("Missing Fields", "Please enter your email and password.");
      }
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;
      await getUserDetail(user);
      if (Platform.OS === "android") {
        ToastAndroid.show("Sign in successful! Welcome back 🎉", ToastAndroid.SHORT);
      }
      router.replace("/Home");
    } catch (error) {
      console.log(error.code, error.message);
      if (Platform.OS === "android") {
        ToastAndroid.show(
          "Invalid credentials. Please verify your email and password.",
          ToastAndroid.LONG
        );
      } else {
        Alert.alert(
          "Sign In Failed",
          "Invalid credentials. Please verify your email and password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserDetail = async (user) => {
    try {
      const result = await getDoc(doc(db, "users", email.trim()));
      if (result.exists()) {
        setUserDetail(result.data());
      } else {
        setUserDetail({
          email: user?.email || email.trim(),
          name: user?.displayName || email.split("@")[0],
        });
      }
    } catch (e) {
      setUserDetail({
        email: user?.email || email.trim(),
        name: user?.displayName || email.split("@")[0],
      });
    }
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
          onPress={() => router.replace("/")}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.BLACK} />
          <Text style={styles.backBtnText}>Back to Welcome</Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.headerBox}>
          <Text style={styles.headerSub}>Welcome Back</Text>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Continue your personalized coaching & study roadmap
          </Text>
        </View>

        {/* ===============================================================
            HERO IMAGE BANNER AT TOP OF FORM (Internet Unsplash Image)
            =============================================================== */}
        <View style={styles.heroImageWrapper}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&auto=format&fit=crop&q=80",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroImageBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.BLACK} />
            <Text style={styles.heroImageBadgeText}>Scholar Access Portal</Text>
          </View>
        </View>

        {/* Input Form Card */}
        <View style={styles.formCard}>
          {/* Email Address */}
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={Colors.MUTED} />
            <TextInput
              placeholder="e.g. scholar@coachingguru.com"
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
              placeholder="Enter your password"
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

          {/* Submit Button (Pitch Black Capsule with Electric Lime Arrow) */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={onSignInClick}
            disabled={loading}
            activeOpacity={0.88}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Signing In..." : "Sign In to Student Account"}
            </Text>
            <View style={styles.submitArrowCircle}>
              <Ionicons name="arrow-forward" size={14} color={Colors.BLACK} />
            </View>
          </TouchableOpacity>

          {/* Switch to Sign Up */}
          <View style={styles.footerLinkRow}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/auth/SignUp")}>
              <Text style={styles.footerHighlight}> Create Free Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dedicated Portals Section */}
        <View style={styles.portalDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Staff & Management Access</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.portalRow}>
          <TouchableOpacity
            onPress={() => router.push("/teacher")}
            style={styles.portalBtnTeacher}
            activeOpacity={0.8}
          >
            <Ionicons name="school-outline" size={16} color="#16a34a" />
            <Text style={styles.portalTeacherText}>Teacher Portal</Text>
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
};

export default Signin;

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
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 13, 15, 0.35)",
  },
  heroImageBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIME, // Electric Lime Badge
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

  /* Footer Links */
  footerLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  footerText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
  },
  footerHighlight: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
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
  portalBtnTeacher: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.WHITE,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 6,
  },
  portalTeacherText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#16a34a",
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