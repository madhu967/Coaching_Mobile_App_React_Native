import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { UserDetailContext } from "../../context/UserDetailContext";
import { auth } from "../../config/firebaseConfig";
import { signOut } from "firebase/auth";
import { getAllCourses } from "../../services/courseStorage";
import { getLmsStore } from "../../services/lmsStore";

const Profile = () => {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [courses, setCourses] = useState([]);
  const [lmsStore, setLmsStore] = useState(null);

  const loadStats = async () => {
    try {
      const [coursesData, storeData] = await Promise.all([
        getAllCourses(),
        getLmsStore(),
      ]);
      setCourses(coursesData || []);
      setLmsStore(storeData || null);
    } catch (e) {
      console.warn("Profile stats load error:", e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const coursesCount = courses.length;
  let completedTopicsCount = 0;
  courses.forEach((c) => {
    const list = Array.isArray(c.completedTopicIds) ? c.completedTopicIds : [];
    completedTopicsCount += list.length;
  });

  const attendancePercent = lmsStore?.attendance?.overallPercentage ?? 0;
  const recentScore =
    lmsStore?.tests?.find((t) => t.completed && t.recentScore)?.recentScore
      ?.accuracy ?? 0;
  const streakDays = lmsStore?.performance?.learningStreakDays ?? 0;

  // Dynamic greeting based on time of day
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning,"
      : currentHour < 17
      ? "Good afternoon,"
      : "Good evening,";

  const userName =
    userDetail?.name ||
    userDetail?.email?.split("@")[0] ||
    "Scholar";

  const userEmail =
    userDetail?.email ||
    auth?.currentUser?.email ||
    "scholar@coachingguru.com";

  const userInitial = userName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            setUserDetail(null);
            router.replace("/");
          } catch (err) {
            router.replace("/");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* ===============================================================
          1. TOP HEADER NAVBAR (Full-bleed UI theme background, Dynamic Greeting, PRO Badge, Sign Out Icon)
          =============================================================== */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeSub}>{greeting}</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>

        <View style={styles.headerRightGroup}>
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.signOutHeaderBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===============================================================
            2. DISPLAY TITLE ("Academic Account / Scholar Profile")
            =============================================================== */}
        <View style={styles.headingSection}>
          <Text style={styles.displaySubHeading}>Academic Account</Text>
          <View style={styles.displayMainRow}>
            <Text style={styles.displayMainHeading}>Scholar Profile</Text>
            <Text style={styles.superscriptBadge}>({coursesCount || 1} Tracks)</Text>
          </View>
        </View>

        {/* ===============================================================
            3. SCHOLAR IDENTIFICATION CARD (Electric Lime Border, 4-Stat Strip)
            =============================================================== */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            {/* Signature Electric Lime Active Indicator Dot */}
            <View style={styles.activeLimeDot} />
          </View>

          <Text style={styles.cardUserName}>{userName}</Text>
          <Text style={styles.userEmailText}>{userEmail}</Text>

          {/* Academic Standing Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.limeActivePill}>
              <Ionicons name="sparkles" size={11} color={Colors.BLACK} />
              <Text style={styles.limeActiveText}>Verified Scholar</Text>
            </View>
            <View style={styles.streakPill}>
              <Text style={styles.streakPillText}>🔥 {streakDays}d Streak</Text>
            </View>
            <View style={styles.blackProPill}>
              <Text style={styles.blackProText}>BATCH 2026</Text>
            </View>
          </View>

          {/* 4-Stat Metric Strip */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{coursesCount}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.cellDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{completedTopicsCount}</Text>
              <Text style={styles.statLabel}>Modules Done</Text>
            </View>
            <View style={styles.cellDivider} />
            <TouchableOpacity
              style={styles.statCell}
              onPress={() => router.push("/attendance")}
              activeOpacity={0.8}
            >
              <Text style={styles.statNum}>{attendancePercent}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </TouchableOpacity>
            <View style={styles.cellDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{recentScore}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        {/* ===============================================================
            4. QUICK ACCESS LEARNING HUBS (2x2 Modern Action Tiles)
            =============================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>ACADEMIC PORTALS</Text>
        </View>

        <View style={styles.quickGrid}>
          {/* Personalized Course Builder */}
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => router.push("/courses/personalized")}
            activeOpacity={0.85}
          >
            <View style={styles.quickTileLimeIcon}>
              <Ionicons name="sparkles" size={18} color={Colors.BLACK} />
            </View>
            <Text style={styles.quickTileTitle}>AI Course Builder</Text>
            <Text style={styles.quickTileSub}>Tailored to your needs</Text>
          </TouchableOpacity>

          {/* Live Studio Classes */}
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => router.push("/classes")}
            activeOpacity={0.85}
          >
            <View style={styles.quickTileIconBox}>
              <Ionicons name="videocam-outline" size={18} color={Colors.BLACK} />
            </View>
            <Text style={styles.quickTileTitle}>Live Studios</Text>
            <Text style={styles.quickTileSub}>Faculty sessions & replays</Text>
          </TouchableOpacity>

          {/* Timed Practice Drills */}
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => router.push("/tests")}
            activeOpacity={0.85}
          >
            <View style={styles.quickTileIconBox}>
              <Ionicons name="timer-outline" size={18} color={Colors.BLACK} />
            </View>
            <Text style={styles.quickTileTitle}>Timed Tests</Text>
            <Text style={styles.quickTileSub}>Mock exam drills</Text>
          </TouchableOpacity>

          {/* Assignments Desk */}
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => router.push("/assignments")}
            activeOpacity={0.85}
          >
            <View style={styles.quickTileIconBox}>
              <Ionicons name="document-text-outline" size={18} color={Colors.BLACK} />
            </View>
            <Text style={styles.quickTileTitle}>Assignments</Text>
            <Text style={styles.quickTileSub}>Submit solutions & marks</Text>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            5. STAFF & MANAGEMENT DEDICATED PORTALS
            =============================================================== */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeading}>AUTHORIZED PORTALS</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/teacher")}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="school-outline" size={16} color="#16a34a" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Teacher Portal</Text>
              <Text style={styles.menuSub}>Faculty studio, class roster & grades</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push("/admin")}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#0284c7" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Admin Console</Text>
              <Text style={styles.menuSub}>Platform management, teachers & broadcast</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.MUTED} />
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            6. SESSION & PREFERENCES
            =============================================================== */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeading}>PREFERENCES & SESSION</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="notifications-outline" size={16} color={Colors.BLACK} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Push Notifications</Text>
              <Text style={styles.menuSub}>Class reminders & test schedule alerts</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={[styles.menuTitle, { color: "#EF4444" }]}>Sign Out</Text>
              <Text style={styles.menuSub}>Disconnect session safely</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_LIGHT,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },

  /* Top Header Navbar — Full-bleed edge-to-edge UI Theme Background */
  topHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.LIME,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 42,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#B8E62E",
  },
  welcomeSub: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "rgba(13, 13, 13, 0.72)",
  },
  userNameText: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.BLACK,
    marginTop: 1,
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proBadge: {
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.WHITE,
    letterSpacing: 0.5,
  },
  signOutHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(13, 13, 13, 0.12)",
  },

  /* Display Headings */
  headingSection: {
    marginBottom: 20,
  },
  displaySubHeading: {
    fontFamily: "outfit",
    fontSize: 28,
    color: Colors.MUTED,
    letterSpacing: -0.5,
  },
  displayMainRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  displayMainHeading: {
    fontFamily: "outfit-bold",
    fontSize: 32,
    color: Colors.BLACK,
    letterSpacing: -0.8,
  },
  superscriptBadge: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.MUTED,
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.CHIP_BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.WHITE,
  },
  avatarText: {
    fontFamily: "outfit-bold",
    fontSize: 30,
    color: Colors.BLACK,
  },
  activeLimeDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: Colors.LIME,
    borderWidth: 2.5,
    borderColor: Colors.WHITE,
  },
  cardUserName: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: Colors.BLACK,
    letterSpacing: -0.4,
  },
  userEmailText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 18,
  },
  limeActivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIME,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  limeActiveText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.BLACK,
  },
  streakPill: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  streakPillText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: "#EA580C",
  },
  blackProPill: {
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  blackProText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.WHITE,
    letterSpacing: 0.4,
  },

  /* 4 Stats Row */
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER_LIGHT,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.BLACK,
  },
  statLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 2,
  },
  cellDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.BORDER_LIGHT,
  },

  /* Section Header */
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.MUTED,
    letterSpacing: 0.8,
  },

  /* Quick Tiles Grid */
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  quickTile: {
    width: "48%",
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  quickTileLimeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.LIME,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickTileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.CHIP_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickTileTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
  },
  quickTileSub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 2,
  },

  /* Menu Groups */
  menuGroup: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  groupHeading: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.MUTED,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER_LIGHT,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.CHIP_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.BLACK,
  },
  menuSub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 1,
  },
});