import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
  Image,
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
    totalTopics > 0
      ? Math.round((completedTopics / totalTopics) * 100)
      : perf.courseCompletionPercent;

  return (
    <View style={styles.container}>
      {/* Top Header with Safe Top Padding to ensure title is fully visible */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Learning Analytics 📊</Text>
          <Text style={styles.headerSubtitle}>
            Curriculum mastery & overall academic standing
          </Text>
        </View>

        <TouchableOpacity
          style={styles.aiHelpBtn}
          onPress={() => router.push("/ai")}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="sparkles" size={14} color={Colors.WHITE} />
          <Text style={styles.aiHelpBtnText}>AI Tutor</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.PRIMARY]}
          />
        }
      >
        {/* ===============================================================
            HERO METRIC BANNER WITH BACKGROUND IMAGE (Non-clipping)
            =============================================================== */}
        <View style={styles.heroBanner}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&auto=format&fit=crop&q=80",
            }}
            style={styles.heroBannerImage}
          />
          <View style={styles.heroBannerOverlay} />
          <View style={styles.heroBannerContent}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>
                🔥 {perf.learningStreakDays} Days Consistent
              </Text>
            </View>
            <Text style={styles.heroBigPercentage}>
              {courseCompletionCalculated}%
            </Text>
            <Text style={styles.heroSubHeading}>Total Syllabus Mastered</Text>
            <Text style={styles.heroQuote}>
              "You are ahead of 84% of learners this semester!"
            </Text>
          </View>
        </View>

        {/* ===============================================================
            4-PILLAR KPI METRICS GRID
            =============================================================== */}
        <View style={styles.pillarGrid}>
          {/* 1. Course Completion */}
          <View style={styles.pillarCard}>
            <View style={[styles.pillarIcon, { backgroundColor: Colors.PRIMARY_LIGHT }]}>
              <Ionicons name="book" size={18} color={Colors.PRIMARY} />
            </View>
            <Text style={styles.pillarValue}>{courseCompletionCalculated}%</Text>
            <Text style={styles.pillarLabel}>Course Mastery</Text>
          </View>

          {/* 2. Test Performance */}
          <View style={styles.pillarCard}>
            <View style={[styles.pillarIcon, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="ribbon" size={18} color="#16a34a" />
            </View>
            <Text style={[styles.pillarValue, { color: "#16a34a" }]}>
              {perf.testAverageScore}%
            </Text>
            <Text style={styles.pillarLabel}>Test Accuracy</Text>
          </View>

          {/* 3. Live Attendance */}
          <View style={styles.pillarCard}>
            <View style={[styles.pillarIcon, { backgroundColor: "#f0f9ff" }]}>
              <Ionicons name="calendar" size={18} color="#0284c7" />
            </View>
            <Text style={[styles.pillarValue, { color: "#0284c7" }]}>
              {perf.attendancePercent}%
            </Text>
            <Text style={styles.pillarLabel}>Attendance</Text>
          </View>

          {/* 4. Assignments */}
          <View style={styles.pillarCard}>
            <View style={[styles.pillarIcon, { backgroundColor: "#fff7ed" }]}>
              <Ionicons name="document-text" size={18} color="#ea580c" />
            </View>
            <Text style={[styles.pillarValue, { color: "#ea580c" }]}>
              {perf.assignmentCompletionPercent}%
            </Text>
            <Text style={styles.pillarLabel}>Assignments</Text>
          </View>
        </View>

        {/* ===============================================================
            SUBJECT PROFICIENCY (Strong & Weak Topics)
            =============================================================== */}
        <View style={styles.proficiencyCard}>
          <Text style={styles.cardSectionTitle}>Subject Proficiency Analysis</Text>

          {/* Strong Subjects */}
          <View style={styles.subjectGroup}>
            <View style={styles.groupHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.strongHeading}>Strong Mastery Subjects:</Text>
            </View>
            {perf.strongSubjects?.map((s, idx) => (
              <View key={idx} style={styles.strongPill}>
                <Text style={styles.strongPillText}>⭐ {s}</Text>
              </View>
            ))}
          </View>

          {/* Weak Subjects */}
          <View style={[styles.subjectGroup, { marginTop: 14 }]}>
            <View style={styles.groupHeader}>
              <Ionicons name="alert-circle" size={16} color="#ea580c" />
              <Text style={styles.weakHeading}>Areas Needing Attention:</Text>
            </View>
            {perf.weakSubjects?.map((w, idx) => (
              <View key={idx} style={styles.weakPill}>
                <Text style={styles.weakPillText}>⚠️ {w}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.aiSolveWeakBtn}
            onPress={() => router.push("/ai")}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={16} color={Colors.WHITE} />
            <Text style={styles.aiSolveWeakBtnText}>
              Strengthen Weak Topics with AI Doubts
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===============================================================
            CURRICULUM MODULES & TOPIC PROGRESS CHECKLIST
            =============================================================== */}
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionHeaderTitle}>
            Curriculum Modules Checklist ({courses.length})
          </Text>

          {courses.length === 0 ? (
            <View style={styles.emptyCoursesCard}>
              <Ionicons name="book-outline" size={38} color={Colors.LIGHT_GRAY} />
              <Text style={styles.emptyCoursesTitle}>No Active Curriculum</Text>
              <Text style={styles.emptyCoursesSub}>
                Build your customized syllabus to begin tracking topic completions.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/courses/personalized")}
                style={styles.createTrackBtn}
              >
                <Text style={styles.createTrackBtnText}>+ Build My Curriculum</Text>
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

              return (
                <View key={item.id} style={styles.curriculumCourseCard}>
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedCourseId(isExpanded ? null : item.id)
                    }
                    style={styles.curriculumHeader}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.curriculumTitle} numberOfLines={1}>
                        {item.courseTitle}
                      </Text>
                      <Text style={styles.curriculumMeta}>
                        {completed} of {total} topics finished ({percent}%)
                      </Text>
                    </View>

                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={Colors.GRAY}
                    />
                  </TouchableOpacity>

                  {/* Progress Line */}
                  <View style={styles.courseProgressTrack}>
                    <View
                      style={[
                        styles.courseProgressFill,
                        { width: `${Math.min(percent, 100)}%` },
                      ]}
                    />
                  </View>

                  {/* Interactive Topics List */}
                  {isExpanded && (
                    <View style={styles.topicsWrapper}>
                      {topics.map((t, idx) => {
                        const isDone = completedList.includes(t.id);
                        return (
                          <TouchableOpacity
                            key={t.id || idx}
                            onPress={() => handleToggleTopic(item.id, t.id)}
                            style={styles.topicCheckItem}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={
                                isDone ? "checkmark-circle" : "ellipse-outline"
                              }
                              size={20}
                              color={isDone ? "#16a34a" : Colors.LIGHT_GRAY}
                              style={{ marginTop: 2 }}
                            />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text
                                style={[
                                  styles.topicCheckText,
                                  isDone && styles.topicCheckTextDone,
                                ]}
                              >
                                {idx + 1}. {t.title}
                              </Text>
                              {t.description ? (
                                <Text
                                  style={styles.topicCheckDesc}
                                  numberOfLines={2}
                                >
                                  {t.description}
                                </Text>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE, // Pure white background
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 46,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER_LIGHT,
    backgroundColor: Colors.WHITE,
  },
  headerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.BLACK,
  },
  headerSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  aiHelpBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  aiHelpBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Hero Banner - Responsive Height with no clipping */
  heroBanner: {
    minHeight: 160,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: Colors.DARK,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroBannerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(79, 70, 229, 0.90)", // Modern Indigo Wash
  },
  heroBannerContent: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  streakBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 6,
  },
  streakBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.WHITE,
  },
  heroBigPercentage: {
    fontFamily: "outfit-bold",
    fontSize: 44,
    color: Colors.WHITE,
    lineHeight: 50,
  },
  heroSubHeading: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.WHITE,
    marginTop: 2,
  },
  heroQuote: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 6,
    textAlign: "center",
  },

  /* 4 Pillars Grid */
  pillarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  },
  pillarCard: {
    width: "48%",
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pillarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pillarValue: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: Colors.BLACK,
  },
  pillarLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },

  /* Proficiency Card */
  proficiencyCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSectionTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
    marginBottom: 12,
  },
  subjectGroup: {
    gap: 6,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  strongHeading: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#16a34a",
  },
  strongPill: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  strongPillText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#15803d",
  },
  weakHeading: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#ea580c",
  },
  weakPill: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  weakPillText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#c2410c",
  },
  aiSolveWeakBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
    marginTop: 14,
  },
  aiSolveWeakBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.WHITE,
  },

  /* Section Header */
  sectionHeaderTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.BLACK,
    marginBottom: 12,
  },
  emptyCoursesCard: {
    backgroundColor: Colors.BG_GRAY,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  emptyCoursesTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
    marginTop: 8,
  },
  emptyCoursesSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 4,
  },
  createTrackBtn: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
  },
  createTrackBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },

  /* Curriculum Course Card */
  curriculumCourseCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  curriculumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  curriculumTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
  },
  curriculumMeta: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  courseProgressTrack: {
    height: 6,
    backgroundColor: Colors.BORDER_LIGHT,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 10,
  },
  courseProgressFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  topicsWrapper: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER_LIGHT,
  },
  topicCheckItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  topicCheckText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.DARK,
  },
  topicCheckTextDone: {
    textDecorationLine: "line-through",
    color: Colors.LIGHT_GRAY,
  },
  topicCheckDesc: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
});