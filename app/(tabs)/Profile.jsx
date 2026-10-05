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

const Profile = () => {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [courses, setCourses] = useState([]);

  const loadStats = async () => {
    try {
      const data = await getAllCourses();
      setCourses(data || []);
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
          <Text style={styles.badgePillText}>Active Learner</Text>
        </View>

        {/* Stats Row */}
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
            <Text style={styles.statValue}>{completedCoursesCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderTitle}>Learning Hub</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/Progress")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#e6f7ff" }]}>
            <Ionicons name="stats-chart" size={20} color={Colors.PRIMARY} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>My Learning Progress</Text>
            <Text style={styles.menuItemSubtitle}>
              View curriculum checklist and course completion
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/Explore")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#f6ffed" }]}>
            <Ionicons name="compass" size={20} color="#52c41a" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Explore All Courses</Text>
            <Text style={styles.menuItemSubtitle}>
              Browse your courses and created curriculums
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/AddCourse")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#fff7e6" }]}>
            <Ionicons name="add-circle" size={20} color="#fa8c16" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Create New Course</Text>
            <Text style={styles.menuItemSubtitle}>
              Generate a personalized AI course curriculum
            </Text>
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
            Alert.alert("Coaching Guru", "Version 1.0.0\nPowered by Gemini AI")
          }
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#f9f0ff" }]}>
            <Ionicons name="information-circle-outline" size={20} color="#722ed1" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>About Coaching Guru</Text>
            <Text style={styles.menuItemSubtitle}>App version & build info</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/admin")}
        >
          <View style={[styles.menuIconBox, { backgroundColor: "#f0f9ff" }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#0284c7" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.menuItemTitle}>Admin Portal</Text>
            <Text style={styles.menuItemSubtitle}>Moderation & platform control</Text>
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
});

export default Profile;