import React, { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { useTheme } from "../../context/ThemeContext";

const STUDENT_MORE_PAGES = [
  {
    key: "classes",
    title: "Live Classes Studio",
    subtitle: "Join teacher-created live sessions & schedules",
    icon: "videocam",
    color: "#16A34A",
    bg: "#F0FDF4",
    route: "/classes",
  },
  {
    key: "attendance",
    title: "Attendance Tracker",
    subtitle: "Combined & separate Class and Test attendance",
    icon: "calendar",
    color: "#2563EB",
    bg: "#EFF6FF",
    route: "/attendance",
  },
  {
    key: "assignments",
    title: "Assignments Desk",
    subtitle: "Submit pending homework & view graded marks",
    icon: "document-text",
    color: "#EA580C",
    bg: "#FFF7ED",
    route: "/assignments",
  },
  {
    key: "tests",
    title: "Timed Mock Tests",
    subtitle: "Practice exam drills & accuracy radar",
    icon: "timer",
    color: "#7C3AED",
    bg: "#F5F3FF",
    route: "/tests",
  },
  {
    key: "ai",
    title: "AI Doubt Solver & Study Plan",
    subtitle: "24/7 step-by-step AI tutor & 7-day planner",
    icon: "sparkles",
    color: "#0D0D0D",
    bg: "#F4F4F5",
    route: "/ai",
  },
  {
    key: "personalized",
    title: "AI Custom Course Builder",
    subtitle: "Generate custom syllabus tailored to your goal",
    icon: "construct",
    color: "#0284C7",
    bg: "#E0F2FE",
    route: "/courses/personalized",
  },
  {
    key: "notifications",
    title: "Notifications & Alerts",
    subtitle: "Class reminders, test alerts & broadcasts",
    icon: "notifications",
    color: "#DC2626",
    bg: "#FEF2F2",
    route: "/notifications",
  },
];

// Custom Floating Capsule Dock — Maximum 5 items (4 primary tabs + 5th "More" button for all other student pages)
function CustomFloatingTabBar({ state, descriptors, navigation }) {
  const router = useRouter();
  const { themeMode } = useTheme();
  const [showMoreModal, setShowMoreModal] = useState(false);

  const activePillBg = themeMode === "indigo" ? "#1E3A8A" : "#0D0D0D";

  const getTabMeta = (routeName) => {
    switch (routeName) {
      case "Home":
        return {
          label: "Home",
          activeIcon: "home",
          inactiveIcon: "home-outline",
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

  // Enforce max 4 visible route tabs so the 5th item is always the "More" button (5 items total max)
  const visibleRoutes = state.routes.slice(0, 4);

  return (
    <>
      <View style={styles.floatingDockWrapper} pointerEvents="box-none">
        <View style={styles.floatingDock}>
          {visibleRoutes.map((route, index) => {
            const isFocused = state.index === index && !showMoreModal;
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
                  style={[
                    styles.activePillCapsule,
                    { backgroundColor: activePillBg },
                  ]}
                >
                  <Ionicons name={meta.activeIcon} size={15} color={Colors.WHITE} />
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
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Ionicons
                  name={meta.inactiveIcon}
                  size={21}
                  color="#8E8E93"
                />
              </TouchableOpacity>
            );
          })}

          {/* 5th Item: "More" Button to access all other Student Pages */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowMoreModal(true)}
            activeOpacity={0.8}
            style={
              showMoreModal
                ? [styles.activePillCapsule, { backgroundColor: activePillBg }]
                : styles.moreDockBtn
            }
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Ionicons
              name={showMoreModal ? "apps" : "apps-outline"}
              size={18}
              color={showMoreModal ? Colors.WHITE : Colors.BLACK}
            />
            <Text
              style={
                showMoreModal
                  ? styles.activePillText
                  : styles.moreDockBtnText
              }
            >
              More
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Student "More Pages" Navigation Sheet Modal */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowMoreModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalSheet}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <View>
                <Text style={styles.sheetTitle}>Student Portal Pages</Text>
                <Text style={styles.sheetSubtitle}>
                  Quick navigation to all academic modules
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setShowMoreModal(false)}
              >
                <Ionicons name="close" size={20} color={Colors.BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {STUDENT_MORE_PAGES.map((page) => (
                <TouchableOpacity
                  key={page.key}
                  style={styles.pageOptionCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    setShowMoreModal(false);
                    router.push(page.route);
                  }}
                >
                  <View
                    style={[
                      styles.pageIconCircle,
                      { backgroundColor: page.bg },
                    ]}
                  >
                    <Ionicons name={page.icon} size={20} color={page.color} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.pageOptionTitle}>{page.title}</Text>
                    <Text style={styles.pageOptionSub}>{page.subtitle}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.MUTED}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
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
      <Tabs.Screen name="Home" options={{ title: "Home" }} />
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
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 36,
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: "92%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 236, 0.9)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  activePillCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  activePillText: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
    fontSize: 12.5,
  },
  inactiveIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  moreDockBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F1F4",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  moreDockBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 11.5,
    color: Colors.BLACK,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(13, 13, 13, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E4E4E7",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "outfit-bold",
    fontSize: 19,
    color: Colors.BLACK,
  },
  sheetSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.MUTED,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  pageOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EFEFF2",
  },
  pageIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pageOptionTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14.5,
    color: Colors.BLACK,
  },
  pageOptionSub: {
    fontFamily: "outfit",
    fontSize: 11.5,
    color: Colors.MUTED,
    marginTop: 2,
  },
});
