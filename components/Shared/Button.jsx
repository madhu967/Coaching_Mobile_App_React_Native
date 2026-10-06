import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import Colors from "../../constant/Colors";

export default function Button({
  text,
  type = "fill", // 'fill' (Pitch Black) | 'lime' (Electric Lime) | 'outline' (White / Bordered)
  onPress,
  loading = false,
  style,
  textStyle,
  icon,
}) {
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
          color={isFill ? Colors.WHITE : Colors.BLACK}
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.LIME_BRIGHT, // Signature Electric Lime
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
    color: Colors.BLACK,
  },
  buttonTextOutline: {
    color: Colors.BLACK,
  },
});