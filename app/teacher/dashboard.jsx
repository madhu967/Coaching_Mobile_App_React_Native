import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import Button from "../../components/Shared/Button";
import {
  getLmsStore,
  createLiveClass,
  createTest,
  createAssignment,
  gradeAssignment,
} from "../../services/lmsStore";
import {
  getLoggedInTeacher,
  logoutTeacher,
} from "../../services/teacherAuth";

export default function TeacherDashboard() {
  const router = useRouter();

  // Teacher Tabs: 'classes' | 'courses' | 'tests' | 'assignments' | 'students'
  const [tab, setTab] = useState("classes");
  const [store, setStore] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassTitle, setNewClassTitle] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [newClassTime, setNewClassTime] = useState("");

  const [showCreateAsnModal, setShowCreateAsnModal] = useState(false);
  const [newAsnTitle, setNewAsnTitle] = useState("");
  const [newAsnSubject, setNewAsnSubject] = useState("");
  const [newAsnDeadline, setNewAsnDeadline] = useState("");
  const [newAsnMarks, setNewAsnMarks] = useState("20");

  const [gradingItem, setGradingItem] = useState(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  const loadData = async () => {
    try {
      const activeTeacher = await getLoggedInTeacher();
      if (!activeTeacher) {
        router.replace("/teacher");
        return;
      }
      setTeacherProfile(activeTeacher);

      const data = await getLmsStore();
      setStore(data);
    } catch (e) {
      console.error("Teacher portal data load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTeacherLogout = () => {
    Alert.alert("Faculty Logout", "Sign out of your teacher account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logoutTeacher();
          router.replace("/teacher");
        },
      },
    ]);
  };

  const handleCreateClass = async () => {
    if (!newClassTitle.trim() || !newClassSubject.trim()) {
      Alert.alert("Missing Fields", "Please enter class title and subject.");
      return;
    }

    await createLiveClass({
      title: newClassTitle.trim(),
      subject: newClassSubject.trim(),
      time: newClassTime.trim() || "Today, 5:00 PM - 6:00 PM",
      teacherName: teacherProfile?.name || "Faculty Member",
      teacherEmail: teacherProfile?.email || "teacher@coachingguru.com",
      roomNumber: "Virtual Studio 1",
    });

    Alert.alert("Class Scheduled! 🎥", "Students have been notified.");
    setShowCreateClassModal(false);
    setNewClassTitle("");
    setNewClassSubject("");
    loadData();
  };

  const handleCreateAssignment = async () => {
    if (!newAsnTitle.trim() || !newAsnSubject.trim()) {
      Alert.alert("Missing Fields", "Please enter assignment title and subject.");
      return;
    }

    await createAssignment({
      title: newAsnTitle.trim(),
      subject: newAsnSubject.trim(),
      deadline: newAsnDeadline.trim() || "In 3 Days",
      totalMarks: parseInt(newAsnMarks) || 20,
      description: "Complete all questions and test specifications according to rubric.",
    });

    Alert.alert("Assignment Published! 📝", "Posted to student dashboards.");
    setShowCreateAsnModal(false);
    setNewAsnTitle("");
    setNewAsnSubject("");
    loadData();
  };

  const handleGradeSubmit = async () => {
    if (!gradeMarks.trim()) {
      Alert.alert("Enter Marks", "Please enter marks awarded.");
      return;
    }

    await gradeAssignment(
      gradingItem.id,
      parseInt(gradeMarks),
      gradeFeedback.trim() || "Good effort. Review concepts discussed in class."
    );

    Alert.alert("Graded! ✅", "Feedback sent to student.");
    setGradingItem(null);
    setGradeMarks("");
    setGradeFeedback("");
    loadData();
  };

  if (!store) {
    return (
      <View style={styles.centerBox}>
        <Text style={{ fontFamily: "outfit" }}>Loading Teacher Portal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="school" size={20} color={Colors.PRIMARY} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {teacherProfile?.name || "Teacher Portal"}
            </Text>
          </View>
          <Text style={styles.headerSub} numberOfLines={1}>
            {teacherProfile?.subject ? `${teacherProfile.subject} • Faculty Console` : "Create • Manage • Monitor"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleTeacherLogout}
          style={styles.exitBtn}
        >
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* Teacher Navigation Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollRow}
      >
        {[
          { key: "classes", label: "Live Classes", icon: "videocam-outline" },
          { key: "assignments", label: "Assignments", icon: "document-text-outline" },
          { key: "tests", label: "Tests & Drills", icon: "ribbon-outline" },
          { key: "students", label: "Attendance & Performance", icon: "people-outline" },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.pillBtn, tab === t.key && styles.pillBtnActive]}
          >
            <Ionicons
              name={t.icon}
              size={16}
              color={tab === t.key ? Colors.WHITE : Colors.PRIMARY}
            />
            <Text style={[styles.pillBtnText, tab === t.key && styles.pillBtnTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab 1: Live Classes */}
      {tab === "classes" && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.actionHeaderBar}>
            <Text style={styles.tabHeading}>Scheduled Classes ({store.classes.length})</Text>
            <TouchableOpacity
              style={styles.addBtnSmall}
              onPress={() => setShowCreateClassModal(true)}
            >
              <Ionicons name="add" size={16} color={Colors.WHITE} />
              <Text style={styles.addBtnText}>+ New Class</Text>
            </TouchableOpacity>
          </View>

          {store.classes.map((cls) => (
            <View key={cls.id} style={styles.cardItem}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cardItemTitle}>{cls.title}</Text>
                <View style={styles.statusBadgeSmall}>
                  <Text style={styles.statusBadgeSmallText}>{cls.subject}</Text>
                </View>
              </View>
              <Text style={styles.cardItemMeta}>⏰ {cls.time}</Text>
              <Text style={styles.cardItemMeta}>📍 {cls.roomNumber}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                <Text style={styles.cardItemTeacher}>Faculty: {cls.teacherName}</Text>
                <Text style={[styles.cardItemTeacher, { color: "#16a34a", fontFamily: "outfit-bold" }]}>
                  {cls.attendanceMarked ? "Attendance Marked" : "Open"}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tab 2: Assignments */}
      {tab === "assignments" && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.actionHeaderBar}>
            <Text style={styles.tabHeading}>Assignments ({store.assignments.length})</Text>
            <TouchableOpacity
              style={styles.addBtnSmall}
              onPress={() => setShowCreateAsnModal(true)}
            >
              <Ionicons name="add" size={16} color={Colors.WHITE} />
              <Text style={styles.addBtnText}>+ New Assignment</Text>
            </TouchableOpacity>
          </View>

          {store.assignments.map((asn) => (
            <View key={asn.id} style={styles.cardItem}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cardItemTitle}>{asn.title}</Text>
                <View style={[styles.statusBadgeSmall, asn.status === "graded" && { backgroundColor: "#f0fdf4" }]}>
                  <Text style={[styles.statusBadgeSmallText, asn.status === "graded" && { color: "#16a34a" }]}>
                    {asn.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardItemMeta}>Deadline: {asn.deadline} • Total: {asn.totalMarks} Marks</Text>

              {asn.status === "submitted" && (
                <TouchableOpacity
                  style={styles.gradeActionBtn}
                  onPress={() => {
                    setGradingItem(asn);
                    setGradeMarks("");
                    setGradeFeedback("");
                  }}
                >
                  <Ionicons name="pencil" size={14} color={Colors.WHITE} />
                  <Text style={styles.gradeActionBtnText}>Grade Student Submission</Text>
                </TouchableOpacity>
              )}

              {asn.status === "graded" && (
                <View style={styles.gradedSummaryBox}>
                  <Text style={styles.gradedSummaryText}>
                    Graded: {asn.obtainedMarks}/{asn.totalMarks} • "{asn.teacherFeedback}"
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tab 3: Tests */}
      {tab === "tests" && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.actionHeaderBar}>
            <Text style={styles.tabHeading}>Tests & Question Banks</Text>
            <TouchableOpacity
              style={styles.addBtnSmall}
              onPress={() =>
                Alert.alert("New Test", "Create custom timed mock drill with auto-scoring.")
              }
            >
              <Ionicons name="add" size={16} color={Colors.WHITE} />
              <Text style={styles.addBtnText}>+ Create Test</Text>
            </TouchableOpacity>
          </View>

          {store.tests.map((tst) => (
            <View key={tst.id} style={styles.cardItem}>
              <Text style={styles.cardItemTitle}>{tst.title}</Text>
              <Text style={styles.cardItemMeta}>
                {tst.type} • {tst.totalQuestions} Questions • {tst.durationMinutes} Minutes
              </Text>
              <Text style={styles.cardItemMeta}>Pass Marks: {tst.passMarks} • Schedule: {tst.scheduledDate}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tab 4: Students Attendance & Performance */}
      {tab === "students" && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <Text style={styles.tabHeading}>Student Attendance & Performance</Text>
          <Text style={styles.tabSubheading}>Monitoring student attendance health & scores</Text>

          <View style={styles.perfOverviewCard}>
            <View style={styles.perfStat}>
              <Text style={styles.perfStatVal}>{store.attendance.overallPercentage}%</Text>
              <Text style={styles.perfStatLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfStat}>
              <Text style={styles.perfStatVal}>{store.performance.testAverageScore}%</Text>
              <Text style={styles.perfStatLabel}>Test Average</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfStat}>
              <Text style={styles.perfStatVal}>{store.performance.learningStreakDays}d</Text>
              <Text style={styles.perfStatLabel}>Avg Streak</Text>
            </View>
          </View>

          <Text style={[styles.tabHeading, { fontSize: 15, marginTop: 16 }]}>Subject Attendance Roster:</Text>
          {store.attendance.subjectWise.map((s, idx) => (
            <View key={idx} style={styles.rosterCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.rosterSubject}>{s.subject}</Text>
                <Text style={[styles.rosterPercent, s.percent < 75 && { color: "#dc2626" }]}>
                  {s.percent}%
                </Text>
              </View>
              <Text style={styles.rosterDetails}>
                {s.attended} of {s.total} sessions logged
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Create Class Modal */}
      <Modal visible={showCreateClassModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Schedule Live Class</Text>
              <TouchableOpacity onPress={() => setShowCreateClassModal(false)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Class Topic (e.g. Graph Algorithms)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newClassTitle}
              onChangeText={setNewClassTitle}
            />
            <TextInput
              placeholder="Subject (e.g. Computer Science)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newClassSubject}
              onChangeText={setNewClassSubject}
            />
            <TextInput
              placeholder="Time (e.g. Today, 5:00 PM - 6:30 PM)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newClassTime}
              onChangeText={setNewClassTime}
            />

            <View style={{ marginTop: 14 }}>
              <Button text="Publish Live Class" type="fill" onPress={handleCreateClass} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal visible={showCreateAsnModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Post New Assignment</Text>
              <TouchableOpacity onPress={() => setShowCreateAsnModal(false)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Assignment Title"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newAsnTitle}
              onChangeText={setNewAsnTitle}
            />
            <TextInput
              placeholder="Subject"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newAsnSubject}
              onChangeText={setNewAsnSubject}
            />
            <TextInput
              placeholder="Deadline (e.g. In 2 Days, 11:59 PM)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={newAsnDeadline}
              onChangeText={setNewAsnDeadline}
            />
            <TextInput
              placeholder="Total Marks (e.g. 25)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.modalInput}
              value={newAsnMarks}
              onChangeText={setNewAsnMarks}
            />

            <View style={{ marginTop: 14 }}>
              <Button text="Post Assignment" type="fill" onPress={handleCreateAssignment} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Grading Modal */}
      <Modal visible={!!gradingItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Grade Student Assignment</Text>
              <TouchableOpacity onPress={() => setGradingItem(null)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.gradeAsnName}>{gradingItem?.title}</Text>
            <Text style={styles.studentSubmittedText}>
              Student solution: "{gradingItem?.submissionContent || 'Solution uploaded'}"
            </Text>

            <TextInput
              placeholder={`Award Marks (out of ${gradingItem?.totalMarks})`}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.modalInput}
              value={gradeMarks}
              onChangeText={setGradeMarks}
            />
            <TextInput
              placeholder="Teacher Feedback & Comments..."
              placeholderTextColor="#9ca3af"
              style={[styles.modalInput, { height: 80 }]}
              multiline
              value={gradeFeedback}
              onChangeText={setGradeFeedback}
            />

            <View style={{ marginTop: 14 }}>
              <Button text="Submit Grade & Feedback" type="fill" onPress={handleGradeSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  headerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: "#1e293b",
  },
  headerSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  tabScrollRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  pillBtnActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  pillBtnText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#475569",
  },
  pillBtnTextActive: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
  },
  tabContent: {
    padding: 20,
    paddingBottom: 60,
  },
  actionHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  tabHeading: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: "#1e293b",
  },
  tabSubheading: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginBottom: 14,
  },
  addBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  cardItem: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  cardItemTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
    flex: 1,
    marginRight: 6,
  },
  statusBadgeSmall: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeSmallText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  cardItemMeta: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 4,
  },
  cardItemTeacher: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#475569",
  },
  gradeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 10,
  },
  gradeActionBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  gradedSummaryBox: {
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  gradedSummaryText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#166534",
  },
  perfOverviewCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.WHITE,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
    marginBottom: 14,
  },
  perfStat: {
    alignItems: "center",
  },
  perfStatVal: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: Colors.PRIMARY,
  },
  perfStatLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  perfDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e2e8f0",
  },
  rosterCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  rosterSubject: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  rosterPercent: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  rosterDetails: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  gradeAsnName: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
  },
  studentSubmittedText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginVertical: 8,
    fontStyle: "italic",
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    fontFamily: "outfit",
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 10,
  },
});
