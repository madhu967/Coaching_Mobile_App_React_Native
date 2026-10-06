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
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { UserDetailContext } from "../../context/UserDetailContext";
import Button from "../../components/Shared/Button";

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
        ToastAndroid.show("Sign in successful!", ToastAndroid.SHORT);
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
      style={{ flex: 1, backgroundColor: Colors.WHITE }}
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
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back to Welcome</Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.headerBox}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={32} color={Colors.PRIMARY} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your personalized learning tracks
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          {/* Email Input */}
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={Colors.GRAY} />
            <TextInput
              placeholder="e.g. alex@example.com"
              placeholderTextColor={Colors.LIGHT_GRAY}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInput}
            />
          </View>

          {/* Password Input */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.GRAY} />
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor={Colors.LIGHT_GRAY}
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
                color={Colors.GRAY}
              />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <View style={{ marginTop: 22 }}>
            <Button
              text="Sign In to Student Account"
              type="fill"
              onPress={onSignInClick}
              loading={loading}
            />
          </View>

          {/* Switch to Sign Up */}
          <View style={styles.footerLinkRow}>
            <Text style={styles.footerText}>New to Coaching Guru?</Text>
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
            <Ionicons name="school" size={16} color="#16a34a" />
            <Text style={styles.portalTeacherText}>Teacher Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={styles.portalBtnAdmin}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={16} color="#0284c7" />
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 40,
    backgroundColor: Colors.WHITE,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  headerBox: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "outfit-bold",
    fontSize: 26,
    color: Colors.BLACK,
  },
  subtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 6,
  },
  formCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.DARK,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BG_GRAY,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: "outfit",
    fontSize: 15,
    color: Colors.BLACK,
  },
  footerLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  footerText: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
  },
  footerHighlight: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  portalDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.BORDER_LIGHT,
  },
  dividerText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.LIGHT_GRAY,
    textTransform: "uppercase",
  },
  portalRow: {
    flexDirection: "row",
    gap: 12,
  },
  portalBtnTeacher: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    paddingVertical: 12,
    borderRadius: 12,
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
    backgroundColor: "#f0f9ff",
    paddingVertical: 12,
    borderRadius: 12,
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