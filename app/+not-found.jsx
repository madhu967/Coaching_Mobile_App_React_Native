import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../constant/Colors";

export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      router.replace("/Home");
      return;
    }

    const lower = pathname.toLowerCase();

    // Auto-resolve any legacy or alias tab navigations
    if (lower.includes("explore")) {
      router.replace("/Explore");
    } else if (lower.includes("progress") || lower.includes("performance")) {
      router.replace("/Progress");
    } else if (lower.includes("profile")) {
      router.replace("/Profile");
    } else if (lower.includes("addcourse")) {
      router.replace("/addCourse");
    } else if (lower.includes("home") || lower.includes("(tabs)")) {
      router.replace("/Home");
    }
  }, [pathname]);

  return (
    <View style={styles.container}>
      <Ionicons name="compass-outline" size={60} color={Colors.PRIMARY} />
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>
        The page you are looking for ({pathname || "route"}) is not available.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/Home")}
      >
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: "#1e293b",
    marginTop: 14,
  },
  subtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: "outfit-bold",
    color: Colors.WHITE,
    fontSize: 15,
  },
});
