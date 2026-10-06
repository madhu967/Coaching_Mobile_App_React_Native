import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { UserDetailContext } from "../context/UserDetailContext";
import { RoleProvider } from "../context/RoleContext";
import { useEffect, useState } from "react";
import { Platform, Text, TextInput, View, ActivityIndicator } from "react-native";
import { QUICKSAND_FONT_MAP } from "../constant/Fonts";
import Colors from "../constant/Colors";

// Apply Quicksand globally as the default font for all Text and TextInput elements
const applyGlobalQuicksandDefaults = () => {
  const defaultFontStyle = { fontFamily: "outfit" };
  const TextAny = Text as any;
  const TextInputAny = TextInput as any;

  if (TextAny.defaultProps == null) TextAny.defaultProps = {};
  TextAny.defaultProps.style = [defaultFontStyle, TextAny.defaultProps.style];

  if (TextInputAny.defaultProps == null) TextInputAny.defaultProps = {};
  TextInputAny.defaultProps.style = [
    defaultFontStyle,
    TextInputAny.defaultProps.style,
  ];
};

applyGlobalQuicksandDefaults();

export default function RootLayout() {
  // Load Google Font Quicksand (wght 300..700) for all app font aliases
  const [fontsLoaded, fontError] = useFonts(QUICKSAND_FONT_MAP);
  const [readyFallback, setReadyFallback] = useState(false);
  const [userDetail, setUserDetail] = useState();

  useEffect(() => {
    // Inject @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap') on Web
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

    // Safety fallback timer so the app never hangs if offline
    const timer = setTimeout(() => {
      setReadyFallback(true);
    }, 1500);

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
    <RoleProvider>
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        <Stack
          key={fontsLoaded ? "quicksand-loaded" : "quicksand-fallback"}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.BG_LIGHT },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </UserDetailContext.Provider>
    </RoleProvider>
  );
}
