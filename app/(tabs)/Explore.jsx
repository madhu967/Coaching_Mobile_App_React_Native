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
  StatusBar,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { getAllCourses, removeCourse } from "../../services/courseStorage";
import Button from "../../components/Shared/Button";

// High-resolution Unsplash course covers
const COURSE_COVERS = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=700&auto=format&fit=crop&q=80",
];

const CATEGORIES = ["All Courses", "Personalized", "In Progress", "Completed"];

const Explore = () => {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All Courses");

  const fetchCourses = async () => {
    try {
      const data = await getAllCourses();
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
      `Are you sure you want to remove "${course.courseTitle}"?`,
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

  const filteredCourses = courses.filter((c) => {
    if (activeCategory === "Personalized") return !!c.isPersonalized;
    const completedList = Array.isArray(c.completedTopicIds) ? c.completedTopicIds : [];
    const totalCount = c.topics?.length || c.topicCount || 0;
    if (activeCategory === "Completed") return totalCount > 0 && completedList.length >= totalCount;
    if (activeCategory === "In Progress") return completedList.length > 0 && completedList.length < totalCount;
    return true;
  });

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Featured AI Generator Hero Banner */}
      <TouchableOpacity
        style={styles.heroBanner}
        onPress={() => router.push("/courses/personalized")}
        activeOpacity={0.9}
      >
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=900&auto=format&fit=crop&q=80",
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroPill}>
            <Ionicons name="sparkles" size={12} color={Colors.WHITE} />
            <Text style={styles.heroPillText}>Needs-Based Generator</Text>
          </View>
          <Text style={styles.heroTitle}>Build a Course to Your Needs</Text>
          <Text style={styles.heroSub}>
            Set your Goal, Skill Level, Study Time & Target Date
          </Text>
          <View style={styles.heroCtaRow}>
            <Text style={styles.heroCtaText}>Start Customizing</Text>
            <Ionicons name="arrow-forward-circle" size={16} color={Colors.WHITE} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Category Pills Filter */}
      <View style={styles.categoryRow}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveCategory(item)}
              style={[
                styles.categoryChip,
                activeCategory === item && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  activeCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Section Subheading */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>
          {activeCategory} ({filteredCourses.length})
        </Text>
      </View>
    </View>
  );

  const renderCourseItem = ({ item, index }) => {
    const isExpanded = expandedCourseId === item.id;
    const coverUri =
      item.coverImage || COURSE_COVERS[index % COURSE_COVERS.length];

    const topics = item.topics || [];
    const totalCount = item.topicCount || topics.length || 0;
    const completedList = Array.isArray(item.completedTopicIds)
      ? item.completedTopicIds
      : [];
    const completedCount = completedList.length;
    const progressPercent =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <View style={styles.courseCard}>
        {/* Cover Image Header with Badges (Zero text cramming) */}
        <View style={styles.cardCoverContainer}>
          <Image
            source={{ uri: coverUri }}
            style={styles.cardCoverImage}
            resizeMode="cover"
          />
          <View style={styles.cardCoverOverlay} />

          <View style={styles.cardCoverTopRow}>
            {item.isPersonalized ? (
              <View style={styles.personalizedPill}>
                <Ionicons name="sparkles" size={11} color={Colors.WHITE} />
                <Text style={styles.personalizedPillText}>AI Customized</Text>
              </View>
            ) : (
              <View style={styles.standardPill}>
                <Ionicons name="book" size={11} color={Colors.WHITE} />
                <Text style={styles.standardPillText}>Fast Track</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => handleDeleteCourse(item)}
              style={styles.deleteBtnCircle}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Body - Completely spacious with clear hierarchy */}
        <View style={styles.cardBody}>
          <Text style={styles.cardCourseTitle} numberOfLines={2}>
            {item.courseTitle || "Untitled Course"}
          </Text>

          {item.goal ? (
            <View style={styles.goalContainer}>
              <Ionicons name="disc-outline" size={13} color={Colors.PRIMARY} />
              <Text style={styles.cardCourseGoal} numberOfLines={1}>
                {item.goal}
              </Text>
            </View>
          ) : null}

          {/* Meta metrics badges */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="layers-outline" size={13} color={Colors.PRIMARY} />
              <Text style={styles.metaBadgeText}>{totalCount} Modules</Text>
            </View>

            <View style={[styles.metaBadge, styles.metaBadgeDone]}>
              <Ionicons name="checkmark-done" size={13} color="#16a34a" />
              <Text style={[styles.metaBadgeText, { color: "#16a34a" }]}>
                {completedCount} Done
              </Text>
            </View>

            <View style={[styles.metaBadge, styles.metaBadgeProgress]}>
              <Ionicons name="trending-up" size={13} color={Colors.DARK} />
              <Text style={[styles.metaBadgeText, { color: Colors.DARK }]}>
                {progressPercent}%
              </Text>
            </View>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
          </View>

          {/* Action Footer */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.toggleTopicsBtn}
              onPress={() => toggleExpand(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.toggleTopicsText}>
                {isExpanded ? "Hide Curriculum" : `Curriculum (${topics.length || totalCount})`}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={15}
                color={Colors.PRIMARY}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.studyNowBtn}
              onPress={() => router.push("/Progress")}
              activeOpacity={0.85}
            >
              <Text style={styles.studyNowBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>

          {/* Expanded Curriculum Topics Accordion */}
          {isExpanded && (
            <View style={styles.accordionContainer}>
              <Text style={styles.curriculumHeading}>Course Modules & Lessons:</Text>
              {topics.map((t, idx) => {
                const isTopicDone = completedList.includes(t.id);
                return (
                  <View key={t.id || idx} style={styles.topicRow}>
                    <Ionicons
                      name={isTopicDone ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={isTopicDone ? "#16a34a" : Colors.LIGHT_GRAY}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[
                          styles.topicTitle,
                          isTopicDone && styles.topicTitleDone,
                        ]}
                      >
                        {idx + 1}. {t.title}
                      </Text>
                      {t.description ? (
                        <Text style={styles.topicDesc} numberOfLines={2}>
                          {t.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header - Safe Area for Android & iOS */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Course Explorer 📚</Text>
          <Text style={styles.headerSubtitle}>
            Curated curriculums & personalized learning paths
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addCourseHeaderBtn}
          onPress={() => router.push("/courses/personalized")}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="sparkles" size={14} color={Colors.WHITE} />
          <Text style={styles.addCourseHeaderText}>Personalize</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={{ marginTop: 12, color: Colors.GRAY, fontFamily: "outfit" }}>
            Loading your courses...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          ListHeaderComponent={renderHeader}
          renderItem={renderCourseItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={60} color={Colors.LIGHT_GRAY} />
              <Text style={styles.emptyTitle}>No Courses Found</Text>
              <Text style={styles.emptySubtitle}>
                No courses under "{activeCategory}". Generate a customized syllabus tailored to your exact study goals!
              </Text>
              <View style={{ width: "100%", marginTop: 20, gap: 10 }}>
                <Button
                  text="✨ Create Course Based on Needs"
                  type="fill"
                  onPress={() => router.push("/courses/personalized")}
                />
                <Button
                  text="+ Quick AI Course"
                  type="outline"
                  onPress={() => router.push("/addCourse")}
                />
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

export default Explore;

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
  addCourseHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 5,
  },
  addCourseHeaderText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },

  listHeaderContainer: {
    paddingTop: 14,
  },

  /* Hero Banner */
  heroBanner: {
    height: 140,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Colors.DARK,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  heroContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
  },
  heroPillText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.WHITE,
  },
  heroTitle: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: Colors.WHITE,
  },
  heroSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 3,
  },
  heroCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  heroCtaText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },

  /* Category Filter */
  categoryRow: {
    paddingVertical: 14,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.BG_GRAY,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
  },
  categoryChipActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  categoryChipText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.GRAY,
  },
  categoryChipTextActive: {
    color: Colors.WHITE,
  },

  sectionHeaderRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionHeading: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  /* Course Card */
  courseCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCoverContainer: {
    height: 110,
    justifyContent: "flex-start",
    padding: 12,
    backgroundColor: Colors.DARK,
  },
  cardCoverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  cardCoverTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  personalizedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  personalizedPillText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.WHITE,
  },
  standardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0284c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  standardPillText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.WHITE,
  },
  deleteBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Card Body */
  cardBody: {
    padding: 14,
  },
  cardCourseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#0f172a",
    lineHeight: 22,
  },
  goalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    marginBottom: 8,
  },
  cardCourseGoal: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.PRIMARY,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.BG_GRAY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaBadgeDone: {
    backgroundColor: "#f0fdf4",
  },
  metaBadgeProgress: {
    backgroundColor: "#f8fafc",
  },
  metaBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.GRAY,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.BORDER_LIGHT,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  toggleTopicsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toggleTopicsText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  studyNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  studyNowBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },

  /* Accordion */
  accordionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER_LIGHT,
  },
  curriculumHeading: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.BLACK,
    marginBottom: 8,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  topicTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.DARK,
  },
  topicTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.GRAY,
  },
  topicDesc: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 1,
  },

  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  emptyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.BLACK,
    marginTop: 12,
  },
  emptySubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});