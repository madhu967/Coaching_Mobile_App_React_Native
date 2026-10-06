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
            <Ionicons name="sparkles" size={28} color={Colors.PRIMARY} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Coaching Guru to access personalized learning curriculums
          </Text>
        </View>

        {/* Input Form Card */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color={Colors.GRAY} />
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

          {/* Password */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.GRAY} />
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
                color={Colors.GRAY}
              />
            </TouchableOpacity>
          </View>

          {/* Create Account Button */}
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
              <Text style={styles.footerHighlight}> Sign In Here</Text>
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
});