import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const RoleContext = createContext();

const ROLE_STORAGE_KEY = "@coaching_active_role";

export const RoleProvider = ({ children }) => {
  const [role, setRoleState] = useState("student"); // "student" | "teacher" | "admin"

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
        if (saved && ["student", "teacher", "admin"].includes(saved)) {
          setRoleState(saved);
        }
      } catch (e) {}
    })();
  }, []);

  const setRole = async (newRole) => {
    setRoleState(newRole);
    try {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } catch (e) {}
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};
