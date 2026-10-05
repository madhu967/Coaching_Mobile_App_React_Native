import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { getAllCourses, toggleTopicCompletion } from "../../services/courseStorage";
import { getLmsStore } from "../../services/lmsStore";
import Button from "../../components/Shared/Button";

export default function PerformanceScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [lmsStore, setLmsStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  const fetchPerformanceData = async () => {
    try {
      const [courseData, storeData] = await Promise.all([
        getAllCourses(),
        getLmsStore(),
      ]);
      setCourses(courseData || []);
      setLmsStore(storeData || null);

      if (courseData && courseData.length > 0 && !expandedCourseId) {
        setExpandedCourseId(courseData[0].id);
      }
    } catch (err) {
      console.error("Failed to load performance data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPerformanceData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPerformanceData();
  };

  const handleToggleTopic = async (courseId, topicId) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === courseId) {
          const current = Array.isArray(c.completedTopicIds)
            ? [...c.completedTopicIds]
            : [];
          const idx = current.indexOf(topicId);
          if (idx > -1) {
            current.splice(idx, 1);
          } else {
            current.push(topicId);
          }
          return { ...c, completedTopicIds: current };
        }
        return c;
      })
    );

    await toggleTopicCompletion(courseId, topicId);
  };

  // Performance calculations
  const perf = lmsStore?.performance || {
    courseCompletionPercent: 74,
    testAverageScore: 88,
    attendancePercent: 92,
    assignmentCompletionPercent: 67,
    learningStreakDays: 6,
    strongSubjects: ["Computer Science (DSA)", "Software Architecture"],
    weakSubjects: ["Artificial Intelligence (Needs practice in prompt tuning)"],
  };

  let totalTopics = 0;
  let completedTopics = 0;
  courses.forEach((c) => {
    const list = Array.isArray(c.completedTopicIds) ? c.completedTopicIds : [];
    totalTopics += c.topics?.length || c.topicCount || 0;
    completedTopics += list.length;
  });

  const courseCompletionCalculated =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : perf.courseCompletionPercent;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Performance & Analytics</Text>
          <Text style={styles.headerSubtitle}>Complete overview of your learning journey</Text>
        </View>
        <TouchableOpacity
          style={styles.streakBadge}
          onPress={() => router.push("/ai")}
        >
          <Ionicons name="flame" size={18} color="#ea580c" />
          <Text style={styles.streakBadgeText}>{perf.learningStreakDays}d Streak</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={{ marginTop: 12, color: Colors.GRAY, fontFamily: "outfit" }}>
            Analyzing performance...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
          }
        >
          {/* STEP 9: Overall Progress Hero Banner */}
          <View style={styles.overallHeroBanner}>
            <Text style={styles.heroBannerTitle}>Overall Learning Progress</Text>
            <Text style={styles.heroBannerSubtitle}>
              Continuous progress tracked across coursework, tests, assignments & attendance.
            </Text>

            {/* 4 Pillars of Performance */}
            <View style={styles.pillarsGrid}>
              {/* 1. Course Completion */}
              <View style={styles.pillarBox}>
                <Ionicons name="book-outline" size={18} color={Colors.PRIMARY} />
                <Text style={styles.pillarVal}>{courseCompletionCalculated}%</Text>
                <Text style={styles.pillarLabel}>Course Completion</Text>
              </View>

              {/* 2. Test Performance */}
              <View style={styles.pillarBox}>
                <Ionicons name="ribbon-outline" size={18} color="#16a34a" />
                <Text style={[styles.pillarVal, { color: "#16a34a" }]}>{perf.testAverageScore}%</Text>
                <Text style={styles.pillarLabel}>Test Performance</Text>
              </View>

              {/* 3. Attendance */}
              <View style={styles.pillarBox}>
                <Ionicons name="calendar-outline" size={18} color="#0284c7" />
                <Text style={[styles.pillarVal, { color: "#0284c7" }]}>{perf.attendancePercent}%</Text>
                <Text style={styles.pillarLabel}>Attendance</Text>
              </View>

              {/* 4. Assignment Completion */}
              <View style={styles.pillarBox}>
                <Ionicons name="document-text-outline" size={18} color="#ea580c" />
                <Text style={[styles.pillarVal, { color: "#ea580c" }]}>{perf.assignmentCompletionPercent}%</Text>
                <Text style={styles.pillarLabel}>Assignments</Text>
              </View>
            </View>
          </View>

          {/* STEP 9: Strong & Weak Subjects */}
          <View style={styles.subjectsSectionCard}>
            <Text style={styles.subjectCardHeading}>Subject Proficiency Analysis</Text>

            {/* Strong Subjects */}
            <View style={styles.subjectBox}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.strongLabel}>Strong Subjects (Mastery):</Text>
              </View>
              {perf.strongSubjects?.map((s, idx) => (
                <View key={idx} style={styles.subjectPillGreen}>
                  <Text style={styles.subjectPillGreenText}>⭐ {s}</Text>
                </View>
              ))}
            </View>

            {/* Weak Subjects */}
            <View style={[styles.subjectBox, { marginTop: 12 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Ionicons name="alert-circle" size={16} color="#ea580c" />
                <Text style={styles.weakLabel}>Areas for Improvement:</Text>
              </View>
              {perf.weakSubjects?.map((w, idx) => (
                <View key={idx} style={styles.subjectPillOrange}>
                  <Text style={styles.subjectPillOrangeText}>⚠️ {w}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.aiSolveWeakBtn}
              onPress={() => router.push("/ai")}
            >
              <Ionicons name="sparkles" size={16} color={Colors.PRIMARY} />
              <Text style={styles.aiSolveWeakBtnText}>
                Use AI Doubt Solver to Reinforce Weak Topics
              </Text>
            </TouchableOpacity>
          </View>

          {/* Enrolled Courses & Topic Progress */}
          <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
            Course Curriculum Progress ({courses.length})
          </Text>

          {courses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={44} color={Colors.GRAY} />
              <Text style={styles.emptyTitle}>No Courses Enrolled</Text>
              <TouchableOpacity
                onPress={() => router.push("/courses/personalized")}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>+ Create Personalized Course</Text>
              </TouchableOpacity>
            </View>
          ) : (
            courses.map((item) => {
              const isExpanded = expandedCourseId === item.id;
              const topics = item.topics || [];
              const completedList = Array.isArray(item.completedTopicIds)
                ? item.completedTopicIds
                : [];
              const total = topics.length;
              const completed = completedList.length;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
              const isFinished = total > 0 && completed >= total;

              return (
                <View key={item.id} style={styles.courseCard}>
                  <TouchableOpacity
                    onPress={() => setExpandedCourseId(isExpanded ? null : item.id)}
                    style={styles.courseCardHeader}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={styles.courseTitle} numberOfLines={1}>
                          {item.courseTitle}
                        </Text>
                        <View style={[styles.statusTag, isFinished ? styles.statusTagDone : styles.statusTagActive]}>
                          <Text style={[styles.statusTagText, isFinished ? { color: "#16a34a" } : { color: Colors.PRIMARY }]}>
                            {isFinished ? "Completed" : "In Progress"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${percent}%` }, isFinished && { backgroundColor: "#16a34a" }]} />
                      </View>

                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        <Text style={styles.progressStatText}>
                          {completed} of {total} topics completed
                        </Text>
                        <Text style={[styles.progressPercentText, isFinished && { color: "#16a34a" }]}>
                          {percent}%
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Checklist */}
                  {isExpanded && (
                    <View style={styles.checklistContainer}>
                      <Text style={styles.checklistHeader}>
                        Tap topic to toggle completion:
                      </Text>
                      {topics.map((t, tIdx) => {
                        const isDone = completedList.includes(t.id);
                        return (
                          <TouchableOpacity
                            key={t.id || tIdx}
                            onPress={() => handleToggleTopic(item.id, t.id)}
                            style={[styles.topicCheckItem, isDone && styles.topicCheckItemDone]}
                          >
                            <Ionicons
                              name={isDone ? "checkmark-circle" : "ellipse-outline"}
                              size={20}
                              color={isDone ? "#16a34a" : "#aaa"}
                            />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={[styles.topicTitleText, isDone && styles.topicTitleDone]}>
                                {tIdx + 1}. {t.title}
                              </Text>
                              {t.description ? (
                                <Text style={styles.topicDescText}>{t.description}</Text>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
    paddingBottom: 14,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  headerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: "#1e293b",
  },
  headerSubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffedd5",
    gap: 4,
  },
  streakBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#ea580c",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overallHeroBanner: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  heroBannerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: Colors.WHITE,
  },
  heroBannerSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 3,
    lineHeight: 16,
  },
  pillarsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  pillarBox: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  pillarVal: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: "#1e293b",
    marginTop: 4,
  },
  pillarLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
    textAlign: "center",
  },
  subjectsSectionCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  subjectCardHeading: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 12,
  },
  subjectBox: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  strongLabel: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#166534",
  },
  weakLabel: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#c2410c",
  },
  subjectPillGreen: {
    backgroundColor: "#f0fdf4",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  subjectPillGreenText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#166534",
  },
  subjectPillOrange: {
    backgroundColor: "#fff7ed",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  subjectPillOrangeText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#c2410c",
  },
  aiSolveWeakBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  aiSolveWeakBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  sectionHeading: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: "#1e293b",
    marginBottom: 12,
  },
  courseCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  courseCardHeader: {},
  courseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
    flex: 1,
    marginRight: 6,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagActive: {
    backgroundColor: "#eff6ff",
  },
  statusTagDone: {
    backgroundColor: "#f0fdf4",
  },
  statusTagText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  progressStatText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  progressPercentText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  checklistContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  checklistHeader: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#475569",
    marginBottom: 8,
  },
  topicCheckItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  topicCheckItemDone: {
    backgroundColor: "#f0fdf4",
  },
  topicTitleText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  topicTitleDone: {
    color: "#64748b",
    textDecorationLine: "line-through",
  },
  topicDescText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 15,
  },
  emptyCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  emptyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
    marginTop: 10,
  },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.WHITE,
  },
});