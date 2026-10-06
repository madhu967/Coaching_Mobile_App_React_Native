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
  saveClassRollCallAttendance,
  saveTestRollCallAttendance,
} from "../../services/lmsStore";
import {
  getLoggedInTeacher,
  logoutTeacher,
} from "../../services/teacherAuth";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

const TEACHER_SLIDES = [
  {
    id: "class_studio",
    badge: "🎥 Live Studio",
    title: "Host Live Masterclass",
    subtitle: "Select class, inspect enrolled students & mark attendance",
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
    subtitle: "Publish practice tests & track test attendance",
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
  const [enrolledStudents, setEnrolledStudents] = useState([]);

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

  // Create Test Modal
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState("");
  const [newTestSubject, setNewTestSubject] = useState("");
  const [newTestDuration, setNewTestDuration] = useState("15");
  const [newTestPassMarks, setNewTestPassMarks] = useState("2");

  // Teacher Roll-Call Attendance Modal (For Classes & Tests)
  const [selectedClassForRollCall, setSelectedClassForRollCall] = useState(null);
  const [selectedTestForRollCall, setSelectedTestForRollCall] = useState(null);
  const [rollCallDraft, setRollCallDraft] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

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

      // Merge LMS enrolledStudents with any registered students in Firestore
      const studentMap = new Map();
      (data?.enrolledStudents || []).forEach((s) => {
        const key = (s.email || s.id || "").toLowerCase();
        if (key) {
          studentMap.set(key, {
            id: s.id || key,
            name: s.name || "Scholar",
            email: s.email || key,
            isPrimary: Boolean(s.isPrimary),
            isRealUser: Boolean(s.isPrimary),
          });
        }
      });

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 1500)
        );
        const snap = await Promise.race([
          getDocs(collection(db, "users")),
          timeoutPromise,
        ]);
        snap.forEach((docSnap) => {
          const u = docSnap.data();
          if (u?.email) {
            const key = u.email.trim().toLowerCase();
            studentMap.set(key, {
              id: docSnap.id || key,
              name: u.name || key.split("@")[0],
              email: key,
              isPrimary: true,
              isRealUser: true,
            });
          }
        });
      } catch (err) {}

      setEnrolledStudents(Array.from(studentMap.values()));
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

  // Teacher Step 1 & 2: Select Class to open Enrolled Students Roll Call
  const handleOpenClassRollCall = (cls) => {
    const existingMap = cls.studentAttendance || {};
    const draft = {};
    const list =
      enrolledStudents.length > 0
        ? enrolledStudents
        : store?.enrolledStudents || [];

    if (cls.rollCallCompleted) {
      list.forEach((stu) => {
        const emailKey = (stu.email || stu.id || "").toLowerCase();
        const prev =
          existingMap[emailKey] ||
          (stu.isPrimary ? existingMap["primary-student"] : null) ||
          (cls.attendanceMarked && stu.isPrimary ? "Present" : "Absent");
        draft[emailKey] = prev === "Present" ? "Present" : "Absent";
      });
      if (existingMap["primary-student"]) {
        draft["primary-student"] = existingMap["primary-student"];
      }
    }

    setSelectedTestForRollCall(null);
    setSelectedClassForRollCall(cls);
    setRollCallDraft(draft);
  };

  // Open Test Roll-Call Attendance
  const handleOpenTestRollCall = (tst) => {
    const existingMap = tst.studentAttendance || {};
    const draft = {};
    const list =
      enrolledStudents.length > 0
        ? enrolledStudents
        : store?.enrolledStudents || [];

    list.forEach((stu) => {
      const emailKey = (stu.email || stu.id || "").toLowerCase();
      const prev =
        existingMap[emailKey] ||
        (stu.isPrimary
          ? existingMap["primary-student"] || (tst.completed ? "Present" : null)
          : null);
      if (prev) {
        draft[emailKey] = prev === "Present" ? "Present" : "Absent";
      }
    });

    setSelectedClassForRollCall(null);
    setSelectedTestForRollCall(tst);
    setRollCallDraft(draft);
  };

  // Teacher Step 4: Toggle Present / Absent for a student
  const handleSetStudentStatus = (student, status) => {
    const emailKey = (student.email || student.id || "").toLowerCase();
    setRollCallDraft((prev) => {
      const updated = { ...prev, [emailKey]: status };
      if (student.isPrimary || student.isRealUser) {
        updated["primary-student"] = status;
        updated["student@coachingguru.com"] = status;
        if (store?.activeStudentEmail) {
          updated[store.activeStudentEmail.toLowerCase()] = status;
        }
      }
      return updated;
    });
  };

  const handleMarkAllRollCall = (status) => {
    const list =
      enrolledStudents.length > 0
        ? enrolledStudents
        : store?.enrolledStudents || [];
    const nextDraft = {
      "primary-student": status,
      "student@coachingguru.com": status,
    };
    if (store?.activeStudentEmail) {
      nextDraft[store.activeStudentEmail.toLowerCase()] = status;
    }
    list.forEach((stu) => {
      const emailKey = (stu.email || stu.id || "").toLowerCase();
      nextDraft[emailKey] = status;
    });
    setRollCallDraft(nextDraft);
  };

  // Teacher Step 5: Save Attendance
  const handleSaveRollCallAttendance = async () => {
    setSavingAttendance(true);
    try {
      const list =
        enrolledStudents.length > 0
          ? enrolledStudents
          : store?.enrolledStudents || [];

      if (selectedClassForRollCall) {
        const updatedStore = await saveClassRollCallAttendance(
          selectedClassForRollCall.id,
          rollCallDraft,
          list
        );
        setStore({ ...updatedStore });
        Alert.alert(
          "Class Attendance Saved! ✅",
          `Attendance for "${selectedClassForRollCall.title}" is now ${updatedStore?.attendance?.overallPercentage ?? 0}% Combined (${updatedStore?.attendance?.classAttendancePercentage ?? 0}% Classes).`
        );
        setSelectedClassForRollCall(null);
      } else if (selectedTestForRollCall) {
        const updatedStore = await saveTestRollCallAttendance(
          selectedTestForRollCall.id,
          rollCallDraft
        );
        setStore({ ...updatedStore });
        Alert.alert(
          "Test Attendance Saved! ✅",
          `Attendance for "${selectedTestForRollCall.title}" is now ${updatedStore?.attendance?.overallPercentage ?? 0}% Combined (${updatedStore?.attendance?.testAttendancePercentage ?? 0}% Tests).`
        );
        setSelectedTestForRollCall(null);
      }

      await loadData();
    } catch (e) {
      Alert.alert("Error", "Could not save attendance.");
    } finally {
      setSavingAttendance(false);
    }
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

    Alert.alert(
      "Class Scheduled! 🎥",
      "Class created! Students who do not attend will be marked Absent until you mark them Present in Roll Call."
    );
    setShowCreateClassModal(false);
    setNewClassTitle("");
    setNewClassSubject("");
    setNewClassTime("");
    loadData();
  };

  const handleCreateTest = async () => {
    if (!newTestTitle.trim() || !newTestSubject.trim()) {
      Alert.alert("Missing Fields", "Please enter test title and subject.");
      return;
    }

    await createTest({
      title: newTestTitle.trim(),
      subject: newTestSubject.trim(),
      durationMinutes: parseInt(newTestDuration) || 15,
      passMarks: parseInt(newTestPassMarks) || 2,
      type: "Mock Test",
      scheduledDate: "Today, Open until 11:59 PM",
    });

    Alert.alert(
      "Test Published! ⏱️",
      "Test created! Students who do not attempt/attend this test are automatically marked Absent for it."
    );
    setShowCreateTestModal(false);
    setNewTestTitle("");
    setNewTestSubject("");
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

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning,"
      : currentHour < 18
      ? "Good afternoon,"
      : "Good evening,";

  const teacherName = teacherProfile?.name || "Faculty Member";
  const teacherInitial = teacherName.charAt(0).toUpperCase();
  const cohortAttendance = store?.attendance?.overallPercentage ?? 0;
  const classAttendancePercent = store?.attendance?.classAttendancePercentage ?? 0;
  const testAttendancePercent = store?.attendance?.testAttendancePercentage ?? 0;
  const totalActivitiesCount =
    (store?.classes?.length || 0) +
    (store?.assignments?.length || 0) +
    (store?.tests?.length || 0);

  return (
    <View style={styles.container}>
      {/* ===============================================================
          1. TOP HEADER NAVBAR (Full-bleed UI theme background, Good morning, Teacher Name, Streak, FACULTY Badge, Avatar & Logout)
          =============================================================== */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeSub}>{greeting}</Text>
          <Text style={styles.userNameText}>{teacherName}</Text>
        </View>

        <View style={styles.headerRightGroup}>
          <View style={styles.streakPill}>
            <Text style={styles.streakPillText}>⚡ Studio Live</Text>
          </View>

          <View style={styles.proBadge}>
            <Text style={styles.proText}>FACULTY</Text>
          </View>

          <TouchableOpacity
            onPress={handleTeacherLogout}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{teacherInitial}</Text>
            </View>
            {/* Active Indicator Dot */}
            <View style={styles.activeLimeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutNavBtn}
            onPress={handleTeacherLogout}
            activeOpacity={0.75}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
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
            2. DISPLAY TITLE ("Faculty Dashboard / Academic Studio ⁽⁴⁾")
            =============================================================== */}
        <View style={styles.headingSection}>
          <Text style={styles.displaySubHeading}>Faculty Dashboard</Text>
          <View style={styles.displayMainRow}>
            <Text style={styles.displayMainHeading}>Academic Studio</Text>
            <Text style={styles.superscriptBadge}>({totalActivitiesCount})</Text>
          </View>
        </View>

        {/* ===============================================================
            3. DATE, COHORT ATTENDANCE & SUBJECT/DESK ROADMAP TREE
            =============================================================== */}
        <View style={styles.dateAndRoadmapRow}>
          {/* Left: Electric Lime Date Pill + Real Attendance % Display (0% if no session attended) */}
          <View style={styles.dateBlock}>
            <View style={styles.limeDatePill}>
              <Text style={styles.limeDateText}>Cohort Attendance</Text>
            </View>
            <Text style={styles.giantDateNumber}>{cohortAttendance}%</Text>
            <Text style={styles.attendanceMetaText}>
              Classes: {classAttendancePercent}% • Tests: {testAttendancePercent}%
            </Text>
          </View>

          {/* Right: Vertical Tree Roadmap Selector (Coaching App Faculty Desks) */}
          <View style={styles.roadmapTreeContainer}>
            <View style={styles.roadmapLine} />

            {/* Branch 1 */}
            <TouchableOpacity
              style={styles.roadmapBranch}
              onPress={() => setTab("classes")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.roadmapDot,
                  tab === "classes" && styles.roadmapDotActive,
                ]}
              />
              <Text
                style={[
                  styles.roadmapBranchText,
                  tab === "classes" && styles.roadmapBranchTextActive,
                ]}
              >
                Live Masterclass
              </Text>
            </TouchableOpacity>

            {/* Branch 2 */}
            <TouchableOpacity
              style={styles.roadmapBranch}
              onPress={() => setTab("assignments")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.roadmapDot,
                  tab === "assignments" && styles.roadmapDotActive,
                ]}
              />
              <Text
                style={[
                  styles.roadmapBranchText,
                  tab === "assignments" && styles.roadmapBranchTextActive,
                ]}
              >
                Assignment Desk
              </Text>
            </TouchableOpacity>

            {/* Branch 3 */}
            <TouchableOpacity
              style={styles.roadmapBranch}
              onPress={() => setTab("students")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.roadmapDot,
                  tab === "students" && styles.roadmapDotActive,
                ]}
              />
              <Text
                style={[
                  styles.roadmapBranchText,
                  tab === "students" && styles.roadmapBranchTextActive,
                ]}
              >
                Cohort Roster
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===============================================================
            4. FILTER PILLS ROW (Count icon, Active tab pill, + Quick Action)
            =============================================================== */}
        <View style={styles.filterPillRow}>
          <TouchableOpacity
            style={styles.filterIconBtn}
            onPress={() => setTab("classes")}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam-outline" size={17} color={Colors.BLACK} />
            <View style={styles.filterLimeDot}>
              <Text style={styles.filterLimeDotText}>{store.classes.length}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.activeFilterPill}>
            <Text style={styles.activeFilterText}>
              {tab === "classes"
                ? "Live Classes"
                : tab === "assignments"
                ? "Assignments"
                : tab === "tests"
                ? "Timed Tests"
                : "Student Roster"}
            </Text>
            <Ionicons name="checkmark" size={13} color={Colors.BLACK} />
          </View>

          <TouchableOpacity
            style={styles.secondaryFilterPill}
            onPress={() => setShowCreateClassModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={12} color={Colors.BLACK} />
            <Text style={styles.secondaryFilterText}>Schedule Class</Text>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            5. IMAGE SLIDER BANNER CAROUSEL (DEDICATED CAROUSEL)
            =============================================================== */}
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
                activeOpacity={0.92}
                onPress={() => handleTeacherSlideAction(slide.action)}
              >
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

        {/* ===============================================================
            6. FACULTY QUICK ACTION COMMAND DOCK
            =============================================================== */}
        <View style={styles.quickLaunchDock}>
          <TouchableOpacity
            style={styles.dockTile}
            onPress={() => setShowCreateClassModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.dockIconCircle, { backgroundColor: Colors.LIME_LIGHT }]}>
              <Ionicons name="videocam" size={16} color={Colors.BLACK} />
            </View>
            <Text style={styles.dockTileTitle}>+ Live Class</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockTile}
            onPress={() => setShowCreateTestModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.dockIconCircle, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="timer" size={16} color="#2563EB" />
            </View>
            <Text style={styles.dockTileTitle}>+ New Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockTile}
            onPress={() => setShowCreateAsnModal(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.dockIconCircle, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="document-text" size={16} color="#EA580C" />
            </View>
            <Text style={styles.dockTileTitle}>+ Assignment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockTile}
            onPress={() => setTab("students")}
            activeOpacity={0.8}
          >
            <View style={[styles.dockIconCircle, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="people" size={16} color="#16A34A" />
            </View>
            <Text style={styles.dockTileTitle}>Roll Call</Text>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            7. TAB CONTENT (Classes / Assignments / Tests / Students Roster)
            =============================================================== */}
        {tab === "classes" && (
          <View style={styles.tabContentWrapper}>
            <View style={styles.actionHeaderBar}>
              <View>
                <Text style={styles.tabHeading}>
                  Today's & Scheduled Classes ({store.classes.length})
                </Text>
                <Text style={{ fontFamily: "outfit", fontSize: 12, color: Colors.MUTED, marginTop: 2 }}>
                  Select a class → Mark enrolled students Present / Absent → Save
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addBtnSmall}
                onPress={() => setShowCreateClassModal(true)}
              >
                <Ionicons name="add" size={16} color={Colors.WHITE} />
                <Text style={styles.addBtnText}>+ New Class</Text>
              </TouchableOpacity>
            </View>

            {store.classes.map((cls) => {
              const isRollCallDone = Boolean(cls.rollCallCompleted);
              const isPrimaryPresent =
                isRollCallDone &&
                (cls.studentAttendance?.["primary-student"] === "Present" ||
                  cls.attendanceMarked);
              const records = Array.isArray(cls.attendanceRecords)
                ? cls.attendanceRecords
                : [];
              const presentCount = records.filter((r) => r.status === "Present").length;
              const absentCount = records.filter((r) => r.status === "Absent").length;

              return (
                <TouchableOpacity
                  key={cls.id}
                  style={styles.cardItem}
                  activeOpacity={0.9}
                  onPress={() => handleOpenClassRollCall(cls)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <View
                          style={[
                            styles.studioLivePill,
                            cls.isLiveToday && { backgroundColor: "#DCFCE7" },
                          ]}
                        >
                          <View
                            style={[
                              styles.studioPulseDot,
                              cls.isLiveToday && { backgroundColor: "#16A34A" },
                            ]}
                          />
                          <Text
                            style={[
                              styles.studioLivePillText,
                              cls.isLiveToday && { color: "#15803D" },
                            ]}
                          >
                            {cls.isLiveToday ? "TODAY'S CLASS" : "SCHEDULED"}
                          </Text>
                        </View>
                        <Text style={styles.classSubjectChip}>{cls.subject}</Text>
                      </View>
                      <Text style={styles.cardItemTitle}>{cls.title}</Text>
                    </View>

                    <View
                      style={[
                        styles.attendanceBadgeSmall,
                        isRollCallDone
                          ? isPrimaryPresent
                            ? { backgroundColor: "#F0FDF4" }
                            : { backgroundColor: "#FEF2F2" }
                          : { backgroundColor: "#FEF2F2" },
                      ]}
                    >
                      <Ionicons
                        name={
                          isRollCallDone
                            ? isPrimaryPresent
                              ? "checkmark-circle"
                              : "close-circle"
                            : "alert-circle"
                        }
                        size={12}
                        color={
                          isRollCallDone
                            ? isPrimaryPresent
                              ? "#16A34A"
                              : "#DC2626"
                            : "#DC2626"
                        }
                      />
                      <Text
                        style={[
                          styles.attendanceBadgeText,
                          isRollCallDone
                            ? isPrimaryPresent
                              ? { color: "#16A34A" }
                              : { color: "#DC2626" }
                            : { color: "#DC2626" },
                        ]}
                      >
                        {isRollCallDone
                          ? `Saved (${presentCount}P / ${absentCount}A)`
                          : "Unmarked (Absent)"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.classMetaRow}>
                    <Text style={styles.cardItemMeta}>⏰ {cls.time}</Text>
                    <Text style={styles.cardItemMeta}>📍 {cls.roomNumber}</Text>
                  </View>

                  {/* Teacher Action Button to Open Class & Mark Present / Absent */}
                  <TouchableOpacity
                    style={[
                      styles.gradeActionBtn,
                      {
                        backgroundColor: isRollCallDone
                          ? Colors.BLACK
                          : Colors.LIME_BRIGHT,
                        marginTop: 12,
                      },
                    ]}
                    onPress={() => handleOpenClassRollCall(cls)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="people"
                      size={15}
                      color={isRollCallDone ? Colors.WHITE : Colors.BLACK}
                    />
                    <Text
                      style={[
                        styles.gradeActionBtnText,
                        { color: isRollCallDone ? Colors.WHITE : Colors.BLACK },
                      ]}
                    >
                      {isRollCallDone
                        ? "Update Enrolled Students Attendance (Present / Absent)"
                        : "Select Class & Mark Attendance (Present / Absent)"}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {tab === "assignments" && (
          <View style={styles.tabContentWrapper}>
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
          </View>
        )}

        {tab === "tests" && (
          <View style={styles.tabContentWrapper}>
            <View style={styles.actionHeaderBar}>
              <View>
                <Text style={styles.tabHeading}>
                  Tests & Assessments ({store.tests.length})
                </Text>
                <Text style={{ fontFamily: "outfit", fontSize: 12, color: Colors.MUTED, marginTop: 2 }}>
                  Unattempted tests are automatically counted as Absent
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addBtnSmall}
                onPress={() => setShowCreateTestModal(true)}
              >
                <Ionicons name="add" size={16} color={Colors.WHITE} />
                <Text style={styles.addBtnText}>+ Create Test</Text>
              </TouchableOpacity>
            </View>

            {store.tests.map((tst) => {
              const isTestAttended =
                tst.studentAttendance?.["primary-student"] === "Present" ||
                (tst.studentAttendance?.["primary-student"] !== "Absent" &&
                  Boolean(tst.completed));

              return (
                <View key={tst.id} style={styles.cardItem}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={styles.cardItemTitle}>{tst.title}</Text>
                    <View
                      style={[
                        styles.attendanceBadgeSmall,
                        isTestAttended
                          ? { backgroundColor: "#F0FDF4" }
                          : { backgroundColor: "#FEF2F2" },
                      ]}
                    >
                      <Ionicons
                        name={isTestAttended ? "checkmark-circle" : "close-circle"}
                        size={12}
                        color={isTestAttended ? "#16A34A" : "#DC2626"}
                      />
                      <Text
                        style={[
                          styles.attendanceBadgeText,
                          { color: isTestAttended ? "#16A34A" : "#DC2626" },
                        ]}
                      >
                        {isTestAttended ? "Attended (Present)" : "Not Attended (Absent)"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardItemMeta}>
                    {tst.subject} • {tst.type} • {tst.totalQuestions} Questions • {tst.durationMinutes} Mins
                  </Text>
                  <Text style={styles.cardItemMeta}>
                    Pass Marks: {tst.passMarks} • Schedule: {tst.scheduledDate}
                  </Text>

                  <TouchableOpacity
                    style={[styles.gradeActionBtn, { marginTop: 10 }]}
                    onPress={() => handleOpenTestRollCall(tst)}
                  >
                    <Ionicons name="checkmark-done" size={14} color={Colors.WHITE} />
                    <Text style={styles.gradeActionBtnText}>
                      Manage Student Test Attendance (Present / Absent)
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {tab === "students" && (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.tabHeading}>Student Attendance & Performance</Text>
            <Text style={styles.tabSubheading}>
              Combined & separate tracking for Live Classes and Tests (0% if none attended)
            </Text>

            <View style={styles.perfOverviewCard}>
              <View style={styles.perfStat}>
                <Text style={styles.perfStatVal}>
                  {store.attendance.overallPercentage ?? 0}%
                </Text>
                <Text style={styles.perfStatLabel}>Combined Avg</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfStat}>
                <Text style={styles.perfStatVal}>
                  {store.attendance.classAttendancePercentage ?? 0}%
                </Text>
                <Text style={styles.perfStatLabel}>Class Attendance</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfStat}>
                <Text style={styles.perfStatVal}>
                  {store.attendance.testAttendancePercentage ?? 0}%
                </Text>
                <Text style={styles.perfStatLabel}>Test Attendance</Text>
              </View>
            </View>

            <Text style={[styles.tabHeading, { fontSize: 15, marginTop: 8, marginBottom: 8 }]}>
              Enrolled Students Roster ({enrolledStudents.length}):
            </Text>
            {enrolledStudents.map((stu, idx) => (
              <View key={stu.id || idx} style={styles.rosterCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={styles.rosterSubject}>
                      {stu.name} {stu.isPrimary ? " (Active Student)" : ""}
                    </Text>
                    <Text style={styles.rosterDetails}>{stu.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: Colors.BLACK,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                    }}
                    onPress={() => {
                      if (store.classes.length > 0) {
                        handleOpenClassRollCall(store.classes[0]);
                      }
                    }}
                  >
                    <Text style={{ fontFamily: "outfit-bold", fontSize: 11, color: Colors.WHITE }}>
                      Mark Roll Call
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={[styles.tabHeading, { fontSize: 15, marginTop: 16, marginBottom: 8 }]}>
              Subject Attendance Breakdown (Classes + Tests):
            </Text>
            {store.attendance.subjectWise.map((s, idx) => (
              <View key={idx} style={styles.rosterCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.rosterSubject}>{s.subject}</Text>
                  <Text style={[styles.rosterPercent, s.percent < 75 && { color: "#dc2626" }]}>
                    {s.percent}%
                  </Text>
                </View>
                <Text style={styles.rosterDetails}>
                  Combined: {s.attended}/{s.total} Present • Classes: {s.classesAttended ?? 0}/{s.classesTotal ?? 0} • Tests: {s.testsAttended ?? 0}/{s.testsTotal ?? 0}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ===============================================================
          TEACHER ROLL-CALL ATTENDANCE MODAL (SELECT CLASS -> MARK PRESENT / ABSENT -> SAVE)
          =============================================================== */}
      <Modal
        visible={Boolean(selectedClassForRollCall || selectedTestForRollCall)}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: "88%" }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.modalTitle}>
                  {selectedClassForRollCall
                    ? "Mark Class Attendance"
                    : "Mark Test Attendance"}
                </Text>
                <Text
                  style={{
                    fontFamily: "outfit-bold",
                    fontSize: 13.5,
                    color: Colors.BLACK,
                    marginTop: 3,
                  }}
                >
                  {(selectedClassForRollCall || selectedTestForRollCall)?.title}
                </Text>
                <Text
                  style={{
                    fontFamily: "outfit",
                    fontSize: 12,
                    color: Colors.GRAY,
                    marginTop: 2,
                  }}
                >
                  {(selectedClassForRollCall || selectedTestForRollCall)?.subject} • Enrolled Students ({enrolledStudents.length})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedClassForRollCall(null);
                  setSelectedTestForRollCall(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.BLACK} />
              </TouchableOpacity>
            </View>

            {/* Quick Bulk Actions */}
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F0FDF4",
                  borderWidth: 1,
                  borderColor: "#BBF7D0",
                  paddingVertical: 8,
                  borderRadius: 12,
                  gap: 6,
                }}
                onPress={() => handleMarkAllRollCall("Present")}
              >
                <Ionicons name="checkmark-done-circle" size={16} color="#16A34A" />
                <Text
                  style={{
                    fontFamily: "outfit-bold",
                    fontSize: 12,
                    color: "#15803D",
                  }}
                >
                  Mark All Present
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FEF2F2",
                  borderWidth: 1,
                  borderColor: "#FECACA",
                  paddingVertical: 8,
                  borderRadius: 12,
                  gap: 6,
                }}
                onPress={() => handleMarkAllRollCall("Absent")}
              >
                <Ionicons name="close-circle" size={16} color="#DC2626" />
                <Text
                  style={{
                    fontFamily: "outfit-bold",
                    fontSize: 12,
                    color: "#B91C1C",
                  }}
                >
                  Mark All Absent
                </Text>
              </TouchableOpacity>
            </View>

            {/* Enrolled Students List with Present / Absent Toggles */}
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {(enrolledStudents.length > 0
                ? enrolledStudents
                : store?.enrolledStudents || []
              ).map((stu, idx) => {
                const emailKey = (stu.email || stu.id || "").toLowerCase();
                const currentStatus =
                  rollCallDraft[emailKey] ||
                  (stu.isPrimary ? rollCallDraft["primary-student"] : null) ||
                  "Absent";
                const isPresent = currentStatus === "Present";

                return (
                  <View
                    key={stu.id || idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: Colors.BG_LIGHT,
                      padding: 12,
                      borderRadius: 16,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: isPresent ? "#86EFAC" : "#FECACA",
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text
                          style={{
                            fontFamily: "outfit-bold",
                            fontSize: 14,
                            color: Colors.BLACK,
                          }}
                        >
                          {stu.name}
                        </Text>
                        {stu.isPrimary && (
                          <View
                            style={{
                              backgroundColor: Colors.LIME,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: "outfit-bold",
                                fontSize: 9,
                                color: Colors.BLACK,
                              }}
                            >
                              ENROLLED
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontFamily: "outfit",
                          fontSize: 11.5,
                          color: Colors.GRAY,
                          marginTop: 2,
                        }}
                      >
                        {stu.email}
                      </Text>
                    </View>

                    {/* Present / Absent Buttons */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleSetStudentStatus(stu, "Present")}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 11,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: isPresent ? "#16A34A" : Colors.WHITE,
                          borderWidth: 1,
                          borderColor: isPresent ? "#16A34A" : Colors.BORDER,
                          gap: 4,
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color={isPresent ? Colors.WHITE : Colors.GRAY}
                        />
                        <Text
                          style={{
                            fontFamily: "outfit-bold",
                            fontSize: 12,
                            color: isPresent ? Colors.WHITE : Colors.GRAY,
                          }}
                        >
                          Present
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleSetStudentStatus(stu, "Absent")}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 11,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: !isPresent ? "#DC2626" : Colors.WHITE,
                          borderWidth: 1,
                          borderColor: !isPresent ? "#DC2626" : Colors.BORDER,
                          gap: 4,
                        }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={13}
                          color={!isPresent ? Colors.WHITE : Colors.GRAY}
                        />
                        <Text
                          style={{
                            fontFamily: "outfit-bold",
                            fontSize: 12,
                            color: !isPresent ? Colors.WHITE : Colors.GRAY,
                          }}
                        >
                          Absent
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={{ marginTop: 14 }}>
              <Button
                text={savingAttendance ? "Saving Attendance..." : "Save Attendance"}
                type="fill"
                loading={savingAttendance}
                onPress={handleSaveRollCallAttendance}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Test Modal */}
      <Modal visible={showCreateTestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={styles.modalTitle}>Create New Test</Text>
                <Text style={{ fontFamily: "outfit", fontSize: 12, color: Colors.GRAY }}>
                  Unattended tests are marked Absent for students
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateTestModal(false)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Test Title (e.g. System Design Assessment)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newTestTitle}
              onChangeText={setNewTestTitle}
            />
            <TextInput
              placeholder="Subject (e.g. Software Engineering)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newTestSubject}
              onChangeText={setNewTestSubject}
            />
            <TextInput
              placeholder="Duration in Minutes (e.g. 15)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.modalInput}
              value={newTestDuration}
              onChangeText={setNewTestDuration}
            />
            <TextInput
              placeholder="Pass Marks (e.g. 2)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.modalInput}
              value={newTestPassMarks}
              onChangeText={setNewTestPassMarks}
            />

            <View style={{ marginTop: 14 }}>
              <Button text="Publish Test" type="fill" onPress={handleCreateTest} />
            </View>
          </View>
        </View>
      </Modal>

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

      {/* Teacher Floating Capsule Bottom Navigation Dock */}
      <View style={styles.floatingDockWrapper} pointerEvents="box-none">
        <View style={styles.floatingDock}>
          {[
            { key: "classes", label: "Classes", activeIcon: "videocam", inactiveIcon: "videocam-outline" },
            { key: "assignments", label: "Tasks", activeIcon: "document-text", inactiveIcon: "document-text-outline" },
            { key: "tests", label: "Tests", activeIcon: "timer", inactiveIcon: "timer-outline" },
            { key: "students", label: "Roster", activeIcon: "people", inactiveIcon: "people-outline" },
          ].map((item) => {
            const isFocused = tab === item.key;
            if (isFocused) {
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  activeOpacity={0.88}
                  style={styles.activePillCapsule}
                >
                  <Ionicons name={item.activeIcon} size={16} color={Colors.WHITE} />
                  <Text style={styles.activePillText}>{item.label}</Text>
                  <View style={styles.dockLimeDot} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setTab(item.key)}
                activeOpacity={0.7}
                style={styles.inactiveIconBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name={item.inactiveIcon} size={22} color={Colors.MUTED} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

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
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.BG_LIGHT,
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
  streakPill: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(13, 13, 13, 0.08)",
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
    borderColor: Colors.BLACK,
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
    backgroundColor: "#16A34A",
    borderWidth: 2,
    borderColor: Colors.WHITE,
  },
  logoutNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(13, 13, 13, 0.12)",
    marginLeft: 2,
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

  /* Date & Roadmap Row (92% Attendance & Vertical Tree) */
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
    backgroundColor: Colors.LIME_BRIGHT,
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
  tabContentWrapper: {
    paddingTop: 10,
    paddingBottom: 20,
  },

  /* Banner Slider Styles */
  sliderContainer: {
    paddingTop: 12,
    marginBottom: 6,
  },
  sliderScroll: {
    paddingHorizontal: 20,
    paddingRight: 6,
  },
  slideCard: {
    width: SLIDE_WIDTH,
    height: 158,
    borderRadius: 24,
    marginRight: 14,
    backgroundColor: Colors.DARK_CARD,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
    backgroundColor: Colors.LIME,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  slideBadgeText: {
    color: Colors.BLACK,
    fontSize: 10.5,
    fontFamily: "outfit-bold",
  },
  slideTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16.5,
    color: Colors.WHITE,
    marginTop: 5,
    lineHeight: 21,
  },
  slideSubtitle: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.72)",
    marginTop: 2,
    lineHeight: 15,
  },
  slideCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.LIME,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    marginTop: 8,
  },
  slideCtaText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.BLACK,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
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
    backgroundColor: Colors.LIME,
  },

  /* Faculty Quick Action Dock */
  quickLaunchDock: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginVertical: 10,
    gap: 10,
  },
  dockTile: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    gap: 6,
  },
  dockIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dockTileTitle: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.BLACK,
  },

  /* Navigation Pills */
  tabScrollRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    borderColor: Colors.BORDER_LIGHT,
    gap: 6,
  },
  pillBtnActive: {
    backgroundColor: Colors.BLACK,
    borderColor: Colors.BLACK,
  },
  pillBtnText: {
    fontFamily: "outfit-medium",
    fontSize: 12.5,
    color: Colors.GRAY,
  },
  pillBtnTextActive: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
  },

  /* Content Area */
  tabContent: {
    padding: 20,
    paddingBottom: 120, // clearance for floating dock
  },
  actionHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  tabHeading: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.BLACK,
    letterSpacing: -0.3,
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
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },

  /* Cards */
  cardItem: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  studioLivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  studioPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.DANGER,
  },
  studioLivePillText: {
    fontFamily: "outfit-bold",
    fontSize: 9,
    color: Colors.DANGER,
  },
  classSubjectChip: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.BLACK,
    backgroundColor: Colors.LIME_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  attendanceBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  attendanceBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: "#854D0E",
  },
  classMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cardItemTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15.5,
    color: Colors.BLACK,
    flex: 1,
    marginRight: 6,
  },
  statusBadgeSmall: {
    backgroundColor: Colors.CHIP_BG,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeSmallText: {
    fontFamily: "outfit-bold",
    fontSize: 10.5,
    color: Colors.BLACK,
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
    color: Colors.GRAY,
  },
  gradeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BLACK,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 10,
  },
  gradeActionBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12.5,
    color: Colors.WHITE,
  },
  gradedSummaryBox: {
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#DCFCE7",
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
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  perfStat: {
    alignItems: "center",
  },
  perfStatVal: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.BLACK,
  },
  perfStatLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  perfDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.BORDER_LIGHT,
  },
  rosterCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  rosterSubject: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.BLACK,
  },
  rosterPercent: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.BLACK,
  },
  rosterDetails: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 3,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: "outfit-bold",
    fontSize: 19,
    color: Colors.BLACK,
  },
  gradeAsnName: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
  },
  studentSubmittedText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginVertical: 8,
    fontStyle: "italic",
  },
  modalInput: {
    backgroundColor: Colors.CHIP_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    padding: 13,
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.BLACK,
    marginBottom: 10,
  },

  /* Floating Capsule Bottom Dock */
  floatingDockWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "ios" ? 28 : 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  floatingDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 36,
    paddingHorizontal: 12,
    paddingVertical: 7,
    width: "90%",
    maxWidth: 390,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 236, 0.85)",
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
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    gap: 6,
  },
  activePillText: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
    fontSize: 13,
  },
  dockLimeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.LIME,
    marginLeft: 1,
  },
  inactiveIconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
});
