import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { getAllCourses, removeCourse } from "../../services/courseStorage";
import Button from "../../components/Shared/Button";

const Explore = () => {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  const fetchCourses = async () => {
    try {
      const data = await getAllCourses();
      console.log("📚 Loaded courses count in Explore:", data?.length);
      setCourses(data || []);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Re-fetch automatically every time the user taps or focuses on Explore tab
  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const toggleExpand = (courseId) => {
    setExpandedCourseId(expandedCourseId === courseId ? null : courseId);
  };

  const handleDeleteCourse = (course) => {
    Alert.alert(
      "Delete Course",
      `Are you sure you want to delete "${course.courseTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeCourse(course.id);
            setCourses((prev) => prev.filter((c) => c.id !== course.id));
          },
        },
      ]
    );
  };

  const renderCourseItem = ({ item, index }) => {
    const isExpanded = expandedCourseId === item.id;
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent";

    const topics = item.topics || [];
    const totalCount = item.topicCount || topics.length || 0;
    const completedList = Array.isArray(item.completedTopicIds) ? item.completedTopicIds : [];
    const completedCount = completedList.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <View style={styles.cardContainer}>
        {/* Personalized Course Badge if created via Needs Generator */}
        {item.isPersonalized && (
          <View style={styles.personalizedTrackBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.PRIMARY} />
            <Text style={styles.personalizedTrackBadgeText}>Personalized Needs-Based Track</Text>
            {item.targetTimeline ? (
              <Text style={styles.personalizedTimelineText}>• {item.targetTimeline}</Text>
            ) : null}
          </View>
        )}

        {/* Card Header */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleExpand(item.id)}
          style={styles.cardHeader}
        >
          <View style={styles.iconBox}>
            <Ionicons name={item.isPersonalized ? "ribbon" : "book"} size={26} color={Colors.PRIMARY} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.courseTitle} numberOfLines={1}>
                {item.courseTitle || "Untitled Course"}
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteCourse(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color="#ff4d4f" />
              </TouchableOpacity>
            </View>

            {item.goal ? (
              <Text style={styles.goalSnippetText} numberOfLines={1}>
                🎯 Goal: {item.goal}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Ionicons name="layers-outline" size={13} color={Colors.PRIMARY} />
                <Text style={styles.badgeText}>
                  {totalCount} Topics
                </Text>
              </View>

              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Learning Progress Bar */}
        <View style={styles.courseProgressSection}>
          <View style={styles.courseProgressTrack}>
            <View style={[styles.courseProgressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={styles.courseProgressSubtext}>
              {completedCount} of {totalCount} topics mastered
            </Text>
            <Text style={styles.courseProgressPercent}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Expandable Topic List */}
        {isExpanded && (
          <View style={styles.topicList}>
            <Text style={styles.topicHeaderTitle}>Course Curriculum:</Text>
            {topics && topics.length > 0 ? (
              topics.map((topic, tIndex) => {
                const isTopicDone = completedList.includes(topic.id);
                return (
                  <View key={topic.id || tIndex} style={styles.topicItem}>
                    <View style={[styles.topicIndexBadge, isTopicDone && { backgroundColor: "#16a34a" }]}>
                      {isTopicDone ? (
                        <Ionicons name="checkmark" size={12} color={Colors.WHITE} />
                      ) : (
                        <Text style={styles.topicIndexText}>{tIndex + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.topicItemTitle, isTopicDone && { textDecorationLine: "line-through", color: "#64748b" }]}>
                        {topic.title}
                      </Text>
                      {topic.description ? (
                        <Text style={styles.topicItemDesc}>{topic.description}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyTopicsText}>No topic details available.</Text>
            )}
          </View>
        )}

        {/* Card Footer Toggle */}
        <TouchableOpacity
          onPress={() => toggleExpand(item.id)}
          style={styles.cardFooter}
        >
          <Text style={styles.footerToggleText}>
            {isExpanded ? "Hide Curriculum" : "View Curriculum"}
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore Courses</Text>
          <Text style={styles.headerSubtitle}>
            Browse and manage all your created courses
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/courses/personalized")}
          style={styles.addCourseHeaderBtn}
        >
          <Ionicons name="sparkles" size={20} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Hero Banner: Create Course Based on Needs */}
      <TouchableOpacity
        style={styles.needsBanner}
        onPress={() => router.push("/courses/personalized")}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.needsBannerTag}>
            <Ionicons name="sparkles" size={11} color={Colors.PRIMARY} />
            <Text style={styles.needsBannerTagText}>Step 3 Unique Feature</Text>
          </View>
          <Text style={styles.needsBannerTitle}>Create Course Based on Your Needs</Text>
          <Text style={styles.needsBannerDesc}>
            Select your Goal, Skill Level, Study Time & Target Date
          </Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={28} color={Colors.PRIMARY} />
      </TouchableOpacity>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={{ marginTop: 12, color: Colors.GRAY, fontFamily: "outfit" }}>
            Loading courses...
          </Text>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="compass-outline" size={70} color={Colors.GRAY} />
          <Text style={styles.emptyTitle}>No Courses Created Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start your learning journey by generating your custom needs-based course!
          </Text>
          <View style={{ width: "100%", marginTop: 20, gap: 10 }}>
            <Button
              text={"✨ Create Course Based on Your Needs"}
              type="fill"
              onPress={() => router.push("/courses/personalized")}
            />
            <Button
              text={"+ Quick AI Course"}
              type="outline"
              onPress={() => router.push("/addCourse")}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderCourseItem}
          contentContainerStyle={{ paddingBottom: 40 }}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  addCourseHeaderBtn: {
    backgroundColor: Colors.PRIMARY,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardContainer: {
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
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#e8f2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  courseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#222",
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#edf4ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.PRIMARY,
    fontWeight: "600",
  },
  dateText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#999",
  },
  topicList: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  topicHeaderTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#444",
    marginBottom: 10,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    backgroundColor: "#fbfbfb",
    padding: 10,
    borderRadius: 10,
  },
  topicIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  topicIndexText: {
    color: Colors.WHITE,
    fontSize: 11,
    fontWeight: "bold",
  },
  topicItemTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#333",
  },
  topicItemDesc: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    lineHeight: 16,
  },
  emptyTopicsText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
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
  needsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    elevation: 2,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  needsBannerTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 6,
    gap: 4,
  },
  needsBannerTagText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.PRIMARY,
  },
  needsBannerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
  },
  needsBannerDesc: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  personalizedTrackBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
    gap: 4,
  },
  personalizedTrackBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  personalizedTimelineText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
  },
  goalSnippetText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#475569",
    marginTop: 3,
  },
  courseProgressSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  courseProgressTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  courseProgressFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  courseProgressSubtext: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
  },
  courseProgressPercent: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
});

export default Explore;