import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { UserDetailContext } from "../context/UserDetailContext";
import { RoleProvider } from "../context/RoleContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { QUICKSAND_FONT_MAP } from "../constant/Fonts";
import Colors from "../constant/Colors";

function ThemedStack({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { colors } = useTheme();
  return (
    <Stack
      key={fontsLoaded ? "fonts-loaded" : "fonts-fallback"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.BG_LIGHT },
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
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError && !readyFallback) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.BG_LIGHT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="small" color={Colors.BLACK} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <RoleProvider>
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
          <ThemedStack fontsLoaded={Boolean(fontsLoaded)} />
        </UserDetailContext.Provider>
      </RoleProvider>
    </ThemeProvider>
  );
}

