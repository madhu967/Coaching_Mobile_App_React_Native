import React, { useState, useEffect, useCallback, useContext } from "react";
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
import { UserDetailContext } from "../../context/UserDetailContext";
import { useTheme } from "../../context/ThemeContext";
import { auth } from "../../config/firebaseConfig";
import { signOut } from "firebase/auth";

// High-resolution Unsplash covers matching coaching topics
const COURSE_COVERS = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=700&auto=format&fit=crop&q=80",
];

// Coaching Academic Categories (NO irrelevant UX/Marketing strings)
const CATEGORIES = [
  "All Tracks",
  "Computer Science",
  "Mobile Dev",
  "System Design",
  "AI & ML",
  "Personalized",
];

// Curated Coaching Masterclasses Catalog Fallback
const CURATED_COACHING_TRACKS = [
  {
    id: "curated-1",
    courseTitle: "Data Structures & Algorithms: Graphs & Dynamic Programming",
    category: "Computer Science",
    goal: "Ace Tech Interviews & Competitive Coding",
    topicCount: 8,
    isPersonalized: false,
    topics: [
      { id: "t1", title: "Asymptotic Notation & Space-Time Complexity" },
      { id: "t2", title: "Arrays, Hash Tables & Sliding Window Patterns" },
      { id: "t3", title: "Binary Trees, BST & Tree Traversals" },
      { id: "t4", title: "Graph Theory: BFS, DFS & Topological Sort" },
      { id: "t5", title: "Dynamic Programming: 1D & 2D Memoization" },
    ],
  },
  {
    id: "curated-2",
    courseTitle: "Advanced React Native & New Architecture Mastery",
    category: "Mobile Dev",
    goal: "Ship Scalable Cross-Platform Mobile Applications",
    topicCount: 6,
    isPersonalized: false,
    topics: [
      { id: "m1", title: "Expo Router: Nested Stack & Dynamic Routing" },
      { id: "m2", title: "Turbomodules & Fabric Renderer Deep Dive" },
      { id: "m3", title: "State Management with Context & AsyncStorage" },
      { id: "m4", title: "Fluid 60FPS Animations with Reanimated" },
    ],
  },
  {
    id: "curated-3",
    courseTitle: "Distributed Systems & Cloud Microservices Architecture",
    category: "System Design",
    goal: "Design Fault-Tolerant Systems for 10M+ Users",
    topicCount: 7,
    isPersonalized: false,
    topics: [
      { id: "s1", title: "Horizontal Scaling & Load Balancing Algorithms" },
      { id: "s2", title: "Database Sharding, Replication & CAP Theorem" },
      { id: "s3", title: "Event-Driven Architecture with Kafka & Queues" },
      { id: "s4", title: "Distributed Caching with Redis & CDN Layers" },
    ],
  },
  {
    id: "curated-4",
    courseTitle: "Foundational AI Engineering: Gemini API & LLM Agents",
    category: "AI & ML",
    goal: "Build Agentic AI Workflows & Structured Decoders",
    topicCount: 6,
    isPersonalized: false,
    topics: [
      { id: "a1", title: "Prompt Engineering & Few-Shot In-Context Learning" },
      { id: "a2", title: "Gemini Function Calling & Structured JSON Schemas" },
      { id: "a3", title: "Retrieval-Augmented Generation (RAG) Pipelines" },
      { id: "a4", title: "Multi-Agent Orchestration & Tool Execution" },
    ],
  },
];

const Explore = () => {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { themeMode, isIndigo, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(), [themeMode]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All Tracks");

  const fetchCourses = async () => {
    try {
      const data = await getAllCourses();
      if (data && data.length > 0) {
        setCourses(data);
      } else {
        setCourses(CURATED_COACHING_TRACKS);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
      setCourses(CURATED_COACHING_TRACKS);
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

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning,"
      : currentHour < 17
      ? "Good afternoon,"
      : "Good evening,";

  const userName =
    userDetail?.name ||
    userDetail?.email?.split("@")[0] ||
    "Scholar";

  const userInitial = userName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            if (setUserDetail) setUserDetail(null);
            router.replace("/");
          } catch (err) {
            router.replace("/");
          }
        },
      },
    ]);
  };

  const filteredCourses = courses.filter((c) => {
    if (activeCategory === "All Tracks") return true;
    if (activeCategory === "Personalized") return !!c.isPersonalized;
    const title = c.courseTitle?.toLowerCase() || "";
    const cat = c.category?.toLowerCase() || "";
    if (activeCategory === "Computer Science") {
      return title.includes("data") || title.includes("algorithm") || title.includes("computer") || cat.includes("computer");
    }
    if (activeCategory === "Mobile Dev") {
      return title.includes("react") || title.includes("mobile") || title.includes("native") || cat.includes("mobile");
    }
    if (activeCategory === "System Design") {
      return title.includes("system") || title.includes("architecture") || title.includes("microservice") || cat.includes("system");
    }
    if (activeCategory === "AI & ML") {
      return title.includes("ai") || title.includes("gemini") || title.includes("learning") || cat.includes("ai");
    }
    return true;
  });

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Big Display Title */}
      <View style={styles.headingSection}>
        <Text style={styles.displaySubHeading}>Coaching Curriculums</Text>
        <View style={styles.displayMainRow}>
          <Text style={styles.displayMainHeading}>All Courses</Text>
          <Text style={styles.superscriptBadge}>({courses.length})</Text>
        </View>
      </View>

      {/* Needs-Based Hero Banner with Electric Lime & Pitch Black Capsule */}
      <TouchableOpacity
        style={styles.heroGeneratorCard}
        onPress={() => router.push("/courses/personalized")}
        activeOpacity={0.92}
      >
        <View style={styles.heroGeneratorLeft}>
          <View style={styles.limeSparkBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.ON_ACCENT} />
            <Text style={styles.limeSparkText}>AI Needs-Based Engine</Text>
          </View>
          <Text style={styles.heroGeneratorTitle}>
            Build Custom Course{"\n"}Around Your Needs
          </Text>
          <Text style={styles.heroGeneratorSub}>
            Set Target Date, Goal & Daily Study Pacing
          </Text>
          <View style={styles.heroBlackBtn}>
            <Text style={styles.heroBlackBtnText}>Customize Now</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.WHITE} />
          </View>
        </View>

        <View style={styles.heroGeneratorRight}>
          <View style={styles.limeAuraCircle}>
            <Ionicons name="school" size={38} color={Colors.ON_ACCENT} />
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
          renderItem={({ item }) => {
            const isActive = activeCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(item)}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                activeOpacity={0.8}
              >
                {isActive && <View style={styles.activeLimeChipDot} />}
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );

  const renderCourseItem = ({ item, index }) => {
    const isExpanded = expandedCourseId === item.id;
    const topics = item.topics || [];
    const totalCount = item.topicCount || topics.length || 6;
    const completedList = Array.isArray(item.completedTopicIds)
      ? item.completedTopicIds
      : [];
    const completedCount = completedList.length;
    const progressPercent =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <View style={styles.courseCardWrapper}>
        <View style={styles.courseCard}>
          {/* Card Top Row: Badge Pill & Delete Action */}
          <View style={styles.courseCardTopRow}>
            {item.isPersonalized ? (
              <View style={styles.limePersonalizedPill}>
                <Ionicons name="sparkles" size={11} color={Colors.ON_ACCENT} />
                <Text style={styles.limePersonalizedText}>AI Tailored</Text>
              </View>
            ) : (
              <View style={styles.grayTrackPill}>
                <Ionicons name="book-outline" size={11} color={Colors.BLACK} />
                <Text style={styles.grayTrackText}>
                  {item.category || "Coaching Curriculum"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => handleDeleteCourse(item)}
              style={styles.trashCircleBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Title & Goal */}
          <Text style={styles.courseTitle} numberOfLines={2}>
            {item.courseTitle || "Untitled Course"}
          </Text>

          {item.goal ? (
            <View style={styles.goalRow}>
              <Text style={styles.goalText}>🎯 {item.goal}</Text>
            </View>
          ) : null}

          {/* Progress Bar & Metrics */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progressPercent || 25, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completedCount} / {totalCount} Done ({progressPercent}%)
            </Text>
          </View>

          {/* Card Bottom Action Buttons */}
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.viewCurriculumBtn}
              onPress={() => toggleExpand(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewCurriculumText}>
                {isExpanded ? "Hide Modules" : `Syllabus (${topics.length || totalCount})`}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={Colors.BLACK}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueBlackBtn}
              onPress={() => router.push("/Progress")}
              activeOpacity={0.88}
            >
              <Text style={styles.continueBlackBtnText}>Study</Text>
              <Ionicons name="arrow-forward" size={12} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>

          {/* Expanded Curriculum Topics Accordion */}
          {isExpanded && (
            <View style={styles.accordionContainer}>
              <Text style={styles.curriculumHeading}>Track Modules & Syllabus:</Text>
              {topics.map((t, idx) => {
                const isTopicDone = completedList.includes(t.id);
                return (
                  <View key={t.id || idx} style={styles.topicRow}>
                    <Ionicons
                      name={isTopicDone ? "checkmark-circle" : "ellipse-outline"}
                      size={17}
                      color={isTopicDone ? Colors.SUCCESS : Colors.MUTED}
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
      {/* Top Header Navbar — Full-bleed UI Theme Background */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeSub}>{greeting}</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.8}
            style={styles.themeToggleBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="color-palette"
              size={18}
              color={Colors.BLACK}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/Profile")}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{userInitial}</Text>
            </View>
            <View style={styles.activeLimeDot} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.logoutNavBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.BLACK} />
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          ListHeaderComponent={renderHeader}
          renderItem={renderCourseItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={48} color={Colors.MUTED} />
              <Text style={styles.emptyTitle}>No Tracks Found</Text>
              <Text style={styles.emptySubtitle}>
                No courses match "{activeCategory}". Generate a customized syllabus to your target!
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => router.push("/courses/personalized")}
              >
                <Text style={styles.emptyCreateBtnText}>✨ Generate Custom Course</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Explore;

const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.BG_LIGHT,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 110,
    },
    centerBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    listHeaderContainer: {
      marginBottom: 20,
    },

    /* Top Header Navbar — Full-bleed edge-to-edge UI Theme Background */
    topHeader: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: Colors.NAVBAR_BG,
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 42,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.NAVBAR_BORDER,
    },
    welcomeSub: {
      fontFamily: "outfit",
      fontSize: 13,
      color: Colors.ON_NAVBAR_SUB,
    },
    userNameText: {
      fontFamily: "outfit-bold",
      fontSize: 17,
      color: Colors.ON_NAVBAR || Colors.ON_ACCENT,
      marginTop: 1,
    },
    headerRightGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 0,
    },
    themeToggleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.WHITE,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: Colors.BLACK,
    },
    avatarWrapper: {
      position: "relative",
      marginLeft: 2,
    },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.BLACK,
  },
  avatarInitial: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.BLACK,
  },
  activeLimeDot: {
    position: "absolute",
    bottom: 0,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#16A34A",
    borderWidth: 2,
    borderColor: Colors.WHITE,
  },
  logoutNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: "rgba(13, 13, 13, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Display Headings */
  headingSection: {
    marginBottom: 14,
  },
  displaySubHeading: {
    fontFamily: "outfit",
    fontSize: 20,
    color: Colors.MUTED,
    letterSpacing: -0.4,
  },
  displayMainRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  displayMainHeading: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: Colors.BLACK,
    letterSpacing: -0.6,
  },
  superscriptBadge: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
  },

  /* Hero Generator Banner */
  heroGeneratorCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 26,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroGeneratorLeft: {
    flex: 1,
    paddingRight: 10,
  },
  limeSparkBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.LIME,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  limeSparkText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.ON_ACCENT,
  },
  heroGeneratorTitle: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: Colors.BLACK,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  heroGeneratorSub: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 4,
  },
  heroBlackBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
  },
  heroBlackBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.WHITE,
  },
  heroGeneratorRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  limeAuraCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.LIME,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Categories */
  categoryRow: {
    marginBottom: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    gap: 5,
  },
  categoryChipActive: {
    backgroundColor: Colors.BLACK,
    borderColor: Colors.BLACK,
  },
  activeLimeChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.LIME,
  },
  categoryChipText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.MUTED,
  },
  categoryChipTextActive: {
    fontFamily: "outfit-bold",
    color: Colors.WHITE,
  },

  /* Course Card */
  courseCardWrapper: {
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  courseCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  limePersonalizedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.LIME,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  limePersonalizedText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.ON_ACCENT,
  },
  grayTrackPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.CHIP_BG,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  grayTrackText: {
    fontFamily: "outfit-bold",
    fontSize: 10,
    color: Colors.BLACK,
  },
  trashCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  courseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.BLACK,
    letterSpacing: -0.3,
  },
  goalRow: {
    marginTop: 4,
  },
  goalText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.MUTED,
  },
  progressRow: {
    marginTop: 10,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.CHIP_BG,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.LIME,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER_LIGHT,
  },
  viewCurriculumBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewCurriculumText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.BLACK,
  },
  continueBlackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  continueBlackBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.WHITE,
  },

  /* Accordion */
  accordionContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER_LIGHT,
  },
  curriculumHeading: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.MUTED,
    letterSpacing: 0.5,
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
    color: Colors.BLACK,
  },
  topicTitleDone: {
    color: Colors.MUTED,
    textDecorationLine: "line-through",
  },
  topicDesc: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.MUTED,
    marginTop: 1,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.BLACK,
  },
  emptySubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.MUTED,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyCreateBtn: {
    backgroundColor: Colors.BLACK,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 10,
  },
  emptyCreateBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
});