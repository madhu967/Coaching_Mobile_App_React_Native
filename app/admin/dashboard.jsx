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
import { getLmsStore, saveLmsStore, addTeacher, deleteTeacher } from "../../services/lmsStore";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Button from "../../components/Shared/Button";

export default function AdminDashboard() {
  const router = useRouter();
  const creds = getAdminCredentials();

  // Navigation tab state: 'overview' | 'students' | 'teachers' | 'courses_classes' | 'settings'
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [lmsStore, setLmsStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Expansion states
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [expandedStudentEmail, setExpandedStudentEmail] = useState(null);

  // Broadcast Notification Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  // Add Teacher Modal
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  // Load all data
  const loadAllData = async () => {
    try {
      const isAuth = await isAdminLoggedIn();
      if (!isAuth) {
        router.replace("/admin");
        return;
      }

      const [courseList, storeData] = await Promise.all([
        getAllCourses(),
        getLmsStore(),
      ]);

      setCourses(courseList || []);
      setLmsStore(storeData || null);

      // Fetch users from Firestore with a 2-second timeout
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
      } catch (err) {}

      // Aggregate students
      const studentMap = new Map();
      userListFromDb.forEach((u) => {
        if (u.email) {
          studentMap.set(u.email.toLowerCase(), {
            email: u.email,
            name: u.name || u.email.split("@")[0],
            courses: [],
          });
        }
      });

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

      aggregatedStudents.sort((a, b) => b.totalCourses - a.totalCourses);
      setStudents(aggregatedStudents);
    } catch (e) {
      console.error("Admin data load error:", e);
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

  const handleAdminLogout = () => {
    Alert.alert("Admin Logout", "Sign out of Admin Console?", [
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

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) {
      Alert.alert("Missing Fields", "Please enter notification title and message.");
      return;
    }

    setBroadcasting(true);
    try {
      const store = await getLmsStore();
      const newNotif = {
        id: "notif-" + Date.now(),
        title: "📢 " + broadcastTitle.trim(),
        message: broadcastMsg.trim(),
        type: "announcement",
        timestamp: "Just now (Admin)",
        read: false,
      };

      const updated = {
        ...store,
        notifications: [newNotif, ...store.notifications],
      };
      await saveLmsStore(updated);

      Alert.alert("Broadcast Sent! 🚀", "All students received the announcement.");
      setShowBroadcastModal(false);
      setBroadcastTitle("");
      setBroadcastMsg("");
      loadAllData();
    } catch (e) {
      Alert.alert("Error", "Could not dispatch broadcast.");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!teacherName.trim() || !teacherSubject.trim() || !teacherEmail.trim() || !teacherPassword.trim()) {
      Alert.alert("Missing Fields", "Please enter teacher name, subject, email, and password.");
      return;
    }

    setAddingTeacher(true);
    try {
      await addTeacher({
        name: teacherName.trim(),
        subject: teacherSubject.trim(),
        email: teacherEmail.trim(),
        password: teacherPassword.trim(),
        phone: teacherPhone.trim() || "+1 415-555-0199",
      });

      Alert.alert(
        "Faculty Member Added! 🎓",
        `Teacher ${teacherName} has been registered.\n\nThey can now log into the Teacher Portal with:\n• Email: ${teacherEmail}\n• Password: ${teacherPassword}`
      );
      setShowAddTeacherModal(false);
      setTeacherName("");
      setTeacherSubject("");
      setTeacherEmail("");
      setTeacherPassword("");
      setTeacherPhone("");
      loadAllData();
    } catch (err) {
      Alert.alert("Registration Error", err.message || "Failed to register teacher.");
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleDeleteTeacher = (teacher) => {
    Alert.alert(
      "Remove Teacher",
      `Are you sure you want to remove ${teacher.name}? Their faculty login access will be permanently revoked.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteTeacher(teacher.id);
            Alert.alert("Removed", `${teacher.name} has been removed.`);
            loadAllData();
          },
        },
      ]
    );
  };

  const togglePasswordReveal = (teacherId) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [teacherId]: !prev[teacherId],
    }));
  };

  // Metrics
  const totalCoursesCount = courses.length;
  const totalStudentsCount = students.length;
  const totalTeachersCount = lmsStore?.teachers?.length || 3;
  const totalClassesCount = lmsStore?.classes?.length || 4;
  const totalTestsCount = lmsStore?.tests?.length || 3;
  const totalAssignmentsCount = lmsStore?.assignments?.length || 3;

  const top5Students = students.slice(0, 5);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.courseTitle?.toLowerCase().includes(q) || c.userEmail?.toLowerCase().includes(q);
  });

  /* =======================================================================
     TAB 1: OVERVIEW & ANALYTICS
     ======================================================================= */
  const renderOverviewTab = () => (
    <ScrollView
      contentContainerStyle={styles.scrollTabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
      }
    >
      {/* Platform Hero Banner */}
      <View style={styles.heroCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroPill}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.WHITE} />
              <Text style={styles.heroPillText}>Coaching Guru Admin</Text>
            </View>
            <Text style={styles.heroTitle}>Master Analytics</Text>
            <Text style={styles.heroSubtitle}>
              Full institutional control across students, teachers & curriculum
            </Text>
          </View>

          <TouchableOpacity style={styles.broadcastIconBtn} onPress={() => setShowBroadcastModal(true)}>
            <Ionicons name="megaphone" size={18} color={Colors.WHITE} />
          </TouchableOpacity>
        </View>

        {/* 6 Key Analytics Metric Tiles */}
        <View style={styles.metricGrid}>
          <View style={styles.metricTile}>
            <Text style={styles.metricVal}>{totalStudentsCount}</Text>
            <Text style={styles.metricLabel}>Students</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricVal}>{totalTeachersCount}</Text>
            <Text style={styles.metricLabel}>Teachers</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricVal}>{totalCoursesCount}</Text>
            <Text style={styles.metricLabel}>Courses</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricVal}>{totalClassesCount}</Text>
            <Text style={styles.metricLabel}>Live Classes</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricVal}>{totalTestsCount}</Text>
            <Text style={styles.metricLabel}>Tests</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricVal}>{totalAssignmentsCount}</Text>
            <Text style={styles.metricLabel}>Assignments</Text>
          </View>
        </View>
      </View>

      {/* Broadcast Announcement Bar */}
      <TouchableOpacity
        style={styles.broadcastBanner}
        onPress={() => setShowBroadcastModal(true)}
      >
        <Ionicons name="megaphone-outline" size={20} color={Colors.PRIMARY} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.broadcastBannerTitle}>Send Platform Announcement</Text>
          <Text style={styles.broadcastBannerSub}>Broadcast notifications to all active student apps</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.PRIMARY} />
      </TouchableOpacity>

      {/* Top 5 Students List */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionHeading}>Top 5 Students</Text>
          <Text style={styles.sectionSubheading}>Highest curriculum engagement</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab("students")} style={styles.seeMoreBtn}>
          <Text style={styles.seeMoreBtnText}>View All ({students.length})</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {top5Students.length === 0 ? (
        <Text style={styles.emptyNotice}>No students recorded yet.</Text>
      ) : (
        top5Students.map((student, idx) => (
          <TouchableOpacity
            key={student.email || idx}
            style={styles.studentRankCard}
            onPress={() => {
              setActiveTab("students");
              setExpandedStudentEmail(student.email);
            }}
          >
            <View style={[styles.rankBadge, idx === 0 && { backgroundColor: "#ffd700" }]}>
              <Text style={[styles.rankBadgeText, idx === 0 && { color: "#854d0e" }]}>
                #{idx + 1}
              </Text>
            </View>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{student.name.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.studentName} numberOfLines={1}>{student.name}</Text>
              <Text style={styles.studentEmail} numberOfLines={1}>{student.email}</Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.countPill}>
                <Ionicons name="book-outline" size={12} color={Colors.PRIMARY} />
                <Text style={styles.countPillText}>{student.totalCourses} Courses</Text>
              </View>
              <Text style={styles.progressPctText}>{student.progressPercent}% Finished</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Faculty Directory Snapshot */}
      <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
        <View>
          <Text style={styles.sectionHeading}>Faculty Overview</Text>
          <Text style={styles.sectionSubheading}>Teaching staff & assigned subjects</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab("teachers")} style={styles.seeMoreBtn}>
          <Text style={styles.seeMoreBtnText}>Manage Faculty</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {lmsStore?.teachers?.map((tch) => (
        <View key={tch.id} style={styles.teacherSnapCard}>
          <View style={styles.teacherSnapAvatar}>
            <Text style={styles.teacherSnapInitial}>{tch.avatar}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.teacherSnapName}>{tch.name}</Text>
            <Text style={styles.teacherSnapSubject}>{tch.subject}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#f59e0b" />
            <Text style={styles.ratingBadgeText}>{tch.rating}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  /* =======================================================================
     TAB 2: STUDENTS DIRECTORY
     ======================================================================= */
  const renderStudentsTab = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.GRAY} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search students by name or email..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={Colors.GRAY} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.email}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
        }
        renderItem={({ item }) => {
          const isExpanded = expandedStudentEmail === item.email;
          return (
            <View style={styles.studentDetailCard}>
              <TouchableOpacity
                onPress={() => setExpandedStudentEmail(isExpanded ? null : item.email)}
                style={styles.studentDetailHeader}
              >
                <View style={styles.studentAvatarLarge}>
                  <Text style={styles.studentAvatarLargeInitial}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.studentDetailName}>{item.name}</Text>
                  <Text style={styles.studentDetailEmail}>{item.email}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    <View style={styles.pillSmall}>
                      <Text style={styles.pillSmallText}>{item.totalCourses} Courses</Text>
                    </View>
                    <View style={[styles.pillSmall, { backgroundColor: "#f0fdf4" }]}>
                      <Text style={[styles.pillSmallText, { color: "#16a34a" }]}>
                        {item.progressPercent}% Done
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

              {/* Student's created courses */}
              {isExpanded && (
                <View style={styles.studentCourseExpandBox}>
                  <Text style={styles.expandHeaderTitle}>Courses Created by {item.name}:</Text>
                  {item.courses.length === 0 ? (
                    <Text style={styles.noCoursesText}>No courses created yet.</Text>
                  ) : (
                    item.courses.map((c, cIdx) => (
                      <View key={c.id || cIdx} style={styles.subCourseItem}>
                        <Text style={styles.subCourseTitle}>{c.courseTitle}</Text>
                        <Text style={styles.subCourseMeta}>
                          {c.topicCount || c.topics?.length || 0} Topics • Created {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recently"}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );

  /* =======================================================================
     TAB 3: TEACHERS DIRECTORY
     ======================================================================= */
  const renderTeachersTab = () => (
    <ScrollView contentContainerStyle={styles.scrollTabContent}>
      <View style={styles.actionHeaderBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeading}>Teaching Staff Directory</Text>
          <Text style={styles.sectionSubheading}>
            Manage instructors, credentials & portal access
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addTeacherTopBtn}
          onPress={() => setShowAddTeacherModal(true)}
        >
          <Ionicons name="add" size={16} color={Colors.WHITE} />
          <Text style={styles.addTeacherTopBtnText}>+ Add Teacher</Text>
        </TouchableOpacity>
      </View>

      {lmsStore?.teachers?.length === 0 ? (
        <View style={styles.emptyTeachersBox}>
          <Ionicons name="school-outline" size={48} color={Colors.GRAY} />
          <Text style={styles.emptyNotice}>No teachers registered yet.</Text>
          <TouchableOpacity
            style={styles.addTeacherTopBtn}
            onPress={() => setShowAddTeacherModal(true)}
          >
            <Text style={styles.addTeacherTopBtnText}>+ Register First Teacher</Text>
          </TouchableOpacity>
        </View>
      ) : (
        lmsStore?.teachers?.map((t) => {
          const isRevealed = revealedPasswords[t.id];
          const pwd = t.password || "Teacher@123";

          return (
            <View key={t.id} style={styles.teacherFullCard}>
              <View style={styles.teacherHeaderRow}>
                <View style={styles.teacherAvatarCircle}>
                  <Text style={styles.teacherAvatarInitial}>{t.avatar}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.teacherFullName}>{t.name}</Text>
                  <Text style={styles.teacherSubject}>{t.subject}</Text>
                  <Text style={styles.teacherContactText}>📞 {t.phone}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteTeacher(t)}
                  style={styles.deleteTeacherBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>

              {/* Login Credentials Box */}
              <View style={styles.teacherCredsBox}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Ionicons name="key" size={14} color="#16a34a" />
                  <Text style={styles.teacherCredsTitle}>Teacher Portal Login Credentials:</Text>
                </View>
                <Text style={styles.teacherCredsRow}>
                  <Text style={{ fontFamily: "outfit-bold", color: "#334155" }}>Email: </Text>
                  {t.email}
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                  <Text style={styles.teacherCredsRow}>
                    <Text style={{ fontFamily: "outfit-bold", color: "#334155" }}>Password: </Text>
                    {isRevealed ? pwd : "••••••••••••"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => togglePasswordReveal(t.id)}
                    style={styles.revealPwdBtn}
                  >
                    <Ionicons
                      name={isRevealed ? "eye-off-outline" : "eye-outline"}
                      size={16}
                      color={Colors.PRIMARY}
                    />
                    <Text style={styles.revealPwdBtnText}>{isRevealed ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.teacherStatsBar}>
                <View style={styles.teacherStatBox}>
                  <Text style={styles.teacherStatVal}>{t.totalStudents}</Text>
                  <Text style={styles.teacherStatLabel}>Enrolled Students</Text>
                </View>
                <View style={styles.teacherStatDivider} />
                <View style={styles.teacherStatBox}>
                  <Text style={styles.teacherStatVal}>{t.activeClasses}</Text>
                  <Text style={styles.teacherStatLabel}>Active Classes</Text>
                </View>
                <View style={styles.teacherStatDivider} />
                <View style={styles.teacherStatBox}>
                  <Text style={[styles.teacherStatVal, { color: "#f59e0b" }]}>⭐ {t.rating}</Text>
                  <Text style={styles.teacherStatLabel}>Student Rating</Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  /* =======================================================================
     TAB 4: COURSES & LIVE CLASSES MANAGEMENT
     ======================================================================= */
  const renderCoursesClassesTab = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.GRAY} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search all courses and classes..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
          return (
            <View style={styles.courseManageCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.courseManageTitle}>{item.courseTitle}</Text>
                  <Text style={styles.courseManageCreator}>Creator: {item.userEmail || "Student"}</Text>
                  <Text style={styles.courseManageDate}>
                    {item.topicCount || topics.length} Topics • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteCourse(item)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>

              {/* Topics dropdown */}
              {isExpanded && (
                <View style={styles.curriculumDropdown}>
                  <Text style={styles.curriculumDropdownHeading}>Curriculum Modules:</Text>
                  {topics.map((t, idx) => (
                    <Text key={t.id || idx} style={styles.curriculumTopicItem}>
                      {idx + 1}. {t.title}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setExpandedCourseId(isExpanded ? null : item.id)}
                style={styles.inspectBtn}
              >
                <Text style={styles.inspectBtnText}>
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
    </View>
  );

  /* =======================================================================
     TAB 5: SETTINGS & LOGOUT
     ======================================================================= */
  const renderSettingsTab = () => (
    <ScrollView contentContainerStyle={styles.scrollTabContent}>
      <View style={styles.settingsHeaderCard}>
        <View style={styles.settingsShieldCircle}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.WHITE} />
        </View>
        <Text style={styles.settingsAdminName}>Super Administrator</Text>
        <Text style={styles.settingsAdminEmail}>{creds.email}</Text>
        <View style={styles.adminVerifiedPill}>
          <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
          <Text style={styles.adminVerifiedText}>Active System Session</Text>
        </View>
      </View>

      <View style={styles.settingsBox}>
        <Text style={styles.settingsBoxHeading}>System Configuration (.env)</Text>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Admin Email:</Text>
          <Text style={styles.settingsVal}>{creds.email}</Text>
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>AI Engine:</Text>
          <Text style={[styles.settingsVal, { color: "#16a34a" }]}>Gemini 3.8 Flash</Text>
        </View>
        <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.settingsLabel}>Data Storage:</Text>
          <Text style={styles.settingsVal}>AsyncStorage + Firestore Sync</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.broadcastActionBtn}
        onPress={() => setShowBroadcastModal(true)}
      >
        <Ionicons name="megaphone" size={18} color={Colors.WHITE} />
        <Text style={styles.broadcastActionBtnText}>Broadcast Platform Announcement</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtnBig} onPress={handleAdminLogout}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutBtnBigText}>Log Out of Admin Console</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.topHeaderTitle}>Admin Console</Text>
          <Text style={styles.topHeaderSubtitle}>Platform Institutional Controller</Text>
        </View>
        <TouchableOpacity style={styles.logoutTopBtn} onPress={handleAdminLogout}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* Main Tab Screen Body */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
            <Text style={{ marginTop: 10, color: Colors.GRAY, fontFamily: "outfit" }}>
              Loading platform data...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === "overview" && renderOverviewTab()}
            {activeTab === "students" && renderStudentsTab()}
            {activeTab === "teachers" && renderTeachersTab()}
            {activeTab === "courses_classes" && renderCoursesClassesTab()}
            {activeTab === "settings" && renderSettingsTab()}
          </>
        )}
      </View>

      {/* Admin Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("overview")}>
          <Ionicons
            name={activeTab === "overview" ? "grid" : "grid-outline"}
            size={22}
            color={activeTab === "overview" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text style={[styles.navLabel, activeTab === "overview" && styles.navLabelActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("students")}>
          <Ionicons
            name={activeTab === "students" ? "people" : "people-outline"}
            size={22}
            color={activeTab === "students" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text style={[styles.navLabel, activeTab === "students" && styles.navLabelActive]}>
            Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("teachers")}>
          <Ionicons
            name={activeTab === "teachers" ? "school" : "school-outline"}
            size={22}
            color={activeTab === "teachers" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text style={[styles.navLabel, activeTab === "teachers" && styles.navLabelActive]}>
            Teachers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("courses_classes")}>
          <Ionicons
            name={activeTab === "courses_classes" ? "book" : "book-outline"}
            size={22}
            color={activeTab === "courses_classes" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text style={[styles.navLabel, activeTab === "courses_classes" && styles.navLabelActive]}>
            Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("settings")}>
          <Ionicons
            name={activeTab === "settings" ? "settings" : "settings-outline"}
            size={22}
            color={activeTab === "settings" ? Colors.PRIMARY : "#94a3b8"}
          />
          <Text style={[styles.navLabel, activeTab === "settings" && styles.navLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Teacher Modal */}
      <Modal visible={showAddTeacherModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={styles.modalTitle}>Register New Teacher</Text>
                <Text style={{ fontFamily: "outfit", fontSize: 12, color: Colors.GRAY }}>
                  Assign credentials for Teacher Portal login
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddTeacherModal(false)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Full Name (e.g. Prof. David Miller)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={teacherName}
              onChangeText={setTeacherName}
            />
            <TextInput
              placeholder="Subject / Department (e.g. Cloud & DevOps)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={teacherSubject}
              onChangeText={setTeacherSubject}
            />
            <TextInput
              placeholder="Login Email (e.g. david.miller@coachingguru.com)"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.modalInput}
              value={teacherEmail}
              onChangeText={setTeacherEmail}
            />
            <TextInput
              placeholder="Login Password (e.g. Teacher@123)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={teacherPassword}
              onChangeText={setTeacherPassword}
            />
            <TextInput
              placeholder="Phone (optional, e.g. +1 415-555-0155)"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              style={styles.modalInput}
              value={teacherPhone}
              onChangeText={setTeacherPhone}
            />

            <View style={{ marginTop: 14 }}>
              <Button
                text="Create Faculty Account"
                type="fill"
                onPress={handleAddTeacher}
                loading={addingTeacher}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Broadcast Announcement Modal */}
      <Modal visible={showBroadcastModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Broadcast Announcement</Text>
              <TouchableOpacity onPress={() => setShowBroadcastModal(false)}>
                <Ionicons name="close" size={22} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Announcement Title (e.g. Schedule Change)"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
            />
            <TextInput
              placeholder="Message to all students..."
              placeholderTextColor="#9ca3af"
              style={[styles.modalInput, { height: 90 }]}
              multiline
              value={broadcastMsg}
              onChangeText={setBroadcastMsg}
            />

            <View style={{ marginTop: 14 }}>
              <Button
                text="Dispatch to All Students"
                type="fill"
                onPress={handleSendBroadcast}
                loading={broadcasting}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  topHeader: {
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
  topHeaderTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: "#1e293b",
  },
  topHeaderSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  logoutTopBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollTabContent: {
    padding: 20,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  heroPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.WHITE,
  },
  heroTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: Colors.WHITE,
  },
  heroSubtitle: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
    lineHeight: 16,
  },
  broadcastIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  metricTile: {
    width: "31%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  metricVal: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  metricLabel: {
    fontFamily: "outfit",
    fontSize: 10,
    color: Colors.GRAY,
    marginTop: 2,
  },
  broadcastBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 20,
  },
  broadcastBannerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  broadcastBannerSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: "#1e293b",
  },
  sectionSubheading: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 1,
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeMoreBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  emptyNotice: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    fontStyle: "italic",
    paddingVertical: 10,
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
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  avatarInitial: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  studentName: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  studentEmail: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 1,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#edf4ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  countPillText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  progressPctText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#16a34a",
    marginTop: 4,
  },
  teacherSnapCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  teacherSnapAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  teacherSnapInitial: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  teacherSnapName: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  teacherSnapSubject: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  ratingBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#b45309",
  },
  searchBox: {
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
  searchInput: {
    flex: 1,
    fontFamily: "outfit",
    fontSize: 14,
    color: "#1e293b",
  },
  studentDetailCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  studentDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  studentAvatarLargeInitial: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: Colors.PRIMARY,
  },
  studentDetailName: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
  },
  studentDetailEmail: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 1,
  },
  pillSmall: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillSmallText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  studentCourseExpandBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  expandHeaderTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#475569",
    marginBottom: 6,
  },
  noCoursesText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    fontStyle: "italic",
  },
  subCourseItem: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  subCourseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  subCourseMeta: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  teacherFullCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  teacherHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teacherAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  teacherFullName: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
  },
  teacherSubject: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.PRIMARY,
    marginBottom: 4,
  },
  teacherContactText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
  },
  deleteTeacherBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  addTeacherTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  addTeacherTopBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.WHITE,
  },
  emptyTeachersBox: {
    alignItems: "center",
    padding: 30,
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#edf2f7",
    gap: 10,
  },
  teacherCredsBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  teacherCredsTitle: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#166534",
  },
  teacherCredsRow: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#166534",
  },
  revealPwdBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  revealPwdBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  teacherStatsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 12,
  },
  teacherStatBox: {
    alignItems: "center",
  },
  teacherStatVal: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  teacherStatLabel: {
    fontFamily: "outfit",
    fontSize: 10,
    color: Colors.GRAY,
    marginTop: 2,
  },
  teacherStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#e2e8f0",
  },
  courseManageCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  courseManageTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
  },
  courseManageCreator: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  courseManageDate: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  curriculumDropdown: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  curriculumDropdownHeading: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: "#475569",
    marginBottom: 6,
  },
  curriculumTopicItem: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#334155",
    marginBottom: 4,
  },
  inspectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    gap: 4,
  },
  inspectBtnText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.PRIMARY,
    fontWeight: "600",
  },
  settingsHeaderCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  settingsShieldCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
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
  adminVerifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  adminVerifiedText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#16a34a",
  },
  settingsBox: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
    marginBottom: 16,
  },
  settingsBoxHeading: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 10,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  settingsLabel: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#64748b",
  },
  settingsVal: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#1e293b",
  },
  broadcastActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  broadcastActionBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.WHITE,
  },
  logoutBtnBig: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  logoutBtnBigText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#dc2626",
  },
  bottomNav: {
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
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  navLabelActive: {
    fontFamily: "outfit-bold",
    color: Colors.PRIMARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
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
