import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { getLmsStore, saveLmsStore } from "../../services/lmsStore";

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifs = async () => {
    try {
      const store = await getLmsStore();
      setNotifications(store.notifications || []);
    } catch (e) {
      console.error("Notifications load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifs();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifs();
  };

  const markAllAsRead = async () => {
    const store = await getLmsStore();
    const updated = store.notifications.map((n) => ({ ...n, read: true }));
    await saveLmsStore({ ...store, notifications: updated });
    setNotifications(updated);
  };

  const getIconForType = (type) => {
    if (type === "class") return { name: "videocam", color: "#3b82f6", bg: "#eff6ff" };
    if (type === "assignment") return { name: "document-text", color: "#f97316", bg: "#fff7ed" };
    if (type === "test") return { name: "ribbon", color: "#16a34a", bg: "#f0fdf4" };
    if (type === "attendance") return { name: "checkmark-done-circle", color: "#8b5cf6", bg: "#f5f3ff" };
    return { name: "sparkles", color: Colors.PRIMARY, bg: "#eff6ff" };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
        }
        renderItem={({ item }) => {
          const icon = getIconForType(item.type);
          return (
            <View style={[styles.notifCard, !item.read && styles.notifCardUnread]}>
              <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
                <Ionicons name={icon.name} size={22} color={icon.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  {!item.read && <View style={styles.blueDot} />}
                </View>
                <Text style={styles.notifMessage}>{item.message}</Text>
                <Text style={styles.notifTime}>{item.timestamp}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 12,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtnText: {
    fontFamily: "outfit-bold",
    color: Colors.PRIMARY,
    fontSize: 14,
  },
  headerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  markReadText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.PRIMARY,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  notifCardUnread: {
    backgroundColor: "#f8fafc",
    borderColor: "#bfdbfe",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  notifTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
    flex: 1,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.PRIMARY,
  },
  notifMessage: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#475569",
    marginTop: 3,
    lineHeight: 18,
  },
  notifTime: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 6,
  },
});
