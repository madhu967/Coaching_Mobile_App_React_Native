import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { UserDetailContext } from "../../context/UserDetailContext";
import { getLmsStore } from "../../services/lmsStore";
import { getAllCourses } from "../../services/courseStorage";

export default function Home() {
  const router = useRouter();
  const { userDetail } = useContext(UserDetailContext);

  const [store, setStore] = useState(null);
  const [courses, setCourses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [lmsData, courseList] = await Promise.all([
        getLmsStore(),
        getAllCourses(),
      ]);
      setStore(lmsData);
      setCourses(courseList || []);
    } catch (e) {
      console.error("Home dashboard load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const userName =
    userDetail?.name ||
    userDetail?.email?.split("@")[0] ||
    "Student";

  // Data helpers
  const todayClasses = store?.classes?.filter((c) => c.isLiveToday) || [];
  const upcomingClasses = store?.classes?.filter((c) => !c.isLiveToday && c.status === "upcoming") || [];
  const pendingAssignments = store?.assignments?.filter((a) => a.status === "pending") || [];
  const attendanceOverall = store?.attendance?.overallPercentage || 92;
  const unreadNotifsCount = store?.notifications?.filter((n) => !n.read).length || 0;
  const upcomingTests = store?.tests?.filter((t) => t.isUpcoming && !t.completed) || [];
  const completedTestWithScore = store?.tests?.find((t) => t.completed && t.recentScore);

  // Active course
  const activeCourse = courses.length > 0 ? courses[0] : null;
  const activeCourseTopics = activeCourse?.topics || [];
  const activeCourseCompleted = Array.isArray(activeCourse?.completedTopicIds)
    ? activeCourse.completedTopicIds.length
    : 0;
  const activeCoursePercent =
    activeCourseTopics.length > 0
      ? Math.round((activeCourseCompleted / activeCourseTopics.length) * 100)
      : 0;

  return (
    <View style={styles.container}>
      {/* Top Welcome Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greetingText}>Hello, {userName}! 👋</Text>
          <Text style={styles.subGreetingText}>Let's achieve your study goals today</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.PRIMARY} />
            {unreadNotifsCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push("/(tabs)/Profile")}
          >
            <Ionicons name="person-circle-outline" size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
        }
        {/* Unique Feature Hero Banner: Create Course Based on Needs */}
        <TouchableOpacity
          style={styles.needsHeroCard}
          onPress={() => router.push("/courses/personalized")}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.needsHeroPill}>
              <Ionicons name="sparkles" size={12} color={Colors.PRIMARY} />
              <Text style={styles.needsHeroPillText}>Unique AI Feature</Text>
            </View>
            <Text style={styles.needsHeroTitle}>Create Course Based on Your Needs</Text>
            <Text style={styles.needsHeroSubtitle}>
              Select your Goal, Skill Level, Study Time & Target Date — AI designs your custom path.
            </Text>
          </View>
          <View style={styles.needsHeroArrow}>
            <Ionicons name="arrow-forward" size={18} color={Colors.WHITE} />
          </View>
        </TouchableOpacity>

        {/* Quick Access Grid: Ask AI Doubts & Take Tests */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionBox, { backgroundColor: "#eff6ff" }]}
            onPress={() => router.push("/ai")}
          >
            <Ionicons name="chatbubbles" size={22} color={Colors.PRIMARY} />
            <Text style={styles.quickActionTitle}>Ask AI Doubts</Text>
            <Text style={styles.quickActionSub}>Instant Gemini explanations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBox, { backgroundColor: "#f0fdf4" }]}
            onPress={() => router.push("/tests")}
          >
            <Ionicons name="timer" size={22} color="#16a34a" />
            <Text style={[styles.quickActionTitle, { color: "#166534" }]}>Timed Tests</Text>
            <Text style={styles.quickActionSub}>Practice drills & mocks</Text>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            STEP 2 DASHBOARD CARDS
            =============================================================== */}

        {/* CARD 1: Today's Classes */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="videocam" size={18} color="#ef4444" />
              <Text style={styles.dashCardTitle}>Today's Classes ({todayClasses.length})</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/classes")}>
              <Text style={styles.dashCardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {todayClasses.length === 0 ? (
            <Text style={styles.emptyNote}>No live classes scheduled for today.</Text>
          ) : (
            todayClasses.map((cls) => (
              <View key={cls.id} style={styles.classSnippetBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.classSnippetTitle} numberOfLines={1}>
                    {cls.title}
                  </Text>
                  <Text style={styles.classSnippetMeta}>
                    ⏰ {cls.time} • 👨‍🏫 {cls.teacherName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.joinSnippetBtn}
                  onPress={() => router.push("/classes")}
                >
                  <Text style={styles.joinSnippetBtnText}>Join</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* CARD 2: Current Course Progress */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="trending-up" size={18} color={Colors.PRIMARY} />
              <Text style={styles.dashCardTitle}>Current Course Progress</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/Progress")}>
              <Text style={styles.dashCardLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {activeCourse ? (
            <View>
              <Text style={styles.activeCourseName}>{activeCourse.courseTitle}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${activeCoursePercent}%` }]} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                <Text style={styles.progressSubtext}>
                  {activeCourseCompleted} of {activeCourseTopics.length} topics mastered
                </Text>
                <Text style={styles.progressPercent}>{activeCoursePercent}%</Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 10 }}>
              <Text style={styles.emptyNote}>No active course enrolled.</Text>
              <TouchableOpacity
                onPress={() => router.push("/courses/personalized")}
                style={styles.createNowBtn}
              >
                <Text style={styles.createNowBtnText}>+ Create Course Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* CARD 3: Attendance % & CARD 4: Recent Test Score (2-Column Row) */}
        <View style={styles.twoColRow}>
          {/* Attendance % */}
          <TouchableOpacity
            style={styles.statCardHalf}
            onPress={() => router.push("/attendance")}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Ionicons name="calendar-outline" size={20} color={Colors.PRIMARY} />
              <View style={[styles.miniBadge, attendanceOverall < 75 && { backgroundColor: "#fef2f2" }]}>
                <Text style={[styles.miniBadgeText, attendanceOverall < 75 && { color: "#dc2626" }]}>
                  {attendanceOverall >= 75 ? "Good" : "Warning"}
                </Text>
              </View>
            </View>
            <Text style={styles.statLargeNum}>{attendanceOverall}%</Text>
            <Text style={styles.statLabelText}>Attendance %</Text>
          </TouchableOpacity>

          {/* Recent Test Score */}
          <TouchableOpacity
            style={styles.statCardHalf}
            onPress={() => router.push("/tests")}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Ionicons name="ribbon-outline" size={20} color="#16a34a" />
              <View style={[styles.miniBadge, { backgroundColor: "#f0fdf4" }]}>
                <Text style={[styles.miniBadgeText, { color: "#16a34a" }]}>Verified</Text>
              </View>
            </View>
            <Text style={styles.statLargeNum}>
              {completedTestWithScore ? `${completedTestWithScore.recentScore.accuracy}%` : "100%"}
            </Text>
            <Text style={styles.statLabelText}>Recent Test Score</Text>
          </TouchableOpacity>
        </View>

        {/* CARD 5: Pending Assignments */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="document-text-outline" size={18} color="#ea580c" />
              <Text style={styles.dashCardTitle}>Pending Assignments ({pendingAssignments.length})</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/assignments")}>
              <Text style={styles.dashCardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {pendingAssignments.length === 0 ? (
            <Text style={styles.emptyNote}>All assignments submitted! No pending tasks.</Text>
          ) : (
            pendingAssignments.slice(0, 2).map((asn) => (
              <TouchableOpacity
                key={asn.id}
                onPress={() => router.push("/assignments")}
                style={styles.asnRowBox}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.asnRowTitle} numberOfLines={1}>
                    {asn.title}
                  </Text>
                  <Text style={styles.asnRowDeadline}>⏳ Due: {asn.deadline}</Text>
                </View>
                <View style={styles.submitPillBtn}>
                  <Text style={styles.submitPillBtnText}>Submit</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* CARD 6: Upcoming Classes */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="time-outline" size={18} color="#0284c7" />
              <Text style={styles.dashCardTitle}>Upcoming Classes</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/classes")}>
              <Text style={styles.dashCardLink}>Schedule</Text>
            </TouchableOpacity>
          </View>

          {upcomingClasses.length === 0 ? (
            <Text style={styles.emptyNote}>No upcoming classes scheduled.</Text>
          ) : (
            upcomingClasses.slice(0, 2).map((cls) => (
              <View key={cls.id} style={styles.upcomingClassRow}>
                <View style={styles.upcomingDot} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.upcomingClassTitle} numberOfLines={1}>
                    {cls.title}
                  </Text>
                  <Text style={styles.upcomingClassTime}>
                    {cls.time} • {cls.subject}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* CARD 7: Upcoming Tests */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="help-buoy-outline" size={18} color={Colors.PRIMARY} />
              <Text style={styles.dashCardTitle}>Upcoming Tests ({upcomingTests.length})</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/tests")}>
              <Text style={styles.dashCardLink}>All Tests</Text>
            </TouchableOpacity>
          </View>

          {upcomingTests.slice(0, 2).map((tst) => (
            <TouchableOpacity
              key={tst.id}
              style={styles.testSnippetRow}
              onPress={() =>
                router.push({
                  pathname: "/tests/take",
                  params: { testId: tst.id },
                })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.testSnippetTitle}>{tst.title}</Text>
                <Text style={styles.testSnippetMeta}>
                  {tst.type} • {tst.durationMinutes} Mins • {tst.scheduledDate}
                </Text>
              </View>
              <View style={styles.takeBtnPill}>
                <Ionicons name="play" size={12} color={Colors.WHITE} />
                <Text style={styles.takeBtnPillText}>Take</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* CARD 8: Notifications Banner */}
        <TouchableOpacity
          style={styles.notifBannerCard}
          onPress={() => router.push("/notifications")}
        >
          <View style={styles.notifIconCircle}>
            <Ionicons name="notifications" size={20} color={Colors.PRIMARY} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.notifBannerTitle}>Notifications & Reminders</Text>
            <Text style={styles.notifBannerSub}>
              {unreadNotifsCount > 0
                ? `${unreadNotifsCount} new alerts: class reminders & grades.`
                : "All notifications caught up."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.GRAY} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 14,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  greetingText: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: "#1e293b",
  },
  subGreetingText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeText: {
    color: Colors.WHITE,
    fontSize: 9,
    fontFamily: "outfit-bold",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  roleBar: {
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  roleBarLabel: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.GRAY,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  roleBtnsRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleActivePill: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleActivePillText: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
    fontSize: 12,
  },
  roleInactivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  roleInactivePillText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  needsHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  needsHeroPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 8,
  },
  needsHeroPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  needsHeroTitle: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: Colors.WHITE,
  },
  needsHeroSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    lineHeight: 16,
  },
  needsHeroArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  quickActionBox: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  quickActionTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
    marginTop: 8,
  },
  quickActionSub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  dashCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  dashCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dashCardTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
  },
  dashCardLink: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  emptyNote: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    fontStyle: "italic",
    paddingVertical: 4,
  },
  classSnippetBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  classSnippetTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  classSnippetMeta: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  joinSnippetBtn: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinSnippetBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  activeCourseName: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 8,
  },
  progressTrack: {
    height: 7,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 4,
  },
  progressSubtext: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  progressPercent: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  createNowBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
  },
  createNowBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  twoColRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  statCardHalf: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  miniBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.PRIMARY,
  },
  statLargeNum: {
    fontFamily: "outfit-bold",
    fontSize: 26,
    color: "#1e293b",
    marginTop: 8,
  },
  statLabelText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  asnRowBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  asnRowTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  asnRowDeadline: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#ea580c",
    marginTop: 2,
  },
  submitPillBtn: {
    backgroundColor: "#ea580c",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  submitPillBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.WHITE,
  },
  upcomingClassRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  upcomingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0284c7",
  },
  upcomingClassTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  upcomingClassTime: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  testSnippetRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  testSnippetTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  testSnippetMeta: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  takeBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  takeBtnPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.WHITE,
  },
  notifBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#edf2f7",
    marginBottom: 20,
  },
  notifIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  notifBannerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  notifBannerSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
});
