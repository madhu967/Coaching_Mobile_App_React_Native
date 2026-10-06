import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { UserDetailContext } from "../../context/UserDetailContext";
import { getLmsStore, syncStudentToLmsRoster } from "../../services/lmsStore";

export default function LiveClassesScreen() {
  const router = useRouter();
  const { userDetail } = useContext(UserDetailContext);
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'today' | 'upcoming' | 'recordings'
  const [refreshing, setRefreshing] = useState(false);

  const loadClasses = async () => {
    try {
      const store = userDetail?.email
        ? await syncStudentToLmsRoster(userDetail)
        : await getLmsStore();
      setClasses(store.classes || []);
    } catch (e) {
      console.error("Live classes load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [userDetail?.email]);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [userDetail?.email])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  const handleJoinClass = (classItem) => {
    // Students CANNOT mark themselves present. Only the teacher marks attendance.
    Alert.alert(
      "Joining Live Class Stream 🎥",
      `Connecting to "${classItem.title}" with ${classItem.teacherName}.\n\nAttendance Policy: Students cannot manually mark themselves present. Your teacher will mark you Present or Absent during roll call.`,
      [
        {
          text: "Open Video Room",
          onPress: () => {
            if (classItem.joinUrl) {
              Linking.openURL(classItem.joinUrl).catch(() => {
                Alert.alert("Simulated Class", "Virtual meeting room started in Coaching Guru player.");
              });
            }
          },
        },
        { text: "Close" },
      ]
    );
  };

  const handleWatchRecording = (classItem) => {
    Alert.alert(
      "Class Recording 📼",
      `Playing recording for "${classItem.title}" recorded on ${classItem.date}.`,
      [{ text: "OK" }]
    );
  };

  const handleSetReminder = (classItem) => {
    Alert.alert(
      "Reminder Set 🔔",
      `You will receive a notification 15 minutes before "${classItem.title}" starts.`,
      [{ text: "OK" }]
    );
  };

  const filteredClasses = classes.filter((c) => {
    if (filter === "today") return c.isLiveToday;
    if (filter === "upcoming") return c.status === "upcoming" && !c.isLiveToday;
    if (filter === "recordings") return !!c.recordingUrl;
    return true;
  });

  const todayClasses = classes.filter((c) => c.isLiveToday);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Classes</Text>
        <TouchableOpacity
          onPress={() => router.push("/attendance")}
          style={styles.notifIconBtn}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All Classes" },
          { key: "today", label: `Today (${todayClasses.length})` },
          { key: "upcoming", label: "Upcoming" },
          { key: "recordings", label: "Recordings" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab.key && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredClasses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-off-outline" size={56} color={Colors.GRAY} />
          <Text style={styles.emptyTitle}>No Classes in this Category</Text>
          <Text style={styles.emptySubtitle}>Check back soon for newly scheduled sessions.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredClasses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
          }
          renderItem={({ item }) => {
            const isCompleted = item.status === "completed";
            const studentKey = userDetail?.email
              ? userDetail.email.trim().toLowerCase()
              : "primary-student";
            const isPresent =
              item.studentAttendance?.[studentKey] === "Present" ||
              item.studentAttendance?.["primary-student"] === "Present" ||
              item.attendanceMarked === true;

            return (
              <View style={styles.classCard}>
                {/* Header Tag */}
                <View style={styles.classCardHeader}>
                  <View style={styles.subjectPill}>
                    <Text style={styles.subjectPillText}>{item.subject}</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    {item.isLiveToday && (
                      <View style={styles.liveNowBadge}>
                        <View style={styles.redPulseDot} />
                        <Text style={styles.liveNowText}>Today's Session</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.attendanceBadge,
                        !isPresent && { backgroundColor: "#fef2f2" },
                      ]}
                    >
                      <Ionicons
                        name={isPresent ? "checkmark-circle" : "close-circle"}
                        size={13}
                        color={isPresent ? "#16a34a" : "#dc2626"}
                      />
                      <Text
                        style={[
                          styles.attendanceBadgeText,
                          !isPresent && { color: "#dc2626" },
                        ]}
                      >
                        {isPresent ? "Present" : "Absent"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Class Title & Description */}
                <Text style={styles.classTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.classDesc}>{item.description}</Text>
                ) : null}

                {/* Time & Room */}
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={15} color={Colors.GRAY} />
                  <Text style={styles.metaText}>{item.time}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.GRAY} />
                  <Text style={styles.metaText}>{item.roomNumber}</Text>
                </View>

                {/* Teacher Info Box */}
                <View style={styles.teacherBox}>
                  <View style={styles.teacherAvatar}>
                    <Text style={styles.teacherAvatarText}>{item.teacherAvatar || "T"}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.teacherName}>{item.teacherName}</Text>
                    <Text style={styles.teacherEmail}>{item.teacherEmail}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  {isCompleted ? (
                    item.recordingUrl ? (
                      <TouchableOpacity
                        style={styles.recordingBtn}
                        onPress={() => handleWatchRecording(item)}
                      >
                        <Ionicons name="play-circle" size={18} color={Colors.PRIMARY} />
                        <Text style={styles.recordingBtnText}>Watch Recording</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.classFinishedText}>Class Finished</Text>
                    )
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => handleJoinClass(item)}
                      >
                        <Ionicons name="videocam" size={18} color={Colors.WHITE} />
                        <Text style={styles.joinBtnText}>Join Class Now</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reminderBtn}
                        onPress={() => handleSetReminder(item)}
                      >
                        <Ionicons name="notifications-outline" size={18} color={Colors.PRIMARY} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
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
  notifIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#edf4ff",
    justifyContent: "center",
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterTabActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  filterTabText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#475569",
  },
  filterTabTextActive: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
  },
  classCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  classCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subjectPill: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  liveNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  redPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#ef4444",
  },
  liveNowText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#ef4444",
  },
  attendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  attendanceBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#16a34a",
  },
  classTitle: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: "#1e293b",
    marginBottom: 4,
  },
  classDesc: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginBottom: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#475569",
  },
  teacherBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 14,
  },
  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#bfdbfe",
    justifyContent: "center",
    alignItems: "center",
  },
  teacherAvatarText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  teacherName: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  teacherEmail: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  joinBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  joinBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.WHITE,
  },
  reminderBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#edf4ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  recordingBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  recordingBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  classFinishedText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 4,
  },
});
