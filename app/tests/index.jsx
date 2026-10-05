import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import { getLmsStore } from "../../services/lmsStore";

export default function TestsListScreen() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'Mock Test' | 'Subject Test' | 'Practice Drill'
  const [refreshing, setRefreshing] = useState(false);

  const loadTests = async () => {
    try {
      const store = await getLmsStore();
      setTests(store.tests || []);
    } catch (e) {
      console.error("Tests load error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTests();
  };

  const filteredTests = tests.filter((t) => {
    if (filter === "all") return true;
    return t.type === filter;
  });

  const completedCount = tests.filter((t) => t.completed).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tests & Assessments</Text>
        <View style={styles.completedBadge}>
          <Text style={styles.completedBadgeText}>
            {completedCount}/{tests.length} Done
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All Tests" },
          { key: "Mock Test", label: "Mock Tests" },
          { key: "Subject Test", label: "Subject Tests" },
          { key: "Practice Drill", label: "Practice Drills" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab.key && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />
        }
        renderItem={({ item }) => {
          const score = item.recentScore;
          return (
            <View style={styles.testCard}>
              <View style={styles.testCardHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.type}</Text>
                </View>

                {item.completed ? (
                  <View style={styles.scoreBadge}>
                    <Ionicons name="ribbon" size={13} color="#16a34a" />
                    <Text style={styles.scoreBadgeText}>
                      Score: {score?.score}/{score?.total} ({score?.accuracy}%)
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                )}
              </View>

              <Text style={styles.testTitle}>{item.title}</Text>
              <Text style={styles.testSubject}>{item.subject}</Text>

              {/* Meta Stats */}
              <View style={styles.testMetaGrid}>
                <View style={styles.metaItem}>
                  <Ionicons name="help-circle-outline" size={16} color={Colors.GRAY} />
                  <Text style={styles.metaItemText}>{item.totalQuestions} Questions</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="timer-outline" size={16} color={Colors.GRAY} />
                  <Text style={styles.metaItemText}>{item.durationMinutes} Minutes</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.GRAY} />
                  <Text style={styles.metaItemText}>{item.scheduledDate}</Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.startTestBtn,
                  item.completed && { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe" },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/tests/take",
                    params: { testId: item.id },
                  })
                }
              >
                <Ionicons
                  name={item.completed ? "refresh" : "play"}
                  size={16}
                  color={item.completed ? Colors.PRIMARY : Colors.WHITE}
                />
                <Text
                  style={[
                    styles.startTestBtnText,
                    item.completed && { color: Colors.PRIMARY },
                  ]}
                >
                  {item.completed ? "Retake Test" : "Start Timed Test"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
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
  completedBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#16a34a",
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
  testCard: {
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
  testCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: Colors.PRIMARY,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  scoreBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
    color: "#16a34a",
  },
  pendingBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
  },
  testTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 2,
  },
  testSubject: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginBottom: 12,
  },
  testMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaItemText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#475569",
  },
  startTestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  startTestBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.WHITE,
  },
});
