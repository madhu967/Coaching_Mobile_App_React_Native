import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../config/firebaseConfig";
import { collection, setDoc, doc, getDocs } from "firebase/firestore";

const STORAGE_KEY = "@coaching_courses";

// In-memory cache for ultra-fast instant UI updates
let memoryCourses = [];

/**
 * Save a newly created course
 * Saves immediately to Memory and AsyncStorage, and syncs to Firestore in background
 */
export async function saveCourse(courseData) {
  const courseId = courseData.id || Date.now().toString();
  const userEmail =
    auth?.currentUser?.email ||
    courseData.userEmail ||
    "guest@coachingapp.com";

  const newCourse = {
    ...courseData,
    id: courseId,
    userEmail,
    createdAt: courseData.createdAt || new Date().toISOString(),
  };

  // 1. Update in-memory cache instantly
  memoryCourses = [newCourse, ...memoryCourses.filter((c) => c.id !== courseId)];

  // 2. Persist to AsyncStorage immediately
  try {
    const existingRaw = await AsyncStorage.getItem(STORAGE_KEY);
    const existingList = existingRaw ? JSON.parse(existingRaw) : [];
    const updatedList = [newCourse, ...existingList.filter((c) => c.id !== courseId)];
    memoryCourses = updatedList;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    console.log("✅ Course saved locally with ID:", courseId);
  } catch (localErr) {
    console.warn("AsyncStorage save error:", localErr);
  }

  // 3. Background sync to Firestore with a 2-second timeout (never blocks UI)
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore timeout")), 2000)
    );
    Promise.race([
      setDoc(doc(db, "courses", courseId), newCourse),
      timeoutPromise,
    ])
      .then(() => console.log("☁️ Course synced to Firestore:", courseId))
      .catch((err) => console.log("☁️ Firestore sync skipped (local copy preserved):", err.message));
  } catch (err) {
    // Ignore firestore background sync errors
  }

  return newCourse;
}

/**
 * Fetch all created courses
 * Reads local storage immediately, then attempts quick Firestore background fetch
 */
export async function getAllCourses() {
  // If we already have courses in memory, return them immediately
  if (memoryCourses.length > 0) {
    return memoryCourses;
  }

  // 1. Read local AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCourses = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("AsyncStorage get error:", err);
  }

  // 2. Quick Firestore sync with 2.5-second timeout so Explore screen NEVER hangs
  try {
    const fetchPromise = getDocs(collection(db, "courses"));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore fetch timeout")), 2500)
    );

    const querySnapshot = await Promise.race([fetchPromise, timeoutPromise]);
    const remoteCourses = [];
    querySnapshot.forEach((d) => {
      remoteCourses.push({ id: d.id, ...d.data() });
    });

    if (remoteCourses.length > 0) {
      const courseMap = new Map();
      remoteCourses.forEach((c) => courseMap.set(c.id, c));
      memoryCourses.forEach((c) => {
        if (!courseMap.has(c.id)) {
          courseMap.set(c.id, c);
        }
      });
      const merged = Array.from(courseMap.values());
      memoryCourses = merged;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (fsErr) {
    // Firestore timed out or network unavailable — return local courses
  }

  return memoryCourses;
}

/**
 * Remove a course by ID
 */
export async function removeCourse(courseId) {
  memoryCourses = memoryCourses.filter((c) => c.id !== courseId);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCourses));
  } catch (err) {
    console.warn("AsyncStorage remove error:", err);
  }
}

/**
 * Toggle completion status of a topic within a course
 */
export async function toggleTopicCompletion(courseId, topicId) {
  const courseIndex = memoryCourses.findIndex((c) => c.id === courseId);
  if (courseIndex === -1) return null;

  const course = { ...memoryCourses[courseIndex] };
  const completed = Array.isArray(course.completedTopicIds)
    ? [...course.completedTopicIds]
    : [];

  const topicIndex = completed.indexOf(topicId);
  if (topicIndex > -1) {
    completed.splice(topicIndex, 1);
  } else {
    completed.push(topicId);
  }

  course.completedTopicIds = completed;
  memoryCourses[courseIndex] = course;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCourses));
  } catch (err) {
    console.warn("AsyncStorage progress save error:", err);
  }

  // Background Firestore sync (non-blocking)
  try {
    setDoc(doc(db, "courses", courseId), course, { merge: true }).catch(() => {});
  } catch (e) {}

  return course;
}
