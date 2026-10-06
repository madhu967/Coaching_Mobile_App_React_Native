import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../config/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LMS_STORAGE_KEY = "@coaching_guru_lms_v2";

// Real initial seed data — NO fake pre-marked attendance (starts at 0% until Teacher marks attendance or Student attends a test)
const INITIAL_LMS_DATA = {
  activeStudentEmail: "student@coachingguru.com",
  activeStudentName: "Active Student",

  // Enrolled Students Roster for Teacher Roll Call
  enrolledStudents: [
    {
      id: "primary-student",
      name: "Active Scholar (Student Account)",
      email: "student@coachingguru.com",
      isPrimary: true,
    },
    {
      id: "stu-2",
      name: "Aarav Sharma",
      email: "aarav.sharma@coachingguru.com",
      isPrimary: false,
    },
    {
      id: "stu-3",
      name: "Priya Nair",
      email: "priya.nair@coachingguru.com",
      isPrimary: false,
    },
    {
      id: "stu-4",
      name: "Rohan Verma",
      email: "rohan.verma@coachingguru.com",
      isPrimary: false,
    },
  ],

  // Live Classes (All start with rollCallCompleted: false & attendanceMarked: false -> Absent until Teacher marks Present)
  classes: [
    {
      id: "cls-1",
      title: "Advanced React Native Architecture & Expo Router",
      subject: "Mobile Development",
      teacherName: "Prof. Sarah Jenkins",
      teacherAvatar: "SJ",
      teacherEmail: "sarah.jenkins@coachingguru.com",
      time: "Today, 4:00 PM - 5:30 PM",
      isLiveToday: true,
      status: "upcoming", // live | upcoming | completed
      joinUrl: "https://meet.google.com/coaching-rn-arch",
      recordingUrl: null,
      attendanceMarked: false,
      rollCallCompleted: false,
      studentAttendance: {},
      attendanceRecords: [],
      date: new Date().toISOString().split("T")[0],
      roomNumber: "Virtual Room A",
      description:
        "Deep dive into New Architecture, Turbomodules, and scalable Expo Router structure.",
    },
    {
      id: "cls-2",
      title: "Data Structures: Graph Algorithms & BFS/DFS",
      subject: "Computer Science",
      teacherName: "Dr. Rajesh Kumar",
      teacherAvatar: "RK",
      teacherEmail: "rajesh.kumar@coachingguru.com",
      time: "Today, 6:00 PM - 7:30 PM",
      isLiveToday: true,
      status: "upcoming",
      joinUrl: "https://meet.google.com/coaching-dsa-graph",
      recordingUrl: null,
      attendanceMarked: false,
      rollCallCompleted: false,
      studentAttendance: {},
      attendanceRecords: [],
      date: new Date().toISOString().split("T")[0],
      roomNumber: "Virtual Room B",
      description:
        "Mastering adjacency lists, topological sort, and interview problem patterns.",
    },
    {
      id: "cls-3",
      title: "AI Integration with Gemini API & Node.js",
      subject: "Artificial Intelligence",
      teacherName: "Eng. Alex Rivera",
      teacherAvatar: "AR",
      teacherEmail: "alex.rivera@coachingguru.com",
      time: "Tomorrow, 10:00 AM - 11:30 AM",
      isLiveToday: false,
      status: "upcoming",
      joinUrl: "https://meet.google.com/coaching-ai-gemini",
      recordingUrl: null,
      attendanceMarked: false,
      rollCallCompleted: false,
      studentAttendance: {},
      attendanceRecords: [],
      date: "Tomorrow",
      roomNumber: "Lab 3",
      description:
        "Prompt engineering, function calling, and structured JSON output streaming.",
    },
    {
      id: "cls-4",
      title: "System Design: Microservices & Message Queues",
      subject: "Software Engineering",
      teacherName: "Dr. Rajesh Kumar",
      teacherAvatar: "RK",
      teacherEmail: "rajesh.kumar@coachingguru.com",
      time: "Yesterday, 3:00 PM - 4:30 PM",
      isLiveToday: false,
      status: "completed",
      joinUrl: null,
      recordingUrl:
        "https://videos.coachingguru.com/recordings/system-design-ep4",
      attendanceMarked: false,
      rollCallCompleted: false,
      studentAttendance: {},
      attendanceRecords: [],
      date: "Yesterday",
      roomNumber: "Virtual Room B",
      description: "Event-driven architecture with Kafka and RabbitMQ.",
    },
  ],

  // Tests (All start with completed: false -> Absent until Student attends/submits test or Teacher marks Present)
  tests: [
    {
      id: "tst-1",
      title: "React Native & Component Lifecycle Mock Test",
      subject: "Mobile Development",
      type: "Mock Test",
      durationMinutes: 10,
      totalQuestions: 5,
      passMarks: 3,
      scheduledDate: "Today, Open until 11:59 PM",
      isUpcoming: true,
      completed: false,
      recentScore: null,
      studentAttendance: {},
      questions: [
        {
          id: "q1",
          question:
            "Which hook is used in React to manage side-effects such as subscriptions or timers?",
          options: ["useMemo", "useEffect", "useCallback", "useContext"],
          correctIndex: 1,
          explanation:
            "useEffect is designed to execute side effects after render cycles.",
        },
        {
          id: "q2",
          question:
            "What is the primary file-based routing convention in Expo Router?",
          options: [
            "pages/index.js",
            "app/ directory",
            "routes.config.js",
            "src/screens/",
          ],
          correctIndex: 1,
          explanation:
            "Expo Router utilizes the app/ directory where filenames correspond to URL paths.",
        },
        {
          id: "q3",
          question:
            "How do you achieve asynchronous storage in cross-platform React Native?",
          options: [
            "localStorage",
            "IndexedDB",
            "@react-native-async-storage/async-storage",
            "cookies",
          ],
          correctIndex: 2,
          explanation:
            "AsyncStorage provides an unencrypted, asynchronous key-value storage system.",
        },
        {
          id: "q4",
          question:
            "Which component should be used in React Native for high-performance scrollable lists?",
          options: ["ScrollView", "FlatList", "ListView", "MapView"],
          correctIndex: 1,
          explanation:
            "FlatList renders only items currently visible on screen, maximizing performance.",
        },
        {
          id: "q5",
          question: "What is the purpose of SafeAreaView in React Native?",
          options: [
            "To encrypt sensitive data",
            "To render content within the safe area boundaries of a device (notches/home bars)",
            "To prevent memory leaks",
            "To enforce strict TypeScript typing",
          ],
          correctIndex: 1,
          explanation:
            "SafeAreaView renders nested content within boundary safe insets of physical devices.",
        },
      ],
    },
    {
      id: "tst-2",
      title: "Data Structures & Big-O Complexity Subject Test",
      subject: "Computer Science",
      type: "Subject Test",
      durationMinutes: 15,
      totalQuestions: 4,
      passMarks: 2,
      scheduledDate: "Today, 2:00 PM",
      isUpcoming: true,
      completed: false,
      recentScore: null,
      studentAttendance: {},
      questions: [
        {
          id: "q201",
          question:
            "What is the average time complexity of searching in a Hash Table?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
          correctIndex: 0,
          explanation:
            "Hash table searches run in O(1) constant time on average.",
        },
        {
          id: "q202",
          question:
            "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
          options: ["Queue", "Stack", "Binary Tree", "Linked List"],
          correctIndex: 1,
          explanation: "A Stack enforces LIFO order using push and pop operations.",
        },
        {
          id: "q203",
          question:
            "Which sorting algorithm achieves worst-case O(n log n) performance?",
          options: [
            "Bubble Sort",
            "Quick Sort",
            "Merge Sort",
            "Insertion Sort",
          ],
          correctIndex: 2,
          explanation:
            "Merge Sort guarantees O(n log n) worst-case time by divide-and-conquer.",
        },
        {
          id: "q204",
          question:
            "What traversal method of a Binary Search Tree produces values in sorted ascending order?",
          options: ["Pre-order", "In-order", "Post-order", "Level-order"],
          correctIndex: 1,
          explanation:
            "An In-order (Left, Root, Right) traversal of a BST visits nodes in strictly ascending order.",
        },
      ],
    },
    {
      id: "tst-3",
      title: "Full Syllabus AI & Machine Learning Practice Drill",
      subject: "Artificial Intelligence",
      type: "Practice Drill",
      durationMinutes: 12,
      totalQuestions: 3,
      passMarks: 2,
      scheduledDate: "Flexible Self-Paced",
      isUpcoming: false,
      completed: false,
      recentScore: null,
      studentAttendance: {},
      questions: [
        {
          id: "q301",
          question:
            "What does temperature control in LLM generative decoding?",
          options: [
            "Hardware CPU temperature",
            "Randomness and creativity of tokens",
            "Context window length",
            "Network latency",
          ],
          correctIndex: 1,
          explanation:
            "Temperature scales logits to adjust randomness and sampling entropy.",
        },
        {
          id: "q302",
          question:
            "What architecture underpins Google Gemini and modern foundational LLMs?",
          options: [
            "Convolutional Neural Network (CNN)",
            "Transformer Attention Architecture",
            "Recurrent Neural Network (RNN)",
            "Decision Trees",
          ],
          correctIndex: 1,
          explanation:
            "The Transformer attention mechanism allows parallel multi-head context processing.",
        },
        {
          id: "q303",
          question: "In prompt engineering, what is 'Few-Shot' prompting?",
          options: [
            "Providing zero instructions",
            "Providing a few input-output examples in the prompt",
            "Limiting the response to 3 words",
            "Running 5 parallel queries",
          ],
          correctIndex: 1,
          explanation:
            "Few-shot prompting provides exemplary demonstration pairs to guide model completions.",
        },
      ],
    },
  ],

  // Assignments
  assignments: [
    {
      id: "asn-1",
      title: "Build an Interactive Navigation Drawer in Expo",
      subject: "Mobile Development",
      deadline: "Tomorrow, 11:59 PM",
      dueDateIso: new Date(Date.now() + 86400000).toISOString(),
      status: "pending",
      totalMarks: 20,
      obtainedMarks: null,
      teacherFeedback: null,
      submissionContent: "",
      submittedAt: null,
      description:
        "Implement nested tabs with custom bottom bar navigation and stack screens for course details.",
    },
    {
      id: "asn-2",
      title: "Graph Traversal BFS Implementation in JavaScript",
      subject: "Computer Science",
      deadline: "In 3 Days",
      dueDateIso: new Date(Date.now() + 259200000).toISOString(),
      status: "pending",
      totalMarks: 25,
      obtainedMarks: null,
      teacherFeedback: null,
      submissionContent: "",
      submittedAt: null,
      description:
        "Write an adjacency list graph class with BFS shortest-path search algorithm and unit tests.",
    },
    {
      id: "asn-3",
      title: "Gemini API Integration Report & Code Sample",
      subject: "Artificial Intelligence",
      deadline: "Due in 5 Days",
      dueDateIso: new Date(Date.now() + 432000000).toISOString(),
      status: "pending",
      totalMarks: 30,
      obtainedMarks: null,
      teacherFeedback: null,
      submissionContent: "",
      submittedAt: null,
      description:
        "Submit your implementation integrating multimodal or text Gemini API calls.",
    },
  ],

  // Attendance (Dynamically recalculated from actual Teacher Class Roll Calls + Test Attendance)
  attendance: {
    overallPercentage: 0,
    classAttendancePercentage: 0,
    testAttendancePercentage: 0,
    warning: true,
    totalClassesHeld: 4,
    totalClassesAttended: 0,
    totalClassesAbsent: 4,
    totalTestsHeld: 3,
    totalTestsAttended: 0,
    totalTestsAbsent: 3,
    totalCombinedSessions: 7,
    totalCombinedAttended: 0,
    totalCombinedAbsent: 7,
    subjectWise: [],
    classHistory: [],
    testHistory: [],
    history: [],
  },

  // Performance & Stats
  performance: {
    courseCompletionPercent: 0,
    testAverageScore: 0,
    attendancePercent: 0,
    assignmentCompletionPercent: 0,
    learningStreakDays: 1,
    strongSubjects: ["Computer Science (DSA)", "Mobile Development"],
    weakSubjects: ["Artificial Intelligence (Needs practice in prompt tuning)"],
    weakTopics: [
      {
        topic: "LLM Hallucination Mitigation",
        subject: "AI",
        suggestedAction: "Review Gemini system instruction prompts",
      },
      {
        topic: "Dynamic Programming Memoization",
        subject: "Computer Science",
        suggestedAction: "Practice Top-down vs Bottom-up drills",
      },
    ],
  },

  // Notifications
  notifications: [
    {
      id: "notif-1",
      title: "Live Class Starting Soon ⏰",
      message:
        "Advanced React Native Architecture starts at 4:00 PM today. Teacher will mark roll-call attendance.",
      type: "class",
      timestamp: "10 mins ago",
      read: false,
    },
    {
      id: "notif-2",
      title: "New Assignment Posted 📝",
      message:
        "Prof. Sarah posted: Build an Interactive Navigation Drawer in Expo (Due Tomorrow).",
      type: "assignment",
      timestamp: "2 hours ago",
      read: false,
    },
  ],

  // Teachers
  teachers: [
    {
      id: "tch-1",
      name: "Prof. Sarah Jenkins",
      subject: "Mobile Development",
      email: "sarah.jenkins@coachingguru.com",
      password: "Teacher@123",
      avatar: "SJ",
      phone: "+1 415-555-0192",
      totalStudents: 142,
      activeClasses: 3,
      rating: 4.9,
    },
    {
      id: "tch-2",
      name: "Dr. Rajesh Kumar",
      subject: "Computer Science & DSA",
      email: "rajesh.kumar@coachingguru.com",
      password: "Teacher@123",
      avatar: "RK",
      phone: "+1 415-555-0188",
      totalStudents: 198,
      activeClasses: 4,
      rating: 4.95,
    },
    {
      id: "tch-3",
      name: "Eng. Alex Rivera",
      subject: "Artificial Intelligence",
      email: "alex.rivera@coachingguru.com",
      password: "Teacher@123",
      avatar: "AR",
      phone: "+1 415-555-0144",
      totalStudents: 110,
      activeClasses: 2,
      rating: 4.85,
    },
  ],

  // Personalized Needs-based courses generated for students
  personalizedCourseRequests: [],
};

let inMemoryStore = null;

/**
 * Pure calculation of Student Attendance from:
 * 1) Teacher-marked Live Classes (unmarked or not attended = Absent)
 * 2) Tests created by Teacher (unattempted/unattended = Absent; completed/marked = Present)
 * Combines both for overallPercentage AND provides separate class & test breakdowns.
 */
export function computeAttendanceSummary(store, targetStudentEmail) {
  const classes = Array.isArray(store?.classes) ? store.classes : [];
  const tests = Array.isArray(store?.tests) ? store.tests : [];
  const authEmail = auth?.currentUser?.email
    ? auth.currentUser.email.trim().toLowerCase()
    : "";
  const emailKey = (
    targetStudentEmail ||
    authEmail ||
    store?.activeStudentEmail ||
    "student@coachingguru.com"
  )
    .trim()
    .toLowerCase();

  // 1. Evaluate every Live Class
  let presentClassesCount = 0;
  const classHistory = classes.map((cls) => {
    const studentMap = cls.studentAttendance || {};
    const isPresent =
      Boolean(cls.rollCallCompleted) &&
      (Boolean(cls.attendanceMarked) ||
        studentMap[emailKey] === "Present" ||
        studentMap["primary-student"] === "Present" ||
        studentMap["student@coachingguru.com"] === "Present");

    if (isPresent) {
      presentClassesCount += 1;
    }

    return {
      id: cls.id,
      category: "Class",
      sessionType: "Class",
      classTitle: cls.title,
      title: cls.title,
      subject: cls.subject || "General",
      teacherName: cls.teacherName || "Faculty",
      date: cls.date || cls.time || "Scheduled",
      time: cls.time || "",
      status: isPresent ? "Present" : "Absent",
      rollCallCompleted: Boolean(cls.rollCallCompleted),
      markedByTeacher: Boolean(cls.rollCallCompleted),
      markedBy: cls.rollCallCompleted
        ? isPresent
          ? `Marked Present by ${cls.teacherName || "Teacher"}`
          : `Marked Absent by ${cls.teacherName || "Teacher"}`
        : "Not Attended — Marked Absent",
    };
  });

  const totalClassesHeld = classes.length;
  const totalClassesAttended = presentClassesCount;
  const totalClassesAbsent = Math.max(0, totalClassesHeld - totalClassesAttended);
  const classAttendancePercentage =
    totalClassesHeld > 0
      ? Math.round((totalClassesAttended / totalClassesHeld) * 100)
      : 0;

  // 2. Evaluate every Test created by Teacher
  let presentTestsCount = 0;
  const testHistory = tests.map((tst) => {
    const studentMap = tst.studentAttendance || {};
    const recordedStatus =
      studentMap[emailKey] ||
      studentMap["primary-student"] ||
      studentMap["student@coachingguru.com"];

    // Present if student completed the test OR teacher explicitly marked Present
    const isPresent =
      recordedStatus === "Present" ||
      (recordedStatus !== "Absent" && Boolean(tst.completed));

    if (isPresent) {
      presentTestsCount += 1;
    }

    return {
      id: tst.id,
      category: "Test",
      sessionType: "Test",
      classTitle: tst.title,
      title: tst.title,
      subject: tst.subject || "General",
      type: tst.type || "Assessment",
      date: tst.scheduledDate || "Scheduled",
      status: isPresent ? "Present" : "Absent",
      completed: Boolean(tst.completed),
      score: tst.recentScore || null,
      markedBy: isPresent
        ? tst.completed
          ? "Completed Test — Marked Present"
          : "Marked Present by Teacher"
        : "Test Not Attempted — Marked Absent",
    };
  });

  const totalTestsHeld = tests.length;
  const totalTestsAttended = presentTestsCount;
  const totalTestsAbsent = Math.max(0, totalTestsHeld - totalTestsAttended);
  const testAttendancePercentage =
    totalTestsHeld > 0
      ? Math.round((totalTestsAttended / totalTestsHeld) * 100)
      : 0;

  // 3. Combined Attendance (Classes + Tests)
  const totalCombinedSessions = totalClassesHeld + totalTestsHeld;
  const totalCombinedAttended = totalClassesAttended + totalTestsAttended;
  const totalCombinedAbsent = Math.max(
    0,
    totalCombinedSessions - totalCombinedAttended
  );
  const overallPercentage =
    totalCombinedSessions > 0
      ? Math.round((totalCombinedAttended / totalCombinedSessions) * 100)
      : 0;

  // 4. Subject-Wise Breakdown (Combined + Separate)
  const subjectMap = new Map();

  classHistory.forEach((c) => {
    const sub = c.subject || "General";
    if (!subjectMap.has(sub)) {
      subjectMap.set(sub, {
        subject: sub,
        classesAttended: 0,
        classesTotal: 0,
        testsAttended: 0,
        testsTotal: 0,
        attended: 0,
        total: 0,
        percent: 0,
      });
    }
    const entry = subjectMap.get(sub);
    entry.classesTotal += 1;
    entry.total += 1;
    if (c.status === "Present") {
      entry.classesAttended += 1;
      entry.attended += 1;
    }
  });

  testHistory.forEach((t) => {
    const sub = t.subject || "General";
    if (!subjectMap.has(sub)) {
      subjectMap.set(sub, {
        subject: sub,
        classesAttended: 0,
        classesTotal: 0,
        testsAttended: 0,
        testsTotal: 0,
        attended: 0,
        total: 0,
        percent: 0,
      });
    }
    const entry = subjectMap.get(sub);
    entry.testsTotal += 1;
    entry.total += 1;
    if (t.status === "Present") {
      entry.testsAttended += 1;
      entry.attended += 1;
    }
  });

  const subjectWise = Array.from(subjectMap.values()).map((s) => ({
    ...s,
    absent: Math.max(0, s.total - s.attended),
    percent: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
    classPercent:
      s.classesTotal > 0
        ? Math.round((s.classesAttended / s.classesTotal) * 100)
        : 0,
    testPercent:
      s.testsTotal > 0
        ? Math.round((s.testsAttended / s.testsTotal) * 100)
        : 0,
  }));

  // 5. Combined Chronological History Log
  const history = [...classHistory, ...testHistory];

  return {
    overallPercentage,
    classAttendancePercentage,
    testAttendancePercentage,
    warning: overallPercentage < 75,
    // Legacy & combined fields
    totalClassesHeld: totalCombinedSessions,
    totalClassesAttended: totalCombinedAttended,
    totalClassesAbsent: totalCombinedAbsent,
    // Explicit separate counters
    onlyClassesHeld: totalClassesHeld,
    onlyClassesAttended: totalClassesAttended,
    onlyClassesAbsent: totalClassesAbsent,
    totalTestsHeld,
    totalTestsAttended,
    totalTestsAbsent,
    totalCombinedSessions,
    totalCombinedAttended,
    totalCombinedAbsent,
    subjectWise,
    classHistory,
    testHistory,
    history,
  };
}

/**
 * Recompute store attendance & performance metrics in-place
 */
function recalculateStoreMetrics(store) {
  if (!store) return store;

  // Ensure enrolledStudents array exists
  if (!Array.isArray(store.enrolledStudents) || store.enrolledStudents.length === 0) {
    store.enrolledStudents = JSON.parse(
      JSON.stringify(INITIAL_LMS_DATA.enrolledStudents)
    );
  }

  // If Firebase Auth has a logged-in student, sync them into activeStudentEmail
  if (auth?.currentUser?.email) {
    const authEmail = auth.currentUser.email.trim().toLowerCase();
    const authName =
      auth.currentUser.displayName || authEmail.split("@")[0] || "Scholar";
    store.activeStudentEmail = authEmail;
    store.activeStudentName = authName;
  }

  const attendanceSummary = computeAttendanceSummary(
    store,
    store.activeStudentEmail
  );
  store.attendance = attendanceSummary;

  // Compute real test average score from completed tests
  const completedTests = (store.tests || []).filter(
    (t) => t.completed && t.recentScore
  );
  const testAverageScore =
    completedTests.length > 0
      ? Math.round(
          completedTests.reduce(
            (acc, t) => acc + (t.recentScore?.accuracy || 0),
            0
          ) / completedTests.length
        )
      : 0;

  // Compute real assignment completion percentage
  const totalAssignments = (store.assignments || []).length;
  const submittedAssignments = (store.assignments || []).filter(
    (a) => a.status === "submitted" || a.status === "graded"
  ).length;
  const assignmentCompletionPercent =
    totalAssignments > 0
      ? Math.round((submittedAssignments / totalAssignments) * 100)
      : 0;

  store.performance = {
    ...(store.performance || {}),
    attendancePercent: attendanceSummary.overallPercentage,
    testAverageScore,
    assignmentCompletionPercent,
  };

  return store;
}

/**
 * Get current LMS Store state
 * ALWAYS reads fresh from AsyncStorage + merges with Firestore so Teacher-created classes
 * and Teacher-marked attendance immediately reflect for Students!
 */
export async function getLmsStore() {
  let localStore = null;

  // 1. Always read latest from AsyncStorage (never rely on stale in-memory cache across tabs/roles)
  try {
    const raw = await AsyncStorage.getItem(LMS_STORAGE_KEY);
    if (raw) {
      localStore = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("AsyncStorage LMS load error:", err);
  }

  // 2. Also check Firestore shared state (with fast 1.2s timeout) so cross-tab/cross-device stays in sync
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore LMS timeout")), 1200)
    );
    const snap = await Promise.race([
      getDoc(doc(db, "lms_state", "shared_v2")),
      timeoutPromise,
    ]);
    if (snap && snap.exists()) {
      const remoteStore = snap.data();
      if (
        remoteStore &&
        (!localStore ||
          (remoteStore.lastUpdatedAt || 0) > (localStore.lastUpdatedAt || 0) ||
          (remoteStore.classes?.length || 0) > (localStore.classes?.length || 0))
      ) {
        localStore = remoteStore;
      }
    }
  } catch (fsErr) {
    // Offline or Firestore rules restricted — localStore from AsyncStorage is used
  }

  if (localStore) {
    inMemoryStore = localStore;
    if (Array.isArray(inMemoryStore.teachers)) {
      inMemoryStore.teachers = inMemoryStore.teachers.map((t) =>
        t.password ? t : { ...t, password: "Teacher@123" }
      );
    }
    recalculateStoreMetrics(inMemoryStore);
    try {
      await AsyncStorage.setItem(LMS_STORAGE_KEY, JSON.stringify(inMemoryStore));
    } catch (e) {}
    return inMemoryStore;
  }

  if (inMemoryStore) {
    return recalculateStoreMetrics(inMemoryStore);
  }

  inMemoryStore = JSON.parse(JSON.stringify(INITIAL_LMS_DATA));
  recalculateStoreMetrics(inMemoryStore);
  try {
    await AsyncStorage.setItem(LMS_STORAGE_KEY, JSON.stringify(inMemoryStore));
  } catch (e) {}

  return inMemoryStore;
}

/**
 * Save store updates to Memory, AsyncStorage, and Firestore
 */
export async function saveLmsStore(updatedStore) {
  const stamped = {
    ...updatedStore,
    lastUpdatedAt: Date.now(),
  };
  inMemoryStore = recalculateStoreMetrics(stamped);
  try {
    await AsyncStorage.setItem(LMS_STORAGE_KEY, JSON.stringify(inMemoryStore));
  } catch (err) {
    console.warn("Failed to save LMS store:", err);
  }

  // Background sync to Firestore so Teacher & Student roles sync across sessions/devices
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore save timeout")), 2000)
    );
    Promise.race([
      setDoc(doc(db, "lms_state", "shared_v2"), inMemoryStore),
      timeoutPromise,
    ]).catch(() => {});
  } catch (e) {}

  return inMemoryStore;
}

/**
 * Sync the currently logged-in Student into the LMS Enrolled Students Roster
 * so the Teacher sees the student in Roll Call and attendance maps to their account.
 * MUST RETURN THE FULL STORE OBJECT!
 */
export async function syncStudentToLmsRoster(studentProfile) {
  const store = await getLmsStore();
  if (!studentProfile || !studentProfile.email) {
    return store;
  }

  const cleanEmail = studentProfile.email.trim().toLowerCase();
  const cleanName =
    studentProfile.name?.trim() || cleanEmail.split("@")[0] || "Scholar";

  store.activeStudentEmail = cleanEmail;
  store.activeStudentName = cleanName;

  const roster = Array.isArray(store.enrolledStudents)
    ? [...store.enrolledStudents]
    : [];

  // Update the primary student slot and avoid duplicates
  const existingIdx = roster.findIndex(
    (s) =>
      s.id === "primary-student" ||
      Boolean(s.isPrimary) ||
      (s.email || "").toLowerCase() === cleanEmail
  );

  if (existingIdx >= 0) {
    roster[existingIdx] = {
      ...roster[existingIdx],
      id: "primary-student",
      name: cleanName,
      email: cleanEmail,
      isPrimary: true,
    };
  } else {
    roster.unshift({
      id: "primary-student",
      name: cleanName,
      email: cleanEmail,
      isPrimary: true,
    });
  }

  store.enrolledStudents = roster;
  const savedStore = await saveLmsStore(store);
  return savedStore;
}

/**
 * TEACHER ONLY: Save Roll-Call Attendance for a Live Class
 * Teacher selects a class -> marks each enrolled student Present or Absent -> saves.
 */
export async function saveClassRollCallAttendance(
  classId,
  studentAttendanceMap,
  enrolledList = []
) {
  const store = await getLmsStore();
  const activeEmail = (
    store.activeStudentEmail || "student@coachingguru.com"
  ).toLowerCase();

  // Normalize map keys to lowercase
  const normalizedMap = {};
  Object.keys(studentAttendanceMap || {}).forEach((k) => {
    normalizedMap[k.trim().toLowerCase()] = studentAttendanceMap[k];
  });

  // Determine if the primary student (or any marked student if primary wasn't explicitly set to Absent) is Present
  const explicitPrimary =
    normalizedMap["primary-student"] ||
    normalizedMap[activeEmail] ||
    normalizedMap["student@coachingguru.com"];

  const anyStudentMarkedPresent = Object.values(normalizedMap).some(
    (val) => val === "Present"
  );

  let primaryStatus = "Absent";
  if (explicitPrimary === "Present") {
    primaryStatus = "Present";
  } else if (explicitPrimary === "Absent") {
    primaryStatus = "Absent";
  } else if (anyStudentMarkedPresent) {
    primaryStatus = "Present";
  }

  normalizedMap["primary-student"] = primaryStatus;
  normalizedMap[activeEmail] = primaryStatus;
  normalizedMap["student@coachingguru.com"] = primaryStatus;

  const attendanceRecords = (
    enrolledList.length > 0 ? enrolledList : store.enrolledStudents || []
  ).map((stu) => {
    const key = (stu.email || stu.id || "").toLowerCase();
    const st = stu.isPrimary
      ? primaryStatus
      : normalizedMap[key] || normalizedMap[stu.id] || "Absent";
    return {
      studentId: stu.id || key,
      name: stu.name,
      email: stu.email,
      status: st === "Present" ? "Present" : "Absent",
      markedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  let targetClassTitle = "Class Session";
  const classes = (store.classes || []).map((c) => {
    if (c.id === classId) {
      targetClassTitle = c.title;
      return {
        ...c,
        rollCallCompleted: true,
        attendanceMarked: primaryStatus === "Present",
        studentAttendance: normalizedMap,
        attendanceRecords,
        lastRollCallAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }
    return c;
  });

  const notifications = [
    {
      id: "notif-" + Date.now(),
      title: `Class Attendance Marked: ${primaryStatus.toUpperCase()} 📋`,
      message: `Your instructor recorded your attendance as ${primaryStatus} for "${targetClassTitle}".`,
      type: "attendance",
      timestamp: "Just now",
      read: false,
    },
    ...(store.notifications || []),
  ];

  const updated = {
    ...store,
    classes,
    notifications,
  };

  const savedStore = await saveLmsStore(updated);
  return savedStore;
}

/**
 * TEACHER ONLY: Save Roll-Call Attendance override for a Test
 */
export async function saveTestRollCallAttendance(testId, studentAttendanceMap) {
  const store = await getLmsStore();
  const activeEmail = (
    store.activeStudentEmail || "student@coachingguru.com"
  ).toLowerCase();

  const normalizedMap = {};
  Object.keys(studentAttendanceMap || {}).forEach((k) => {
    normalizedMap[k.trim().toLowerCase()] = studentAttendanceMap[k];
  });

  const explicitPrimary =
    normalizedMap["primary-student"] ||
    normalizedMap[activeEmail] ||
    normalizedMap["student@coachingguru.com"];

  const anyStudentMarkedPresent = Object.values(normalizedMap).some(
    (val) => val === "Present"
  );

  let primaryStatus = "Absent";
  if (explicitPrimary === "Present") {
    primaryStatus = "Present";
  } else if (explicitPrimary === "Absent") {
    primaryStatus = "Absent";
  } else if (anyStudentMarkedPresent) {
    primaryStatus = "Present";
  }

  normalizedMap["primary-student"] = primaryStatus;
  normalizedMap[activeEmail] = primaryStatus;
  normalizedMap["student@coachingguru.com"] = primaryStatus;

  const tests = (store.tests || []).map((t) => {
    if (t.id === testId) {
      return {
        ...t,
        completed: primaryStatus === "Present" ? true : false,
        studentAttendance: normalizedMap,
      };
    }
    return t;
  });

  const updated = { ...store, tests };
  const savedStore = await saveLmsStore(updated);
  return savedStore;
}

/**
 * DEPRECATED for students: Students cannot manually mark themselves present!
 * Kept only as a safe no-op export so any legacy import does not crash.
 */
export async function markClassAttendance() {
  // Students are NOT allowed to mark their own attendance.
  // Only teachers can mark attendance via saveClassRollCallAttendance().
  return false;
}

/**
 * Add a new Teacher (Admin feature)
 */
export async function addTeacher(teacherData) {
  const store = await getLmsStore();
  const email = (teacherData.email || "").trim().toLowerCase();

  const existing = (store.teachers || []).find(
    (t) => (t.email || "").toLowerCase() === email
  );
  if (existing) {
    throw new Error("A faculty account with this email already exists.");
  }

  const name = teacherData.name.trim();
  const initials =
    name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "T";

  const newTeacher = {
    id: "tch-" + Date.now(),
    name,
    subject: teacherData.subject.trim(),
    email,
    password: teacherData.password.trim(),
    phone: teacherData.phone?.trim() || "+1 415-555-0100",
    avatar: teacherData.avatar?.trim() || initials,
    totalStudents: 0,
    activeClasses: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  };

  const updated = {
    ...store,
    teachers: [newTeacher, ...store.teachers],
  };

  await saveLmsStore(updated);
  return newTeacher;
}

/**
 * Delete a Teacher (Admin feature)
 */
export async function deleteTeacher(teacherId) {
  const store = await getLmsStore();
  const updatedTeachers = (store.teachers || []).filter(
    (t) => t.id !== teacherId
  );
  const updated = {
    ...store,
    teachers: updatedTeachers,
  };
  await saveLmsStore(updated);
  return true;
}

/**
 * Student submits an assignment
 */
export async function submitAssignment(assignmentId, submissionContent) {
  const store = await getLmsStore();
  const assignments = store.assignments.map((a) => {
    if (a.id === assignmentId) {
      return {
        ...a,
        status: "submitted",
        submissionContent,
        submittedAt:
          "Just now (" +
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) +
          ")",
      };
    }
    return a;
  });

  const updated = { ...store, assignments };
  await saveLmsStore(updated);
  return assignments.find((a) => a.id === assignmentId);
}

/**
 * Student submits a test -> calculates instant score & accuracy AND marks Test Attendance as Present!
 */
export async function submitTestResult(testId, answersMap, timeSpentSeconds) {
  const store = await getLmsStore();
  const test = store.tests.find((t) => t.id === testId);
  if (!test) return null;

  const activeEmail = (
    store.activeStudentEmail || "student@coachingguru.com"
  ).toLowerCase();

  let correctCount = 0;
  const questionDetails = (test.questions || []).map((q) => {
    const selected = answersMap[q.id];
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) correctCount++;
    return {
      ...q,
      selectedOptionIndex: selected,
      isCorrect,
    };
  });

  const total = (test.questions || []).length || test.totalQuestions || 1;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const result = {
    score: correctCount,
    total,
    accuracy,
    timeSpentSeconds,
    takenAt: "Just now",
    questionDetails,
  };

  const tests = store.tests.map((t) => {
    if (t.id === testId) {
      const updatedStudentAttendance = {
        ...(t.studentAttendance || {}),
        "primary-student": "Present",
        [activeEmail]: "Present",
        "student@coachingguru.com": "Present",
      };
      return {
        ...t,
        completed: true,
        recentScore: result,
        studentAttendance: updatedStudentAttendance,
      };
    }
    return t;
  });

  const notifications = [
    {
      id: "notif-" + Date.now(),
      title: "Test Attended & Submitted! 🎯",
      message: `You scored ${correctCount}/${total} (${accuracy}%) in "${test.title}". Test attendance marked as PRESENT.`,
      type: "test",
      timestamp: "Just now",
      read: false,
    },
    ...(store.notifications || []),
  ];

  const updated = { ...store, tests, notifications };
  await saveLmsStore(updated);
  return result;
}

/**
 * Create a new live class (Teacher / Admin)
 * Automatically starts with attendanceMarked: false & rollCallCompleted: false -> counted as Absent for students until Teacher marks Present!
 */
export async function createLiveClass(classData) {
  const store = await getLmsStore();
  const tName = classData?.teacherName || "Faculty Member";
  const initials =
    tName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "FM";

  const newClass = {
    id: "cls-" + Date.now(),
    isLiveToday: true,
    createdByTeacher: true,
    status: "upcoming",
    attendanceMarked: false,
    rollCallCompleted: false,
    studentAttendance: {},
    attendanceRecords: [],
    date: new Date().toISOString().split("T")[0],
    recordingUrl: null,
    teacherAvatar: initials,
    roomNumber: classData?.roomNumber || "Virtual Studio 1",
    description:
      classData?.description ||
      `Live interactive session on ${classData?.subject || "Curriculum"} hosted by ${tName}.`,
    joinUrl:
      "https://meet.google.com/coaching-" +
      Math.random().toString(36).substring(2, 7),
    ...classData,
  };

  const notifications = [
    {
      id: "notif-" + Date.now(),
      title: "New Live Class Scheduled 🎥",
      message: `${tName} scheduled "${newClass.title}" (${newClass.subject}) at ${newClass.time}.`,
      type: "class",
      timestamp: "Just now",
      read: false,
    },
    ...(store.notifications || []),
  ];

  const updated = {
    ...store,
    classes: [newClass, ...(store.classes || [])],
    notifications,
  };
  await saveLmsStore(updated);
  return newClass;
}

/**
 * Create a new Test (Teacher / Admin)
 * Automatically starts with completed: false & studentAttendance: {} -> counted as Absent for students until Student attends/submits test!
 */
export async function createTest(testData) {
  const store = await getLmsStore();
  const defaultQuestions =
    Array.isArray(testData.questions) && testData.questions.length > 0
      ? testData.questions
      : [
          {
            id: "q-" + Date.now() + "-1",
            question: `Core concept assessment question for ${testData.title || "this subject"}:`,
            options: [
              "Option A (Primary Principle)",
              "Option B (Optimal Solution)",
              "Option C (Alternative Approach)",
              "Option D (None of the above)",
            ],
            correctIndex: 1,
            explanation: "Option B represents the optimal solution pattern.",
          },
          {
            id: "q-" + Date.now() + "-2",
            question: `In ${testData.subject || "this course"}, which practice ensures best scalability and accuracy?`,
            options: [
              "Modular architecture & verification",
              "Ignoring edge cases",
              "Hardcoding static values",
              "Skipping complexity analysis",
            ],
            correctIndex: 0,
            explanation:
              "Modular architecture and verification ensure reliable scalability.",
          },
          {
            id: "q-" + Date.now() + "-3",
            question: `Which metric best evaluates performance in ${testData.title || "this assessment"}?`,
            options: [
              "Time & Space Efficiency",
              "Random guessing",
              "Unindexed lookup",
              "Redundant loops",
            ],
            correctIndex: 0,
            explanation:
              "Time and space efficiency are key evaluation benchmarks.",
          },
        ];

  const newTest = {
    id: "tst-" + Date.now(),
    completed: false,
    recentScore: null,
    isUpcoming: true,
    studentAttendance: {},
    type: testData.type || "Mock Test",
    durationMinutes: Number(testData.durationMinutes) || 10,
    totalQuestions: defaultQuestions.length,
    passMarks: Number(testData.passMarks) || 2,
    scheduledDate: testData.scheduledDate || "Today, Open until 11:59 PM",
    ...testData,
    questions: defaultQuestions,
  };

  const updated = {
    ...store,
    tests: [newTest, ...store.tests],
  };
  await saveLmsStore(updated);
  return newTest;
}

/**
 * Create a new Assignment (Teacher / Admin)
 */
export async function createAssignment(assignmentData) {
  const store = await getLmsStore();
  const newAsn = {
    id: "asn-" + Date.now(),
    status: "pending",
    obtainedMarks: null,
    teacherFeedback: null,
    submissionContent: "",
    submittedAt: null,
    ...assignmentData,
  };

  const updated = {
    ...store,
    assignments: [newAsn, ...store.assignments],
  };
  await saveLmsStore(updated);
  return newAsn;
}

/**
 * Grade Assignment (Teacher)
 */
export async function gradeAssignment(assignmentId, marks, feedback) {
  const store = await getLmsStore();
  const assignments = store.assignments.map((a) => {
    if (a.id === assignmentId) {
      return {
        ...a,
        status: "graded",
        obtainedMarks: marks,
        teacherFeedback: feedback,
      };
    }
    return a;
  });

  const updated = { ...store, assignments };
  await saveLmsStore(updated);
  return true;
}

/**
 * Save Needs-Based Personalized Course
 */
export async function savePersonalizedCourse(courseReq) {
  const store = await getLmsStore();
  const newReq = {
    id: "need-" + Date.now(),
    createdAt: new Date().toISOString(),
    ...courseReq,
  };

  const updated = {
    ...store,
    personalizedCourseRequests: [
      newReq,
      ...(store.personalizedCourseRequests || []),
    ],
  };
  await saveLmsStore(updated);
  return newReq;
}
