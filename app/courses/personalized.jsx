import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import Button from "../../components/Shared/Button";
import generateContentWithAI from "../../config/AiModel";
import { saveCourse } from "../../services/courseStorage";
import { savePersonalizedCourse } from "../../services/lmsStore";

const GOALS = [
  "Crack Top Tech Job Interviews",
  "Master Mobile & App Development",
  "College Semester / Exam Prep",
  "Build Production AI Products",
  "Career Transition to Software",
];

const SKILL_LEVELS = [
  "Beginner (Starting from scratch)",
  "Intermediate (Know the basics)",
  "Advanced (Seeking system mastery)",
];

const SUBJECT_OPTIONS = [
  "React Native",
  "Python",
  "DSA & Algorithms",
  "Artificial Intelligence",
  "System Design",
  "Node.js Backend",
  "Cloud & DevOps",
  "SQL & Databases",
];

const STUDY_TIMES = [
  "30 Mins / Day",
  "1 Hour / Day",
  "2 Hours / Day",
  "4+ Hours / Day (Intensive)",
];

const TIMELINES = [
  "2 Weeks (Crash Course)",
  "1 Month (Fast-Track)",
  "3 Months (Comprehensive)",
  "6 Months (Full Mastery)",
];

export default function PersonalizedCourseNeeds() {
  const router = useRouter();

  // Selections
  const [goal, setGoal] = useState(GOALS[0]);
  const [skillLevel, setSkillLevel] = useState(SKILL_LEVELS[1]);
  const [selectedSubjects, setSelectedSubjects] = useState(["React Native", "DSA & Algorithms"]);
  const [customSubject, setCustomSubject] = useState("");
  const [dailyTime, setDailyTime] = useState(STUDY_TIMES[1]);
  const [targetTimeline, setTargetTimeline] = useState(TIMELINES[1]);

  // Loading & Result states
  const [generating, setGenerating] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  const toggleSubject = (sub) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleGeneratePath = async () => {
    const subjectsToLearn = [...selectedSubjects];
    if (customSubject.trim()) {
      subjectsToLearn.push(customSubject.trim());
    }

    if (subjectsToLearn.length === 0) {
      Alert.alert("Select Subjects", "Please pick at least one subject or enter a custom topic.");
      return;
    }

    setGenerating(true);
    setGeneratedResult(null);

    const prompt = `You are an elite educational counselor and curriculum architect. Create a personalized, custom course curriculum strictly tailored to the student's needs:
- Goal: ${goal}
- Current Skill Level: ${skillLevel}
- Subjects/Topics: ${subjectsToLearn.join(", ")}
- Available Study Time: ${dailyTime}
- Target Completion Timeline: ${targetTimeline}

Return ONLY valid JSON format:
{
  "courseTitle": "Concise Course Name",
  "summary": "2-sentence explanation of why this path achieves their goal in ${targetTimeline}",
  "weeklyPace": "${dailyTime} focus",
  "topics": [
    {
      "id": 1,
      "title": "Module Title",
      "description": "Specific real-world outcome and key concepts"
    }
  ]
}
Generate 5-7 focused, sequential topics matching their available study time and target date.`;

    try {
      const response = await generateContentWithAI(prompt);
      console.log("Personalized AI Course Result:", response);
      const parsed = JSON.parse(response);
      setGeneratedResult(parsed);
    } catch (err) {
      console.warn("AI Personalized Generation Error:", err.message);
      // Fallback personalized response
      const fallbackTitle = `${subjectsToLearn[0] || "Custom"} Personalized Track`;
      setGeneratedResult({
        courseTitle: fallbackTitle,
        summary: `Custom crafted track for ${goal} designed for ${dailyTime} study pace over ${targetTimeline}.`,
        weeklyPace: dailyTime,
        topics: [
          { id: 1, title: `${subjectsToLearn[0] || "Core"} Foundations`, description: `Baseline principles tailored for ${skillLevel}` },
          { id: 2, title: `Core Implementation & Workflows`, description: `Practical drills matched to ${goal}` },
          { id: 3, title: `Intermediate Problem Solving`, description: `Building resilience and speed in ${subjectsToLearn.join(", ")}` },
          { id: 4, title: `Real-World Capstone Project`, description: `Comprehensive project targeting your completion date` },
          { id: 5, title: `Interview & Exam Mastery`, description: `Final review, tips, and mock evaluations` },
        ],
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleEnrollPersonalized = async () => {
    if (!generatedResult) return;
    setEnrolling(true);

    try {
      const coursePayload = {
        courseTitle: generatedResult.courseTitle,
        topics: generatedResult.topics,
        topicCount: generatedResult.topics?.length || 5,
        summary: generatedResult.summary,
        weeklyPace: generatedResult.weeklyPace,
        goal,
        skillLevel,
        targetTimeline,
        isPersonalized: true,
      };

      await saveCourse(coursePayload);
      await savePersonalizedCourse(coursePayload);

      Alert.alert(
        "Learning Path Activated! 🚀",
        `"${generatedResult.courseTitle}" is now added to your courses and learning progress.`,
        [
          {
            text: "Go to Explore",
            onPress: () => router.push("/(tabs)/Explore"),
          },
        ]
      );
    } catch (err) {
      console.error("Enrollment error:", err);
      Alert.alert("Error", "Could not save learning path. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.badgePill}>
          <Ionicons name="sparkles" size={14} color={Colors.PRIMARY} />
          <Text style={styles.badgePillText}>AI Personalized Path</Text>
        </View>
      </View>

      <Text style={styles.pageTitle}>Create Course Based on Your Needs</Text>
      <Text style={styles.pageSubtitle}>
        Tell AI your goals, available study hours, and timeline — we'll generate a custom curriculum built specifically for you.
      </Text>

      {/* 1. Goal Selection */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>1. What is your primary learning goal?</Text>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => setGoal(g)}
            style={[styles.radioItem, goal === g && styles.radioItemSelected]}
          >
            <Ionicons
              name={goal === g ? "radio-button-on" : "radio-button-off"}
              size={18}
              color={goal === g ? Colors.PRIMARY : Colors.GRAY}
            />
            <Text style={[styles.radioText, goal === g && { color: Colors.PRIMARY, fontFamily: "outfit-bold" }]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Skill Level */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>2. What is your current skill level?</Text>
        {SKILL_LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl}
            onPress={() => setSkillLevel(lvl)}
            style={[styles.radioItem, skillLevel === lvl && styles.radioItemSelected]}
          >
            <Ionicons
              name={skillLevel === lvl ? "radio-button-on" : "radio-button-off"}
              size={18}
              color={skillLevel === lvl ? Colors.PRIMARY : Colors.GRAY}
            />
            <Text style={[styles.radioText, skillLevel === lvl && { color: Colors.PRIMARY, fontFamily: "outfit-bold" }]}>
              {lvl}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. Subjects */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>3. Choose subjects / topics you want to cover:</Text>
        <View style={styles.chipsWrap}>
          {SUBJECT_OPTIONS.map((sub) => {
            const isSel = selectedSubjects.includes(sub);
            return (
              <TouchableOpacity
                key={sub}
                onPress={() => toggleSubject(sub)}
                style={[styles.chip, isSel && styles.chipSelected]}
              >
                <Ionicons
                  name={isSel ? "checkmark-circle" : "add-circle-outline"}
                  size={16}
                  color={isSel ? Colors.WHITE : Colors.PRIMARY}
                />
                <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          placeholder="+ Or type custom subject (e.g. Next.js, Rust)"
          placeholderTextColor="#9ca3af"
          style={styles.customInput}
          value={customSubject}
          onChangeText={setCustomSubject}
        />
      </View>

      {/* 4. Available Study Time */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>4. How much time can you study per day?</Text>
        <View style={styles.timeGrid}>
          {STUDY_TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setDailyTime(t)}
              style={[styles.timeBox, dailyTime === t && styles.timeBoxSelected]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={dailyTime === t ? Colors.PRIMARY : Colors.GRAY}
              />
              <Text style={[styles.timeBoxText, dailyTime === t && { color: Colors.PRIMARY, fontFamily: "outfit-bold" }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Target Completion Date */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>5. Target completion date / timeline:</Text>
        <View style={styles.timeGrid}>
          {TIMELINES.map((tm) => (
            <TouchableOpacity
              key={tm}
              onPress={() => setTargetTimeline(tm)}
              style={[styles.timeBox, targetTimeline === tm && styles.timeBoxSelected]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={targetTimeline === tm ? Colors.PRIMARY : Colors.GRAY}
              />
              <Text style={[styles.timeBoxText, targetTimeline === tm && { color: Colors.PRIMARY, fontFamily: "outfit-bold" }]}>
                {tm}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate Button */}
      <View style={{ marginTop: 10 }}>
        <Button
          text={generating ? "Designing Your Custom Course..." : "✨ Generate AI Personalized Learning Path"}
          type="fill"
          onPress={handleGeneratePath}
          loading={generating}
        />
      </View>

      {/* Generated Result Preview */}
      {generatedResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="ribbon" size={26} color={Colors.PRIMARY} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.resultCourseTitle}>{generatedResult.courseTitle}</Text>
              <Text style={styles.resultPaceText}>
                Pace: {generatedResult.weeklyPace} • Target: {targetTimeline}
              </Text>
            </View>
          </View>

          {generatedResult.summary ? (
            <Text style={styles.resultSummaryText}>{generatedResult.summary}</Text>
          ) : null}

          <Text style={styles.resultCurriculumHeading}>Tailored Curriculum Modules:</Text>

          {generatedResult.topics?.map((topic, index) => (
            <View key={topic.id || index} style={styles.resultTopicItem}>
              <View style={styles.resultTopicNumBadge}>
                <Text style={styles.resultTopicNumText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.resultTopicTitle}>{topic.title}</Text>
                <Text style={styles.resultTopicDesc}>{topic.description}</Text>
              </View>
            </View>
          ))}

          <View style={{ marginTop: 16 }}>
            <Button
              text={enrolling ? "Enrolling..." : "Enroll & Start This Learning Path"}
              type="fill"
              onPress={handleEnrollPersonalized}
              loading={enrolling}
            />
          </View>
        </View>
      )}
    </ScrollView>
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
    marginTop: Platform.OS === "ios" ? 40 : 20,
    marginBottom: 16,
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
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgePillText: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
  },
  pageTitle: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: "#1e293b",
  },
  pageSubtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionLabel: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
    marginBottom: 12,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#fbfcfd",
    gap: 10,
  },
  radioItemSelected: {
    backgroundColor: "#f0f7ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
  },
  radioText: {
    fontFamily: "outfit",
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: Colors.PRIMARY,
  },
  chipText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#334155",
  },
  chipTextSelected: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
  },
  customInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    height: 44,
    fontFamily: "outfit",
    fontSize: 13,
    color: "#1e293b",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeBox: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  timeBoxSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  timeBoxText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#334155",
    flex: 1,
  },
  resultCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    elevation: 3,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  resultCourseTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  resultPaceText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.PRIMARY,
    marginTop: 2,
  },
  resultSummaryText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#475569",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    lineHeight: 18,
  },
  resultCurriculumHeading: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 10,
  },
  resultTopicItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fcfcfd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  resultTopicNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  resultTopicNumText: {
    fontFamily: "outfit-bold",
    color: Colors.WHITE,
    fontSize: 11,
  },
  resultTopicTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
  },
  resultTopicDesc: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
    lineHeight: 16,
  },
});
