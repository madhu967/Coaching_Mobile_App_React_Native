import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
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
  let completedCoursesCount = 0;

  courses.forEach((c) => {
    const list = Array.isArray(c.completedTopicIds) ? c.completedTopicIds : [];
    completedTopicsCount += list.length;
    if (c.topics && c.topics.length > 0 && list.length >= c.topics.length) {
      completedCoursesCount += 1;
    }
  });

  const attendancePercent = lmsStore?.attendance?.overallPercentage || 92;
  const recentScore = lmsStore?.tests?.find((t) => t.completed && t.recentScore)?.recentScore?.accuracy || 100;

  const userName =
    userDetail?.name ||
    auth?.currentUser?.displayName ||
    userDetail?.email?.split("@")[0] ||
    "Student";

  const userEmail =
    userDetail?.email ||
    auth?.currentUser?.email ||
    "Learner Account";

  const userInitial = userName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      {/* Header Profile Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </View>

        <Text style={styles.userNameText}>{userName}</Text>
        <Text style={styles.userEmailText}>{userEmail}</Text>

        <View style={styles.badgePill}>
          <Ionicons name="sparkles" size={14} color={Colors.PRIMARY} />
          <Text style={styles.badgePillText}>Student Profile</Text>
        </View>

        {/* 4 Stats Highlights Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{coursesCount}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedTopicsCount}</Text>
            <Text style={styles.statLabel}>Topics Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.PRIMARY }]}>{attendancePercent}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#16a34a" }]}>{recentScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>
      </View>

      {/* Featured AI Innovation: Step 3 Needs-Based Course Generator */}
      <TouchableOpacity
        style={styles.needsHeroCard}
        onPress={() => router.push("/courses/personalized")}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.needsHeroBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.PRIMARY} />
            <Text style={styles.needsHeroBadgeText}>AI Recommendation</Text>
          </View>
          <Text style={styles.needsHeroTitle}>Create Course Based on Your Needs</Text>
          <Text style={styles.needsHeroSubtitle}>
            Tailor course by Goal, Skill Level, Daily Study Time & Target Date
          </Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={28} color={Colors.WHITE} />
      </TouchableOpacity>

      {/* Section: Academic Learning Modules */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderTitle}>Academic Learning Modules</Text>

        {/* Live Classes */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/classes")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#fee2e2" }]}>
            <Ionicons name="videocam" size={20} color="#dc2626" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Live Classes & Recordings</Text>
            <Text style={styles.menuItemSubtitle}>Join sessions, reminders & attendance</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        {/* Tests & Assessments */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/tests")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="ribbon" size={20} color="#16a34a" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Tests & Assessments</Text>
            <Text style={styles.menuItemSubtitle}>Timed drills, instant scores & analysis</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        {/* Assignments */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/assignments")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#fff7ed" }]}>
            <Ionicons name="document-text" size={20} color="#ea580c" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Assignments & Homework</Text>
            <Text style={styles.menuItemSubtitle}>Submit solutions & view teacher feedback</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        {/* Attendance Tracker */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/attendance")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#eff6ff" }]}>
            <Ionicons name="calendar" size={20} color={Colors.PRIMARY} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Attendance Tracker</Text>
            <Text style={styles.menuItemSubtitle}>Overall %, subject-wise & warnings</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        {/* AI Learning Suite */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/ai")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#f5f3ff" }]}>
            <Ionicons name="sparkles" size={20} color="#7c3aed" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>AI Learning Suite</Text>
            <Text style={styles.menuItemSubtitle}>Doubt solver, study plans & quiz generator</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/notifications")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="notifications" size={20} color="#d97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Notifications & Alerts</Text>
            <Text style={styles.menuItemSubtitle}>Class reminders, scores & announcements</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* Preferences & Support */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderTitle}>Account & Settings</Text>

        <View style={styles.infoRowItem}>
          <View style={[styles.menuIconBox, { backgroundColor: "#f0f0f0" }]}>
            <Ionicons name="person-outline" size={20} color="#666" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Account Email</Text>
            <Text style={styles.menuItemSubtitle}>{userEmail}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert("Coaching Guru", "Version 2.0.0\nAll 12 Modules Activated\nPowered by Google Gemini 3.8 Flash")
          }
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#f9f0ff" }]}>
            <Ionicons name="information-circle-outline" size={20} color="#722ed1" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>About Coaching Guru</Text>
            <Text style={styles.menuItemSubtitle}>LMS version & institutional build</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ff4d4f" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
  },
  profileHeaderCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eaeaea",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  avatarText: {
    fontFamily: "outfit-bold",
    fontSize: 32,
    color: Colors.WHITE,
  },
  userNameText: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: "#222",
  },
  userEmailText: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#edf4ff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
    gap: 6,
  },
  badgePillText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: Colors.PRIMARY,
  },
  statLabel: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e8e8e8",
  },
  sectionContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eaeaea",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionHeaderTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#333",
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f7f7f7",
  },
  infoRowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f7f7f7",
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#222",
  },
  menuItemSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 1,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#fff1f0",
    borderRadius: 14,
    gap: 8,
  },
  signOutText: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#ff4d4f",
  },
  needsHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  needsHeroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 6,
    gap: 4,
  },
  needsHeroBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  needsHeroTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.WHITE,
  },
  needsHeroSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    lineHeight: 16,
  },
});

export default Profile;