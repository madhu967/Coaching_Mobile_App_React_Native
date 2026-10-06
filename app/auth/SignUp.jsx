import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { UserDetailContext } from "../../context/UserDetailContext";
import Button from "../../components/Shared/Button";

const SignUp = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setUserDetail } = useContext(UserDetailContext);
  const [loading, setLoading] = useState(false);

  const CreateNewAccount = () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Please fill all required fields", ToastAndroid.SHORT);
      } else {
        Alert.alert("Missing Fields", "Please enter your name, email, and password.");
      }
      return;
    }

    setLoading(true);
    createUserWithEmailAndPassword(auth, email.trim(), password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await SaveUser(user);
        setLoading(false);
        if (Platform.OS === "android") {
          ToastAndroid.show("Account created successfully! Welcome 🎉", ToastAndroid.SHORT);
        }
        router.replace("/Home");
      })
      .catch((error) => {
        console.log(error.code, error.message);
        setLoading(false);
        if (Platform.OS === "android") {
          ToastAndroid.show(error.message || "Error creating account", ToastAndroid.SHORT);
        } else {
          Alert.alert("Registration Error", error.message || "Could not register account.");
        }
      });
  };

  const SaveUser = async (user) => {
    try {
      await setDoc(doc(db, "users", email.trim()), {
        name: fullName.trim(),
        email: email.trim(),
        member: true,
        uid: user?.uid,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.log("Error saving user to database:", error);
    }

    setUserDetail({
      name: fullName.trim(),
      email: email.trim(),
      member: true,
      uid: user?.uid,
    });
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
          <Text style={styles.headerSub}>Start Your Journey</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Coaching Guru to access personalized learning curriculums
          </Text>
        </View>

        {/* ===============================================================
            HERO IMAGE FROM INTERNET AT TOP OF FORM (As explicitly requested)
            =============================================================== */}
        <View style={styles.heroImageWrapper}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&auto=format&fit=crop&q=80",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroImageBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.BLACK} />
            <Text style={styles.heroImageBadgeText}>50,000+ Active Scholars</Text>
          </View>
        </View>

        {/* Input Form Card */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color={Colors.MUTED} />
            <TextInput
              placeholder="e.g. Alex Morgan"
              placeholderTextColor={Colors.LIGHT_GRAY}
              value={fullName}
              onChangeText={setFullName}
              style={styles.textInput}
            />
          </View>

          {/* Email */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={Colors.MUTED} />
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

          {/* Password */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.MUTED} />
            <TextInput
              placeholder="Choose a strong password"
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
                color={Colors.MUTED}
              />
            </TouchableOpacity>
          </View>

          {/* Create Account Button (Pitch Black Capsule) */}
          <View style={{ marginTop: 22 }}>
            <Button
              text="Create Free Account"
              type="fill"
              onPress={CreateNewAccount}
              loading={loading}
            />
          </View>

          {/* Switch to Sign In */}
          <View style={styles.footerLinkRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/auth/Signin")}>
              <Text style={styles.footerHighlight}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 46,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    alignSelf: "flex-start",
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
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
  },
  title: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: Colors.BLACK,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
    marginTop: 4,
    lineHeight: 18,
  },

  /* Internet Image Hero at top of form */
  heroImageWrapper: {
    height: 155,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    marginBottom: 18,
    backgroundColor: Colors.BLACK,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 13, 13, 0.35)",
  },
  heroImageBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIME,
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
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputLabel: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.CHIP_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: "outfit",
    fontSize: 14,
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
    fontSize: 13,
    color: Colors.MUTED,
  },
  footerHighlight: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
  },
});