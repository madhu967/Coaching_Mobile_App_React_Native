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
import { getLmsStore, submitAssignment } from "../../services/lmsStore";

export default function AssignmentsScreen() {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'submitted' | 'graded'
  const [refreshing, setRefreshing] = useState(false);

  // Submit Modal
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAssignments = async () => {
    try {
      const store = await getLmsStore();
      setAssignments(store.assignments || []);
    } catch (e) {
      console.error("Assignments load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAssignments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignments();
  };

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      Alert.alert("Empty Submission", "Please enter your assignment text or link.");
      return;
    }

    setSubmitting(true);
    try {
      await submitAssignment(activeModalItem.id, submissionText.trim());
      Alert.alert("Success 🎉", "Assignment submitted to teacher for grading!");
      setActiveModalItem(null);
      setSubmissionText("");
      loadAssignments();
    } catch (e) {
      Alert.alert("Error", "Could not submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = assignments.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const pendingCount = assignments.filter((a) => a.status === "pending").length;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignments</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{pendingCount} Due</Text>
        </View>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All" },
          { key: "pending", label: `Pending (${pendingCount})` },
          { key: "submitted", label: "Submitted" },
          { key: "graded", label: "Graded" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
        }
        renderItem={({ item }) => {
          const isPending = item.status === "pending";
          const isSubmitted = item.status === "submitted";
          const isGraded = item.status === "graded";

          return (
            <View style={styles.assignmentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.subjectPill}>
                  <Text style={styles.subjectPillText}>{item.subject}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    isPending && styles.statusPillPending,
                    isSubmitted && styles.statusPillSubmitted,
                    isGraded && styles.statusPillGraded,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isPending && { color: "#ea580c" },
                      isSubmitted && { color: Colors.PRIMARY },
                      isGraded && { color: "#16a34a" },
                    ]}
                  >
                    {isPending ? "Pending" : isSubmitted ? "Under Review" : "Graded"}
                  </Text>
                </View>
              </View>

              <Text style={styles.asnTitle}>{item.title}</Text>
              <Text style={styles.asnDesc}>{item.description}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="alarm-outline" size={15} color={isPending ? "#ea580c" : Colors.GRAY} />
                <Text style={[styles.metaText, isPending && { color: "#ea580c", fontFamily: "outfit-bold" }]}>
                  Deadline: {item.deadline}
                </Text>
              </View>

              {/* Graded Details */}
              {isGraded && (
                <View style={styles.gradeBox}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.gradeLabel}>Marks Obtained:</Text>
                    <Text style={styles.gradeVal}>
                      {item.obtainedMarks} / {item.totalMarks}
                    </Text>
                  </View>
                  {item.teacherFeedback ? (
                    <View style={styles.feedbackBox}>
                      <Text style={styles.feedbackTitle}>Teacher Feedback:</Text>
                      <Text style={styles.feedbackText}>{item.teacherFeedback}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Submitted Details */}
              {isSubmitted && (
                <View style={styles.submittedInfoBox}>
                  <Ionicons name="checkmark-done" size={16} color={Colors.PRIMARY} />
                  <Text style={styles.submittedInfoText}>
                    Submitted: {item.submittedAt || "Recently"}
                  </Text>
                </View>
              )}

              {/* Action Button */}
              {isPending && (
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => {
                    setActiveModalItem(item);
                    setSubmissionText("");
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={Colors.WHITE} />
                  <Text style={styles.submitBtnText}>Submit Assignment</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Submission Modal */}
      <Modal visible={!!activeModalItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Submit Assignment</Text>
              <TouchableOpacity onPress={() => setActiveModalItem(null)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {activeModalItem?.title}
            </Text>

            <Text style={styles.inputLabel}>Enter code solution, GitHub URL, or answer:</Text>
            <TextInput
              placeholder="Paste your GitHub repository link or write your solution text here..."
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              multiline
              numberOfLines={6}
              value={submissionText}
              onChangeText={setSubmissionText}
            />

            <View style={{ marginTop: 16 }}>
              <Button
                text="Submit to Teacher"
                type="fill"
                onPress={handleSubmit}
                loading={submitting}
              />
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
  pendingBadge: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#ea580c",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    fontSize: 12,
    color: "#475569",
  },
  filterTabTextActive: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
  },
  assignmentCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectPill: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillPending: {
    backgroundColor: "#fff7ed",
  },
  statusPillSubmitted: {
    backgroundColor: "#eff6ff",
  },
  statusPillGraded: {
    backgroundColor: "#f0fdf4",
  },
  statusPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
  },
  asnTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 4,
  },
  asnDesc: {
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
    marginBottom: 12,
  },
  metaText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#475569",
  },
  gradeBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  gradeLabel: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#166534",
  },
  gradeVal: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#16a34a",
  },
  feedbackBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(22, 163, 74, 0.2)",
  },
  feedbackTitle: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#166534",
  },
  feedbackText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#14532d",
    marginTop: 2,
    lineHeight: 16,
  },
  submittedInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10,
  },
  submittedInfoText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.WHITE,
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
  modalSubtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#334155",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    height: 120,
    textAlignVertical: "top",
    fontFamily: "outfit",
    fontSize: 14,
    color: "#1e293b",
  },
});
