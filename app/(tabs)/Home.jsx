import React, { useContext, useState, useEffect, useCallback } from "react";
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
  Alert,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { UserDetailContext } from "../../context/UserDetailContext";
import { getLmsStore, markClassAttendance } from "../../services/lmsStore";
import { getAllCourses } from "../../services/courseStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

// Interactive 3D Hero Slider Assets with Transparent PNGs (No Background)
const HERO_SLIDES = [
  {
    id: "personalized_path",
    badge: "✨ AI Adaptive Engine",
    title: "Personalized Learning Path",
    subtitle: "Tailor curriculum to your target exam, daily hours & skill level",
    cta: "+ Build AI Course",
    action: "/courses/personalized",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649595.png",
  },
  {
    id: "live_studio",
    badge: "🎥 Live Masterclasses",
    title: "Interactive Live Studios",
    subtitle: "Join top faculty sessions, real-time Q&A & verified attendance",
    cta: "Join Live Studio",
    action: "/classes",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649635.png",
  },
  {
    id: "mock_drills",
    badge: "⏱️ Exam Readiness",
    title: "Timed Mock Test Drills",
    subtitle: "Simulated exam conditions with instant AI speed & accuracy radar",
    cta: "Start Timed Drill",
    action: "/tests",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649620.png",
  },
  {
    id: "ai_doubts",
    badge: "🤖 24/7 AI Tutor",
    title: "Instant Doubt Resolution",
    subtitle: "Snap or ask complex coding, algorithmic & theoretical questions",
    cta: "Solve Doubts Now",
    action: "/ai",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649600.png",
  },
];

export default function Home() {
  const router = useRouter();
  const { userDetail } = useContext(UserDetailContext);

  const [store, setStore] = useState(null);
  const [courses, setCourses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBranch, setActiveBranch] = useState("Computer Science");
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

  const handleSlideScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (SLIDE_WIDTH + 12));
    if (index >= 0 && index < HERO_SLIDES.length) {
      setActiveSlideIndex(index);
    }
  };

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

  const userInitial = userName.charAt(0).toUpperCase();

  // Coaching App Core Data from LMS store & Course storage
  const todayClasses = store?.classes?.filter((c) => c.isLiveToday) || [];
  const upcomingClasses =
    store?.classes?.filter((c) => !c.isLiveToday && c.status === "upcoming") || [];
  const pendingAssignments =
    store?.assignments?.filter((a) => a.status === "pending") || [];
  const attendancePercent = store?.attendance?.overallPercentage || 92;
  const recentTest = store?.tests?.find((t) => t.completed && t.recentScore);
  const upcomingTests = store?.tests?.filter((t) => !t.completed) || [];
  const learningStreakDays = store?.performance?.learningStreakDays || 6;

  // Active Enrolled Course Progress
  const activeCourse = courses.length > 0 ? courses[0] : null;
  const activeCourseTopics = activeCourse?.topics || [];
  const activeCourseDoneCount = Array.isArray(activeCourse?.completedTopicIds)
    ? activeCourse.completedTopicIds.length
    : 0;
  const activeCourseTotal = activeCourseTopics.length || activeCourse?.topicCount || 6;
  const activeCoursePercent =
    activeCourseTotal > 0
      ? Math.round((activeCourseDoneCount / activeCourseTotal) * 100)
      : 45;

  const totalEventsCount =
    todayClasses.length +
    upcomingClasses.length +
    pendingAssignments.length +
    upcomingTests.length;

  const handleJoinLiveClass = async (classItem) => {
    await markClassAttendance(classItem.id);
    loadDashboardData();
    Alert.alert(
      "Connecting to Live Class 🎥",
      `Welcome to "${classItem.title}" with ${classItem.teacherName}.\nAttendance recorded: PRESENT ✅`,
      [{ text: "Enter Studio", onPress: () => router.push("/classes") }]
    );
  };

  return (
    <View style={styles.container}>
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
            1. TOP HEADER (Good morning, User Name, Streak, PRO Badge, Avatar)
            =============================================================== */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.welcomeSub}>{greeting}</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>

          <View style={styles.headerRightGroup}>
            <View style={styles.streakPill}>
              <Text style={styles.streakPillText}>🔥 {learningStreakDays}d</Text>
            </View>

            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/Profile")}
              activeOpacity={0.8}
              style={styles.avatarWrapper}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{userInitial}</Text>
              </View>
              {/* Electric Lime Active Indicator Dot */}
              <View style={styles.activeLimeDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ===============================================================
            2. DISPLAY TITLE ("Student Dashboard / Academic Hub ⁽⁴⁸⁾")
            =============================================================== */}
        <View style={styles.headingSection}>
          <Text style={styles.displaySubHeading}>Student Dashboard</Text>
          <View style={styles.displayMainRow}>
            <Text style={styles.displayMainHeading}>Academic Hub</Text>
            <Text style={styles.superscriptBadge}>({totalEventsCount || 8})</Text>
          </View>
        </View>

        {/* ===============================================================
            3. DATE, ATTENDANCE 92% & SUBJECT ROADMAP SELECTOR ROW
            =============================================================== */}
        <View style={styles.dateAndRoadmapRow}>
          {/* Left: Electric Lime Date Pill + Attendance % Display */}
          <View style={styles.dateBlock}>
            <View style={styles.limeDatePill}>
              <Text style={styles.limeDateText}>Attendance</Text>
            </View>
            <Text style={styles.giantDateNumber}>{attendancePercent}%</Text>
            <Text style={styles.attendanceMetaText}>Verified Standing</Text>
          </View>

          {/* Right: Vertical Tree Roadmap Selector (Coaching App Subjects) */}
          <View style={styles.roadmapTreeContainer}>
            <View style={styles.roadmapLine} />

            {/* Branch 1 */}
            <TouchableOpacity
              style={styles.roadmapBranch}
              onPress={() => setActiveBranch("Computer Science")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.roadmapDot,
                  activeBranch === "Computer Science" && styles.roadmapDotActive,
                ]}
              />
              <Text
                style={[
                  styles.roadmapBranchText,
                  activeBranch === "Computer Science" && styles.roadmapBranchTextActive,
                ]}
              >
                Computer Science
              </Text>
            </TouchableOpacity>

            {/* Branch 2 */}
            <TouchableOpacity
              style={styles.roadmapBranch}
              onPress={() => setActiveBranch("Full-Stack & Systems")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.roadmapDot,
                  activeBranch === "Full-Stack & Systems" && styles.roadmapDotActive,
                ]}
              />
              <Text
                style={[
                  styles.roadmapBranchText,
                  activeBranch === "Full-Stack & Systems" && styles.roadmapBranchTextActive,
                ]}
              >
                Full-Stack & Systems
              </Text>
            </TouchableOpacity>

            {/* Branch 3 */}
            <TouchableOpacity
              style={styles.roadmapBranch}
              onPress={() => setActiveBranch("AI & Algorithms")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.roadmapDot,
                  activeBranch === "AI & Algorithms" && styles.roadmapDotActive,
                ]}
              />
              <Text
                style={[
                  styles.roadmapBranchText,
                  activeBranch === "AI & Algorithms" && styles.roadmapBranchTextActive,
                ]}
              >
                AI & Algorithms
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Pills Row */}
        <View style={styles.filterPillRow}>
          <TouchableOpacity
            style={styles.filterIconBtn}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={17} color={Colors.BLACK} />
            <View style={styles.filterLimeDot}>
              <Text style={styles.filterLimeDotText}>2</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.activeFilterPill}>
            <Text style={styles.activeFilterText}>{activeBranch}</Text>
            <TouchableOpacity onPress={() => setActiveBranch("Computer Science")}>
              <Ionicons name="checkmark" size={13} color={Colors.BLACK} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.secondaryFilterPill}
            onPress={() => router.push("/courses/personalized")}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={12} color={Colors.BLACK} />
            <Text style={styles.secondaryFilterText}>AI Syllabus</Text>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            4. IMAGE SLIDER BANNER (COMES SEPARATELY BELOW ATTENDANCE & ROADMAP)
            =============================================================== */}
        <View style={styles.sliderContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleSlideScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.sliderScroll}
            decelerationRate="fast"
            snapToInterval={SLIDE_WIDTH + 12}
            snapToAlignment="center"
          >
            {HERO_SLIDES.map((slide) => (
              <TouchableOpacity
                key={slide.id}
                style={styles.slideCard}
                activeOpacity={0.92}
                onPress={() => router.push(slide.action)}
              >
                {/* Left Column: Pill, Title, Subtitle, and CTA Button */}
                <View style={styles.slideLeftColumn}>
                  <View style={styles.slideBadge}>
                    <Ionicons name="sparkles" size={11} color={Colors.BLACK} />
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
                    <Ionicons name="arrow-forward" size={12} color={Colors.BLACK} />
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

          {/* Active Pagination Dots */}
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
            5. THE SIGNATURE 3D STACKED CARD -> UNIQUE FEATURE:
               "CREATE COURSE BASED ON STUDENT NEEDS"
            =============================================================== */}
        <View style={styles.cardStackWrapper}>
          {/* Layer 2 Underneath */}
          <View style={styles.stackedLayerTwo} />
          {/* Layer 1 Underneath */}
          <View style={styles.stackedLayerOne} />

          {/* Main Top 3D Card */}
          <TouchableOpacity
            style={styles.hero3DCard}
            onPress={() => router.push("/courses/personalized")}
            activeOpacity={0.92}
          >
            {/* Top Row: AI Assistant Tag & Student Avatar Cluster */}
            <View style={styles.cardTopRow}>
              <View style={styles.aiTagPill}>
                <View style={styles.aiLimeDot}>
                  <Ionicons name="sparkles" size={10} color={Colors.BLACK} />
                </View>
                <View>
                  <Text style={styles.aiTagLabel}>Unique Feature</Text>
                  <Text style={styles.aiTagTitle}>AI Course Generator</Text>
                </View>
              </View>

              {/* Overlapping Pupil Avatars */}
              <View style={styles.avatarCluster}>
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
                  style={[styles.clusterAvatar, { marginLeft: -12, zIndex: 2 }]}
                />
                <View style={[styles.clusterMoreBadge, { marginLeft: -12, zIndex: 1 }]}>
                  <Text style={styles.clusterMoreText}>50k+</Text>
                </View>
              </View>
            </View>

            {/* Course Title & Wavy Line */}
            <View style={styles.courseTitleWrapper}>
              <Text style={styles.heroCourseLine}>Personalized</Text>
              <Text style={styles.heroCourseLine}>Learning Path</Text>
              <Text style={styles.heroCourseLine}>For Your Needs</Text>
              <Text style={styles.wavyLineDecoration}>〰️</Text>
            </View>

            {/* Metrics & Floating Action Controls */}
            <View style={styles.cardBottomControls}>
              <View>
                <Text style={styles.bigPercentageText}>Target 2026</Text>
                <Text style={styles.pupilsFractionText}>Goal • Skill • Daily Hours</Text>
              </View>

              {/* Primary Color Action Button */}
              <View style={styles.primaryActionBtn}>
                <Text style={styles.primaryActionBtnText}>Create Course</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.BLACK} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            6. CURRENT COURSE PROGRESS (Enrolled Curriculum from storage)
            =============================================================== */}
        <View style={styles.courseProgressSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>ACTIVE COURSE PROGRESS</Text>
            <TouchableOpacity onPress={() => router.push("/Explore")}>
              <Text style={styles.seeAllLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {activeCourse ? (
            <TouchableOpacity
              style={styles.activeCourseCard}
              onPress={() => router.push("/Progress")}
              activeOpacity={0.85}
            >
              <View style={styles.activeCourseTop}>
                <View style={styles.activeCourseMetaCol}>
                  <Text style={styles.activeCourseTitle} numberOfLines={1}>
                    {activeCourse.courseTitle}
                  </Text>
                  <Text style={styles.activeCourseSub}>
                    {activeCourseDoneCount} of {activeCourseTotal} modules mastered
                  </Text>
                </View>
                <Text style={styles.activeCoursePct}>{activeCoursePercent}%</Text>
              </View>

              {/* Electric Lime Progress Bar */}
              <View style={styles.courseProgressBarTrack}>
                <View
                  style={[
                    styles.courseProgressBarFill,
                    { width: `${Math.min(activeCoursePercent, 100)}%` },
                  ]}
                />
              </View>

              <View style={styles.activeCourseBottom}>
                <Text style={styles.activeCourseGoal}>
                  {activeCourse.goal ? `🎯 ${activeCourse.goal}` : "✨ Fast-Track Mastery"}
                </Text>
                <View style={styles.continueBlackPill}>
                  <Text style={styles.continueBlackPillText}>Continue Study</Text>
                  <Ionicons name="arrow-forward" size={11} color={Colors.WHITE} />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeCourseCard}>
              <Text style={styles.activeCourseTitle}>No Active Course Enrolled</Text>
              <Text style={styles.activeCourseSub}>
                Build a tailored AI curriculum or explore existing courses
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={styles.continueBlackPill}
                  onPress={() => router.push("/courses/personalized")}
                >
                  <Text style={styles.continueBlackPillText}>+ Build AI Course</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.continueBlackPill, { backgroundColor: Colors.CHIP_BG }]}
                  onPress={() => router.push("/Explore")}
                >
                  <Text style={[styles.continueBlackPillText, { color: Colors.BLACK }]}>Explore Catalog</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ===============================================================
            7. TODAY'S LIVE CLASSES (Module 4)
            =============================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>TODAY'S LIVE CLASSES</Text>
          <TouchableOpacity onPress={() => router.push("/classes")}>
            <Text style={styles.seeAllLink}>All classes</Text>
          </TouchableOpacity>
        </View>

        {todayClasses.length > 0 ? (
          todayClasses.map((item) => (
            <View key={item.id} style={styles.classCard}>
              <View style={styles.classCardLeft}>
                <View style={styles.classLiveIndicator}>
                  <View style={styles.pulseLiveDot} />
                  <Text style={styles.classLiveText}>LIVE NOW</Text>
                </View>
                <Text style={styles.classTitleText} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.classInstructorText}>
                  {item.teacherName} • {item.subject} • {item.time}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.joinStudioBlackBtn}
                onPress={() => handleJoinLiveClass(item)}
                activeOpacity={0.88}
              >
                <Text style={styles.joinStudioText}>Join Class</Text>
                <Ionicons name="videocam" size={13} color={Colors.WHITE} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <TouchableOpacity
            style={styles.classCard}
            onPress={() => router.push("/classes")}
            activeOpacity={0.85}
          >
            <View style={styles.classCardLeft}>
              <View style={styles.limeChipBadge}>
                <Text style={styles.limeChipText}>Scheduled Session</Text>
              </View>
              <Text style={styles.classTitleText}>Data Structures & Algorithms</Text>
              <Text style={styles.classInstructorText}>Dr. Rajesh Kumar • Today, 6:00 PM • Studio B</Text>
            </View>

            <View style={styles.joinStudioBlackBtn}>
              <Text style={styles.joinStudioText}>Details</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.WHITE} />
            </View>
          </TouchableOpacity>
        )}

        {/* ===============================================================
            8. PENDING ASSIGNMENTS (Module 6)
            =============================================================== */}
        <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
          <Text style={styles.sectionLabel}>PENDING ASSIGNMENTS ({pendingAssignments.length})</Text>
          <TouchableOpacity onPress={() => router.push("/assignments")}>
            <Text style={styles.seeAllLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {pendingAssignments.length > 0 ? (
          pendingAssignments.slice(0, 2).map((asn) => (
            <View key={asn.id} style={styles.assignmentCard}>
              <View style={styles.assignmentLeft}>
                <View style={styles.dueBadgePill}>
                  <Ionicons name="time-outline" size={11} color="#C2410C" />
                  <Text style={styles.dueBadgeText}>Deadline: {asn.deadline}</Text>
                </View>
                <Text style={styles.assignmentTitleText} numberOfLines={1}>
                  {asn.title}
                </Text>
                <Text style={styles.assignmentSubjectText}>
                  {asn.subject} • Total Marks: {asn.totalMarks}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitWorkBlackBtn}
                onPress={() => router.push("/assignments")}
                activeOpacity={0.85}
              >
                <Text style={styles.submitWorkText}>Submit</Text>
                <Ionicons name="arrow-forward" size={12} color={Colors.WHITE} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyNoteCard}>
            <Ionicons name="checkmark-done-circle" size={24} color={Colors.SUCCESS} />
            <Text style={styles.emptyNoteText}>All assignments submitted and up to date!</Text>
          </View>
        )}

        {/* ===============================================================
            9. UPCOMING TESTS & RECENT SCORE (Module 5)
            =============================================================== */}
        <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
          <Text style={styles.sectionLabel}>TESTS & ACCURACY RADAR</Text>
          <TouchableOpacity onPress={() => router.push("/tests")}>
            <Text style={styles.seeAllLink}>Test center</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testScoreGrid}>
          {/* Recent Accuracy Tile */}
          <View style={styles.testAccuracyCard}>
            <View style={styles.testAccuracyHeader}>
              <Text style={styles.testAccuracyLabel}>Recent Score</Text>
              <View style={styles.accuracyLimePill}>
                <Text style={styles.accuracyLimePillText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.testAccuracyBigNum}>
              {recentTest ? `${recentTest.recentScore.accuracy}%` : "92%"}
            </Text>
            <Text style={styles.testAccuracySub}>Instant results with auto-timer</Text>
          </View>

          {/* Practice Drill CTA Tile */}
          <TouchableOpacity
            style={styles.practiceDrillCard}
            onPress={() => router.push("/tests")}
            activeOpacity={0.88}
          >
            <View style={styles.drillIconCircle}>
              <Ionicons name="timer" size={18} color={Colors.WHITE} />
            </View>
            <Text style={styles.drillCardTitle}>Timed Mock Test</Text>
            <Text style={styles.drillCardSub}>45 Mins Drill • Auto-submit</Text>
            <View style={styles.startDrillBtn}>
              <Text style={styles.startDrillText}>Start Drill</Text>
              <Ionicons name="arrow-forward" size={11} color={Colors.BLACK} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            10. AI LEARNING SUITE STRIP (Module 8)
            =============================================================== */}
        <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
          <Text style={styles.sectionLabel}>AI LEARNING SUITE</Text>
        </View>

        <View style={styles.quickTilesRow}>
          {/* AI Doubts */}
          <TouchableOpacity
            style={styles.quickTileCard}
            onPress={() => router.push("/ai")}
            activeOpacity={0.85}
          >
            <View style={styles.quickTileLimeIcon}>
              <Ionicons name="sparkles" size={18} color={Colors.BLACK} />
            </View>
            <Text style={styles.quickTileTitle}>AI Doubt Solver</Text>
            <Text style={styles.quickTileSub}>24/7 Step-by-step logic</Text>
          </TouchableOpacity>

          {/* AI Study Plan */}
          <TouchableOpacity
            style={styles.quickTileCard}
            onPress={() => router.push("/ai")}
            activeOpacity={0.85}
          >
            <View style={[styles.quickTileLimeIcon, { backgroundColor: Colors.CHIP_BG }]}>
              <Ionicons name="calendar-outline" size={18} color={Colors.BLACK} />
            </View>
            <Text style={styles.quickTileTitle}>7-Day Study Plan</Text>
            <Text style={styles.quickTileSub}>Weak-topic detection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_LIGHT, // Clean minimalist off-white surface
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 46,
    paddingBottom: 110, // Clearance for floating island dock
  },

  /* Top Header */
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeSub: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
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
  streakPill: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  streakPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#EA580C",
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
  avatarWrapper: {
    position: "relative",
    marginLeft: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.BORDER_LIGHT,
  },
  avatarInitial: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.BLACK,
  },
  activeLimeDot: {
    position: "absolute",
    bottom: 0,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.LIME, // Electric lime dot from reference
    borderWidth: 2,
    borderColor: Colors.WHITE,
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

  /* Date & Roadmap Row */
  dateAndRoadmapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  dateBlock: {
    alignItems: "flex-start",
  },
  limeDatePill: {
    backgroundColor: Colors.LIME_BRIGHT, // Neon Chartreuse pill
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  limeDateText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.BLACK,
  },
  giantDateNumber: {
    fontFamily: "outfit-bold",
    fontSize: 52,
    color: Colors.BLACK,
    lineHeight: 58,
    marginTop: 4,
    letterSpacing: -1,
  },
  attendanceMetaText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
  },

  /* Roadmap Tree */
  roadmapTreeContainer: {
    position: "relative",
    paddingLeft: 18,
    gap: 6,
    marginTop: 6,
  },
  roadmapLine: {
    position: "absolute",
    left: 4,
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: Colors.BORDER,
  },
  roadmapBranch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  roadmapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.BORDER,
    marginLeft: -18,
  },
  roadmapDotActive: {
    backgroundColor: Colors.BLACK,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roadmapBranchText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
  },
  roadmapBranchTextActive: {
    fontFamily: "outfit-bold",
    color: Colors.BLACK,
  },

  /* Filter Pill Row */
  filterPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  filterIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  filterLimeDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.LIME,
    alignItems: "center",
    justifyContent: "center",
  },
  filterLimeDotText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: Colors.BLACK,
  },
  activeFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.CHIP_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  activeFilterText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
  },
  secondaryFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    gap: 5,
  },
  secondaryFilterText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
  },

  /* =========================================================================
     4. IMAGE SLIDER BANNER (SEPARATE DEDICATED CAROUSEL)
     ========================================================================= */
  sliderContainer: {
    marginBottom: 24,
  },
  sliderScroll: {
    gap: 12,
  },
  slideCard: {
    width: SLIDE_WIDTH,
    backgroundColor: Colors.DARK_CARD, // Pitch Obsidian Card
    borderRadius: 26,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  slideLeftColumn: {
    flex: 1,
    paddingRight: 10,
  },
  slideBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.LIME, // Electric Lime Tag
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  slideBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.BLACK,
  },
  slideTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.WHITE,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  slideSubtitle: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    lineHeight: 15,
  },
  slideCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.LIME, // Electric Lime Action Button
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
    marginTop: 10,
  },
  slideCtaText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.BLACK,
  },
  slideRightColumn: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  slideTransparentImage: {
    width: 94,
    height: 94,
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
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.BLACK,
  },

  /* 3D Stacked Hero Card -> Dedicated to Unique Feature */
  cardStackWrapper: {
    position: "relative",
    marginBottom: 26,
  },
  stackedLayerTwo: {
    position: "absolute",
    bottom: -14,
    left: 18,
    right: 18,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 236, 0.7)",
  },
  stackedLayerOne: {
    position: "absolute",
    bottom: -7,
    left: 10,
    right: 10,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 236, 0.8)",
  },
  hero3DCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  aiTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiLimeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.LIME,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTagLabel: {
    fontFamily: "outfit",
    fontSize: 10,
    color: Colors.MUTED,
  },
  aiTagTitle: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.BLACK,
  },
  avatarCluster: {
    flexDirection: "row",
    alignItems: "center",
  },
  clusterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.WHITE,
  },
  clusterMoreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.CHIP_BG,
    borderWidth: 2,
    borderColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  clusterMoreText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: Colors.BLACK,
  },

  /* Course Display */
  courseTitleWrapper: {
    marginBottom: 20,
  },
  heroCourseLine: {
    fontFamily: "outfit-bold",
    fontSize: 26,
    color: Colors.BLACK,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  wavyLineDecoration: {
    fontSize: 16,
    color: Colors.MUTED,
    marginTop: 2,
  },

  /* Card Bottom Controls */
  cardBottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bigPercentageText: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.BLACK,
    letterSpacing: -0.4,
  },
  pupilsFractionText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 2,
  },
  swipeIndicatorRow: {
    alignItems: "center",
    paddingBottom: 4,
  },
  swipeIndicatorText: {
    fontFamily: "outfit",
    fontSize: 10,
    color: Colors.MUTED,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIME, // Vibrant Primary Color
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: Colors.LIME,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
  },

  /* Active Course Section */
  courseProgressSection: {
    marginBottom: 20,
  },
  activeCourseCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  activeCourseTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activeCourseMetaCol: {
    flex: 1,
    paddingRight: 12,
  },
  activeCourseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.BLACK,
  },
  activeCourseSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.MUTED,
    marginTop: 2,
  },
  activeCoursePct: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.BLACK,
  },
  courseProgressBarTrack: {
    height: 7,
    backgroundColor: Colors.CHIP_BG,
    borderRadius: 3.5,
    overflow: "hidden",
    marginBottom: 12,
  },
  courseProgressBarFill: {
    height: "100%",
    backgroundColor: Colors.LIME, // Electric lime fill
    borderRadius: 3.5,
  },
  activeCourseBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeCourseGoal: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    flex: 1,
  },
  continueBlackPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  continueBlackPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.WHITE,
  },

  /* Schedule Section */
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.MUTED,
    letterSpacing: 0.8,
  },
  seeAllLink: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
  },

  /* Class Card */
  classCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    marginBottom: 12,
  },
  classCardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  classLiveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  pulseLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.DANGER,
  },
  classLiveText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.DANGER,
    letterSpacing: 0.5,
  },
  limeChipBadge: {
    backgroundColor: Colors.LIME_LIGHT,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  limeChipText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.BLACK,
  },
  classTitleText: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
  },
  classInstructorText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.MUTED,
    marginTop: 2,
  },
  joinStudioBlackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    gap: 6,
  },
  joinStudioText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },

  /* Assignments */
  assignmentCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    marginBottom: 10,
  },
  assignmentLeft: {
    flex: 1,
    paddingRight: 10,
  },
  dueBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    marginBottom: 4,
  },
  dueBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: "#C2410C",
  },
  assignmentTitleText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.BLACK,
  },
  assignmentSubjectText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 2,
  },
  submitWorkBlackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  submitWorkText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.WHITE,
  },
  emptyNoteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    gap: 10,
    marginBottom: 10,
  },
  emptyNoteText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
    flex: 1,
  },

  /* Tests Grid */
  testScoreGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  testAccuracyCard: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    justifyContent: "space-between",
  },
  testAccuracyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  testAccuracyLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
  },
  accuracyLimePill: {
    backgroundColor: Colors.LIME,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accuracyLimePillText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: Colors.BLACK,
  },
  testAccuracyBigNum: {
    fontFamily: "outfit-bold",
    fontSize: 32,
    color: Colors.BLACK,
    marginVertical: 4,
  },
  testAccuracySub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
  },
  practiceDrillCard: {
    flex: 1,
    backgroundColor: Colors.DARK_CARD,
    borderRadius: 22,
    padding: 16,
    justifyContent: "space-between",
  },
  drillIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  drillCardTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.WHITE,
    marginTop: 8,
  },
  drillCardSub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#94949C",
    marginTop: 2,
  },
  startDrillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIME, // Electric lime CTA on dark card
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  startDrillText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.BLACK,
  },

  /* Quick Tiles */
  quickTilesRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickTileCard: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  quickTileLimeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.LIME,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
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
});
