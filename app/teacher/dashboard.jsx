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
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { useTheme } from "../../context/ThemeContext";
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
import generateContentWithAI from "../../config/AiModel";
import { generateTestQuestions } from "../../constant/Prompt";
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
  const { themeMode, isIndigo, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(), [themeMode]);

  // Teacher Tabs: 'overview' | 'classes' | 'assignments' | 'tests' | 'attendance' | 'students'
  const [tab, setTab] = useState("overview");
  const [showMoreModal, setShowMoreModal] = useState(false);
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

  // Create Test Modal + Question Upload & Gemini AI Question Generation
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState("");
  const [newTestSubject, setNewTestSubject] = useState("");
  const [newTestDuration, setNewTestDuration] = useState("15");
  const [newTestPassMarks, setNewTestPassMarks] = useState("2");
  const [testQuestions, setTestQuestions] = useState([]);
  const [aiTopicPrompt, setAiTopicPrompt] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [publishingTest, setPublishingTest] = useState(false);

  // Manual Question Upload Form State
  const [showManualQForm, setShowManualQForm] = useState(false);
  const [manualQText, setManualQText] = useState("");
  const [manualOptA, setManualOptA] = useState("");
  const [manualOptB, setManualOptB] = useState("");
  const [manualOptC, setManualOptC] = useState("");
  const [manualOptD, setManualOptD] = useState("");
  const [manualCorrectIdx, setManualCorrectIdx] = useState(0);
  const [manualExplanation, setManualExplanation] = useState("");
  const [expandedTestId, setExpandedTestId] = useState(null);

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

  const handleGenerateQuestionsWithAI = async () => {
    const topicVal =
      aiTopicPrompt.trim() ||
      newTestTitle.trim() ||
      newTestSubject.trim();

    if (!topicVal) {
      alert("Please enter a Test Title, Subject, or AI Topic Prompt");
      return;
    }

    if (aiGenerating) {
      alert("Please wait for the previous request to complete");
      return;
    }

    try {
      setAiGenerating(true);
      const PROMPT =
        generateTestQuestions.idea +
        `\nGenerate ${aiQuestionCount} questions.\n\nUser Input: ` +
        topicVal;
      const aiResponse = await generateContentWithAI(PROMPT);
      console.log("Generated Test Questions:", aiResponse);

      const cleaned = String(aiResponse || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsedData = JSON.parse(cleaned);
      const rawQuestions =
        parsedData?.questions ||
        (Array.isArray(parsedData) ? parsedData : []);

      const formattedQuestions = rawQuestions.map((q, idx) => ({
        id: `ai-q-${Date.now()}-${idx + 1}`,
        question: q.question || q.title || `Question ${idx + 1} on ${topicVal}`,
        options:
          Array.isArray(q.options) && q.options.length >= 4
            ? q.options.slice(0, 4)
            : [
                `Core principle of ${topicVal}`,
                `Optimized implementation in ${topicVal}`,
                "Alternative legacy approach",
                "None of the above",
              ],
        correctIndex:
          typeof q.correctIndex === "number" &&
          q.correctIndex >= 0 &&
          q.correctIndex <= 3
            ? q.correctIndex
            : 0,
        explanation:
          q.explanation ||
          q.description ||
          `Correct concept for ${topicVal}.`,
      }));

      setTestQuestions((prev) => [...prev, ...formattedQuestions]);
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddManualQuestion = () => {
    if (!manualQText.trim()) {
      Alert.alert("Missing Question", "Please enter the question text.");
      return;
    }
    if (!manualOptA.trim() || !manualOptB.trim()) {
      Alert.alert("Missing Options", "Please enter at least Option A and Option B.");
      return;
    }

    const options = [
      manualOptA.trim(),
      manualOptB.trim(),
      manualOptC.trim() || "None of the above",
      manualOptD.trim() || "All of the above",
    ];

    const newQ = {
      id: "manual-q-" + Date.now(),
      question: manualQText.trim(),
      options,
      correctIndex: manualCorrectIdx,
      explanation:
        manualExplanation.trim() ||
        `Correct Answer: Option ${String.fromCharCode(65 + manualCorrectIdx)} (${options[manualCorrectIdx]}).`,
    };

    setTestQuestions((prev) => [...prev, newQ]);
    setManualQText("");
    setManualOptA("");
    setManualOptB("");
    setManualOptC("");
    setManualOptD("");
    setManualCorrectIdx(0);
    setManualExplanation("");
    setShowManualQForm(false);
  };

  const handleRemoveTestQuestion = (qId) => {
    setTestQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleCreateTest = async () => {
    if (!newTestTitle.trim() || !newTestSubject.trim()) {
      Alert.alert("Missing Fields", "Please enter test title and subject.");
      return;
    }

    setPublishingTest(true);
    try {
      let finalQuestions = [...testQuestions];

      // If teacher didn't manually upload or pre-generate questions yet, auto-generate with Gemini AI using the exact same code pattern
      if (finalQuestions.length === 0) {
        const topicVal =
          aiTopicPrompt.trim() ||
          `${newTestTitle.trim()} - ${newTestSubject.trim()}`;
        const PROMPT =
          generateTestQuestions.idea +
          `\nGenerate ${aiQuestionCount || 5} questions.\n\nUser Input: ` +
          topicVal;
        const aiResponse = await generateContentWithAI(PROMPT);
        const cleaned = String(aiResponse || "")
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const parsedData = JSON.parse(cleaned);
        const rawQuestions =
          parsedData?.questions ||
          (Array.isArray(parsedData) ? parsedData : []);
        finalQuestions = rawQuestions.map((q, idx) => ({
          id: `ai-q-${Date.now()}-${idx + 1}`,
          question: q.question || q.title || `Question ${idx + 1} on ${topicVal}`,
          options:
            Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4)
              : [
                  `Core principle of ${topicVal}`,
                  `Optimized implementation in ${topicVal}`,
                  "Alternative legacy approach",
                  "None of the above",
                ],
          correctIndex:
            typeof q.correctIndex === "number" &&
            q.correctIndex >= 0 &&
            q.correctIndex <= 3
              ? q.correctIndex
              : 0,
          explanation:
            q.explanation ||
            q.description ||
            `Correct concept for ${topicVal}.`,
        }));
      }

      const passVal = Math.min(
        finalQuestions.length,
        Math.max(1, parseInt(newTestPassMarks) || Math.ceil(finalQuestions.length * 0.5))
      );

      await createTest({
        title: newTestTitle.trim(),
        subject: newTestSubject.trim(),
        durationMinutes: parseInt(newTestDuration) || 15,
        passMarks: passVal,
        type: "Mock Test",
        scheduledDate: "Today, Open until 11:59 PM",
        questions: finalQuestions,
        totalQuestions: finalQuestions.length,
      });

      Alert.alert(
        "Test Posted Successfully! ⏱️",
        `Published "${newTestTitle.trim()}" with ${finalQuestions.length} questions! Students can now attempt this test.`
      );
      setShowCreateTestModal(false);
      setNewTestTitle("");
      setNewTestSubject("");
      setAiTopicPrompt("");
      setTestQuestions([]);
      setShowManualQForm(false);
      loadData();
    } catch (e) {
      Alert.alert("Error", "Could not publish test.");
    } finally {
      setPublishingTest(false);
    }
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

  const getActivePageHeaderMeta = () => {
    switch (tab) {
      case "classes":
        return {
          title: "Live Classes Studio",
          subtitle: `${store.classes.length} Scheduled Sessions • Roll Call`,
        };
      case "assignments":
        return {
          title: "Assignments Desk",
          subtitle: `${store.assignments.length} Homework & Grading Tasks`,
        };
      case "tests":
        return {
          title: "Tests & Assessments",
          subtitle: `${store.tests.length} Timed Drills & Test Attendance`,
        };
      case "attendance":
        return {
          title: "Attendance Roll Call",
          subtitle: `Combined: ${cohortAttendance}% • Class & Test Tracking`,
        };
      case "students":
        return {
          title: "Student Roster",
          subtitle: `${enrolledStudents.length} Enrolled Scholars`,
        };
      default:
        return {
          title: "Faculty Studio",
          subtitle: "Academic Portal",
        };
    }
  };

  const pageMeta = getActivePageHeaderMeta();

  return (
    <View style={styles.container}>
      {/* ===============================================================
          1. TOP HEADER NAVBAR
          - On "overview" (Home): Shows Greeting, Teacher Name, Live Pill, Theme Icon, Avatar & Logout
          - On Sub-Pages: Shows Back Button, Page Title & Subtitle, Theme Icon & Logout
          =============================================================== */}
      {tab === "overview" ? (
        <View style={styles.topHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.welcomeSub} numberOfLines={1}>{greeting}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>{teacherName}</Text>
          </View>

          <View style={styles.headerRightGroup}>
            <View style={styles.streakPill}>
              <Text style={styles.streakPillText}>⚡ Live</Text>
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
              onPress={handleTeacherLogout}
              activeOpacity={0.8}
              style={styles.avatarWrapper}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{teacherInitial}</Text>
              </View>
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
      ) : (
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, marginRight: 8 }}
            onPress={() => setTab("overview")}
            activeOpacity={0.75}
          >
            <View style={styles.subTabBackCircle}>
              <Ionicons name="arrow-back" size={18} color={Colors.BLACK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userNameText} numberOfLines={1}>
                {pageMeta.title}
              </Text>
              <Text style={styles.welcomeSub} numberOfLines={1}>
                {pageMeta.subtitle}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightGroup}>
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
              style={styles.logoutNavBtn}
              onPress={handleTeacherLogout}
              activeOpacity={0.75}
            >
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
            OVERVIEW (HOME) PAGE ONLY:
            Display Title, Cohort Attendance, Roadmap, Image Slider & Quick Launch Dock
            =============================================================== */}
        {tab === "overview" && (
          <View>
            {/* 2. DISPLAY TITLE ("Faculty Dashboard / Academic Studio") */}
            <View style={styles.headingSection}>
              <Text style={styles.displaySubHeading}>Faculty Dashboard</Text>
              <View style={styles.displayMainRow}>
                <Text style={styles.displayMainHeading}>Academic Studio</Text>
                <Text style={styles.superscriptBadge}>({totalActivitiesCount})</Text>
              </View>
            </View>

            {/* 3. DATE, COHORT ATTENDANCE & SUBJECT/DESK ROADMAP TREE */}
            <View style={styles.dateAndRoadmapRow}>
              <TouchableOpacity
                style={styles.dateBlock}
                activeOpacity={0.8}
                onPress={() => setTab("attendance")}
              >
                <View style={styles.limeDatePill}>
                  <Text style={styles.limeDateText}>Cohort Attendance →</Text>
                </View>
                <Text style={styles.giantDateNumber}>{cohortAttendance}%</Text>
                <Text style={styles.attendanceMetaText}>
                  Classes: {classAttendancePercent}% • Tests: {testAttendancePercent}%
                </Text>
              </TouchableOpacity>

              <View style={styles.roadmapTreeContainer}>
                <View style={styles.roadmapLine} />

                <TouchableOpacity
                  style={styles.roadmapBranch}
                  onPress={() => setTab("classes")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.roadmapDot, styles.roadmapDotActive]} />
                  <Text style={[styles.roadmapBranchText, styles.roadmapBranchTextActive]}>
                    Live Masterclass
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.roadmapBranch}
                  onPress={() => setTab("assignments")}
                  activeOpacity={0.7}
                >
                  <View style={styles.roadmapDot} />
                  <Text style={styles.roadmapBranchText}>Assignment Desk</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.roadmapBranch}
                  onPress={() => setTab("students")}
                  activeOpacity={0.7}
                >
                  <View style={styles.roadmapDot} />
                  <Text style={styles.roadmapBranchText}>Cohort Roster</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. FILTER PILLS ROW */}
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

              <TouchableOpacity
                style={styles.activeFilterPill}
                onPress={() => setTab("attendance")}
                activeOpacity={0.8}
              >
                <Text style={styles.activeFilterText}>Roll Call Hub</Text>
                <Ionicons name="checkmark" size={13} color={Colors.BLACK} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryFilterPill}
                onPress={() => setShowCreateClassModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={12} color={Colors.BLACK} />
                <Text style={styles.secondaryFilterText}>Schedule Class</Text>
              </TouchableOpacity>
            </View>

            {/* 5. IMAGE SLIDER BANNER CAROUSEL (Aligned flush with left & right edges) */}
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
                      <Text style={styles.slideTitle} numberOfLines={2}>
                        {slide.title}
                      </Text>
                      <Text style={styles.slideSubtitle} numberOfLines={2}>
                        {slide.subtitle}
                      </Text>
                      <View style={styles.slideCtaBtn}>
                        <Text style={styles.slideCtaText}>{slide.cta}</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color={Colors.MODE === "monochrome" ? Colors.BLACK : Colors.ON_ACCENT}
                        />
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

            {/* 6. FACULTY QUICK ACTION COMMAND DOCK (Aligned flush with left & right edges) */}
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
                onPress={() => setTab("attendance")}
                activeOpacity={0.8}
              >
                <View style={[styles.dockIconCircle, { backgroundColor: "#F0FDF4" }]}>
                  <Ionicons name="checkmark-done" size={16} color="#16A34A" />
                </View>
                <Text style={styles.dockTileTitle}>Roll Call</Text>
              </TouchableOpacity>
            </View>

            {/* 7. OVERVIEW SUMMARY SECTIONS */}
            <View style={[styles.actionHeaderBar, { marginTop: 12 }]}>
              <Text style={styles.tabHeading}>Today's Live Classes ({store.classes.length})</Text>
              <TouchableOpacity onPress={() => setTab("classes")}>
                <Text style={{ fontFamily: "outfit-bold", fontSize: 12.5, color: Colors.BLACK }}>
                  Manage All →
                </Text>
              </TouchableOpacity>
            </View>

            {store.classes.slice(0, 2).map((cls) => {
              const isRollCallDone = Boolean(cls.rollCallCompleted);
              const records = Array.isArray(cls.attendanceRecords) ? cls.attendanceRecords : [];
              const presentCount = records.filter((r) => r.status === "Present").length;
              const absentCount = records.filter((r) => r.status === "Absent").length;

              return (
                <TouchableOpacity
                  key={cls.id}
                  style={styles.cardItem}
                  activeOpacity={0.9}
                  onPress={() => handleOpenClassRollCall(cls)}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.classSubjectChip}>{cls.subject}</Text>
                      <Text style={styles.cardItemTitle}>{cls.title}</Text>
                      <Text style={styles.cardItemMeta}>⏰ {cls.time} • 📍 {cls.roomNumber}</Text>
                    </View>
                    <View
                      style={[
                        styles.attendanceBadgeSmall,
                        isRollCallDone
                          ? { backgroundColor: "#F0FDF4" }
                          : { backgroundColor: "#FEF2F2" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.attendanceBadgeText,
                          { color: isRollCallDone ? "#16A34A" : "#DC2626" },
                        ]}
                      >
                        {isRollCallDone ? `${presentCount}P / ${absentCount}A` : "Unmarked"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.gradeActionBtn,
                      {
                        backgroundColor: isRollCallDone ? Colors.BLACK : Colors.LIME_BRIGHT,
                        marginTop: 10,
                      },
                    ]}
                    onPress={() => handleOpenClassRollCall(cls)}
                  >
                    <Ionicons
                      name="people"
                      size={14}
                      color={isRollCallDone ? Colors.WHITE : Colors.ON_ACCENT}
                    />
                    <Text
                      style={[
                        styles.gradeActionBtnText,
                        { color: isRollCallDone ? Colors.WHITE : Colors.ON_ACCENT },
                      ]}
                    >
                      {isRollCallDone ? "Update Class Attendance" : "Mark Present / Absent"}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.actionHeaderBar, { marginTop: 10 }]}>
              <Text style={styles.tabHeading}>Quick Module Access</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <TouchableOpacity
                style={[styles.cardItem, { flex: 1, marginBottom: 0 }]}
                onPress={() => setTab("assignments")}
              >
                <Ionicons name="document-text" size={20} color="#EA580C" />
                <Text style={[styles.cardItemTitle, { marginTop: 6, fontSize: 14 }]}>
                  Assignments ({store.assignments.length})
                </Text>
                <Text style={styles.cardItemMeta}>Grade student work</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cardItem, { flex: 1, marginBottom: 0 }]}
                onPress={() => setTab("tests")}
              >
                <Ionicons name="timer" size={20} color="#2563EB" />
                <Text style={[styles.cardItemTitle, { marginTop: 6, fontSize: 14 }]}>
                  Timed Tests ({store.tests.length})
                </Text>
                <Text style={styles.cardItemMeta}>Drills & attendance</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===============================================================
            DEDICATED SUB-PAGES (Classes / Assignments / Tests / Attendance / Students)
            =============================================================== */}
        {tab === "classes" && (
          <View style={styles.tabContentWrapper}>
            <View style={styles.headingSection}>
              <Text style={styles.displaySubHeading}>Faculty Studio</Text>
              <View style={styles.displayMainRow}>
                <Text style={styles.displayMainHeading}>Live Classes</Text>
                <Text style={styles.superscriptBadge}>({store.classes.length})</Text>
              </View>
            </View>
            <View style={styles.actionHeaderBar}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.tabHeading}>
                  Today's & Scheduled Classes
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
            <View style={styles.headingSection}>
              <Text style={styles.displaySubHeading}>Homework & Evaluation</Text>
              <View style={styles.displayMainRow}>
                <Text style={styles.displayMainHeading}>Assignments Desk</Text>
                <Text style={styles.superscriptBadge}>/{store.assignments.length}</Text>
              </View>
            </View>

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
            <View style={styles.headingSection}>
              <Text style={styles.displaySubHeading}>Assessments & Exams</Text>
              <View style={styles.displayMainRow}>
                <Text style={styles.displayMainHeading}>Timed Mock Tests</Text>
                <Text style={styles.superscriptBadge}>/{store.tests.length}</Text>
              </View>
            </View>

            {/* Tests & Assessments Summary Metrics Card */}
            <View style={styles.perfOverviewCard}>
              <View style={styles.perfStat}>
                <Text style={styles.perfStatVal}>{store.tests.length}</Text>
                <Text style={styles.perfStatLabel}>Total Tests</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfStat}>
                <Text style={styles.perfStatVal}>
                  {store.tests.reduce(
                    (acc, t) => acc + (t.questions?.length || t.totalQuestions || 0),
                    0
                  )}
                </Text>
                <Text style={styles.perfStatLabel}>Total Questions</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfStat}>
                <Text style={styles.perfStatVal}>
                  {store.attendance.testAttendancePercentage ?? 0}%
                </Text>
                <Text style={styles.perfStatLabel}>Test Attendance</Text>
              </View>
            </View>

            {/* Gemini AI Test & Question Studio Banner (Properly Spaced, Never Overflows) */}
            <View
              style={{
                backgroundColor: Colors.DARK_CARD,
                borderRadius: 22,
                padding: 18,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.12)",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    gap: 5,
                  }}
                >
                  <Ionicons name="sparkles" size={13} color={Colors.LIME} />
                  <Text
                    style={{
                      fontFamily: "outfit-bold",
                      fontSize: 11,
                      color: Colors.WHITE,
                    }}
                  >
                    GEMINI AI QUESTION STUDIO
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "outfit",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  Auto-grading & Roll Call
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: "outfit-bold",
                  fontSize: 17,
                  color: Colors.WHITE,
                  marginBottom: 4,
                }}
              >
                Create Test & Upload / AI-Generate Questions
              </Text>
              <Text
                style={{
                  fontFamily: "outfit",
                  fontSize: 12.5,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 18,
                  marginBottom: 14,
                }}
              >
                Generate MCQs instantly with Gemini AI or upload your own custom questions, then publish to student dashboards.
              </Text>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.MODE === "monochrome" ? Colors.WHITE : Colors.LIME_BRIGHT,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  gap: 8,
                }}
                activeOpacity={0.85}
                onPress={() => setShowCreateTestModal(true)}
              >
                <Ionicons
                  name="add-circle"
                  size={18}
                  color={Colors.MODE === "monochrome" ? Colors.BLACK : Colors.ON_ACCENT}
                />
                <Text
                  style={{
                    fontFamily: "outfit-bold",
                    fontSize: 13.5,
                    color: Colors.MODE === "monochrome" ? Colors.BLACK : Colors.ON_ACCENT,
                  }}
                >
                  + Create New Test (Gemini AI / Upload Questions)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Section Header Row — Properly constrained with flex: 1 so button never overflows */}
            <View style={styles.actionHeaderBar}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.tabHeading}>
                  Published Tests ({store.tests.length})
                </Text>
                <Text
                  style={{
                    fontFamily: "outfit",
                    fontSize: 12,
                    color: Colors.MUTED,
                    marginTop: 2,
                  }}
                >
                  Unattempted tests are automatically counted as Absent
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addBtnSmall, { flexShrink: 0 }]}
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
              const qList = Array.isArray(tst.questions) ? tst.questions : [];
              const qCount = qList.length || tst.totalQuestions || 0;
              const isExpanded = expandedTestId === tst.id;

              return (
                <View key={tst.id} style={[styles.cardItem, { padding: 18, marginBottom: 14 }]}>
                  {/* Top Badges Row: Subject + Type on Left, Attendance Status on Right */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={styles.classSubjectChip}>{tst.subject}</Text>
                      <View
                        style={{
                          backgroundColor: Colors.BG_LIGHT,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: Colors.BORDER_LIGHT,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "outfit-bold",
                            fontSize: 10,
                            color: Colors.MUTED,
                          }}
                        >
                          {tst.type || "Mock Test"}
                        </Text>
                      </View>
                    </View>

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

                  {/* Test Title */}
                  <Text
                    style={{
                      fontFamily: "outfit-bold",
                      fontSize: 16.5,
                      color: Colors.BLACK,
                      lineHeight: 22,
                      marginBottom: 10,
                    }}
                  >
                    {tst.title}
                  </Text>

                  {/* Well-Spaced Metric Pills */}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: Colors.BG_LIGHT,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        gap: 5,
                      }}
                    >
                      <Ionicons name="help-circle-outline" size={14} color={Colors.BLACK} />
                      <Text style={{ fontFamily: "outfit-bold", fontSize: 12, color: Colors.BLACK }}>
                        {qCount} Questions
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: Colors.BG_LIGHT,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        gap: 5,
                      }}
                    >
                      <Ionicons name="timer-outline" size={14} color={Colors.BLACK} />
                      <Text style={{ fontFamily: "outfit-bold", fontSize: 12, color: Colors.BLACK }}>
                        {tst.durationMinutes} Mins
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: Colors.BG_LIGHT,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        gap: 5,
                      }}
                    >
                      <Ionicons name="ribbon-outline" size={14} color={Colors.BLACK} />
                      <Text style={{ fontFamily: "outfit-bold", fontSize: 12, color: Colors.BLACK }}>
                        Pass: {tst.passMarks}/{qCount}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardItemMeta, { marginBottom: 12 }]}>
                    🗓️ Schedule: {tst.scheduledDate}
                  </Text>

                  {/* Expandable Questions Preview Toggle */}
                  {qList.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: Colors.BG_LIGHT,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: Colors.BORDER_LIGHT,
                        }}
                        onPress={() =>
                          setExpandedTestId(isExpanded ? null : tst.id)
                        }
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Ionicons name="list-circle-outline" size={16} color={Colors.BLACK} />
                          <Text
                            style={{
                              fontFamily: "outfit-bold",
                              fontSize: 12.5,
                              color: Colors.BLACK,
                            }}
                          >
                            {isExpanded
                              ? `Hide Test Questions (${qList.length})`
                              : `Preview Uploaded / AI Questions (${qList.length})`}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={Colors.MUTED}
                        />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={{ marginTop: 10, gap: 8 }}>
                          {qList.map((qItem, qIdx) => (
                            <View
                              key={qItem.id || qIdx}
                              style={{
                                backgroundColor: Colors.BG_LIGHT,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: Colors.BORDER_LIGHT,
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: "outfit-bold",
                                  fontSize: 12.5,
                                  color: Colors.BLACK,
                                  marginBottom: 6,
                                }}
                              >
                                Q{qIdx + 1}. {qItem.question}
                              </Text>
                              {(qItem.options || []).map((opt, oIdx) => {
                                const isAns = qItem.correctIndex === oIdx;
                                return (
                                  <Text
                                    key={oIdx}
                                    style={{
                                      fontFamily: isAns ? "outfit-bold" : "outfit",
                                      fontSize: 11.5,
                                      color: isAns ? "#16A34A" : Colors.GRAY,
                                      marginTop: 2,
                                    }}
                                  >
                                    {String.fromCharCode(65 + oIdx)}. {opt}{" "}
                                    {isAns ? "✓ (Correct)" : ""}
                                  </Text>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Manage Student Test Attendance Button */}
                  <TouchableOpacity
                    style={[styles.gradeActionBtn, { marginTop: 2 }]}
                    onPress={() => handleOpenTestRollCall(tst)}
                  >
                    <Ionicons name="checkmark-done" size={15} color={Colors.WHITE} />
                    <Text style={styles.gradeActionBtnText}>
                      Manage Student Test Attendance (Present / Absent)
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {tab === "attendance" && (
          <View style={styles.tabContentWrapper}>
            <View style={styles.headingSection}>
              <Text style={styles.displaySubHeading}>Mark Present or Absent</Text>
              <View style={styles.displayMainRow}>
                <Text style={styles.displayMainHeading}>Attendance Roll Call</Text>
                <Text style={styles.superscriptBadge}>/{store.attendance.overallPercentage ?? 0}%</Text>
              </View>
            </View>

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
                <Text style={styles.perfStatLabel}>Class Roll Call</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfStat}>
                <Text style={styles.perfStatVal}>
                  {store.attendance.testAttendancePercentage ?? 0}%
                </Text>
                <Text style={styles.perfStatLabel}>Test Roll Call</Text>
              </View>
            </View>

            <Text style={[styles.tabHeading, { fontSize: 15, marginTop: 4, marginBottom: 10 }]}>
              Class Sessions Roll Call ({store.classes.length}):
            </Text>
            {store.classes.map((cls) => {
              const isRollCallDone = Boolean(cls.rollCallCompleted);
              const records = Array.isArray(cls.attendanceRecords) ? cls.attendanceRecords : [];
              const presentCount = records.filter((r) => r.status === "Present").length;
              const absentCount = records.filter((r) => r.status === "Absent").length;
              return (
                <View key={cls.id} style={styles.cardItem}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.cardItemTitle}>{cls.title}</Text>
                      <Text style={styles.cardItemMeta}>{cls.subject} • {cls.time}</Text>
                    </View>
                    <View
                      style={[
                        styles.attendanceBadgeSmall,
                        isRollCallDone ? { backgroundColor: "#F0FDF4" } : { backgroundColor: "#FEF2F2" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.attendanceBadgeText,
                          { color: isRollCallDone ? "#16A34A" : "#DC2626" },
                        ]}
                      >
                        {isRollCallDone ? `${presentCount}P / ${absentCount}A` : "Pending"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.gradeActionBtn, { marginTop: 10 }]}
                    onPress={() => handleOpenClassRollCall(cls)}
                  >
                    <Ionicons name="checkmark-done-circle" size={15} color={Colors.WHITE} />
                    <Text style={styles.gradeActionBtnText}>
                      {isRollCallDone ? "Edit Class Roll Call" : "Open Class Roll Call"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <Text style={[styles.tabHeading, { fontSize: 15, marginTop: 10, marginBottom: 10 }]}>
              Test Sessions Roll Call ({store.tests.length}):
            </Text>
            {store.tests.map((tst) => (
              <View key={tst.id} style={styles.cardItem}>
                <Text style={styles.cardItemTitle}>{tst.title}</Text>
                <Text style={styles.cardItemMeta}>{tst.subject} • {tst.scheduledDate}</Text>
                <TouchableOpacity
                  style={[styles.gradeActionBtn, { marginTop: 10 }]}
                  onPress={() => handleOpenTestRollCall(tst)}
                >
                  <Ionicons name="checkmark-done" size={14} color={Colors.WHITE} />
                  <Text style={styles.gradeActionBtnText}>Open Test Roll Call</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === "students" && (
          <View style={styles.tabContentWrapper}>
            <View style={styles.headingSection}>
              <Text style={styles.displaySubHeading}>Enrolled Cohort & Analytics</Text>
              <View style={styles.displayMainRow}>
                <Text style={styles.displayMainHeading}>Student Roster</Text>
                <Text style={styles.superscriptBadge}>/{enrolledStudents.length}</Text>
              </View>
            </View>

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

      {/* Create Test Modal (Upload Questions + Gemini AI Question Generator) */}
      <Modal visible={showCreateTestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: "92%" }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.modalTitle}>Create & Post New Test</Text>
                <Text style={{ fontFamily: "outfit", fontSize: 12, color: Colors.GRAY, marginTop: 2 }}>
                  Upload custom questions or generate MCQs with Gemini AI
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCreateTestModal(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: Colors.BG_LIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color={Colors.BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              {/* 1. Test Details */}
              <Text
                style={{
                  fontFamily: "outfit-bold",
                  fontSize: 12.5,
                  color: Colors.BLACK,
                  marginBottom: 6,
                }}
              >
                1. Test Information
              </Text>
              <TextInput
                placeholder="Test Title (e.g. System Design & Microservices Quiz)"
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
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "outfit",
                      fontSize: 11,
                      color: Colors.MUTED,
                      marginBottom: 4,
                    }}
                  >
                    Duration (Minutes)
                  </Text>
                  <TextInput
                    placeholder="15"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    style={styles.modalInput}
                    value={newTestDuration}
                    onChangeText={setNewTestDuration}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "outfit",
                      fontSize: 11,
                      color: Colors.MUTED,
                      marginBottom: 4,
                    }}
                  >
                    Pass Marks
                  </Text>
                  <TextInput
                    placeholder="2"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    style={styles.modalInput}
                    value={newTestPassMarks}
                    onChangeText={setNewTestPassMarks}
                  />
                </View>
              </View>

              {/* 2. Gemini AI Question Generator */}
              <View
                style={{
                  backgroundColor: Colors.BG_LIGHT,
                  borderRadius: 18,
                  padding: 14,
                  marginTop: 6,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: Colors.BORDER_LIGHT,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="sparkles" size={16} color={Colors.BLACK} />
                    <Text
                      style={{
                        fontFamily: "outfit-bold",
                        fontSize: 13.5,
                        color: Colors.BLACK,
                      }}
                    >
                      2. Generate Questions with Gemini AI
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: Colors.LIME_LIGHT,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "outfit-bold",
                        fontSize: 10,
                        color: Colors.BLACK,
                      }}
                    >
                      GEMINI AI
                    </Text>
                  </View>
                </View>

                <TextInput
                  placeholder="Optional Topic Prompt (e.g. React Hooks, BFS/DFS, SQL Joins)"
                  placeholderTextColor="#9ca3af"
                  style={[styles.modalInput, { backgroundColor: Colors.WHITE, marginBottom: 8 }]}
                  value={aiTopicPrompt}
                  onChangeText={setAiTopicPrompt}
                />

                {/* Question Count Selector */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontFamily: "outfit", fontSize: 12, color: Colors.MUTED }}>
                    Number of AI Questions:
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {[3, 5, 8, 10].map((cnt) => {
                      const active = aiQuestionCount === cnt;
                      return (
                        <TouchableOpacity
                          key={cnt}
                          onPress={() => setAiQuestionCount(cnt)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 10,
                            backgroundColor: active ? Colors.BLACK : Colors.WHITE,
                            borderWidth: 1,
                            borderColor: active ? Colors.BLACK : Colors.BORDER_LIGHT,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "outfit-bold",
                              fontSize: 11.5,
                              color: active ? Colors.WHITE : Colors.BLACK,
                            }}
                          >
                            {cnt} Qs
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: Colors.BLACK,
                    paddingVertical: 11,
                    borderRadius: 12,
                    gap: 8,
                  }}
                  activeOpacity={0.85}
                  disabled={aiGenerating}
                  onPress={handleGenerateQuestionsWithAI}
                >
                  {aiGenerating ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.WHITE} />
                      <Text
                        style={{
                          fontFamily: "outfit-bold",
                          fontSize: 12.5,
                          color: Colors.WHITE,
                        }}
                      >
                        Gemini AI Generating {aiQuestionCount} Questions...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={15} color={Colors.LIME} />
                      <Text
                        style={{
                          fontFamily: "outfit-bold",
                          fontSize: 12.5,
                          color: Colors.WHITE,
                        }}
                      >
                        ✨ Generate {aiQuestionCount} Questions with Gemini AI
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* 3. Upload / Add Custom Question Manually */}
              <View
                style={{
                  backgroundColor: Colors.BG_LIGHT,
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: Colors.BORDER_LIGHT,
                }}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onPress={() => setShowManualQForm(!showManualQForm)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="cloud-upload-outline" size={17} color={Colors.BLACK} />
                    <Text
                      style={{
                        fontFamily: "outfit-bold",
                        fontSize: 13.5,
                        color: Colors.BLACK,
                      }}
                    >
                      3. Upload / Add Custom Question Manually
                    </Text>
                  </View>
                  <Ionicons
                    name={showManualQForm ? "chevron-up" : "add-circle-outline"}
                    size={20}
                    color={Colors.BLACK}
                  />
                </TouchableOpacity>

                {showManualQForm && (
                  <View style={{ marginTop: 12 }}>
                    <TextInput
                      placeholder="Enter Question Text..."
                      placeholderTextColor="#9ca3af"
                      style={[styles.modalInput, { backgroundColor: Colors.WHITE }]}
                      value={manualQText}
                      onChangeText={setManualQText}
                    />
                    <TextInput
                      placeholder="Option A"
                      placeholderTextColor="#9ca3af"
                      style={[styles.modalInput, { backgroundColor: Colors.WHITE }]}
                      value={manualOptA}
                      onChangeText={setManualOptA}
                    />
                    <TextInput
                      placeholder="Option B"
                      placeholderTextColor="#9ca3af"
                      style={[styles.modalInput, { backgroundColor: Colors.WHITE }]}
                      value={manualOptB}
                      onChangeText={setManualOptB}
                    />
                    <TextInput
                      placeholder="Option C"
                      placeholderTextColor="#9ca3af"
                      style={[styles.modalInput, { backgroundColor: Colors.WHITE }]}
                      value={manualOptC}
                      onChangeText={setManualOptC}
                    />
                    <TextInput
                      placeholder="Option D"
                      placeholderTextColor="#9ca3af"
                      style={[styles.modalInput, { backgroundColor: Colors.WHITE }]}
                      value={manualOptD}
                      onChangeText={setManualOptD}
                    />

                    {/* Select Correct Option */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontFamily: "outfit-bold", fontSize: 12, color: Colors.BLACK }}>
                        Correct Option:
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {["A", "B", "C", "D"].map((letter, idx) => {
                          const isSel = manualCorrectIdx === idx;
                          return (
                            <TouchableOpacity
                              key={letter}
                              onPress={() => setManualCorrectIdx(idx)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 10,
                                backgroundColor: isSel ? "#16A34A" : Colors.WHITE,
                                borderWidth: 1,
                                borderColor: isSel ? "#16A34A" : Colors.BORDER_LIGHT,
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: "outfit-bold",
                                  fontSize: 12,
                                  color: isSel ? Colors.WHITE : Colors.BLACK,
                                }}
                              >
                                {letter}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <TextInput
                      placeholder="Optional Answer Explanation..."
                      placeholderTextColor="#9ca3af"
                      style={[styles.modalInput, { backgroundColor: Colors.WHITE }]}
                      value={manualExplanation}
                      onChangeText={setManualExplanation}
                    />

                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#16A34A",
                        paddingVertical: 10,
                        borderRadius: 12,
                        gap: 6,
                      }}
                      onPress={handleAddManualQuestion}
                    >
                      <Ionicons name="checkmark-circle" size={16} color={Colors.WHITE} />
                      <Text
                        style={{
                          fontFamily: "outfit-bold",
                          fontSize: 12.5,
                          color: Colors.WHITE,
                        }}
                      >
                        + Upload Question to Test Paper
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 4. Uploaded & AI-Generated Questions Preview List */}
              <View style={{ marginBottom: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "outfit-bold",
                      fontSize: 13,
                      color: Colors.BLACK,
                    }}
                  >
                    Uploaded / AI Questions ({testQuestions.length})
                  </Text>
                  {testQuestions.length > 0 && (
                    <TouchableOpacity onPress={() => setTestQuestions([])}>
                      <Text
                        style={{
                          fontFamily: "outfit-bold",
                          fontSize: 11.5,
                          color: Colors.DANGER,
                        }}
                      >
                        Clear All
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {testQuestions.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: Colors.BG_LIGHT,
                      borderRadius: 14,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: Colors.BORDER_LIGHT,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "outfit",
                        fontSize: 12,
                        color: Colors.MUTED,
                        textAlign: "center",
                      }}
                    >
                      No questions added yet. Tap "✨ Generate with Gemini AI" or upload a custom question above (or tap Post Test to auto-generate {aiQuestionCount} AI questions!).
                    </Text>
                  </View>
                ) : (
                  testQuestions.map((qItem, qIdx) => (
                    <View
                      key={qItem.id || qIdx}
                      style={{
                        backgroundColor: Colors.BG_LIGHT,
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: Colors.BORDER_LIGHT,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "outfit-bold",
                            fontSize: 12.5,
                            color: Colors.BLACK,
                            flex: 1,
                            marginRight: 8,
                          }}
                        >
                          Q{qIdx + 1}. {qItem.question}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveTestQuestion(qItem.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={Colors.DANGER} />
                        </TouchableOpacity>
                      </View>
                      {(qItem.options || []).map((opt, oIdx) => {
                        const isCorrect = qItem.correctIndex === oIdx;
                        return (
                          <Text
                            key={oIdx}
                            style={{
                              fontFamily: isCorrect ? "outfit-bold" : "outfit",
                              fontSize: 11.5,
                              color: isCorrect ? "#16A34A" : Colors.GRAY,
                              marginTop: 2,
                            }}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt}{" "}
                            {isCorrect ? "✓ (Correct)" : ""}
                          </Text>
                        );
                      })}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <View style={{ marginTop: 12 }}>
              <Button
                text={
                  publishingTest
                    ? "Posting Test..."
                    : testQuestions.length > 0
                    ? `Post Test (${testQuestions.length} Questions)`
                    : `AI-Generate & Post Test (${aiQuestionCount} Questions)`
                }
                type="fill"
                loading={publishingTest}
                onPress={handleCreateTest}
              />
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

      {/* Teacher Floating Capsule Bottom Navigation Dock (Max 5 Items: 4 Primary + More Button) */}
      <View style={styles.floatingDockWrapper} pointerEvents="box-none">
        <View style={styles.floatingDock}>
          {[
            { key: "overview", label: "Home", activeIcon: "home", inactiveIcon: "home-outline" },
            { key: "classes", label: "Classes", activeIcon: "videocam", inactiveIcon: "videocam-outline" },
            { key: "assignments", label: "Tasks", activeIcon: "document-text", inactiveIcon: "document-text-outline" },
            { key: "tests", label: "Tests", activeIcon: "timer", inactiveIcon: "timer-outline" },
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

          {/* 5th Item: "More" Button for Remaining Teacher Pages */}
          {tab === "attendance" || tab === "students" || showMoreModal ? (
            <TouchableOpacity
              onPress={() => setShowMoreModal(true)}
              activeOpacity={0.88}
              style={styles.activePillCapsule}
            >
              <Ionicons name="apps" size={16} color={Colors.WHITE} />
              <Text style={styles.activePillText}>
                {tab === "attendance" ? "Roll Call" : tab === "students" ? "Roster" : "More"}
              </Text>
              <View style={styles.dockLimeDot} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowMoreModal(true)}
              activeOpacity={0.7}
              style={styles.inactiveIconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="apps-outline" size={22} color={Colors.MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Teacher "More Pages" Navigation Modal */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreModal(false)}
        >
          <View
            style={[styles.modalBox, { maxHeight: "82%" }]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <View>
                <Text style={styles.modalTitle}>More Faculty Pages</Text>
                <Text style={{ fontFamily: "outfit", fontSize: 12, color: Colors.MUTED, marginTop: 2 }}>
                  Jump to any Teacher Studio page or action
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMoreModal(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: Colors.BG_LIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color={Colors.BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                {
                  key: "attendance",
                  title: "Attendance Roll Call",
                  subtitle: "Mark Present / Absent for Live Classes & Tests",
                  icon: "checkmark-done-circle",
                  color: "#16A34A",
                  bg: "#DCFCE7",
                  onSelect: () => {
                    setShowMoreModal(false);
                    setTab("attendance");
                  },
                },
                {
                  key: "students",
                  title: "Student Roster & Analytics",
                  subtitle: "Enrolled students & subject-wise attendance %",
                  icon: "people",
                  color: "#2563EB",
                  bg: "#DBEAFE",
                  onSelect: () => {
                    setShowMoreModal(false);
                    setTab("students");
                  },
                },
                {
                  key: "classes",
                  title: "Live Classes Studio",
                  subtitle: "Schedule classes & manage class attendance",
                  icon: "videocam",
                  color: "#7C3AED",
                  bg: "#EDE9FE",
                  onSelect: () => {
                    setShowMoreModal(false);
                    setTab("classes");
                  },
                },
                {
                  key: "assignments",
                  title: "Assignments & Grading Desk",
                  subtitle: "Post homework & grade student submissions",
                  icon: "document-text",
                  color: "#EA580C",
                  bg: "#FFEDD5",
                  onSelect: () => {
                    setShowMoreModal(false);
                    setTab("assignments");
                  },
                },
                {
                  key: "tests",
                  title: "Timed Mock Tests",
                  subtitle: "Publish tests & manage test roll call",
                  icon: "timer",
                  color: "#DB2777",
                  bg: "#FCE7F3",
                  onSelect: () => {
                    setShowMoreModal(false);
                    setTab("tests");
                  },
                },
                {
                  key: "overview",
                  title: "Faculty Home Overview",
                  subtitle: "Main academic studio & quick launch hub",
                  icon: "home",
                  color: "#0D9488",
                  bg: "#CCFBF1",
                  onSelect: () => {
                    setShowMoreModal(false);
                    setTab("overview");
                  },
                },
              ].map((pg) => (
                <TouchableOpacity
                  key={pg.key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: tab === pg.key ? Colors.LIME_LIGHT : Colors.BG_LIGHT,
                    padding: 13,
                    borderRadius: 18,
                    marginBottom: 9,
                    borderWidth: 1,
                    borderColor: tab === pg.key ? Colors.BLACK : Colors.BORDER_LIGHT,
                  }}
                  activeOpacity={0.85}
                  onPress={pg.onSelect}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      backgroundColor: pg.bg,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name={pg.icon} size={20} color={pg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "outfit-bold", fontSize: 14, color: Colors.BLACK }}>
                      {pg.title}
                    </Text>
                    <Text style={{ fontFamily: "outfit", fontSize: 11.5, color: Colors.MUTED, marginTop: 2 }}>
                      {pg.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.MUTED} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
      backgroundColor: Colors.NAVBAR_BG,
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 42,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.NAVBAR_BORDER,
    },
    subTabBackCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: Colors.WHITE,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(13, 13, 13, 0.12)",
      flexShrink: 0,
    },
    welcomeSub: {
      fontFamily: "outfit",
      fontSize: 12,
      color: Colors.ON_NAVBAR_SUB,
    },
    userNameText: {
      fontFamily: "outfit-bold",
      fontSize: 16,
      color: Colors.ON_NAVBAR || Colors.ON_ACCENT,
      marginTop: 1,
    },
    headerRightGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
    },
    streakPill: {
      backgroundColor: Colors.WHITE,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(13, 13, 13, 0.08)",
    },
    streakPillText: {
      fontFamily: "outfit-bold",
      fontSize: 10.5,
      color: "#EA580C",
    },
    themeToggleBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: Colors.WHITE,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: Colors.BLACK,
    },
    avatarWrapper: {
      position: "relative",
      marginLeft: 1,
    },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(13, 13, 13, 0.12)",
    marginLeft: 1,
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
    color: Colors.ON_ACCENT,
  },
  giantDateNumber: {
    fontFamily: "outfit-bold",
    fontSize: 38,
    color: Colors.BLACK,
    lineHeight: 44,
    marginTop: 4,
    letterSpacing: -0.8,
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
    color: Colors.ON_ACCENT,
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
    justifyContent: "center",
    paddingRight: 8,
    gap: 6,
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
  slideTitle: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: Colors.WHITE,
    lineHeight: 22,
  },
  slideSubtitle: {
    fontFamily: "outfit",
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.78)",
    lineHeight: 16,
  },
  slideCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.MODE === "monochrome" ? Colors.WHITE : Colors.LIME,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
  },
  slideCtaText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.MODE === "monochrome" ? Colors.BLACK : Colors.ON_ACCENT,
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
