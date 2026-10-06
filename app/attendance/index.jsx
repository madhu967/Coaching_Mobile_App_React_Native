import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { UserDetailContext } from "../../context/UserDetailContext";
import { getLmsStore, syncStudentToLmsRoster } from "../../services/lmsStore";

export default function AttendanceScreen() {
  const router = useRouter();
  const { userDetail } = useContext(UserDetailContext);
  const [attendance, setAttendance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all"); // "all" | "classes" | "tests"

  const loadAttendance = async () => {
    try {
      const store = userDetail?.email
        ? await syncStudentToLmsRoster(userDetail)
        : await getLmsStore();
      setAttendance(store.attendance || null);
    } catch (e) {
      console.error("Attendance load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [userDetail?.email]);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [userDetail?.email])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  if (!attendance) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 24, fontFamily: "Quicksand-Medium", color: "#475569" }}>
          Loading attendance records...
        </Text>
      </View>
    );
  }

  const overall = attendance.overallPercentage ?? 0;
  const classPct = attendance.classAttendancePercentage ?? 0;
  const testPct = attendance.testAttendancePercentage ?? 0;

  const totalCombinedHeld = attendance.totalCombinedSessions ?? attendance.totalClassesHeld ?? 0;
  const totalCombinedAttended =
    attendance.totalCombinedAttended ?? attendance.totalClassesAttended ?? 0;
  const totalCombinedAbsent =
    attendance.totalCombinedAbsent ?? Math.max(0, totalCombinedHeld - totalCombinedAttended);

  const onlyClassesHeld = attendance.onlyClassesHeld ?? 0;
  const onlyClassesAttended = attendance.onlyClassesAttended ?? 0;
  const onlyClassesAbsent =
    attendance.onlyClassesAbsent ?? Math.max(0, onlyClassesHeld - onlyClassesAttended);

  const totalTestsHeld = attendance.totalTestsHeld ?? 0;
  const totalTestsAttended = attendance.totalTestsAttended ?? 0;
  const totalTestsAbsent =
    attendance.totalTestsAbsent ?? Math.max(0, totalTestsHeld - totalTestsAttended);

  const isWarning = overall < 75;

  const filteredHistory =
    historyFilter === "classes"
      ? attendance.classHistory || []
      : historyFilter === "tests"
      ? attendance.testHistory || []
      : attendance.history || [];

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
          <Ionicons name="arrow-back" size={20} color="#181b19" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Tracker</Text>
        <View style={{ width: 52 }} />
      </View>

      {/* Read-Only Policy Banner */}
      <View style={styles.policyBanner}>
        <View style={styles.policyIconWrap}>
          <Ionicons name="shield-checkmark" size={20} color="#181b19" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.policyTitle}>Teacher-Verified Attendance Only</Text>
          <Text style={styles.policySub}>
            Students cannot manually mark themselves present. Class attendance is marked by your
            faculty during roll call, and test attendance is recorded when you complete a test. Any
            unattended class or test is marked Absent.
          </Text>
        </View>
      </View>

      {/* Warning Alert Banner if < 75% */}
      {isWarning ? (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color="#dc2626" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.warningTitle}>
              {overall === 0 ? "0% Attendance Recorded" : "Attendance Warning"}
            </Text>
            <Text style={styles.warningSubtitle}>
              {overall === 0
                ? "No classes or tests have been marked Present yet. Unattended sessions are counted as Absent (0%)."
                : `Your combined attendance is ${overall}%. A minimum of 75% is required for term eligibility.`}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.goodBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.goodTitle}>Attendance in Good Standing</Text>
            <Text style={styles.goodSubtitle}>
              You have maintained {overall}% combined attendance across classes and tests!
            </Text>
          </View>
        </View>
      )}

      {/* COMBINED OVERALL ATTENDANCE CARD */}
      <View style={styles.scoreCard}>
        <View style={styles.combinedTagPill}>
          <Ionicons name="layers-outline" size={13} color="#181b19" />
          <Text style={styles.combinedTagText}>COMBINED ATTENDANCE (CLASSES + TESTS)</Text>
        </View>

        <View style={[styles.scoreCircle, isWarning && { borderColor: "#dc2626", backgroundColor: "#fef2f2" }]}>
          <Text style={[styles.scoreNumber, isWarning && { color: "#dc2626" }]}>{overall}%</Text>
          <Text style={styles.scoreLabel}>Combined</Text>
        </View>

        <View style={styles.scoreMetaRow}>
          <View style={styles.scoreMetaBox}>
            <Text style={[styles.scoreMetaVal, { color: "#16a34a" }]}>{totalCombinedAttended}</Text>
            <Text style={styles.scoreMetaLabel}>Present</Text>
          </View>
          <View style={styles.scoreMetaDivider} />
          <View style={styles.scoreMetaBox}>
            <Text style={styles.scoreMetaVal}>{totalCombinedHeld}</Text>
            <Text style={styles.scoreMetaLabel}>Total Held</Text>
          </View>
          <View style={styles.scoreMetaDivider} />
          <View style={styles.scoreMetaBox}>
            <Text style={[styles.scoreMetaVal, { color: "#dc2626" }]}>{totalCombinedAbsent}</Text>
            <Text style={styles.scoreMetaLabel}>Absent</Text>
          </View>
        </View>
      </View>

      {/* SEPARATE BREAKDOWN CARDS: CLASS ATTENDANCE vs TEST ATTENDANCE */}
      <Text style={styles.sectionHeading}>Separate Attendance Breakdown</Text>
      <View style={styles.separateRow}>
        {/* Separate Class Attendance Card */}
        <View style={styles.separateCard}>
          <View style={styles.separateCardTop}>
            <View style={[styles.separateIconBox, { backgroundColor: "#e6f0ea" }]}>
              <Ionicons name="videocam" size={18} color="#181b19" />
            </View>
            <Text style={styles.separateBadge}>TEACHER ROLL CALL</Text>
          </View>
          <Text style={styles.separatePercent}>{classPct}%</Text>
          <Text style={styles.separateTitle}>Class Attendance</Text>
          <View style={styles.miniProgressTrack}>
            <View
              style={[
                styles.miniProgressFill,
                { width: `${classPct}%`, backgroundColor: "#181b19" },
              ]}
            />
          </View>
          <View style={styles.separateCountsRow}>
            <Text style={styles.separateCountPresent}>{onlyClassesAttended} Present</Text>
            <Text style={styles.separateCountDot}>•</Text>
            <Text style={styles.separateCountAbsent}>{onlyClassesAbsent} Absent</Text>
          </View>
          <Text style={styles.separateTotalSub}>{onlyClassesHeld} Total Classes Scheduled</Text>
        </View>

        {/* Separate Test Attendance Card */}
        <View style={styles.separateCard}>
          <View style={styles.separateCardTop}>
            <View style={[styles.separateIconBox, { backgroundColor: "#f7e8e3" }]}>
              <Ionicons name="document-text" size={18} color="#9a3412" />
            </View>
            <Text style={[styles.separateBadge, { backgroundColor: "#fff7ed", color: "#9a3412" }]}>
              EXAM / TEST
            </Text>
          </View>
          <Text style={styles.separatePercent}>{testPct}%</Text>
          <Text style={styles.separateTitle}>Test Attendance</Text>
          <View style={styles.miniProgressTrack}>
            <View
              style={[
                styles.miniProgressFill,
                { width: `${testPct}%`, backgroundColor: "#ea580c" },
              ]}
            />
          </View>
          <View style={styles.separateCountsRow}>
            <Text style={styles.separateCountPresent}>{totalTestsAttended} Present</Text>
            <Text style={styles.separateCountDot}>•</Text>
            <Text style={styles.separateCountAbsent}>{totalTestsAbsent} Absent</Text>
          </View>
          <Text style={styles.separateTotalSub}>{totalTestsHeld} Total Tests Created</Text>
        </View>
      </View>

      {/* Subject-Wise Breakdown */}
      <Text style={[styles.sectionHeading, { marginTop: 12 }]}>Subject-Wise Attendance</Text>

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

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, flexWrap: "wrap", gap: 4 }}>
              <Text style={styles.subRatio}>
                Combined: {sub.attended}/{sub.total} Present ({sub.absent ?? sub.total - sub.attended} Absent)
              </Text>
              <Text style={styles.subSeparateMeta}>
                Classes: {sub.classesAttended ?? 0}/{sub.classesTotal ?? 0} ({sub.classPercent ?? 0}%) • Tests:{" "}
                {sub.testsAttended ?? 0}/{sub.testsTotal ?? 0} ({sub.testPercent ?? 0}%)
              </Text>
            </View>
          </View>
        );
      })}

      {/* Filterable Attendance History Log */}
      <View style={styles.historyHeaderRow}>
        <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>Attendance History Log</Text>
        <Text style={styles.historySubCount}>{filteredHistory.length} Records</Text>
      </View>

      {/* Filter Pills: All Combined | Classes Only | Tests Only */}
      <View style={styles.filterTabsRow}>
        {[
          { id: "all", label: `All Combined (${(attendance.history || []).length})` },
          { id: "classes", label: `Classes (${(attendance.classHistory || []).length})` },
          { id: "tests", label: `Tests (${(attendance.testHistory || []).length})` },
        ].map((tab) => {
          const active = historyFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setHistoryFilter(tab.id)}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredHistory.map((log, idx) => {
        const isPresent = log.status === "Present";
        const isTest = log.sessionType === "Test";
        return (
          <View key={log.id || idx} style={styles.historyCard}>
            <View
              style={[
                styles.historyStatusDot,
                { backgroundColor: isPresent ? "#16a34a" : "#dc2626" },
              ]}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <View
                  style={[
                    styles.typeChip,
                    { backgroundColor: isTest ? "#fff7ed" : "#eef3f0" },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: isTest ? "#9a3412" : "#181b19" },
                    ]}
                  >
                    {isTest ? "TEST" : "CLASS"}
                  </Text>
                </View>
                <Text style={styles.historyDateText}>{log.date}</Text>
              </View>
              <Text style={styles.historyTitle}>{log.classTitle}</Text>
              <Text style={styles.historyMeta}>
                {log.subject} • {log.markedBy || (isPresent ? "Marked Present" : "Not Attended — Marked Absent")}
              </Text>
            </View>
            <View
              style={[
                styles.historyBadge,
                { backgroundColor: isPresent ? "#f0fdf4" : "#fef2f2" },
              ]}
            >
              <Ionicons
                name={isPresent ? "checkmark-circle" : "close-circle"}
                size={13}
                color={isPresent ? "#16a34a" : "#dc2626"}
              />
              <Text
                style={[
                  styles.historyBadgeText,
                  { color: isPresent ? "#16a34a" : "#dc2626" },
                ]}
              >
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
    backgroundColor: "#f7f5f2",
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
    gap: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  backBtnText: {
    fontFamily: "Quicksand-Bold",
    color: "#181b19",
    fontSize: 13,
  },
  headerTitle: {
    fontFamily: "Quicksand-Bold",
    fontSize: 19,
    color: "#181b19",
  },
  policyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  policyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#e6f0ea",
    justifyContent: "center",
    alignItems: "center",
  },
  policyTitle: {
    fontFamily: "Quicksand-Bold",
    fontSize: 13,
    color: "#181b19",
  },
  policySub: {
    fontFamily: "Quicksand-Medium",
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 16,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 16,
  },
  warningTitle: {
    fontFamily: "Quicksand-Bold",
    fontSize: 14,
    color: "#991b1b",
  },
  warningSubtitle: {
    fontFamily: "Quicksand-Medium",
    fontSize: 12,
    color: "#7f1d1d",
    marginTop: 2,
    lineHeight: 16,
  },
  goodBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 16,
  },
  goodTitle: {
    fontFamily: "Quicksand-Bold",
    fontSize: 14,
    color: "#166534",
  },
  goodSubtitle: {
    fontFamily: "Quicksand-Medium",
    fontSize: 12,
    color: "#14532d",
    marginTop: 2,
  },
  scoreCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2f7",
    marginBottom: 22,
  },
  combinedTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
  },
  combinedTagText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 10,
    color: "#181b19",
    letterSpacing: 0.5,
  },
  scoreCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#16a34a",
    marginBottom: 16,
  },
  scoreNumber: {
    fontFamily: "Quicksand-Bold",
    fontSize: 28,
    color: "#16a34a",
  },
  scoreLabel: {
    fontFamily: "Quicksand-SemiBold",
    fontSize: 11,
    color: "#64748b",
  },
  scoreMetaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  scoreMetaBox: {
    alignItems: "center",
  },
  scoreMetaVal: {
    fontFamily: "Quicksand-Bold",
    fontSize: 18,
    color: "#181b19",
  },
  scoreMetaLabel: {
    fontFamily: "Quicksand-SemiBold",
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  scoreMetaDivider: {
    width: 1,
    height: 26,
    backgroundColor: "#e2e8f0",
  },
  sectionHeading: {
    fontFamily: "Quicksand-Bold",
    fontSize: 16,
    color: "#181b19",
    marginBottom: 12,
  },
  separateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  separateCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  separateCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  separateIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  separateBadge: {
    fontFamily: "Quicksand-Bold",
    fontSize: 9,
    color: "#181b19",
    backgroundColor: "#e6f0ea",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  separatePercent: {
    fontFamily: "Quicksand-Bold",
    fontSize: 24,
    color: "#181b19",
  },
  separateTitle: {
    fontFamily: "Quicksand-Bold",
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  miniProgressTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    marginVertical: 10,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  separateCountsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  separateCountPresent: {
    fontFamily: "Quicksand-Bold",
    fontSize: 11,
    color: "#16a34a",
  },
  separateCountDot: {
    color: "#cbd5e1",
    fontSize: 11,
  },
  separateCountAbsent: {
    fontFamily: "Quicksand-Bold",
    fontSize: 11,
    color: "#dc2626",
  },
  separateTotalSub: {
    fontFamily: "Quicksand-Medium",
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  subjectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  subjectName: {
    fontFamily: "Quicksand-Bold",
    fontSize: 15,
    color: "#181b19",
  },
  subjectPercent: {
    fontFamily: "Quicksand-Bold",
    fontSize: 15,
    color: "#16a34a",
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
    backgroundColor: "#16a34a",
    borderRadius: 3,
  },
  subRatio: {
    fontFamily: "Quicksand-SemiBold",
    fontSize: 11,
    color: "#475569",
  },
  subSeparateMeta: {
    fontFamily: "Quicksand-Bold",
    fontSize: 11,
    color: "#181b19",
  },
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  historySubCount: {
    fontFamily: "Quicksand-Bold",
    fontSize: 12,
    color: "#64748b",
  },
  filterTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPillActive: {
    backgroundColor: "#181b19",
    borderColor: "#181b19",
  },
  filterPillText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 11,
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
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
  typeChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeChipText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 9,
    letterSpacing: 0.4,
  },
  historyDateText: {
    fontFamily: "Quicksand-Medium",
    fontSize: 11,
    color: "#64748b",
  },
  historyTitle: {
    fontFamily: "Quicksand-Bold",
    fontSize: 14,
    color: "#181b19",
  },
  historyMeta: {
    fontFamily: "Quicksand-Medium",
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  historyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  historyBadgeText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 11,
  },
});
