import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
  RefreshControl,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import Button from "../../components/Shared/Button";
import {
  getLmsStore,
  createLiveClass,
  createTest,
  createAssignment,
  gradeAssignment,
} from "../../services/lmsStore";
import {
  getLoggedInTeacher,
  logoutTeacher,
} from "../../services/teacherAuth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

const TEACHER_SLIDES = [
  {
    id: "class_studio",
    badge: "🎥 Live Studio",
    title: "Host Live Masterclass",
    subtitle: "Launch interactive video room & log attendance",
    cta: "+ New Class",
    action: "create_class",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649635.png",
  },
  {
    id: "grading_desk",
    badge: "📝 Homework Desk",
    title: "Evaluate Assignments",
    subtitle: "Review student submissions & provide marks",
    cta: "Review Work",
    action: "tab_assignments",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649624.png",
  },
  {
    id: "test_authoring",
    badge: "⏱️ Mock Drills",
    title: "Create Timed Tests",
    subtitle: "Publish practice tests & view score analytics",
    cta: "Manage Tests",
    action: "tab_tests",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649626.png",
  },
  {
    id: "cohort_mastery",
    badge: "👥 Academic Roster",
    title: "Attendance & Mastery",
    subtitle: "Inspect cohort attendance & weak subject spots",
    cta: "Inspect Cohort",
    action: "tab_students",
    image: "https://cdn-icons-png.flaticon.com/512/8649/8649591.png",
  },
];

export default function TeacherDashboard() {
  const router = useRouter();

  // Teacher Tabs: 'classes' | 'courses' | 'tests' | 'assignments' | 'students'
  const [tab, setTab] = useState("classes");
  const [store, setStore] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const handleTeacherSlideScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (SLIDE_WIDTH + 14));
    setActiveSlideIndex(index);
  };

  const handleTeacherSlideAction = (action) => {
    if (action === "create_class") {
      setShowCreateClassModal(true);
    } else if (action === "tab_assignments") {
      setTab("assignments");
    } else if (action === "tab_tests") {
      setTab("tests");
    } else if (action === "tab_students") {
      setTab("students");
    }
  };

  // Modals
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassTitle, setNewClassTitle] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [newClassTime, setNewClassTime] = useState("");

  const [showCreateAsnModal, setShowCreateAsnModal] = useState(false);
  const [newAsnTitle, setNewAsnTitle] = useState("");
  const [newAsnSubject, setNewAsnSubject] = useState("");
  const [newAsnDeadline, setNewAsnDeadline] = useState("");
  const [newAsnMarks, setNewAsnMarks] = useState("20");

  const [gradingItem, setGradingItem] = useState(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  const loadData = async () => {
    try {
      const activeTeacher = await getLoggedInTeacher();
      if (!activeTeacher) {
        router.replace("/teacher");
        return;
      }
      setTeacherProfile(activeTeacher);

      const data = await getLmsStore();
      setStore(data);
    } catch (e) {
      console.error("Teacher portal data load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTeacherLogout = () => {
    Alert.alert("Faculty Logout", "Sign out of your teacher account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logoutTeacher();
          router.replace("/teacher");
        },
      },
    ]);
  };

  const handleCreateClass = async () => {
    if (!newClassTitle.trim() || !newClassSubject.trim()) {
      Alert.alert("Missing Fields", "Please enter class title and subject.");
      return;
    }

    await createLiveClass({
      title: newClassTitle.trim(),
      subject: newClassSubject.trim(),
      time: newClassTime.trim() || "Today, 5:00 PM - 6:00 PM",
      teacherName: teacherProfile?.name || "Faculty Member",
      teacherEmail: teacherProfile?.email || "teacher@coachingguru.com",
      roomNumber: "Virtual Studio 1",
    });

    Alert.alert("Class Scheduled! 🎥", "Students have been notified.");
    setShowCreateClassModal(false);
    setNewClassTitle("");
    setNewClassSubject("");
    loadData();
  };

  const handleCreateAssignment = async () => {
    if (!newAsnTitle.trim() || !newAsnSubject.trim()) {
      Alert.alert("Missing Fields", "Please enter assignment title and subject.");
      return;
    }

    await createAssignment({
      title: newAsnTitle.trim(),
      subject: newAsnSubject.trim(),
      deadline: newAsnDeadline.trim() || "In 3 Days",
      totalMarks: parseInt(newAsnMarks) || 20,
      description: "Complete all questions and test specifications according to rubric.",
    });

    Alert.alert("Assignment Published! 📝", "Posted to student dashboards.");
    setShowCreateAsnModal(false);
    setNewAsnTitle("");
    setNewAsnSubject("");
    loadData();
  };

  const handleGradeSubmit = async () => {
    if (!gradeMarks.trim()) {
      Alert.alert("Enter Marks", "Please enter marks awarded.");
      return;
    }

    await gradeAssignment(
      gradingItem.id,
      parseInt(gradeMarks),
      gradeFeedback.trim() || "Good effort. Review concepts discussed in class."
    );

    Alert.alert("Graded! ✅", "Feedback sent to student.");
    setGradingItem(null);
    setGradeMarks("");
    setGradeFeedback("");
    loadData();
  };

  if (!store) {
    return (
      <View style={styles.centerBox}>
        <Text style={{ fontFamily: "outfit" }}>Loading Teacher Portal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header with Faculty Identity */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 10 }}>
          <View style={styles.facultyAvatarBox}>
            <Text style={styles.facultyAvatarInitial}>
              {teacherProfile?.name?.charAt(0) || "T"}
            </Text>
            <View style={styles.facultyActiveDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {teacherProfile?.name || "Teacher Portal"}
            </Text>
            <View style={styles.facultyPillRow}>
              <View style={styles.facultyBadge}>
                <Ionicons name="school" size={10} color="#166534" />
                <Text style={styles.facultyBadgeText}>
                  {teacherProfile?.subject ? `${teacherProfile.subject} • Faculty` : "Faculty Instructor"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleTeacherLogout}
          style={styles.exitBtn}
        >
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* Banner Carousel with Primary Cards & Right-Side Transparent 3D Asset */}
      <View style={styles.sliderContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleTeacherSlideScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.sliderScroll}
          decelerationRate="fast"
          snapToInterval={SLIDE_WIDTH + 14}
          snapToAlignment="center"
        >
          {TEACHER_SLIDES.map((slide) => (
            <TouchableOpacity
              key={slide.id}
              style={styles.slideCard}
              activeOpacity={0.9}
              onPress={() => handleTeacherSlideAction(slide.action)}
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

        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {TEACHER_SLIDES.map((_, idx) => (
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

      {/* Faculty Quick Action Command Dock */}
      <View style={styles.quickLaunchDock}>
        <TouchableOpacity
          style={styles.dockTile}
          onPress={() => setShowCreateClassModal(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.dockIconCircle, { backgroundColor: "#fee2e2" }]}>
            <Ionicons name="videocam" size={15} color="#dc2626" />
          </View>
          <Text style={styles.dockTileTitle}>+ Live Class</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dockTile}
          onPress={() => setShowCreateAsnModal(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.dockIconCircle, { backgroundColor: "#fff7ed" }]}>
            <Ionicons name="document-text" size={15} color="#ea580c" />
          </View>
          <Text style={styles.dockTileTitle}>+ Assignment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dockTile}
          onPress={() => setTab("students")}
          activeOpacity={0.8}
        >
          <View style={[styles.dockIconCircle, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="people" size={15} color="#16a34a" />
          </View>
          <Text style={styles.dockTileTitle}>Cohort Roster</Text>
        </TouchableOpacity>
      </View>

      {/* Teacher Navigation Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollRow}
      >
        {[
          { key: "classes", label: "Live Classes", icon: "videocam-outline" },
          { key: "assignments", label: "Assignments", icon: "document-text-outline" },
          { key: "tests", label: "Tests & Drills", icon: "ribbon-outline" },
          { key: "students", label: "Attendance & Performance", icon: "people-outline" },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.pillBtn, tab === t.key && styles.pillBtnActive]}
          >
            <Ionicons
              name={t.icon}
              size={16}
              color={tab === t.key ? Colors.WHITE : Colors.PRIMARY}
            />
            <Text style={[styles.pillBtnText, tab === t.key && styles.pillBtnTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab 1: Live Classes */}
      {tab === "classes" && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.actionHeaderBar}>
            <Text style={styles.tabHeading}>Scheduled Classes ({store.classes.length})</Text>
            <TouchableOpacity
              style={styles.addBtnSmall}
              onPress={() => setShowCreateClassModal(true)}
            >
              <Ionicons name="add" size={16} color={Colors.WHITE} />
              <Text style={styles.addBtnText}>+ New Class</Text>
            </TouchableOpacity>
          </View>

          {store.classes.map((cls) => (
            <View key={cls.id} style={styles.cardItem}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <View style={styles.studioLivePill}>
                      <View style={styles.studioPulseDot} />
                      <Text style={styles.studioLivePillText}>STUDIO READY</Text>
                    </View>
                    <Text style={styles.classSubjectChip}>{cls.subject}</Text>
                  </View>
                  <Text style={styles.cardItemTitle}>{cls.title}</Text>
                </View>

                <View style={[styles.attendanceBadgeSmall, cls.attendanceMarked && { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons
                    name={cls.attendanceMarked ? "checkmark-circle" : "time-outline"}
                    size={11}
                    color={cls.attendanceMarked ? "#16a34a" : "#ca8a04"}
                  />
                  <Text style={[styles.attendanceBadgeText, cls.attendanceMarked && { color: "#16a34a" }]}>
                    {cls.attendanceMarked ? "Marked" : "Check-in Open"}
                  </Text>
                </View>
              </View>

              <View style={styles.classMetaRow}>
                <Text style={styles.cardItemMeta}>⏰ {cls.time}</Text>
                <Text style={styles.cardItemMeta}>📍 {cls.roomNumber}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tab 2: Assignments */}
      {tab === "assignments" && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.actionHeaderBar}>
            <Text style={styles.tabHeading}>Assignments ({store.assignments.length})</Text>
            <TouchableOpacity
              style={styles.addBtnSmall}
              onPress={() => setShowCreateAsnModal(true)}
            >
              <Ionicons name="add" size={16} color={Colors.WHITE} />
              <Text style={styles.addBtnText}>+ New Assignment</Text>
            </TouchableOpacity>
          </View>

          {store.assignments.map((asn) => (
            <View key={asn.id} style={styles.cardItem}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cardItemTitle}>{asn.title}</Text>
                <View style={[styles.statusBadgeSmall, asn.status === "graded" && { backgroundColor: "#f0fdf4" }]}>
                  <Text style={[styles.statusBadgeSmallText, asn.status === "graded" && { color: "#16a34a" }]}>
                    {asn.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardItemMeta}>Deadline: {asn.deadline} • Total: {asn.totalMarks} Marks</Text>

              {asn.status === "submitted" && (
                <TouchableOpacity
                  style={styles.gradeActionBtn}
                  onPress={() => {
                    setGradingItem(asn);
                    setGradeMarks("");
                    setGradeFeedback("");
                  }}
                >
                  <Ionicons name="pencil" size={14} color={Colors.WHITE} />
                  <Text style={styles.gradeActionBtnText}>Grade Student Submission</Text>
                </TouchableOpacity>
              )}

              {asn.status === "graded" && (
                <View style={styles.gradedSummaryBox}>
                  <Text style={styles.gradedSummaryText}>
                    Graded: {asn.obtainedMarks}/{asn.totalMarks} • "{asn.teacherFeedback}"
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tab 3: Tests */}
      {tab === "tests" && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.actionHeaderBar}>
            <Text style={styles.tabHeading}>Tests & Question Banks</Text>
            <TouchableOpacity
              style={styles.addBtnSmall}
              onPress={() =>
                Alert.alert("New Test", "Create custom timed mock drill with auto-scoring.")
              }
            >
              <Ionicons name="add" size={16} color={Colors.WHITE} />
              <Text style={styles.addBtnText}>+ Create Test</Text>
            </TouchableOpacity>
          </View>

          {store.tests.map((tst) => (
            <View key={tst.id} style={styles.cardItem}>
              <Text style={styles.cardItemTitle}>{tst.title}</Text>
              <Text style={styles.cardItemMeta}>
                {tst.type} • {tst.totalQuestions} Questions • {tst.durationMinutes} Minutes
              </Text>
              <Text style={styles.cardItemMeta}>Pass Marks: {tst.passMarks} • Schedule: {tst.scheduledDate}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tab 4: Students Attendance & Performance */}
      {tab === "students" && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <Text style={styles.tabHeading}>Student Attendance & Performance</Text>
          <Text style={styles.tabSubheading}>Monitoring student attendance health & scores</Text>

          <View style={styles.perfOverviewCard}>
            <View style={styles.perfStat}>
              <Text style={styles.perfStatVal}>{store.attendance.overallPercentage}%</Text>
              <Text style={styles.perfStatLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfStat}>
              <Text style={styles.perfStatVal}>{store.performance.testAverageScore}%</Text>
              <Text style={styles.perfStatLabel}>Test Average</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfStat}>
              <Text style={styles.perfStatVal}>{store.performance.learningStreakDays}d</Text>
              <Text style={styles.perfStatLabel}>Avg Streak</Text>
            </View>
          </View>

          <Text style={[styles.tabHeading, { fontSize: 15, marginTop: 16 }]}>Subject Attendance Roster:</Text>
          {store.attendance.subjectWise.map((s, idx) => (
            <View key={idx} style={styles.rosterCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.rosterSubject}>{s.subject}</Text>
                <Text style={[styles.rosterPercent, s.percent < 75 && { color: "#dc2626" }]}>
                  {s.percent}%
                </Text>
              </View>
              <Text style={styles.rosterDetails}>
                {s.attended} of {s.total} sessions logged
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Create Class Modal */}
      <Modal visible={showCreateClassModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Schedule Live Class</Text>
              <TouchableOpacity onPress={() => setShowCreateClassModal(false)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Class Topic (e.g. Graph Algorithms)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newClassTitle}
              onChangeText={setNewClassTitle}
            />
            <TextInput
              placeholder="Subject (e.g. Computer Science)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newClassSubject}
              onChangeText={setNewClassSubject}
            />
            <TextInput
              placeholder="Time (e.g. Today, 5:00 PM - 6:30 PM)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newClassTime}
              onChangeText={setNewClassTime}
            />

            <View style={{ marginTop: 14 }}>
              <Button text="Publish Live Class" type="fill" onPress={handleCreateClass} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal visible={showCreateAsnModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Post New Assignment</Text>
              <TouchableOpacity onPress={() => setShowCreateAsnModal(false)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Assignment Title"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newAsnTitle}
              onChangeText={setNewAsnTitle}
            />
            <TextInput
              placeholder="Subject"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newAsnSubject}
              onChangeText={setNewAsnSubject}
            />
            <TextInput
              placeholder="Deadline (e.g. In 2 Days, 11:59 PM)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newAsnDeadline}
              onChangeText={setNewAsnDeadline}
            />
            <TextInput
              placeholder="Total Marks (e.g. 25)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.modalInput}
              value={newAsnMarks}
              onChangeText={setNewAsnMarks}
            />

            <View style={{ marginTop: 14 }}>
              <Button text="Post Assignment" type="fill" onPress={handleCreateAssignment} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Grading Modal */}
      <Modal visible={!!gradingItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Grade Student Assignment</Text>
              <TouchableOpacity onPress={() => setGradingItem(null)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.gradeAsnName}>{gradingItem?.title}</Text>
            <Text style={styles.studentSubmittedText}>
              Student solution: "{gradingItem?.submissionContent || 'Solution uploaded'}"
            </Text>

            <TextInput
              placeholder={`Award Marks (out of ${gradingItem?.totalMarks})`}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.modalInput}
              value={gradeMarks}
              onChangeText={setGradeMarks}
            />
            <TextInput
              placeholder="Teacher Feedback & Comments..."
              placeholderTextColor="#9ca3af"
              style={[styles.modalInput, { height: 80 }]}
              multiline
              value={gradeFeedback}
              onChangeText={setGradeFeedback}
            />

            <View style={{ marginTop: 14 }}>
              <Button text="Submit Grade & Feedback" type="fill" onPress={handleGradeSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  /* Banner Slider Styles */
  sliderContainer: {
    paddingTop: 10,
    marginBottom: 4,
  },
  sliderScroll: {
    paddingHorizontal: 20,
    paddingRight: 6,
  },
  slideCard: {
    width: SLIDE_WIDTH,
    height: 155,
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
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  slideTransparentImage: {
    width: 95,
    height: 95,
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
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e2e8f0",
  },
  activeDot: {
    width: 18,
    backgroundColor: Colors.PRIMARY,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 46,
    paddingBottom: 12,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  facultyAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  facultyAvatarInitial: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#166534",
  },
  facultyActiveDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: Colors.WHITE,
  },
  headerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  facultyPillRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  facultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  facultyBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: "#166534",
  },
  /* Faculty Quick Action Dock */
  quickLaunchDock: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginVertical: 10,
    gap: 8,
  },
  dockTile: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    gap: 6,
  },
  dockIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dockTileTitle: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#1e293b",
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  tabScrollRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  pillBtnActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  pillBtnText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#475569",
  },
  pillBtnTextActive: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
  },
  tabContent: {
    padding: 20,
    paddingBottom: 60,
  },
  actionHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  tabHeading: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: "#1e293b",
  },
  tabSubheading: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginBottom: 14,
  },
  addBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  cardItem: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  studioLivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  studioPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#dc2626",
  },
  studioLivePillText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: "#dc2626",
  },
  classSubjectChip: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.PRIMARY,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attendanceBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef9c3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  attendanceBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: "#854d0e",
  },
  classMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cardItemTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
    flex: 1,
    marginRight: 6,
  },
  statusBadgeSmall: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeSmallText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  cardItemMeta: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 4,
  },
  cardItemTeacher: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#475569",
  },
  gradeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 10,
  },
  gradeActionBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  gradedSummaryBox: {
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  gradedSummaryText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#166534",
  },
  perfOverviewCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.WHITE,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
    marginBottom: 14,
  },
  perfStat: {
    alignItems: "center",
  },
  perfStatVal: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: Colors.PRIMARY,
  },
  perfStatLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  perfDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e2e8f0",
  },
  rosterCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  rosterSubject: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  rosterPercent: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  rosterDetails: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  gradeAsnName: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
  },
  studentSubmittedText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginVertical: 8,
    fontStyle: "italic",
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    fontFamily: "outfit",
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 10,
  },
});
