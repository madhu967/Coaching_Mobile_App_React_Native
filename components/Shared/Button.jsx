import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import Colors from "../../constant/Colors";
import { useTheme } from "../../context/ThemeContext";

export default function Button({
  text,
  type = "fill", // 'fill' (Pitch Black) | 'lime' (Electric Lime / Navy Blue) | 'outline' (White / Bordered)
  onPress,
  loading = false,
  style,
  textStyle,
  icon,
}) {
  const { themeMode } = useTheme();
  const styles = React.useMemo(() => getStyles(), [themeMode]);
  const isFill = type === "fill";
  const isLime = type === "lime";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.82}
      style={[
        styles.buttonBase,
        isFill && styles.buttonFill,
        isLime && styles.buttonLime,
        type === "outline" && styles.buttonOutline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFill ? Colors.WHITE : isLime ? Colors.ON_ACCENT : Colors.BLACK}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.buttonText,
              isFill && styles.buttonTextFill,
              isLime && styles.buttonTextLime,
              type === "outline" && styles.buttonTextOutline,
              textStyle,
            ]}
          >
            {text}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const getStyles = () =>
  StyleSheet.create({
    buttonBase: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      width: "100%",
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    buttonFill: {
      backgroundColor: Colors.BLACK, // Signature Pitch Black
      shadowColor: Colors.BLACK,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    buttonLime: {
      backgroundColor: Colors.LIME_BRIGHT, // Signature Electric Lime or Navy Blue
      shadowColor: Colors.LIME,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    buttonOutline: {
      backgroundColor: Colors.WHITE,
      borderWidth: 1.5,
      borderColor: Colors.BORDER_LIGHT,
    },
    buttonText: {
      fontFamily: "outfit-bold",
      fontSize: 15,
      textAlign: "center",
    },
    buttonTextFill: {
      color: Colors.WHITE,
    },
    buttonTextLime: {
      color: Colors.ON_ACCENT,
    },
    buttonTextOutline: {
      color: Colors.BLACK,
    },
  });