import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { UserDetailContext } from "../context/UserDetailContext";
import { RoleProvider } from "../context/RoleContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { QUICKSAND_FONT_MAP } from "../constant/Fonts";
import Colors from "../constant/Colors";
import BrandLogo from "../components/Common/BrandLogo";

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected runtime error",
    };
  }

  componentDidCatch(error: any, info: any) {
    console.warn("RootErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <BrandLogo size={72} style={{ marginBottom: 16 }} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#0D0D0D",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Coaching Guru
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            {this.state.errorMessage}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, errorMessage: "" })}
            style={{
              backgroundColor: "#0D0D0D",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
              Reload App
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function ThemedStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors?.BG_LIGHT || "#F6F7FA" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(QUICKSAND_FONT_MAP);
  const [readyFallback, setReadyFallback] = useState(false);
  const [userDetail, setUserDetail] = useState();

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const styleId = "quicksand-google-font-global";
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');
          * {
            font-family: 'Quicksand', 'outfit', 'outfit-bold', sans-serif !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
    }

    const timer = setTimeout(() => {
      setReadyFallback(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError && !readyFallback) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BrandLogo size={96} />
      </View>
    );
  }

  return (
    <RootErrorBoundary>
      <ThemeProvider>
        <RoleProvider>
          <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            <ThemedStack />
          </UserDetailContext.Provider>
        </RoleProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}


