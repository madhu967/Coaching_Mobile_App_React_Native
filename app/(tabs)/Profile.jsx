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

  // Compute User Statistics
  const coursesCount = courses.length;
  let completedTopicsCount = 0;
  courses.forEach((c) => {
    const list = Array.isArray(c.completedTopicIds) ? c.completedTopicIds : [];
    completedTopicsCount += list.length;
  });

  const attendancePercent = lmsStore?.attendance?.overallPercentage || 92;
  const recentScore =
    lmsStore?.tests?.find((t) => t.completed && t.recentScore)?.recentScore
      ?.accuracy || 88;

  const userName =
    userDetail?.name ||
    auth?.currentUser?.displayName ||
    userDetail?.email?.split("@")[0] ||
    "Student";

  const userEmail =
    userDetail?.email ||
    auth?.currentUser?.email ||
    "scholar@coachingguru.com";

  const userInitial = userName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Coaching Guru?", [
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
            console.error("Sign out error:", err);
            router.replace("/");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Safe Top Padding */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Scholar Profile 🎓</Text>
          <Text style={styles.headerSubtitle}>Academic portfolio & student record</Text>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.signOutHeaderBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.DANGER} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scholar Identification Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark" size={11} color={Colors.WHITE} />
            </View>
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>

          <View style={styles.roleBadgeContainer}>
            <View style={styles.scholarBadge}>
              <Ionicons name="school" size={13} color={Colors.PRIMARY} />
              <Text style={styles.scholarBadgeText}>Active Scholar</Text>
            </View>
            <View style={styles.uidBadge}>
              <Text style={styles.uidBadgeText}>Batch 2026</Text>
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
              <Text style={styles.statLabel}>Topics Done</Text>
            </View>
            <View style={styles.cellDivider} />
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: Colors.PRIMARY }]}>
                {attendancePercent}%
              </Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <View style={styles.cellDivider} />
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: "#16a34a" }]}>
                {recentScore}%
              </Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </View>
        </View>

        {/* Academic Modules & Portals */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeading}>Academic Modules</Text>

          {/* Live Classes */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/classes")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="videocam" size={18} color="#dc2626" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Live Classes & Recordings</Text>
              <Text style={styles.menuSub}>Sessions, teacher notes & recordings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.LIGHT_GRAY} />
          </TouchableOpacity>

          {/* Tests & Assessments */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/tests")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="ribbon" size={18} color="#16a34a" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Tests & Assessments</Text>
              <Text style={styles.menuSub}>Practice drills, mock exams & analytics</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.LIGHT_GRAY} />
          </TouchableOpacity>

          {/* Assignments */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/assignments")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#fff7ed" }]}>
              <Ionicons name="document-text" size={18} color="#ea580c" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Assignments & Homework</Text>
              <Text style={styles.menuSub}>Submit solutions & faculty remarks</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.LIGHT_GRAY} />
          </TouchableOpacity>

          {/* Attendance Tracker */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/attendance")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.PRIMARY_LIGHT }]}>
              <Ionicons name="calendar" size={18} color={Colors.PRIMARY} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Attendance Tracker</Text>
              <Text style={styles.menuSub}>Overall %, subject-wise logs & alerts</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.LIGHT_GRAY} />
          </TouchableOpacity>

          {/* AI Learning Suite */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/ai")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#f5f3ff" }]}>
              <Ionicons name="sparkles" size={18} color="#7c3aed" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>AI Learning Suite</Text>
              <Text style={styles.menuSub}>Doubt solver, study plan & summary engine</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.LIGHT_GRAY} />
          </TouchableOpacity>

          {/* Needs-Based Personalized Course Generator */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push("/courses/personalized")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#eff6ff" }]}>
              <Ionicons name="hardware-chip" size={18} color={Colors.PRIMARY} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Personalized Course Builder</Text>
              <Text style={styles.menuSub}>Generate a custom syllabus to your goal</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.LIGHT_GRAY} />
          </TouchableOpacity>
        </View>

        {/* System & Account */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupHeading}>System & Account</Text>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="notifications" size={18} color="#d97706" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Notifications & Alerts</Text>
              <Text style={styles.menuSub}>Reminders, deadlines & faculty notices</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.LIGHT_GRAY} />
          </TouchableOpacity>

          {/* Version Info */}
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.BG_GRAY }]}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.GRAY} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>App Version</Text>
              <Text style={styles.menuSub}>Coaching Guru v2.4.0 (Enterprise Edition)</Text>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#fef2f2" }]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.DANGER} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={[styles.menuTitle, { color: Colors.DANGER }]}>
                Sign Out
              </Text>
              <Text style={styles.menuSub}>Safely log out of your session</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.DANGER} />
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
    backgroundColor: Colors.WHITE, // Pure white canvas
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 46,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER_LIGHT,
    backgroundColor: Colors.WHITE,
  },
  headerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.BLACK,
  },
  headerSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  signOutHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.PRIMARY_LIGHT,
  },
  avatarText: {
    fontFamily: "outfit-bold",
    fontSize: 28,
    color: Colors.WHITE,
  },
  verifiedDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#16a34a",
    borderWidth: 2,
    borderColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontFamily: "outfit-bold",
    fontSize: 19,
    color: Colors.BLACK,
  },
  userEmail: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 2,
  },
  roleBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  scholarBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scholarBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  uidBadge: {
    backgroundColor: Colors.BG_GRAY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  uidBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.GRAY,
  },

  /* Stats Row Inside Profile Card */
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
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
    color: Colors.GRAY,
    marginTop: 2,
  },
  cellDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.BORDER_LIGHT,
  },

  /* Menu Groups */
  menuGroup: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  groupHeading: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.BLACK,
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER_LIGHT,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#0f172a",
  },
  menuSub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
});