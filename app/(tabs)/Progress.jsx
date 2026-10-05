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
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { getAllCourses, toggleTopicCompletion } from "../../services/courseStorage";
import Button from "../../components/Shared/Button";

const Progress = () => {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  const fetchCourses = async () => {
    try {
      const data = await getAllCourses();
      setCourses(data || []);
      // Auto-expand first course by default if none expanded
      if (data && data.length > 0 && !expandedCourseId) {
        setExpandedCourseId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load courses for progress:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const handleToggleTopic = async (courseId, topicId) => {
    // 1. Optimistic instant local state update
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

    // 2. Persist to storage
    await toggleTopicCompletion(courseId, topicId);
  };

  // Calculate Overall Progress Metrics
  let totalTopicsCount = 0;
  let totalCompletedTopicsCount = 0;
  let completedCoursesCount = 0;

  courses.forEach((c) => {
    const topicCount = c.topics?.length || c.topicCount || 0;
    const completedList = Array.isArray(c.completedTopicIds)
      ? c.completedTopicIds
      : [];
    totalTopicsCount += topicCount;
    totalCompletedTopicsCount += completedList.length;
    if (topicCount > 0 && completedList.length >= topicCount) {
      completedCoursesCount += 1;
    }
  });

  const overallPercent =
    totalTopicsCount > 0
      ? Math.round((totalCompletedTopicsCount / totalTopicsCount) * 100)
      : 0;

  const renderCourseItem = ({ item }) => {
    const isExpanded = expandedCourseId === item.id;
    const topics = item.topics || [];
    const completedList = Array.isArray(item.completedTopicIds)
      ? item.completedTopicIds
      : [];
    const total = topics.length;
    const completed = completedList.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isCourseFinished = total > 0 && completed >= total;

    return (
      <View style={styles.courseCard}>
        {/* Course Card Header */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            setExpandedCourseId(isExpanded ? null : item.id)
          }
          style={styles.cardHeader}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.courseTitle} numberOfLines={1}>
                {item.courseTitle || "Course"}
              </Text>
              <View
                style={[
                  styles.statusTag,
                  isCourseFinished
                    ? styles.statusTagCompleted
                    : completed > 0
                    ? styles.statusTagInProgress
                    : styles.statusTagNotStarted,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    isCourseFinished
                      ? { color: "#237804" }
                      : completed > 0
                      ? { color: Colors.PRIMARY }
                      : { color: "#888" },
                  ]}
                >
                  {isCourseFinished
                    ? "Completed"
                    : completed > 0
                    ? "In Progress"
                    : "Not Started"}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${percent}%` },
                  isCourseFinished && { backgroundColor: "#52c41a" },
                ]}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={styles.progressStatText}>
                {completed} of {total} topics completed
              </Text>
              <Text style={[styles.progressPercentText, isCourseFinished && { color: "#52c41a" }]}>
                {percent}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expandable Topics Checklist */}
        {isExpanded && (
          <View style={styles.topicChecklistContainer}>
            <Text style={styles.checklistHeader}>
              Curriculum Checklist (tap to mark complete):
            </Text>

            {topics.map((topic, tIndex) => {
              const isTopicDone = completedList.includes(topic.id);
              return (
                <TouchableOpacity
                  key={topic.id || tIndex}
                  onPress={() => handleToggleTopic(item.id, topic.id)}
                  style={[
                    styles.topicCheckItem,
                    isTopicDone && styles.topicCheckItemDone,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isTopicDone ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={isTopicDone ? "#52c41a" : "#aaa"}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[
                        styles.topicCheckTitle,
                        isTopicDone && styles.topicCheckTitleDone,
                      ]}
                    >
                      {tIndex + 1}. {topic.title}
                    </Text>
                    {topic.description ? (
                      <Text
                        style={[
                          styles.topicCheckDesc,
                          isTopicDone && { color: "#aaa" },
                        ]}
                      >
                        {topic.description}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Card Footer Toggle */}
        <TouchableOpacity
          onPress={() =>
            setExpandedCourseId(isExpanded ? null : item.id)
          }
          style={styles.cardFooter}
        >
          <Text style={styles.footerToggleText}>
            {isExpanded ? "Hide Topics Checklist" : "Manage Topics Progress"}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.PRIMARY}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Progress</Text>
        <Text style={styles.headerSubtitle}>
          Track your progress and complete course topics
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={{ marginTop: 12, color: Colors.GRAY, fontFamily: "outfit" }}>
            Loading progress...
          </Text>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={70} color={Colors.GRAY} />
          <Text style={styles.emptyTitle}>No Active Courses</Text>
          <Text style={styles.emptySubtitle}>
            Create your first AI course to start tracking your learning progress!
          </Text>
          <View style={{ width: "100%", marginTop: 24 }}>
            <Button
              text={"+ Create A Course"}
              type="fill"
              onPress={() => router.push("/AddCourse")}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderCourseItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            /* Overall Stats Card */
            <View style={styles.overallBanner}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={styles.overallTitle}>Overall Completion</Text>
                  <Text style={styles.overallSubtitle}>
                    {overallPercent === 100
                      ? "Awesome! All courses completed! 🏆"
                      : overallPercent > 0
                      ? "Keep going, great momentum! 🚀"
                      : "Start checking off your topics! 🎯"}
                  </Text>
                </View>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentBadgeText}>{overallPercent}%</Text>
                </View>
              </View>

              {/* Overall Progress Bar */}
              <View style={styles.overallBarTrack}>
                <View
                  style={[
                    styles.overallBarFill,
                    { width: `${overallPercent}%` },
                  ]}
                />
              </View>

              {/* Quick Metrics */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{courses.length}</Text>
                  <Text style={styles.metricLabel}>Courses</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{totalCompletedTopicsCount}</Text>
                  <Text style={styles.metricLabel}>Topics Done</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricVal}>{completedCoursesCount}</Text>
                  <Text style={styles.metricLabel}>Finished</Text>
                </View>
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.PRIMARY]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 26,
    color: "#111",
  },
  headerSubtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 2,
  },
  overallBanner: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  overallTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.WHITE,
  },
  overallSubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  percentBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.WHITE,
  },
  overallBarTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },
  overallBarFill: {
    height: "100%",
    backgroundColor: Colors.WHITE,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  metricItem: {
    alignItems: "center",
  },
  metricVal: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.WHITE,
  },
  metricLabel: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  courseCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eaeaea",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  courseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#222",
    flex: 1,
    marginRight: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTagCompleted: {
    backgroundColor: "#f6ffed",
    borderColor: "#b7eb8f",
    borderWidth: 1,
  },
  statusTagInProgress: {
    backgroundColor: "#e6f7ff",
    borderColor: "#91d5ff",
    borderWidth: 1,
  },
  statusTagNotStarted: {
    backgroundColor: "#f5f5f5",
    borderColor: "#d9d9d9",
    borderWidth: 1,
  },
  statusTagText: {
    fontFamily: "outfit",
    fontSize: 11,
    fontWeight: "bold",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 4,
  },
  progressStatText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  progressPercentText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.PRIMARY,
  },
  topicChecklistContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  checklistHeader: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#555",
    marginBottom: 10,
  },
  topicCheckItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    marginBottom: 8,
  },
  topicCheckItemDone: {
    backgroundColor: "#f6ffed",
  },
  topicCheckTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#333",
  },
  topicCheckTitleDone: {
    color: "#888",
    textDecorationLine: "line-through",
  },
  topicCheckDesc: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f7f7f7",
    gap: 4,
  },
  footerToggleText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.PRIMARY,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    marginTop: 16,
    color: "#333",
  },
  emptySubtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});

export default Progress;