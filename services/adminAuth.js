import AsyncStorage from "@react-native-async-storage/async-storage";

const ADMIN_STORAGE_KEY = "@admin_logged_in";

export const getAdminCredentials = () => {
  const email = process.env.EXPO_PUBLIC_ADMIN_EMAIL;
  const password = process.env.EXPO_PUBLIC_ADMIN_PASSWORD;

  return {
    email: email?.trim().toLowerCase() || "",
    password: password?.trim() || "",
  };
};

/**
 * Validate admin credentials and start admin session
 */
export async function loginAdmin(email, password) {
  const creds = getAdminCredentials();
  const inputEmail = (email || "").trim().toLowerCase();
  const inputPassword = (password || "").trim();

  if (inputEmail === creds.email && inputPassword === creds.password) {
    await AsyncStorage.setItem(ADMIN_STORAGE_KEY, "true");
    return { success: true };
  }

  return {
    success: false,
    message: "Invalid admin email or password. Please check your credentials.",
  };
}

/**
 * Check if admin session is currently active
 */
export async function isAdminLoggedIn() {
  try {
    const val = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
    return val === "true";
  } catch (e) {
    return false;
  }
}

/**
 * Log out from admin session
 */
export async function logoutAdmin() {
  try {
    await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch (e) {
    console.warn("Error logging out admin:", e);
  }
}
