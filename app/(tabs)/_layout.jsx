import React from "react";
import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";

// Custom Floating Capsule Dock matching the reference UI design
function CustomFloatingTabBar({ state, descriptors, navigation }) {
  const getTabMeta = (routeName) => {
    switch (routeName) {
      case "Home":
        return {
          label: "Events",
          activeIcon: "calendar",
          inactiveIcon: "calendar-outline",
        };
      case "Explore":
        return {
          label: "Courses",
          activeIcon: "git-branch",
          inactiveIcon: "git-branch-outline",
        };
      case "Progress":
        return {
          label: "Stats",
          activeIcon: "stats-chart",
          inactiveIcon: "stats-chart-outline",
        };
      case "Profile":
        return {
          label: "Profile",
          activeIcon: "person",
          inactiveIcon: "person-outline",
        };
      default:
        return {
          label: routeName,
          activeIcon: "ellipse",
          inactiveIcon: "ellipse-outline",
        };
    }
  };

  return (
    <View style={styles.floatingDockWrapper} pointerEvents="box-none">
      <View style={styles.floatingDock}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const meta = getTabMeta(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isFocused) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: true }}
                onPress={onPress}
                activeOpacity={0.88}
                style={styles.activePillCapsule}
              >
                <Ionicons name={meta.activeIcon} size={16} color={Colors.WHITE} />
                <Text style={styles.activePillText}>{meta.label}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: false }}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.inactiveIconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={meta.inactiveIcon}
                size={22}
                color={Colors.MUTED}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const TabLayout = () => {
  return (
    <Tabs
      tabBar={(props) => <CustomFloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="Home" options={{ title: "Events" }} />
      <Tabs.Screen name="Explore" options={{ title: "Courses" }} />
      <Tabs.Screen name="Progress" options={{ title: "Stats" }} />
      <Tabs.Screen name="Profile" options={{ title: "Profile" }} />
    </Tabs>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  floatingDockWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "ios" ? 28 : 18,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 36,
    paddingHorizontal: 12,
    paddingVertical: 7,
    width: "88%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 236, 0.8)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  activePillCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BLACK, // Signature pitch black capsule from reference
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 7,
  },
  activePillText: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
    fontSize: 13,
  },
  inactiveIconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
});
