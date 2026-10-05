import AsyncStorage from "@react-native-async-storage/async-storage";

const LMS_STORAGE_KEY = "@coaching_guru_lms_v1";

// Rich initial seed data covering all 12 Steps
const INITIAL_LMS_DATA = {
  // Live Classes
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
      attendanceMarked: true,
      date: new Date().toISOString().split("T")[0],
      roomNumber: "Virtual Room A",
      description: "Deep dive into New Architecture, Turbomodules, and scalable Expo Router structure."
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
      date: new Date().toISOString().split("T")[0],
      roomNumber: "Virtual Room B",
      description: "Mastering adjacency lists, topological sort, and interview problem patterns."
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
      date: "Tomorrow",
      roomNumber: "Lab 3",
      description: "Prompt engineering, function calling, and structured JSON output streaming."
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
      recordingUrl: "https://videos.coachingguru.com/recordings/system-design-ep4",
      attendanceMarked: true,
      date: "Yesterday",
      roomNumber: "Virtual Room B",
      description: "Event-driven architecture with Kafka and RabbitMQ."
    }
  ],

  // Tests
  tests: [
    {
      id: "tst-1",
      title: "React Native & Component Lifecycle Mock Test",
      subject: "Mobile Development",
      type: "Mock Test", // Practice | Mock | Subject
      durationMinutes: 10,
      totalQuestions: 5,
      passMarks: 3,
      scheduledDate: "Today, Open until 11:59 PM",
      isUpcoming: true,
      completed: false,
      recentScore: null,
      questions: [
        {
          id: "q1",
          question: "Which hook is used in React to manage side-effects such as subscriptions or timers?",
          options: ["useMemo", "useEffect", "useCallback", "useContext"],
          correctIndex: 1,
          explanation: "useEffect is designed to execute side effects after render cycles."
        },
        {
          id: "q2",
          question: "What is the primary file-based routing convention in Expo Router?",
          options: ["pages/index.js", "app/ directory", "routes.config.js", "src/screens/"],
          correctIndex: 1,
          explanation: "Expo Router utilizes the app/ directory where filenames correspond to URL paths."
        },
        {
          id: "q3",
          question: "How do you achieve asynchronous storage in cross-platform React Native?",
          options: ["localStorage", "IndexedDB", "@react-native-async-storage/async-storage", "cookies"],
          correctIndex: 2,
          explanation: "AsyncStorage provides an unencrypted, asynchronous key-value storage system."
        },
        {
          id: "q4",
          question: "Which component should be used in React Native for high-performance scrollable lists?",
          options: ["ScrollView", "FlatList", "ListView", "MapView"],
          correctIndex: 1,
          explanation: "FlatList renders only items currently visible on screen, maximizing performance."
        },
        {
          id: "q5",
          question: "What is the purpose of SafeAreaView in React Native?",
          options: [
            "To encrypt sensitive data",
            "To render content within the safe area boundaries of a device (notches/home bars)",
            "To prevent memory leaks",
            "To enforce strict TypeScript typing"
          ],
          correctIndex: 1,
          explanation: "SafeAreaView renders nested content within boundary safe insets of physical devices."
        }
      ]
    },
    {
      id: "tst-2",
      title: "Data Structures & Big-O Complexity Subject Test",
      subject: "Computer Science",
      type: "Subject Test",
      durationMinutes: 15,
      totalQuestions: 4,
      passMarks: 2,
      scheduledDate: "Tomorrow, 2:00 PM",
      isUpcoming: true,
      completed: true,
      recentScore: {
        score: 4,
        total: 4,
        accuracy: 100,
        takenAt: "Yesterday",
        timeSpentSeconds: 245
      },
      questions: [
        {
          id: "q201",
          question: "What is the average time complexity of searching in a Hash Table?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
          correctIndex: 0,
          explanation: "Hash table searches run in O(1) constant time on average."
        },
        {
          id: "q202",
          question: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
          options: ["Queue", "Stack", "Binary Tree", "Linked List"],
          correctIndex: 1,
          explanation: "A Stack enforces LIFO order using push and pop operations."
        },
        {
          id: "q203",
          question: "Which sorting algorithm achieves worst-case O(n log n) performance?",
          options: ["Bubble Sort", "Quick Sort", "Merge Sort", "Insertion Sort"],
          correctIndex: 2,
          explanation: "Merge Sort guarantees O(n log n) worst-case time by divide-and-conquer."
        },
        {
          id: "q204",
          question: "What traversal method of a Binary Search Tree produces values in sorted ascending order?",
          options: ["Pre-order", "In-order", "Post-order", "Level-order"],
          correctIndex: 1,
          explanation: "An In-order (Left, Root, Right) traversal of a BST visits nodes in strictly ascending order."
        }
      ]
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
      questions: [
        {
          id: "q301",
          question: "What does temperature control in LLM generative decoding?",
          options: ["Hardware CPU temperature", "Randomness and creativity of tokens", "Context window length", "Network latency"],
          correctIndex: 1,
          explanation: "Temperature scales logits to adjust randomness and sampling entropy."
        },
        {
          id: "q302",
          question: "What architecture underpins Google Gemini and modern foundational LLMs?",
          options: ["Convolutional Neural Network (CNN)", "Transformer Attention Architecture", "Recurrent Neural Network (RNN)", "Decision Trees"],
          correctIndex: 1,
          explanation: "The Transformer attention mechanism allows parallel multi-head context processing."
        },
        {
          id: "q303",
          question: "In prompt engineering, what is 'Few-Shot' prompting?",
          options: ["Providing zero instructions", "Providing a few input-output examples in the prompt", "Limiting the response to 3 words", "Running 5 parallel queries"],
          correctIndex: 1,
          explanation: "Few-shot prompting provides exemplary demonstration pairs to guide model completions."
        }
      ]
    }
  ],

  // Assignments
  assignments: [
    {
      id: "asn-1",
      title: "Build an Interactive Navigation Drawer in Expo",
      subject: "Mobile Development",
      deadline: "Tomorrow, 11:59 PM",
      dueDateIso: new Date(Date.now() + 86400000).toISOString(),
      status: "pending", // pending | submitted | graded
      totalMarks: 20,
      obtainedMarks: null,
      teacherFeedback: null,
      submissionContent: "",
      submittedAt: null,
      description: "Implement nested tabs with custom bottom bar navigation and stack screens for course details."
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
      description: "Write an adjacency list graph class with BFS shortest-path search algorithm and unit tests."
    },
    {
      id: "asn-3",
      title: "Gemini API Integration Report & Code Sample",
      subject: "Artificial Intelligence",
      deadline: "Completed Yesterday",
      dueDateIso: new Date(Date.now() - 86400000).toISOString(),
      status: "graded",
      totalMarks: 30,
      obtainedMarks: 28,
      teacherFeedback: "Exceptional code quality! Great error handling around 503 fallback and schema parsing.",
      submissionContent: "Integrated @google/genai with Gemini 3.8 Flash and custom schema validation.",
      submittedAt: "Yesterday, 8:45 PM",
      description: "Submit your implementation integrating multimodal or text Gemini API calls."
    }
  ],

  // Attendance
  attendance: {
    overallPercentage: 92,
    warning: false, // true if < 75%
    totalClassesHeld: 25,
    totalClassesAttended: 23,
    subjectWise: [
      { subject: "Mobile Development", attended: 9, total: 10, percent: 90 },
      { subject: "Computer Science (DSA)", attended: 8, total: 8, percent: 100 },
      { subject: "Artificial Intelligence", attended: 4, total: 5, percent: 80 },
      { subject: "Software Engineering", attended: 2, total: 2, percent: 100 }
    ],
    history: [
      { date: "Oct 5, 2026", subject: "Mobile Development", classTitle: "React Native New Architecture", status: "Present" },
      { date: "Oct 4, 2026", subject: "Computer Science", classTitle: "Graphs & Topological Sort", status: "Present" },
      { date: "Oct 3, 2026", subject: "Artificial Intelligence", classTitle: "Gemini Generative API", status: "Absent" },
      { date: "Oct 2, 2026", subject: "Mobile Development", classTitle: "State Management in Expo", status: "Present" },
      { date: "Oct 1, 2026", subject: "Software Engineering", classTitle: "Microservices Design", status: "Present" }
    ]
  },

  // Performance & Stats
  performance: {
    courseCompletionPercent: 74,
    testAverageScore: 88,
    attendancePercent: 92,
    assignmentCompletionPercent: 67,
    learningStreakDays: 6,
    strongSubjects: ["Computer Science (DSA)", "Software Architecture"],
    weakSubjects: ["Artificial Intelligence (Needs practice in prompt tuning)"],
    weakTopics: [
      { topic: "LLM Hallucination Mitigation", subject: "AI", suggestedAction: "Review Gemini system instruction prompts" },
      { topic: "Dynamic Programming Memoization", subject: "Computer Science", suggestedAction: "Practice Top-down vs Bottom-up drills" }
    ]
  },

  // Notifications
  notifications: [
    {
      id: "notif-1",
      title: "Live Class Starting Soon ⏰",
      message: "Advanced React Native Architecture starts at 4:00 PM today. Don't forget to join!",
      type: "class",
      timestamp: "10 mins ago",
      read: false
    },
    {
      id: "notif-2",
      title: "New Assignment Posted 📝",
      message: "Prof. Sarah posted: Build an Interactive Navigation Drawer in Expo (Due Tomorrow).",
      type: "assignment",
      timestamp: "2 hours ago",
      read: false
    },
    {
      id: "notif-3",
      title: "Test Score Available 🏆",
      message: "Your score for Data Structures Subject Test is 4/4 (100% Accuracy)! Great job!",
      type: "test",
      timestamp: "Yesterday",
      read: true
    },
    {
      id: "notif-4",
      title: "Attendance Recorded ✅",
      message: "Your attendance for 'Graphs & Topological Sort' was verified as Present.",
      type: "attendance",
      timestamp: "Yesterday",
      read: true
    },
    {
      id: "notif-5",
      title: "AI Doubts Solver Available 🤖",
      message: "Need help before today's test? Ask the Gemini AI Tutor any doubt 24/7.",
      type: "ai",
      timestamp: "2 days ago",
      read: true
    }
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
      rating: 4.9
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
      rating: 4.95
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
      rating: 4.85
    }
  ],

  // Personalized Needs-based courses generated for students
  personalizedCourseRequests: []
};

let inMemoryStore = null;

/**
 * Get current LMS Store state (loads from AsyncStorage or seeds initial state)
 */
export async function getLmsStore() {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  try {
    const raw = await AsyncStorage.getItem(LMS_STORAGE_KEY);
    if (raw) {
      inMemoryStore = JSON.parse(raw);
      // Ensure all teachers have password property
      if (Array.isArray(inMemoryStore.teachers)) {
        let needsUpdate = false;
        inMemoryStore.teachers = inMemoryStore.teachers.map((t) => {
          if (!t.password) {
            needsUpdate = true;
            return { ...t, password: "Teacher@123" };
          }
          return t;
        });
        if (needsUpdate) {
          AsyncStorage.setItem(LMS_STORAGE_KEY, JSON.stringify(inMemoryStore)).catch(() => {});
        }
      }
      return inMemoryStore;
    }
  } catch (err) {
    console.warn("AsyncStorage LMS load error:", err);
  }

  inMemoryStore = JSON.parse(JSON.stringify(INITIAL_LMS_DATA));
  try {
    await AsyncStorage.setItem(LMS_STORAGE_KEY, JSON.stringify(inMemoryStore));
  } catch (e) {}

  return inMemoryStore;
}

/**
 * Save store updates to Memory and AsyncStorage
 */
export async function saveLmsStore(updatedStore) {
  inMemoryStore = { ...updatedStore };
  try {
    await AsyncStorage.setItem(LMS_STORAGE_KEY, JSON.stringify(inMemoryStore));
  } catch (err) {
    console.warn("Failed to save LMS store:", err);
  }
  return inMemoryStore;
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
  const initials = name
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
  const updatedTeachers = (store.teachers || []).filter((t) => t.id !== teacherId);
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
        submittedAt: "Just now (" + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")",
      };
    }
    return a;
  });

  const updated = { ...store, assignments };
  await saveLmsStore(updated);
  return assignments.find((a) => a.id === assignmentId);
}

/**
 * Student submits a test and calculates instant score & accuracy
 */
export async function submitTestResult(testId, answersMap, timeSpentSeconds) {
  const store = await getLmsStore();
  const test = store.tests.find((t) => t.id === testId);
  if (!test) return null;

  let correctCount = 0;
  const questionDetails = test.questions.map((q) => {
    const selected = answersMap[q.id];
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) correctCount++;
    return {
      ...q,
      selectedOptionIndex: selected,
      isCorrect,
    };
  });

  const total = test.questions.length;
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
      return {
        ...t,
        completed: true,
        recentScore: result,
      };
    }
    return t;
  });

  // Add notification
  const notifications = [
    {
      id: "notif-" + Date.now(),
      title: "Test Submitted Successfully! 🎯",
      message: `You scored ${correctCount}/${total} (${accuracy}%) in ${test.title}.`,
      type: "test",
      timestamp: "Just now",
      read: false,
    },
    ...store.notifications,
  ];

  const updated = { ...store, tests, notifications };
  await saveLmsStore(updated);
  return result;
}

/**
 * Join live class & auto-record attendance
 */
export async function markClassAttendance(classId) {
  const store = await getLmsStore();
  const classes = store.classes.map((c) => {
    if (c.id === classId) {
      return { ...c, attendanceMarked: true };
    }
    return c;
  });

  // Increment attendance count if not already marked
  const target = store.classes.find((c) => c.id === classId);
  let attendance = { ...store.attendance };
  if (target && !target.attendanceMarked) {
    const newAttended = attendance.totalClassesAttended + 1;
    const newTotal = attendance.totalClassesHeld;
    attendance.totalClassesAttended = newAttended;
    attendance.overallPercentage = Math.round((newAttended / newTotal) * 100);
    attendance.history = [
      {
        date: "Today",
        subject: target.subject,
        classTitle: target.title,
        status: "Present",
      },
      ...attendance.history,
    ];
  }

  const updated = { ...store, classes, attendance };
  await saveLmsStore(updated);
  return true;
}

/**
 * Create a new live class (Teacher / Admin)
 */
export async function createLiveClass(classData) {
  const store = await getLmsStore();
  const newClass = {
    id: "cls-" + Date.now(),
    isLiveToday: true,
    status: "upcoming",
    attendanceMarked: false,
    recordingUrl: null,
    joinUrl: "https://meet.google.com/coaching-" + Math.random().toString(36).substring(2, 7),
    ...classData,
  };

  const updated = {
    ...store,
    classes: [newClass, ...store.classes],
  };
  await saveLmsStore(updated);
  return newClass;
}

/**
 * Create a new Test (Teacher / Admin)
 */
export async function createTest(testData) {
  const store = await getLmsStore();
  const newTest = {
    id: "tst-" + Date.now(),
    completed: false,
    recentScore: null,
    isUpcoming: true,
    ...testData,
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
    personalizedCourseRequests: [newReq, ...store.personalizedCourseRequests],
  };
  await saveLmsStore(updated);
  return newReq;
}
