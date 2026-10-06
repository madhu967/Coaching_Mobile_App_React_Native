import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { UserDetailContext } from "../../context/UserDetailContext";
import { getLmsStore } from "../../services/lmsStore";
import { getAllCourses } from "../../services/courseStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

// Curated Educational 3D Assets with NO background (Transparent PNGs)
const HERO_SLIDES = [
  {
    id: "ai_doubts",
    badge: "⚡ 24/7 AI Mentor",
    title: "Instant AI Doubt Solving",
    subtitle: "Step-by-step reasoning & concept clarity with Gemini.",
    cta: "Ask Doubts",
    route: "/ai",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649607.png",
  },
  {
    id: "personalized_path",
    badge: "🎯 Tailored Track",
    title: "Course Built For Your Needs",
    subtitle: "Custom syllabus by goal, hours & target completion date.",
    cta: "Build Track",
    route: "/courses/personalized",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649595.png",
  },
  {
    id: "live_classes",
    badge: "🔴 Live Coaching",
    title: "Interactive Masterclasses",
    subtitle: "Join scheduled video rooms, ask faculty & discuss.",
    cta: "Join Class",
    route: "/classes",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649635.png",
  },
  {
    id: "timed_tests",
    badge: "⏱️ Timed Drills",
    title: "Mock Tests & Rank Drills",
    subtitle: "Real exam simulation with instant accuracy & scores.",
    cta: "Take Drill",
    route: "/tests",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649626.png",
  },
];

export default function Home() {
  const router = useRouter();
  const { userDetail } = useContext(UserDetailContext);

  const [store, setStore] = useState(null);
  const [courses, setCourses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

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

  const handleScroll = (event) => {
    const slide = Math.round(
      event.nativeEvent.contentOffset.x / (SLIDE_WIDTH + 14)
    );
    setActiveSlideIndex(slide);
  };

  const userName =
    userDetail?.name ||
    userDetail?.email?.split("@")[0] ||
    "Student";

  // Data helpers
  const todayClasses = store?.classes?.filter((c) => c.isLiveToday) || [];
  const upcomingClasses =
    store?.classes?.filter((c) => !c.isLiveToday && c.status === "upcoming") || [];
  const pendingAssignments =
    store?.assignments?.filter((a) => a.status === "pending") || [];
  const attendanceOverall = store?.attendance?.overallPercentage || 92;
  const unreadNotifsCount =
    store?.notifications?.filter((n) => !n.read).length || 0;
  const upcomingTests =
    store?.tests?.filter((t) => t.isUpcoming && !t.completed) || [];
  const completedTestWithScore = store?.tests?.find(
    (t) => t.completed && t.recentScore
  );

  // Active course calculations
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
      {/* Top Header: Clean, Non-overlapping, Large Touch Targets */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.greetingText}>Hi, {userName} 👋</Text>
          <Text style={styles.subGreetingText}>Let's master something new!</Text>
        </View>

        <View style={styles.headerRightActions}>
          <View style={styles.streakPill}>
            <Text style={styles.streakPillText}>🔥 6 Days</Text>
          </View>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.DARK} />
            {unreadNotifsCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push("/Profile")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.avatarLetter}>
              {userName.charAt(0).toUpperCase()}
            </Text>
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
            colors={[Colors.PRIMARY]}
          />
        }
      >
        {/* ===============================================================
            HERO IMAGE SLIDER / SPOTLIGHT CAROUSEL
            =============================================================== */}
        <View style={styles.sliderContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.sliderScroll}
            decelerationRate="fast"
            snapToInterval={SLIDE_WIDTH + 14}
            snapToAlignment="center"
          >
            {HERO_SLIDES.map((slide) => (
              <TouchableOpacity
                key={slide.id}
                style={styles.slideCard}
                activeOpacity={0.9}
                onPress={() => router.push(slide.route)}
              >
                {/* Left Column: Pill, Title, Subtitle, and CTA Button */}
                <View style={styles.slideLeftColumn}>
                  <View style={styles.slideBadge}>
                    <Ionicons name="sparkles" size={11} color={Colors.WHITE} />
                    <Text style={styles.slideBadgeText}>{slide.badge}</Text>
                  </View>
                  <Text style={styles.slideTitle} numberOfLines={2}>
                    {slide.title}
                  </Text>
                  <Text style={styles.slideSubtitle} numberOfLines={2}>
                    {slide.subtitle}
                  </Text>
                  <View style={styles.slideCtaBtn}>
                    <Text style={styles.slideCtaText}>{slide.cta}</Text>
                    <Ionicons name="arrow-forward" size={12} color={Colors.PRIMARY} />
                  </View>
                </View>

                {/* Right Column: Transparent PNG with NO Background */}
                <View style={styles.slideRightColumn}>
                  <Image
                    source={{ uri: slide.image }}
                    style={styles.slideTransparentImage}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Slider Pagination Dots */}
          <View style={styles.dotsRow}>
            {HERO_SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === activeSlideIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ===============================================================
            QUICK ACTIONS: SINGLE ROW HORIZONTAL SCROLL
            =============================================================== */}
        <View style={styles.quickScrollSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScrollContent}
          >
            {/* 1. Ask AI Doubts */}
            <TouchableOpacity
              style={[styles.quickPillCard, { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE" }]}
              onPress={() => router.push("/ai")}
              activeOpacity={0.8}
            >
              <View style={[styles.quickCardIconCircle, { backgroundColor: Colors.WHITE }]}>
                <Ionicons name="chatbubbles" size={18} color={Colors.PRIMARY} />
              </View>
              <View>
                <Text style={styles.quickCardTitle}>AI Doubt Solver</Text>
                <Text style={styles.quickCardSub}>Ask questions 24/7</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Live Studios */}
            <TouchableOpacity
              style={[styles.quickPillCard, { backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" }]}
              onPress={() => router.push("/classes")}
              activeOpacity={0.8}
            >
              <View style={[styles.quickCardIconCircle, { backgroundColor: Colors.WHITE }]}>
                <Ionicons name="videocam" size={18} color="#9333ea" />
              </View>
              <View>
                <Text style={[styles.quickCardTitle, { color: "#6b21a8" }]}>Live Classes</Text>
                <Text style={styles.quickCardSub}>{todayClasses.length} Scheduled Today</Text>
              </View>
            </TouchableOpacity>

            {/* 3. Timed Mock Tests */}
            <TouchableOpacity
              style={[styles.quickPillCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}
              onPress={() => router.push("/tests")}
              activeOpacity={0.8}
            >
              <View style={[styles.quickCardIconCircle, { backgroundColor: Colors.WHITE }]}>
                <Ionicons name="timer" size={18} color="#16a34a" />
              </View>
              <View>
                <Text style={[styles.quickCardTitle, { color: "#166534" }]}>Timed Tests</Text>
                <Text style={styles.quickCardSub}>Practice Drills</Text>
              </View>
            </TouchableOpacity>

            {/* 4. Assignments */}
            <TouchableOpacity
              style={[styles.quickPillCard, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}
              onPress={() => router.push("/assignments")}
              activeOpacity={0.8}
            >
              <View style={[styles.quickCardIconCircle, { backgroundColor: Colors.WHITE }]}>
                <Ionicons name="document-text" size={18} color="#ea580c" />
              </View>
              <View>
                <Text style={[styles.quickCardTitle, { color: "#9a3412" }]}>Assignments</Text>
                <Text style={styles.quickCardSub}>{pendingAssignments.length} Pending</Text>
              </View>
            </TouchableOpacity>

            {/* 5. Custom Track */}
            <TouchableOpacity
              style={[styles.quickPillCard, { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" }]}
              onPress={() => router.push("/courses/personalized")}
              activeOpacity={0.8}
            >
              <View style={[styles.quickCardIconCircle, { backgroundColor: Colors.WHITE }]}>
                <Ionicons name="sparkles" size={18} color={Colors.PRIMARY} />
              </View>
              <View>
                <Text style={styles.quickCardTitle}>Personalized Path</Text>
                <Text style={styles.quickCardSub}>Custom Syllabus</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ===============================================================
            CARD 1: Today's Classes (Spacious Non-Overlapping Layout)
            =============================================================== */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: "#fee2e2" }]}>
                <Ionicons name="videocam" size={16} color="#dc2626" />
              </View>
              <Text style={styles.dashCardTitle}>
                Today's Classes ({todayClasses.length})
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/classes")}>
              <Text style={styles.dashCardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {todayClasses.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <Ionicons name="calendar-outline" size={28} color={Colors.LIGHT_GRAY} />
              <Text style={styles.emptyNote}>No live classes scheduled for today.</Text>
            </View>
          ) : (
            todayClasses.map((cls) => (
              <View key={cls.id} style={styles.classCardSpacious}>
                {/* Top: Status Badges and Time */}
                <View style={styles.classCardTopRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={styles.liveNowPill}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveNowText}>LIVE STUDIO</Text>
                    </View>
                    <View style={styles.classSubjectChip}>
                      <Text style={styles.classSubjectChipText}>{cls.subject}</Text>
                    </View>
                  </View>
                  <Text style={styles.classTimeText}>⏰ {cls.time}</Text>
                </View>

                {/* Middle: Title */}
                <Text style={styles.classTitleLarge}>{cls.title}</Text>

                {/* Bottom: Teacher info & Join CTA */}
                <View style={styles.classCardBottomRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 10 }}>
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
                      }}
                      style={styles.teacherAvatar}
                    />
                    <View>
                      <Text style={styles.teacherLabel}>Instructor</Text>
                      <Text style={styles.teacherNameBold}>{cls.teacherName}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.joinClassBtnSpacious}
                    onPress={() => router.push("/classes")}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="videocam" size={14} color={Colors.WHITE} />
                    <Text style={styles.joinClassBtnTextSpacious}>Join Class</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ===============================================================
            CARD 2: Current Course Progress
            =============================================================== */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: Colors.PRIMARY_LIGHT }]}>
                <Ionicons name="trending-up" size={16} color={Colors.PRIMARY} />
              </View>
              <Text style={styles.dashCardTitle}>Current Course Progress</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/Progress")}>
              <Text style={styles.dashCardLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {activeCourse ? (
            <View style={styles.courseProgressBox}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.activeCourseName} numberOfLines={1}>
                  {activeCourse.courseTitle}
                </Text>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentBadgeText}>{activeCoursePercent}%</Text>
                </View>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(activeCoursePercent, 100)}%` },
                  ]}
                />
              </View>

              <View style={styles.progressBottomRow}>
                <Text style={styles.progressSubtext}>
                  🎯 {activeCourseCompleted} of {activeCourseTopics.length} topics mastered
                </Text>
                <TouchableOpacity onPress={() => router.push("/Progress")}>
                  <Text style={styles.continueLinkText}>Continue →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCardBox}>
              <Ionicons name="book-outline" size={28} color={Colors.LIGHT_GRAY} />
              <Text style={styles.emptyNote}>No active course enrolled yet.</Text>
              <TouchableOpacity
                onPress={() => router.push("/courses/personalized")}
                style={styles.createNowBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.createNowBtnText}>+ Create Course Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ===============================================================
            CARD 3 & CARD 4: 2-Column KPI Row (Attendance & Recent Test)
            =============================================================== */}
        <View style={styles.kpiRow}>
          {/* Attendance % */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push("/attendance")}
            activeOpacity={0.85}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: Colors.PRIMARY_LIGHT }]}>
                <Ionicons name="calendar" size={18} color={Colors.PRIMARY} />
              </View>
              <View
                style={[
                  styles.kpiBadge,
                  attendanceOverall < 75 && { backgroundColor: Colors.DANGER_LIGHT },
                ]}
              >
                <Text
                  style={[
                    styles.kpiBadgeText,
                    attendanceOverall < 75 && { color: Colors.DANGER },
                  ]}
                >
                  {attendanceOverall >= 75 ? "Good" : "Warning"}
                </Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{attendanceOverall}%</Text>
            <Text style={styles.kpiLabel}>Attendance Rate</Text>
          </TouchableOpacity>

          {/* Recent Test Score */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push("/tests")}
            activeOpacity={0.85}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: "#f0fdf4" }]}>
                <Ionicons name="ribbon" size={18} color="#16a34a" />
              </View>
              <View style={[styles.kpiBadge, { backgroundColor: "#f0fdf4" }]}>
                <Text style={[styles.kpiBadgeText, { color: "#16a34a" }]}>Verified</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: "#16a34a" }]}>
              {completedTestWithScore
                ? `${completedTestWithScore.recentScore.accuracy}%`
                : "100%"}
            </Text>
            <Text style={styles.kpiLabel}>Recent Test Score</Text>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            CARD 5: Pending Assignments
            =============================================================== */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: "#fff7ed" }]}>
                <Ionicons name="document-text" size={16} color="#ea580c" />
              </View>
              <Text style={styles.dashCardTitle}>
                Pending Assignments ({pendingAssignments.length})
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/assignments")}>
              <Text style={styles.dashCardLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {pendingAssignments.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <Ionicons name="checkmark-done-circle" size={28} color="#16a34a" />
              <Text style={styles.emptyNote}>
                All caught up! No pending assignments.
              </Text>
            </View>
          ) : (
            pendingAssignments.slice(0, 2).map((asn) => (
              <TouchableOpacity
                key={asn.id}
                onPress={() => router.push("/assignments")}
                style={styles.asnItemRow}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.asnItemTitle} numberOfLines={1}>
                    {asn.title}
                  </Text>
                  <Text style={styles.asnItemMeta}>
                    ⏳ Due: {asn.deadline} • {asn.totalMarks} Marks
                  </Text>
                </View>
                <View style={styles.asnPillBtn}>
                  <Text style={styles.asnPillBtnText}>Submit</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ===============================================================
            CARD 6: Upcoming Classes
            =============================================================== */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: "#f0f9ff" }]}>
                <Ionicons name="time" size={16} color="#0284c7" />
              </View>
              <Text style={styles.dashCardTitle}>Upcoming Classes</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/classes")}>
              <Text style={styles.dashCardLink}>Schedule</Text>
            </TouchableOpacity>
          </View>

          {upcomingClasses.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <Text style={styles.emptyNote}>No future classes scheduled.</Text>
            </View>
          ) : (
            upcomingClasses.slice(0, 2).map((cls) => (
              <View key={cls.id} style={styles.upcomingRow}>
                <View style={styles.upcomingDot} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.upcomingTitle} numberOfLines={1}>
                    {cls.title}
                  </Text>
                  <Text style={styles.upcomingMeta}>
                    {cls.time} • {cls.subject}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ===============================================================
            CARD 7: Upcoming Tests
            =============================================================== */}
        <View style={styles.dashCard}>
          <View style={styles.dashCardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: Colors.PRIMARY_LIGHT }]}>
                <Ionicons name="help-buoy" size={16} color={Colors.PRIMARY} />
              </View>
              <Text style={styles.dashCardTitle}>
                Upcoming Tests ({upcomingTests.length})
              </Text>
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
              activeOpacity={0.8}
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

        {/* ===============================================================
            CARD 8: Notifications Banner
            =============================================================== */}
        <TouchableOpacity
          style={styles.notifBannerCard}
          onPress={() => router.push("/notifications")}
          activeOpacity={0.85}
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
    backgroundColor: Colors.WHITE, // Pure white canvas as requested
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 46,
    paddingBottom: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER_LIGHT,
  },
  greetingText: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.BLACK,
  },
  streakBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  streakPill: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fed7aa",
    gap: 4,
  },
  streakPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#ea580c",
  },
  scholarStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16a34a",
  },
  scholarStatusText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: "#166534",
  },
  subGreetingText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.BG_GRAY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  notifBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: Colors.DANGER,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: Colors.WHITE,
    fontSize: 10,
    fontFamily: "outfit-bold",
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: Colors.WHITE,
  },
  avatarLetter: {
    color: Colors.WHITE,
    fontSize: 16,
    fontFamily: "outfit-bold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Hero Slider Styles */
  sliderContainer: {
    marginBottom: 20,
  },
  sliderScroll: {
    paddingRight: 6,
  },
  slideCard: {
    width: SLIDE_WIDTH,
    height: 160,
    borderRadius: 20,
    marginRight: 14,
    backgroundColor: Colors.PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  slideLeftColumn: {
    flex: 1.15,
    justifyContent: "space-between",
    paddingRight: 6,
  },
  slideRightColumn: {
    width: 105,
    height: 105,
    alignItems: "center",
    justifyContent: "center",
  },
  slideTransparentImage: {
    width: 100,
    height: 100,
  },
  slideBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  slideBadgeText: {
    color: Colors.WHITE,
    fontSize: 10,
    fontFamily: "outfit-bold",
  },
  slideTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.WHITE,
    marginTop: 4,
    lineHeight: 20,
  },
  slideSubtitle: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.88)",
    marginTop: 2,
    lineHeight: 15,
  },
  slideCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    marginTop: 8,
  },
  slideCtaText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.BORDER,
  },
  activeDot: {
    width: 18,
    backgroundColor: Colors.PRIMARY,
  },

  /* Quick Actions Single-Row Horizontal Scroll */
  quickScrollSection: {
    marginBottom: 20,
  },
  quickScrollContent: {
    paddingRight: 6,
    gap: 10,
  },
  quickPillCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  quickCardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  quickCardTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
  },
  quickCardSub: {
    fontFamily: "outfit",
    fontSize: 10,
    color: Colors.GRAY,
    marginTop: 1,
  },

  /* Dashboard Cards Standard */
  dashCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dashCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dashCardTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
  },
  dashCardLink: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.PRIMARY,
  },
  emptyCardBox: {
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
  },
  emptyNote: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    textAlign: "center",
  },
  createNowBtn: {
    backgroundColor: Colors.PRIMARY_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 6,
  },
  createNowBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.PRIMARY,
  },

  /* Spacious Non-Overlapping Class Card */
  classCardSpacious: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  classCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  liveNowPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#dc2626",
  },
  liveNowText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: "#dc2626",
  },
  classSubjectChip: {
    backgroundColor: Colors.PRIMARY_LIGHT,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classSubjectChipText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.PRIMARY,
  },
  classTimeText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
  },
  classTitleLarge: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
    lineHeight: 20,
    marginBottom: 10,
  },
  classCardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
  },
  teacherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.BORDER,
  },
  teacherLabel: {
    fontFamily: "outfit",
    fontSize: 9,
    color: Colors.GRAY,
  },
  teacherNameBold: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#334155",
  },
  joinClassBtnSpacious: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  joinClassBtnTextSpacious: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },

  /* Course Progress Card */
  courseProgressBox: {
    marginTop: 4,
  },
  activeCourseName: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
    flex: 1,
    marginRight: 10,
  },
  percentBadge: {
    backgroundColor: Colors.PRIMARY_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  percentBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.BORDER_LIGHT,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 4,
  },
  progressBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  progressSubtext: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  continueLinkText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },

  /* KPI 2-Column Row */
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kpiBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.PRIMARY,
  },
  kpiValue: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: Colors.BLACK,
  },
  kpiLabel: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },

  /* Assignment Row */
  asnItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BG_GRAY,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  asnItemTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.BLACK,
  },
  asnItemMeta: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  asnPillBtn: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  asnPillBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#ea580c",
  },

  /* Upcoming Class */
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER_LIGHT,
  },
  upcomingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0284c7",
  },
  upcomingTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
  },
  upcomingMeta: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 1,
  },

  /* Upcoming Test Snippet */
  testSnippetRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BG_GRAY,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  testSnippetTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.BLACK,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  takeBtnPillText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },

  /* Notifications Banner */
  notifBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BG_GRAY,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  notifIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBannerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.BLACK,
  },
  notifBannerSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
});
