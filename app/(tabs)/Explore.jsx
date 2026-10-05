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

    return (
      <View style={styles.cardContainer}>
        {/* Card Header */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleExpand(item.id)}
          style={styles.cardHeader}
        >
          <View style={styles.iconBox}>
            <Ionicons name="book" size={26} color={Colors.PRIMARY} />
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

            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Ionicons name="layers-outline" size={13} color={Colors.PRIMARY} />
                <Text style={styles.badgeText}>
                  {item.topicCount || item.topics?.length || 0} Topics
                </Text>
              </View>

              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expandable Topic List */}
        {isExpanded && (
          <View style={styles.topicList}>
            <Text style={styles.topicHeaderTitle}>Course Curriculum:</Text>
            {item.topics && item.topics.length > 0 ? (
              item.topics.map((topic, tIndex) => (
                <View key={topic.id || tIndex} style={styles.topicItem}>
                  <View style={styles.topicIndexBadge}>
                    <Text style={styles.topicIndexText}>{tIndex + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.topicItemTitle}>{topic.title}</Text>
                    {topic.description ? (
                      <Text style={styles.topicItemDesc}>{topic.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))
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
          onPress={() => router.push("/AddCourse")}
          style={styles.addCourseHeaderBtn}
        >
          <Ionicons name="add" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>

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
            Start your learning journey by generating your first AI-powered course!
          </Text>
          <View style={{ width: "100%", marginTop: 20 }}>
            <Button
              text={"+ Create Your First Course"}
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
});

export default Explore;