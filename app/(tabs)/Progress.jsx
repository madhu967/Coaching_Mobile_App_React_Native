import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  Image,
  Switch,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { UserDetailContext } from "../../context/UserDetailContext";
import { useTheme } from "../../context/ThemeContext";
import { auth } from "../../config/firebaseConfig";
import { signOut } from "firebase/auth";
import { getAllCourses, toggleTopicCompletion } from "../../services/courseStorage";
import { getLmsStore } from "../../services/lmsStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PerformanceScreen() {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { themeMode, isIndigo, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(), [themeMode]);

  const [courses, setCourses] = useState([]);
  const [lmsStore, setLmsStore] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState("this_week");
  const [averageEnabled, setAverageEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  const fetchPerformanceData = async () => {
    try {
      const [courseData, storeData] = await Promise.all([
        getAllCourses(),
        getLmsStore(),
      ]);
      setCourses(courseData || []);
      setLmsStore(storeData || null);

      if (courseData && courseData.length > 0 && !expandedCourseId) {
        setExpandedCourseId(courseData[0].id);
      }
    } catch (err) {
      console.error("Failed to load performance data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPerformanceData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPerformanceData();
  };

  const handleToggleTopic = async (courseId, topicId) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === courseId) {
          const current = Array.isArray(c.completedTopicIds)
            ? [...c.completedTopicIds]
            : [];
          const idx = current.indexOf(topicId);
          if (idx > -1) {
            current.splice(idx, 1);
          } else {
            current.push(topicId);
          }
          return { ...c, completedTopicIds: current };
        }
        return c;
      })
    );

    await toggleTopicCompletion(courseId, topicId);
  };

  // Dynamic greeting based on time
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
            if (setUserDetail) setUserDetail(null);
            router.replace("/");
          } catch (err) {
            router.replace("/");
          }
        },
      },
    ]);
  };

  // Performance calculations from LMS Store
  const perf = lmsStore?.performance || {
    courseCompletionPercent: 0,
    testAverageScore: 0,
    attendancePercent: 0,
    assignmentCompletionPercent: 0,
    learningStreakDays: 0,
    strongSubjects: [
      "Data Structures & Algorithms (Graphs)",
      "Full-Stack Software Architecture",
      "React Native & Mobile Systems",
    ],
    weakSubjects: [
      "Dynamic Programming (Needs practice in memoization)",
      "AI Prompt Engineering & Function Calling",
    ],
  };

  let totalTopics = 0;
  let completedTopics = 0;
  courses.forEach((c) => {
    const list = Array.isArray(c.completedTopicIds) ? c.completedTopicIds : [];
    totalTopics += c.topics?.length || c.topicCount || 0;
    completedTopics += list.length;
  });

  const courseCompletionCalculated =
    totalTopics > 0
      ? Math.round((completedTopics / totalTopics) * 100)
      : perf.courseCompletionPercent ?? 0;

  const activeCourse = courses.length > 0 ? courses[0] : null;
  const attendancePercent = lmsStore?.attendance?.overallPercentage ?? 0;
  const classAttendancePercent = lmsStore?.attendance?.classAttendancePercentage ?? 0;
  const testAttendancePercent = lmsStore?.attendance?.testAttendancePercentage ?? 0;
  const streakDays = perf.learningStreakDays ?? 0;

  // Weekly study consistency bar metrics
  const WEEK_DAYS = [
    { day: "Mon", height: "70%", active: false },
    { day: "Tue", height: "90%", active: false },
    { day: "Wed", height: "60%", active: false },
    { day: "Thu", height: "95%", active: false },
    { day: "Fri", height: "85%", isTarget: true, active: true },
    { day: "Sat", height: "65%", active: false },
    { day: "Sun", height: "80%", active: false },
  ];

  return (
    <View style={styles.container}>
      {/* ===============================================================
          1. TOP HEADER NAVBAR (Full-bleed UI theme background, Good morning, Name, Streak, Theme Toggle Icon, Avatar & Logout)
          =============================================================== */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeSub}>{greeting}</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>

        <View style={styles.headerRightGroup}>
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 {streakDays}d</Text>
          </View>

          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.8}
            style={styles.themeToggleBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="color-palette"
              size={18}
              color={Colors.BLACK}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/Profile")}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{userInitial}</Text>
            </View>
            <View style={styles.activeLimeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.logoutNavBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.BLACK]}
            tintColor={Colors.BLACK}
          />
        }
      >
        {/* ===============================================================
            2. DISPLAY TITLE (REAL COACHING DATA: Academic Standing & Mastered %)
            =============================================================== */}
        <View style={styles.headingSection}>
          <Text style={styles.displaySubHeading}>Academic Progress</Text>
          <View style={styles.displayMainRow}>
            <Text style={styles.displayMainHeading}>
              {courseCompletionCalculated}% Mastered
            </Text>
            <Text style={styles.superscriptBadge}>({courses.length || 1} Tracks)</Text>
          </View>
        </View>

        {/* ===============================================================
            3. REAL COACHING INFO ROW (Semester Term + Verified Attendance)
            =============================================================== */}
        <View style={styles.dateFilterRow}>
          <View style={styles.dateChip}>
            <Ionicons name="school-outline" size={13} color={Colors.BLACK} />
            <Text style={styles.dateChipText}>
              Classes: {classAttendancePercent}% • Tests: {testAttendancePercent}%
            </Text>
          </View>

          <TouchableOpacity
            style={styles.attendanceChip}
            onPress={() => router.push("/attendance")}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={13} color={Colors.SUCCESS} />
            <Text style={styles.attendanceChipText}>{attendancePercent}% Combined →</Text>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            4. THE ICONIC PITCH BLACK GRAPH CARD (Study Consistency)
            =============================================================== */}
        <View style={styles.blackChartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Study Consistency</Text>
            <View style={styles.chartLimePill}>
              <Text style={styles.chartLimePillText}>Target 2.5h / day</Text>
            </View>
          </View>

          {/* Main Visual Bars with Chart Area */}
          <View style={styles.chartArea}>
            {/* Background Trend Curves Simulation (Cyan & Electric Lime) */}
            <View style={styles.trendLinesOverlay}>
              <View style={styles.cyanTrendLine} />
              <View style={styles.limeTrendLine} />
            </View>

            {/* Vertical Bars */}
            <View style={styles.barsContainer}>
              {WEEK_DAYS.map((item, idx) => (
                <View key={idx} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.whitePillBar,
                        { height: item.height },
                        item.isTarget && styles.dashedTargetBar,
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabelText}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Controls Strip Under Graph */}
          <View style={styles.chartControlsStrip}>
            <View style={styles.productivityBadge}>
              <Ionicons name="trending-up" size={13} color={Colors.LIME} />
              <Text style={styles.productivityBadgeText}>Weekly Consistency</Text>
              <View style={styles.productivityHighlightPill}>
                <Text style={styles.productivityHighlightText}>
                  +{courseCompletionCalculated > 0 ? courseCompletionCalculated : 15}%
                </Text>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Average</Text>
              <Switch
                value={averageEnabled}
                onValueChange={setAverageEnabled}
                trackColor={{ false: "#2A2A2E", true: Colors.LIME }}
                thumbColor={Colors.WHITE}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>

          {/* Secondary Filter Line */}
          <View style={styles.chartSecondaryFooter}>
            <View style={styles.radioFilterRow}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setSelectedWeekFilter("this_week")}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.radioCircle,
                    selectedWeekFilter === "this_week" && styles.radioCircleActive,
                  ]}
                />
                <Text style={styles.radioText}>This Week</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setSelectedWeekFilter("last_week")}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.radioCircle,
                    selectedWeekFilter === "last_week" && styles.radioCircleActive,
                  ]}
                />
                <Text style={styles.radioText}>Last Week</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Alerts</Text>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: "#2A2A2E", true: Colors.LIME }}
                thumbColor={Colors.WHITE}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
        </View>

        {/* ===============================================================
            5. THE SIGNATURE ELECTRIC LIME CARD -> CONNECTED TO REAL COURSE
            =============================================================== */}
        <View style={styles.electricLimeCard}>
          {/* Card Top Row Pills */}
          <View style={styles.limeCardTopRow}>
            <View style={styles.translucentPill}>
              <Text style={styles.translucentPillText}>Active Curriculum</Text>
            </View>

            <View style={styles.translucentPill}>
              <Ionicons name="time-outline" size={12} color={Colors.ON_ACCENT} />
              <Text style={styles.translucentPillText}>Daily Pace: 2.5h</Text>
            </View>
          </View>

          {/* Card Content: Donut Progress Ring + Title & Avatars */}
          <View style={styles.limeCardContentRow}>
            {/* Donut Progress Cluster */}
            <View style={styles.donutClusterCol}>
              <View style={styles.donutOuterRing}>
                <View style={styles.donutInner}>
                  <Text style={styles.donutPercentText}>
                    {courseCompletionCalculated}%
                  </Text>
                </View>
              </View>

              <View style={styles.donutBadgesRow}>
                <View style={styles.pointsBadgeMini}>
                  <Text style={styles.pointsBadgeMiniText}>Top 5%</Text>
                </View>
                <View style={styles.gradeBadgeMini}>
                  <Text style={styles.gradeBadgeMiniText}>Grade A</Text>
                </View>
              </View>

              <View style={styles.donutLegendRow}>
                <View style={styles.legendDotFilled} />
                <Text style={styles.legendText}>Done ({completedTopics})</Text>
                <View style={[styles.legendDotHollow, { marginLeft: 6 }]} />
                <Text style={styles.legendText}>Left ({Math.max(0, totalTopics - completedTopics)})</Text>
              </View>
            </View>

            {/* Course Title & Avatars */}
            <View style={styles.limeCourseInfoCol}>
              <Text style={styles.limeCourseTitle} numberOfLines={2}>
                {activeCourse ? activeCourse.courseTitle : "Data Structures & Algorithms"}
              </Text>
              <Text style={styles.limeCourseSub}>
                {completedTopics} of {totalTopics || 6} curriculum modules completed
              </Text>

              {/* Overlapping Pupil Avatars */}
              <View style={styles.avatarClusterLime}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                  }}
                  style={[styles.clusterAvatar, { zIndex: 3 }]}
                />
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
                  }}
                  style={[styles.clusterAvatar, { marginLeft: -10, zIndex: 2 }]}
                />
                <View style={[styles.clusterMoreBadgeLime, { marginLeft: -10, zIndex: 1 }]}>
                  <Text style={styles.clusterMoreTextLime}>50k+</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ===============================================================
            6. 4-PILLAR KPI BREAKDOWN (Real LMS Pillars)
            =============================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeadingLabel}>ACADEMIC STANDING PILLARS</Text>
        </View>

        <View style={styles.pillarGrid}>
          {/* Course Mastery */}
          <View style={styles.pillarCard}>
            <View style={styles.pillarIconCircle}>
              <Ionicons name="book-outline" size={16} color={Colors.BLACK} />
            </View>
            <Text style={styles.pillarNum}>{courseCompletionCalculated}%</Text>
            <Text style={styles.pillarLabel}>Course Mastery</Text>
          </View>

          {/* Test Performance */}
          <View style={styles.pillarCard}>
            <View style={[styles.pillarIconCircle, { backgroundColor: Colors.LIME_LIGHT }]}>
              <Ionicons name="ribbon-outline" size={16} color={Colors.BLACK} />
            </View>
            <Text style={styles.pillarNum}>{perf.testAverageScore}%</Text>
            <Text style={styles.pillarLabel}>Test Accuracy</Text>
          </View>

          {/* Attendance */}
          <View style={styles.pillarCard}>
            <View style={styles.pillarIconCircle}>
              <Ionicons name="calendar-outline" size={16} color={Colors.BLACK} />
            </View>
            <Text style={styles.pillarNum}>{attendancePercent}%</Text>
            <Text style={styles.pillarLabel}>Attendance</Text>
          </View>

          {/* Assignments */}
          <View style={styles.pillarCard}>
            <View style={styles.pillarIconCircle}>
              <Ionicons name="document-text-outline" size={16} color={Colors.BLACK} />
            </View>
            <Text style={styles.pillarNum}>{perf.assignmentCompletionPercent}%</Text>
            <Text style={styles.pillarLabel}>Assignments</Text>
          </View>
        </View>

        {/* ===============================================================
            7. SUBJECT PROFICIENCY: STRONG & WEAK TOPICS RADAR
            =============================================================== */}
        <View style={styles.proficiencyCard}>
          <Text style={styles.proficiencyTitle}>Subject Proficiency Radar</Text>

          {/* Strong Mastery */}
          <View style={styles.subjectGroup}>
            <View style={styles.groupHeaderRow}>
              <Ionicons name="checkmark-circle" size={15} color={Colors.SUCCESS} />
              <Text style={styles.strongHeaderTitle}>Strong Mastery Subjects:</Text>
            </View>
            {perf.strongSubjects?.map((s, idx) => (
              <View key={idx} style={styles.strongPill}>
                <Text style={styles.strongPillText}>⭐ {s}</Text>
              </View>
            ))}
          </View>

          {/* Weak Topics */}
          <View style={[styles.subjectGroup, { marginTop: 12 }]}>
            <View style={styles.groupHeaderRow}>
              <Ionicons name="alert-circle" size={15} color="#EA580C" />
              <Text style={styles.weakHeaderTitle}>Areas Needing Attention:</Text>
            </View>
            {perf.weakSubjects?.map((w, idx) => (
              <View key={idx} style={styles.weakPill}>
                <Text style={styles.weakPillText}>⚠️ {w}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===============================================================
            8. ENROLLED COURSE MODULES CHECKLIST (Interactive Topic Tracker)
            =============================================================== */}
        {activeCourse && (
          <View style={styles.modulesContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeadingLabel}>MODULE COMPLETION CHECKLIST</Text>
            </View>

            <View style={styles.modulesCard}>
              <Text style={styles.modulesCardTitle}>{activeCourse.courseTitle}</Text>
              <Text style={styles.modulesCardSub}>
                Tap any module checkbox to update your live progress
              </Text>

              {activeCourse.topics?.map((topic, index) => {
                const completedList = Array.isArray(activeCourse.completedTopicIds)
                  ? activeCourse.completedTopicIds
                  : [];
                const isCompleted = completedList.includes(topic.id);

                return (
                  <TouchableOpacity
                    key={topic.id || index}
                    style={styles.topicRow}
                    onPress={() => handleToggleTopic(activeCourse.id, topic.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isCompleted ? "checkbox" : "square-outline"}
                      size={20}
                      color={isCompleted ? Colors.BLACK : Colors.MUTED}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.topicName,
                          isCompleted && styles.topicNameDone,
                        ]}
                      >
                        {topic.title}
                      </Text>
                      {topic.description ? (
                        <Text style={styles.topicDesc} numberOfLines={1}>
                          {topic.description}
                        </Text>
                      ) : null}
                    </View>
                    {isCompleted && (
                      <View style={styles.doneLimeBadge}>
                        <Text style={styles.doneLimeText}>Mastered</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
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
      backgroundColor: Colors.NAVBAR_BG,
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 42,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.NAVBAR_BORDER,
    },
    welcomeSub: {
      fontFamily: "outfit",
      fontSize: 13,
      color: Colors.ON_NAVBAR_SUB,
    },
    userNameText: {
      fontFamily: "outfit-bold",
      fontSize: 17,
      color: Colors.ON_NAVBAR || Colors.ON_ACCENT,
      marginTop: 1,
    },
    headerRightGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 0,
    },
    streakPill: {
      backgroundColor: Colors.WHITE,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(13, 13, 13, 0.08)",
    },
    streakText: {
      fontFamily: "outfit-bold",
      fontSize: 11,
      color: "#EA580C",
    },
    themeToggleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.WHITE,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: Colors.BLACK,
    },
    avatarWrapper: {
      position: "relative",
      marginLeft: 2,
    },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.BLACK,
  },
  avatarInitial: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
  },
  activeLimeDot: {
    position: "absolute",
    bottom: 0,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#16A34A",
    borderWidth: 2,
    borderColor: Colors.WHITE,
  },
  logoutNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: "rgba(13, 13, 13, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Display Headings */
  headingSection: {
    marginBottom: 14,
  },
  displaySubHeading: {
    fontFamily: "outfit",
    fontSize: 20,
    color: Colors.MUTED,
    letterSpacing: -0.4,
  },
  displayMainRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  displayMainHeading: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: Colors.BLACK,
    letterSpacing: -0.6,
  },
  superscriptBadge: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
  },

  /* Date & Term Row */
  dateFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    gap: 6,
  },
  dateChipText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
  },
  attendanceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 6,
  },
  attendanceChipText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.SUCCESS,
  },

  /* Black Chart Card */
  blackChartCard: {
    backgroundColor: Colors.DARK_CARD,
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  chartTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.WHITE,
  },
  chartLimePill: {
    backgroundColor: Colors.MODE === "monochrome" ? Colors.WHITE : Colors.LIME,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chartLimePillText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.MODE === "monochrome" ? Colors.BLACK : Colors.ON_ACCENT,
  },
  chartArea: {
    height: 140,
    position: "relative",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  trendLinesOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  cyanTrendLine: {
    height: 2,
    backgroundColor: Colors.SECONDARY,
    opacity: 0.35,
    transform: [{ rotate: "-4deg" }],
  },
  limeTrendLine: {
    height: 2,
    backgroundColor: Colors.LIME,
    opacity: 0.35,
    marginTop: 18,
    transform: [{ rotate: "3deg" }],
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "100%",
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barTrack: {
    height: 100,
    width: 14,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  whitePillBar: {
    width: 12,
    borderRadius: 6,
    backgroundColor: Colors.WHITE,
  },
  dashedTargetBar: {
    backgroundColor: Colors.LIME,
  },
  dayLabelText: {
    fontFamily: "outfit",
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 6,
  },
  chartControlsStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  productivityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productivityBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  productivityHighlightPill: {
    backgroundColor: Colors.LIME,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productivityHighlightText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.ON_ACCENT,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toggleLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#9CA3AF",
  },
  chartSecondaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  radioFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
  },
  radioCircleActive: {
    borderColor: Colors.LIME,
    backgroundColor: Colors.LIME,
  },
  radioText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#D1D5DB",
  },

  /* Electric Lime Card */
  electricLimeCard: {
    backgroundColor: Colors.LIME,
    borderRadius: 28,
    padding: 22,
    marginBottom: 24,
    shadowColor: Colors.LIME,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  limeCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  translucentPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.MODE === "indigo" ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  translucentPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.ON_ACCENT,
  },
  limeCardContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  donutClusterCol: {
    alignItems: "center",
    width: "42%",
  },
  donutOuterRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.BLACK,
    alignItems: "center",
    justifyContent: "center",
  },
  donutInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.LIME,
    alignItems: "center",
    justifyContent: "center",
  },
  donutPercentText: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.ON_ACCENT,
  },
  donutBadgesRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  pointsBadgeMini: {
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pointsBadgeMiniText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: Colors.WHITE,
  },
  gradeBadgeMini: {
    backgroundColor: Colors.MODE === "indigo" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gradeBadgeMiniText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: Colors.ON_ACCENT,
  },
  donutLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  legendDotFilled: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.ON_ACCENT,
  },
  legendDotHollow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: Colors.ON_ACCENT,
  },
  legendText: {
    fontFamily: "outfit",
    fontSize: 9,
    color: Colors.ON_ACCENT,
    marginLeft: 3,
  },
  limeCourseInfoCol: {
    flex: 1,
    paddingLeft: 14,
  },
  limeCourseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: Colors.ON_ACCENT,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  limeCourseSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.ON_NAVBAR_SUB,
    marginTop: 4,
  },
  avatarClusterLime: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  clusterAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Colors.LIME,
  },
  clusterMoreBadgeLime: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.BLACK,
    alignItems: "center",
    justifyContent: "center",
  },
  clusterMoreTextLime: {
    fontFamily: "outfit-bold",
    fontSize: 8,
    color: Colors.WHITE,
  },

  /* 4 Pillars */
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeadingLabel: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.MUTED,
    letterSpacing: 0.8,
  },
  pillarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  pillarCard: {
    width: "48%",
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  pillarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.CHIP_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pillarNum: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.BLACK,
  },
  pillarLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 2,
  },

  /* Proficiency */
  proficiencyCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  proficiencyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
    marginBottom: 14,
  },
  subjectGroup: {
    gap: 6,
  },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  strongHeaderTitle: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.SUCCESS,
  },
  weakHeaderTitle: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#EA580C",
  },
  strongPill: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  strongPillText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#166534",
  },
  weakPill: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  weakPillText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#9A3412",
  },

  /* Modules Checklist */
  modulesContainer: {
    marginBottom: 20,
  },
  modulesCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  modulesCardTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
  },
  modulesCardSub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 2,
    marginBottom: 14,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER_LIGHT,
  },
  topicName: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
  },
  topicNameDone: {
    color: Colors.MUTED,
    textDecorationLine: "line-through",
  },
  topicDesc: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 1,
  },
  doneLimeBadge: {
    backgroundColor: Colors.LIME,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  doneLimeText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: Colors.ON_ACCENT,
  },
});