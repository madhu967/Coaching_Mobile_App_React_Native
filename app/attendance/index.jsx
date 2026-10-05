import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { getLmsStore } from "../../services/lmsStore";

export default function AttendanceScreen() {
  const router = useRouter();
  const [attendance, setAttendance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAttendance = async () => {
    try {
      const store = await getLmsStore();
      setAttendance(store.attendance || null);
    } catch (e) {
      console.error("Attendance load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  if (!attendance) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 20, fontFamily: "outfit" }}>Loading attendance records...</Text>
      </View>
    );
  }

  const overall = attendance.overallPercentage || 0;
  const isWarning = overall < 75;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Warning Alert Banner if < 75% */}
      {isWarning ? (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color="#dc2626" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.warningTitle}>Attendance Warning</Text>
            <Text style={styles.warningSubtitle}>
              Your overall attendance is {overall}%. A minimum of 75% is required to remain eligible for term exams!
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.goodBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.goodTitle}>Attendance in Good Standing</Text>
            <Text style={styles.goodSubtitle}>
              You have maintained {overall}% attendance across all courses!
            </Text>
          </View>
        </View>
      )}

      {/* Overall Score Circle Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{overall}%</Text>
          <Text style={styles.scoreLabel}>Overall</Text>
        </View>

        <View style={styles.scoreMetaRow}>
          <View style={styles.scoreMetaBox}>
            <Text style={styles.scoreMetaVal}>{attendance.totalClassesAttended}</Text>
            <Text style={styles.scoreMetaLabel}>Attended</Text>
          </View>
          <View style={styles.scoreMetaDivider} />
          <View style={styles.scoreMetaBox}>
            <Text style={styles.scoreMetaVal}>{attendance.totalClassesHeld}</Text>
            <Text style={styles.scoreMetaLabel}>Total Sessions</Text>
          </View>
          <View style={styles.scoreMetaDivider} />
          <View style={styles.scoreMetaBox}>
            <Text style={styles.scoreMetaVal}>
              {attendance.totalClassesHeld - attendance.totalClassesAttended}
            </Text>
            <Text style={styles.scoreMetaLabel}>Missed</Text>
          </View>
        </View>
      </View>

      {/* Subject-Wise Breakdown */}
      <Text style={styles.sectionHeading}>Subject-Wise Attendance:</Text>

      {attendance.subjectWise?.map((sub, idx) => {
        const subWarn = sub.percent < 75;
        return (
          <View key={idx} style={styles.subjectCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.subjectName}>{sub.subject}</Text>
              <Text style={[styles.subjectPercent, subWarn && { color: "#dc2626" }]}>
                {sub.percent}%
              </Text>
            </View>

            <View style={styles.subBarTrack}>
              <View
                style={[
                  styles.subBarFill,
                  { width: `${sub.percent}%` },
                  subWarn && { backgroundColor: "#dc2626" },
                ]}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
              <Text style={styles.subRatio}>
                {sub.attended} of {sub.total} classes attended
              </Text>
              {subWarn && (
                <Text style={styles.subWarnTag}>Below 75% Target</Text>
              )}
            </View>
          </View>
        );
      })}

      {/* Class Attendance History */}
      <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Recent Class Attendance Log:</Text>

      {attendance.history?.map((log, idx) => {
        const isPresent = log.status === "Present";
        return (
          <View key={idx} style={styles.historyCard}>
            <View style={[styles.historyStatusDot, { backgroundColor: isPresent ? "#16a34a" : "#dc2626" }]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.historyTitle}>{log.classTitle}</Text>
              <Text style={styles.historyMeta}>
                {log.subject} • {log.date}
              </Text>
            </View>
            <View style={[styles.historyBadge, { backgroundColor: isPresent ? "#f0fdf4" : "#fef2f2" }]}>
              <Text style={[styles.historyBadgeText, { color: isPresent ? "#16a34a" : "#dc2626" }]}>
                {log.status}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
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
    marginTop: Platform.OS === "ios" ? 40 : 20,
    marginBottom: 16,
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
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 16,
  },
  warningTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#991b1b",
  },
  warningSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#7f1d1d",
    marginTop: 2,
    lineHeight: 16,
  },
  goodBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 16,
  },
  goodTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#166534",
  },
  goodSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#14532d",
    marginTop: 2,
  },
  scoreCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2f7",
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.PRIMARY,
    marginBottom: 16,
  },
  scoreNumber: {
    fontFamily: "outfit-bold",
    fontSize: 28,
    color: Colors.PRIMARY,
  },
  scoreLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
  },
  scoreMetaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  scoreMetaBox: {
    alignItems: "center",
  },
  scoreMetaVal: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  scoreMetaLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  scoreMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#e2e8f0",
  },
  sectionHeading: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  subjectName: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
  },
  subjectPercent: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.PRIMARY,
  },
  subBarTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    marginVertical: 8,
    overflow: "hidden",
  },
  subBarFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  subRatio: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  subWarnTag: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#dc2626",
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  historyMeta: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
  },
});
