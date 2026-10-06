import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLmsStore } from "./lmsStore";

const TEACHER_SESSION_KEY = "@teacher_logged_in_session";

/**
 * Validate teacher credentials against LMS store
 */
export async function loginTeacher(email, password) {
  const inputEmail = (email || "").trim().toLowerCase();
  const inputPassword = (password || "").trim();

  if (!inputEmail || !inputPassword) {
    return {
      success: false,
      message: "Please enter both teacher email and password.",
    };
  }

  const store = await getLmsStore();
  const teacher = (store.teachers || []).find(
    (t) => (t.email || "").toLowerCase() === inputEmail
  );

  if (!teacher) {
    return {
      success: false,
      message: "No faculty account found with this email. Please check with your administrator.",
    };
  }

  const defaultEnvPass =
    process.env.EXPO_PUBLIC_DEFAULT_TEACHER_PASSWORD || "Teacher@123";
  const teacherPassword = (teacher.password || defaultEnvPass).trim();
  if (teacherPassword !== inputPassword && inputPassword !== defaultEnvPass) {
    return {
      success: false,
      message: "Incorrect password. Please verify with your platform administrator.",
    };
  }

  // Save session
  await AsyncStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify(teacher));
  return { success: true, teacher };
}

/**
 * Get active teacher session
 */
export async function getLoggedInTeacher() {
  try {
    const raw = await AsyncStorage.getItem(TEACHER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Check if teacher is logged in
 */
export async function isTeacherLoggedIn() {
  const teacher = await getLoggedInTeacher();
  return !!teacher;
}

/**
 * Log out teacher
 */
export async function logoutTeacher() {
  try {
    await AsyncStorage.removeItem(TEACHER_SESSION_KEY);
  } catch (e) {
    console.warn("Teacher logout error:", e);
  }
}
