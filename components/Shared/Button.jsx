import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import Colors from "../../constant/Colors";

export default function Button({
  text,
  type = "fill",
  onPress,
  loading = false,
  style,
  textStyle,
  icon,
}) {
  const isFill = type === "fill";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.82}
      style={[
        styles.buttonBase,
        isFill ? styles.buttonFill : styles.buttonOutline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFill ? Colors.WHITE : Colors.PRIMARY}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.buttonText,
              isFill ? styles.buttonTextFill : styles.buttonTextOutline,
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
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonFill: {
    backgroundColor: Colors.PRIMARY,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonOutline: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1.5,
    borderColor: Colors.PRIMARY,
  },
  buttonText: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    textAlign: "center",
  },
  buttonTextFill: {
    color: Colors.WHITE,
  },
  buttonTextOutline: {
    color: Colors.PRIMARY,
  },
});