import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { getAllCourses, removeCourse } from "../../services/courseStorage";
import { isAdminLoggedIn, logoutAdmin, getAdminCredentials } from "../../services/adminAuth";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  const router = useRouter();
  const creds = getAdminCredentials();

  // Navigation tab state: 'overview' | 'students' | 'courses' | 'settings'
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Expansion states
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [expandedStudentEmail, setExpandedStudentEmail] = useState(null);

  // Load all data
  const loadAllData = async () => {
    try {
      const isAuth = await isAdminLoggedIn();
      if (!isAuth) {
        router.replace("/admin");
        return;
      }

      // 1. Fetch courses
      const courseList = await getAllCourses();
      setCourses(courseList || []);

      // 2. Fetch users from Firestore with a 2-second timeout
      let userListFromDb = [];
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2000)
        );
        const snapshot = await Promise.race([
          getDocs(collection(db, "users")),
          timeoutPromise,
        ]);
        snapshot.forEach((doc) => {
          userListFromDb.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        // Fallback gracefully if Firestore is not available
      }

      // 3. Aggregate unique students from Firestore users + course creators
      const studentMap = new Map();

      // Seed from Firestore users
      userListFromDb.forEach((u) => {
        if (u.email) {
          studentMap.set(u.email.toLowerCase(), {
            email: u.email,
            name: u.name || u.email.split("@")[0],
            courses: [],
          });
        }
      });

      // Group courses under their creators
      (courseList || []).forEach((c) => {
        const email = (c.userEmail || "guest@coachingapp.com").toLowerCase();
        if (!studentMap.has(email)) {
          studentMap.set(email, {
            email: c.userEmail || email,
            name: (c.userEmail || "Guest Student").split("@")[0],
            courses: [],
          });
        }
        studentMap.get(email).courses.push(c);
      });

      // Format student list with metrics
      const aggregatedStudents = Array.from(studentMap.values()).map((s) => {
        let studentTotalTopics = 0;
        let studentCompletedTopics = 0;

        s.courses.forEach((c) => {
          const tCount = c.topics?.length || c.topicCount || 0;
          const cCount = Array.isArray(c.completedTopicIds)
            ? c.completedTopicIds.length
            : 0;
          studentTotalTopics += tCount;
          studentCompletedTopics += cCount;
        });

        const progressPercent =
          studentTotalTopics > 0
            ? Math.round((studentCompletedTopics / studentTotalTopics) * 100)
            : 0;

        return {
          ...s,
          totalCourses: s.courses.length,
          totalTopics: studentTotalTopics,
          completedTopics: studentCompletedTopics,
          progressPercent,
        };
      });

      // Sort students by most active (most courses created)
      aggregatedStudents.sort((a, b) => b.totalCourses - a.totalCourses);
      setStudents(aggregatedStudents);
    } catch (e) {
      console.error("Admin dashboard data load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Admin Logout
  const handleAdminLogout = () => {
    Alert.alert("Admin Logout", "Are you sure you want to log out of Admin Console?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logoutAdmin();
          router.replace("/admin");
        },
      },
    ]);
  };

  // Delete Course
  const handleDeleteCourse = (course) => {
    Alert.alert(
      "Delete Course",
      `Are you sure you want to delete "${course.courseTitle}" permanently?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeCourse(course.id);
            setCourses((prev) => prev.filter((c) => c.id !== course.id));
            loadAllData();
            Alert.alert("Success", "Course was permanently removed.");
          },
        },
      ]
    );
  };

  // Metrics
  const totalCoursesCount = courses.length;
  const totalStudentsCount = students.length;
  let totalTopicsCreated = 0;
  courses.forEach((c) => {
    totalTopicsCreated += c.topics?.length || c.topicCount || 0;
  });

  const top5Students = students.slice(0, 5);

  // Filter courses for Courses tab
  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.courseTitle?.toLowerCase().includes(q) ||
      c.userEmail?.toLowerCase().includes(q)
    );
  });

  // Filter students for Students tab
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  /* =======================================================================
     TAB 1: OVERVIEW SCREEN
     ======================================================================= */
  const renderOverviewTab = () => (
    <ScrollView
      contentContainerStyle={styles.scrollTabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
      }
    >
      {/* Welcome Admin Banner */}
      <View style={styles.adminHeroCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroPillBadge}>
              <Ionicons name="shield-checkmark" size={13} color={Colors.WHITE} />
              <Text style={styles.heroPillText}>Administrator Portal</Text>
            </View>
            <Text style={styles.heroTitle}>Platform Overview</Text>
            <Text style={styles.heroSubtitle}>
              Monitoring all courses, students, and curriculum activity
            </Text>
          </View>
          <TouchableOpacity
            style={styles.heroLogoutBtn}
            onPress={handleAdminLogout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.WHITE} />
          </TouchableOpacity>
        </View>

        {/* 3 Key Metrics Cards inside Banner */}
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>{totalCoursesCount}</Text>
            <Text style={styles.heroStatLabel}>Total Courses</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>{totalStudentsCount}</Text>
            <Text style={styles.heroStatLabel}>Students</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>{totalTopicsCreated}</Text>
            <Text style={styles.heroStatLabel}>Curriculums</Text>
          </View>
        </View>
      </View>

      {/* Top 5 Students Section */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionHeading}>Top Students</Text>
          <Text style={styles.sectionSubheading}>Most active course creators</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setActiveTab("students");
            setSearchQuery("");
          }}
          style={styles.seeMoreBtn}
        >
          <Text style={styles.seeMoreBtnText}>View All ({students.length})</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {top5Students.length === 0 ? (
        <View style={styles.emptyCardBox}>
          <Ionicons name="people-outline" size={36} color={Colors.GRAY} />
          <Text style={styles.emptyCardText}>No students recorded yet.</Text>
        </View>
      ) : (
        top5Students.map((student, idx) => (
          <TouchableOpacity
            key={student.email || idx}
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab("students");
              setExpandedStudentEmail(student.email);
            }}
            style={styles.studentRankCard}
          >
            {/* Rank badge */}
            <View style={[styles.rankBadge, idx === 0 && { backgroundColor: "#ffd700" }]}>
              <Text style={[styles.rankBadgeText, idx === 0 && { color: "#854d0e" }]}>
                #{idx + 1}
              </Text>
            </View>

            {/* Avatar Circle */}
            <View style={styles.studentAvatarCircle}>
              <Text style={styles.studentAvatarInitial}>
                {student.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.studentNameText} numberOfLines={1}>
                {student.name}
              </Text>
              <Text style={styles.studentEmailText} numberOfLines={1}>
                {student.email}
              </Text>
            </View>

            {/* Courses and Progress */}
            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.courseCountPill}>
                <Ionicons name="book-outline" size={12} color={Colors.PRIMARY} />
                <Text style={styles.courseCountPillText}>
                  {student.totalCourses} {student.totalCourses === 1 ? "Course" : "Courses"}
                </Text>
              </View>
              <Text style={styles.studentProgressText}>
                {student.progressPercent}% Finished
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Recent Created Courses Feed */}
      <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
        <View>
          <Text style={styles.sectionHeading}>Recent Courses</Text>
          <Text style={styles.sectionSubheading}>Latest AI generated curriculums</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setActiveTab("courses");
            setSearchQuery("");
          }}
          style={styles.seeMoreBtn}
        >
          <Text style={styles.seeMoreBtnText}>View All ({courses.length})</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {courses.slice(0, 3).map((course, idx) => (
        <View key={course.id || idx} style={styles.recentCourseCard}>
          <View style={styles.recentCourseIcon}>
            <Ionicons name="book" size={20} color={Colors.PRIMARY} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.recentCourseTitle} numberOfLines={1}>
              {course.courseTitle}
            </Text>
            <Text style={styles.recentCourseCreator} numberOfLines={1}>
              Creator: {course.userEmail}
            </Text>
          </View>
          <View style={styles.recentCourseBadge}>
            <Text style={styles.recentCourseBadgeText}>
              {course.topicCount || course.topics?.length || 0} Topics
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  /* =======================================================================
     TAB 2: STUDENTS DIRECTORY SCREEN
     ======================================================================= */
  const renderStudentsTab = () => (
    <View style={{ flex: 1 }}>
      {/* Search Bar */}
      <View style={styles.tabSearchBox}>
        <Ionicons name="search" size={18} color={Colors.GRAY} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search students by name or email..."
          placeholderTextColor="#9ca3af"
          style={styles.tabSearchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={Colors.GRAY} />
          </TouchableOpacity>
        )}
      </View>

      {filteredStudents.length === 0 ? (
        <View style={styles.emptyCenterContainer}>
          <Ionicons name="people-outline" size={54} color={Colors.GRAY} />
          <Text style={styles.emptyTitle}>No Students Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? "Try a different search query." : "No registered students yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.email}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
          }
          renderItem={({ item, index }) => {
            const isExpanded = expandedStudentEmail === item.email;
            return (
              <View style={styles.studentFullCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setExpandedStudentEmail(isExpanded ? null : item.email)
                  }
                  style={styles.studentFullCardHeader}
                >
                  <View style={styles.studentAvatarCircleLarge}>
                    <Text style={styles.studentAvatarInitialLarge}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.studentNameTitle}>{item.name}</Text>
                    <Text style={styles.studentEmailSubtitle}>{item.email}</Text>

                    <View style={styles.studentMetaRow}>
                      <View style={styles.badgePillSmall}>
                        <Ionicons name="book-outline" size={12} color={Colors.PRIMARY} />
                        <Text style={styles.badgePillSmallText}>
                          {item.totalCourses} {item.totalCourses === 1 ? "Course" : "Courses"}
                        </Text>
                      </View>
                      <View style={[styles.badgePillSmall, { backgroundColor: "#f0fdf4" }]}>
                        <Ionicons name="checkmark-circle-outline" size={12} color="#16a34a" />
                        <Text style={[styles.badgePillSmallText, { color: "#16a34a" }]}>
                          {item.progressPercent}% Completed
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Colors.GRAY}
                  />
                </TouchableOpacity>

                {/* Expanded Student Courses */}
                {isExpanded && (
                  <View style={styles.studentCoursesContainer}>
                    <Text style={styles.studentCoursesSectionTitle}>
                      Courses Created by {item.name}:
                    </Text>

                    {item.courses.length === 0 ? (
                      <Text style={styles.noCoursesForStudentText}>
                        This student hasn't created any courses yet.
                      </Text>
                    ) : (
                      item.courses.map((c, cIdx) => {
                        const totalT = c.topics?.length || c.topicCount || 0;
                        const compT = Array.isArray(c.completedTopicIds)
                          ? c.completedTopicIds.length
                          : 0;
                        const pct = totalT > 0 ? Math.round((compT / totalT) * 100) : 0;

                        return (
                          <View key={c.id || cIdx} style={styles.studentSubCourseCard}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                              <Text style={styles.studentSubCourseTitle} numberOfLines={1}>
                                {c.courseTitle}
                              </Text>
                              <Text style={styles.studentSubCourseProgress}>
                                {pct}% Done
                              </Text>
                            </View>

                            <View style={styles.subCourseProgressBar}>
                              <View style={[styles.subCourseProgressFill, { width: `${pct}%` }]} />
                            </View>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                              <Text style={styles.subCourseTopicsCount}>
                                {compT} / {totalT} topics completed
                              </Text>
                              <Text style={styles.subCourseDate}>
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent"}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );

  /* =======================================================================
     TAB 3: COURSES MANAGEMENT SCREEN
     ======================================================================= */
  const renderCoursesTab = () => (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={styles.tabSearchBox}>
        <Ionicons name="search" size={18} color={Colors.GRAY} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search courses or creators..."
          placeholderTextColor="#9ca3af"
          style={styles.tabSearchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={Colors.GRAY} />
          </TouchableOpacity>
        )}
      </View>

      {filteredCourses.length === 0 ? (
        <View style={styles.emptyCenterContainer}>
          <Ionicons name="book-outline" size={54} color={Colors.GRAY} />
          <Text style={styles.emptyTitle}>No Courses Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? "No courses match your search." : "No courses created in the app yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
          }
          renderItem={({ item }) => {
            const isExpanded = expandedCourseId === item.id;
            const topics = item.topics || [];
            const completedCount = Array.isArray(item.completedTopicIds)
              ? item.completedTopicIds.length
              : 0;

            return (
              <View style={styles.courseManageCard}>
                <View style={styles.courseManageHeader}>
                  <View style={styles.courseManageIcon}>
                    <Ionicons name="book" size={22} color={Colors.PRIMARY} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={styles.courseManageTitle} numberOfLines={1}>
                        {item.courseTitle}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteCourse(item)}
                        style={styles.deleteIconButton}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.courseCreatorRow}>
                      <Ionicons name="person-circle-outline" size={14} color={Colors.GRAY} />
                      <Text style={styles.courseCreatorText} numberOfLines={1}>
                        Created by: {item.userEmail || "guest"}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                      <View style={styles.badgePillSmall}>
                        <Ionicons name="layers-outline" size={12} color={Colors.PRIMARY} />
                        <Text style={styles.badgePillSmallText}>
                          {item.topicCount || topics.length} Topics
                        </Text>
                      </View>
                      <Text style={styles.courseCreatedDateText}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Expandable Curriculum */}
                {isExpanded && (
                  <View style={styles.courseCurriculumDrawer}>
                    <Text style={styles.drawerTitle}>Curriculum Breakdown:</Text>
                    {topics.length > 0 ? (
                      topics.map((t, idx) => (
                        <View key={t.id || idx} style={styles.drawerTopicRow}>
                          <View style={styles.drawerTopicBadge}>
                            <Text style={styles.drawerTopicBadgeNum}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.drawerTopicTitle}>{t.title}</Text>
                            {t.description ? (
                              <Text style={styles.drawerTopicDesc}>{t.description}</Text>
                            ) : null}
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: Colors.GRAY, fontStyle: "italic", fontSize: 12 }}>
                        No curriculum topics listed.
                      </Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setExpandedCourseId(isExpanded ? null : item.id)}
                  style={styles.courseDrawerToggle}
                >
                  <Text style={styles.courseDrawerToggleText}>
                    {isExpanded ? "Hide Curriculum" : "Inspect Curriculum"}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={15}
                    color={Colors.PRIMARY}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );

  /* =======================================================================
     TAB 4: SETTINGS & ACCOUNT SCREEN
     ======================================================================= */
  const renderSettingsTab = () => (
    <ScrollView contentContainerStyle={styles.scrollTabContent}>
      {/* Admin Profile Box */}
      <View style={styles.settingsProfileCard}>
        <View style={styles.settingsAvatarCircle}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.WHITE} />
        </View>
        <Text style={styles.settingsAdminName}>System Administrator</Text>
        <Text style={styles.settingsAdminEmail}>{creds.email}</Text>
        <View style={styles.activeStatusPill}>
          <View style={styles.greenDot} />
          <Text style={styles.activeStatusText}>Admin Session Authenticated</Text>
        </View>
      </View>

      {/* System Information Card */}
      <View style={styles.settingsSectionCard}>
        <Text style={styles.settingsSectionHeading}>System Health & Configuration</Text>

        <View style={styles.settingsInfoRow}>
          <Text style={styles.settingsInfoLabel}>Admin Email (.env)</Text>
          <Text style={styles.settingsInfoVal}>{creds.email}</Text>
        </View>

        <View style={styles.settingsInfoRow}>
          <Text style={styles.settingsInfoLabel}>AI Engine</Text>
          <Text style={[styles.settingsInfoVal, { color: "#16a34a" }]}>Gemini 3.8 Flash (Active)</Text>
        </View>

        <View style={styles.settingsInfoRow}>
          <Text style={styles.settingsInfoLabel}>Database</Text>
          <Text style={[styles.settingsInfoVal, { color: "#16a34a" }]}>Connected (Cloud + Local)</Text>
        </View>

        <View style={[styles.settingsInfoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.settingsInfoLabel}>App Build</Text>
          <Text style={styles.settingsInfoVal}>Coaching Guru v1.0.0</Text>
        </View>
      </View>

      {/* Logout Action */}
      <View style={[styles.settingsSectionCard, { marginTop: 16 }]}>
        <Text style={styles.settingsSectionHeading}>Session Controls</Text>
        <Text style={styles.settingsSectionDesc}>
          To return to the student application, securely log out from this admin session.
        </Text>

        <TouchableOpacity style={styles.bigLogoutBtn} onPress={handleAdminLogout}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.bigLogoutBtnText}>Log Out of Admin Console</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      {/* Top Header */}
      <View style={styles.topHeaderBar}>
        <View>
          <Text style={styles.topHeaderTitle}>Admin Console</Text>
          <Text style={styles.topHeaderSubtitle}>Coaching Guru Management</Text>
        </View>

        <TouchableOpacity style={styles.topLogoutIcon} onPress={handleAdminLogout}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.emptyCenterContainer}>
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
            <Text style={{ marginTop: 12, color: Colors.GRAY, fontFamily: "outfit" }}>
              Loading admin dashboard...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === "overview" && renderOverviewTab()}
            {activeTab === "students" && renderStudentsTab()}
            {activeTab === "courses" && renderCoursesTab()}
            {activeTab === "settings" && renderSettingsTab()}
          </>
        )}
      </View>

      {/* Modern Admin Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => {
            setActiveTab("overview");
            setSearchQuery("");
          }}
        >
          <Ionicons
            name={activeTab === "overview" ? "grid" : "grid-outline"}
            size={22}
            color={activeTab === "overview" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabBarLabel,
              activeTab === "overview" && styles.tabBarLabelActive,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => {
            setActiveTab("students");
            setSearchQuery("");
          }}
        >
          <Ionicons
            name={activeTab === "students" ? "people" : "people-outline"}
            size={23}
            color={activeTab === "students" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabBarLabel,
              activeTab === "students" && styles.tabBarLabelActive,
            ]}
          >
            Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => {
            setActiveTab("courses");
            setSearchQuery("");
          }}
        >
          <Ionicons
            name={activeTab === "courses" ? "book" : "book-outline"}
            size={22}
            color={activeTab === "courses" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabBarLabel,
              activeTab === "courses" && styles.tabBarLabelActive,
            ]}
          >
            Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          onPress={() => {
            setActiveTab("settings");
            setSearchQuery("");
          }}
        >
          <Ionicons
            name={activeTab === "settings" ? "settings" : "settings-outline"}
            size={22}
            color={activeTab === "settings" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabBarLabel,
              activeTab === "settings" && styles.tabBarLabelActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  topHeaderBar: {
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
  topHeaderTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: "#1e293b",
  },
  topHeaderSubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
  },
  topLogoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  scrollTabContent: {
    padding: 20,
    paddingBottom: 100,
  },
  adminHeroCard: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  heroPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
    gap: 5,
  },
  heroPillText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  heroTitle: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: Colors.WHITE,
  },
  heroSubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  heroLogoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
  },
  heroStatItem: {
    alignItems: "center",
  },
  heroStatVal: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.WHITE,
  },
  heroStatLabel: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  sectionSubheading: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 1,
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  seeMoreBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.PRIMARY,
  },
  studentRankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  rankBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#64748b",
  },
  studentAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e8f2ff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  studentAvatarInitial: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.PRIMARY,
  },
  studentNameText: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
  },
  studentEmailText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  courseCountPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#edf4ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  courseCountPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  studentProgressText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#16a34a",
    marginTop: 4,
    fontWeight: "600",
  },
  recentCourseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  recentCourseIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#e8f2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  recentCourseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  recentCourseCreator: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  recentCourseBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentCourseBadgeText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  tabSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  tabSearchInput: {
    flex: 1,
    fontFamily: "outfit",
    fontSize: 14,
    color: "#1e293b",
  },
  studentFullCard: {
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
  studentFullCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatarCircleLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e8f2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  studentAvatarInitialLarge: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.PRIMARY,
  },
  studentNameTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
  },
  studentEmailSubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 1,
  },
  studentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  badgePillSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#edf4ff",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  badgePillSmallText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.PRIMARY,
    fontWeight: "600",
  },
  studentCoursesContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  studentCoursesSectionTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
  },
  noCoursesForStudentText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    fontStyle: "italic",
    paddingVertical: 4,
  },
  studentSubCourseCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  studentSubCourseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  studentSubCourseProgress: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#16a34a",
  },
  subCourseProgressBar: {
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    marginTop: 6,
    overflow: "hidden",
  },
  subCourseProgressFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  subCourseTopicsCount: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
  },
  subCourseDate: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#94a3b8",
  },
  courseManageCard: {
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
  courseManageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  courseManageIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e8f2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  courseManageTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  deleteIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  courseCreatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  courseCreatorText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  courseCreatedDateText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#94a3b8",
  },
  courseCurriculumDrawer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  drawerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
  },
  drawerTopicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  drawerTopicBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  drawerTopicBadgeNum: {
    color: Colors.WHITE,
    fontSize: 10,
    fontFamily: "outfit-bold",
  },
  drawerTopicTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  drawerTopicDesc: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 15,
  },
  courseDrawerToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    gap: 4,
  },
  courseDrawerToggleText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.PRIMARY,
    fontWeight: "600",
  },
  settingsProfileCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  settingsAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  settingsAdminName: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: "#1e293b",
  },
  settingsAdminEmail: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 2,
  },
  activeStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16a34a",
  },
  activeStatusText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#16a34a",
  },
  settingsSectionCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  settingsSectionHeading: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
    marginBottom: 12,
  },
  settingsSectionDesc: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginBottom: 14,
    lineHeight: 18,
  },
  settingsInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  settingsInfoLabel: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#64748b",
  },
  settingsInfoVal: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  bigLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  bigLogoutBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#dc2626",
  },
  emptyCardBox: {
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  emptyCardText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 6,
  },
  emptyCenterContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 4,
  },
  bottomTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabBarItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tabBarLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3,
  },
  tabBarLabelActive: {
    fontFamily: "outfit-bold",
    color: Colors.PRIMARY,
  },
});
