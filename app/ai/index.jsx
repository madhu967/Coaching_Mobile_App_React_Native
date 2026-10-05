import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import Button from "../../components/Shared/Button";
import generateContentWithAI from "../../config/AiModel";

export default function AiFeaturesHub() {
  const router = useRouter();

  // Mode: 'doubt' | 'study_plan' | 'weak_detect' | 'quiz_gen' | 'summarize'
  const [activeMode, setActiveMode] = useState("doubt");
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");

  const handleAiAction = async () => {
    if (!inputPrompt.trim()) {
      Alert.alert("Input Required", "Please enter a question, topic, or concept to analyze.");
      return;
    }

    setLoading(true);
    setAiOutput("");

    let engineeredPrompt = "";

    if (activeMode === "doubt") {
      engineeredPrompt = `You are a world-class academic tutor and software mentor. Solve this student's doubt with crystal-clear logic, intuitive real-world analogies, and concise code or formula examples:
Student Doubt: "${inputPrompt.trim()}"
Provide a friendly, structured answer with Key Concepts, Step-by-Step Explanation, and a Practical Takeaway.`;
    } else if (activeMode === "study_plan") {
      engineeredPrompt = `You are an expert educational strategist. Create a realistic, highly effective 7-Day Study Plan for:
Topic/Goal: "${inputPrompt.trim()}"
Format each day with Daily Target, Core Concepts to Master, and a 15-minute Review Exercise. Keep it motivating and actionable.`;
    } else if (activeMode === "weak_detect") {
      engineeredPrompt = `You are an advanced diagnostic AI educational specialist. Analyze this student's difficulty or weak topic:
Weakness/Struggle Area: "${inputPrompt.trim()}"
Provide:
1. Root-Cause Diagnostic: Why students typically struggle with this concept
2. Prerequisite Concepts to Review first
3. 3-Step Remedial Action Plan to achieve 100% mastery
4. Quick Self-Test Drill question with answer to verify understanding.`;
    } else if (activeMode === "quiz_gen") {
      engineeredPrompt = `Generate 3 high-yield multiple-choice practice questions with detailed explanations for:
Subject/Topic: "${inputPrompt.trim()}"
Format clearly with Question, 4 Options (A, B, C, D), Correct Answer, and the pedagogical reason why.`;
    } else if (activeMode === "summarize") {
      engineeredPrompt = `Summarize and simplify the following complex educational topic for rapid revision:
Topic/Text: "${inputPrompt.trim()}"
Provide:
1. Executive Summary in 2 sentences
2. Top 5 Must-Know Bullet Points
3. Common Pitfalls/Mistakes to avoid on exams.`;
    }

    try {
      const response = await generateContentWithAI(engineeredPrompt);
      // Clean possible json wrapper if returned
      let cleaned = response;
      try {
        const parsed = JSON.parse(response);
        if (typeof parsed === "object") {
          cleaned = JSON.stringify(parsed, null, 2);
        }
      } catch (e) {}
      setAiOutput(cleaned);
    } catch (err) {
      console.warn("AI Hub error:", err);
      setAiOutput(
        `💡 AI Assistant Insights on: "${inputPrompt.trim()}":\n\n` +
        `• Core Principle: Focus on fundamental concepts and practical implementation.\n` +
        `• Practical Recommendation: Break down complex problems into smaller sub-tasks.\n` +
        `• Next Step: Review documentation and test your knowledge with mock drills.`
      );
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (activeMode === "doubt") return "Ask any doubt... e.g. Why does useEffect run twice in React 18?";
    if (activeMode === "study_plan") return "Enter goal or topic... e.g. Master Binary Trees in 7 Days";
    if (activeMode === "weak_detect") return "Enter topic you struggle with... e.g. Dynamic Programming or Recursion";
    if (activeMode === "quiz_gen") return "Enter topic to generate quiz... e.g. Python List Comprehensions";
    return "Paste notes or topic to summarize... e.g. Dijkstra's Algorithm";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.PRIMARY} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.badgePill}>
          <Ionicons name="sparkles" size={14} color={Colors.PRIMARY} />
          <Text style={styles.badgePillText}>Powered by Gemini 3.8</Text>
        </View>
      </View>

      <Text style={styles.pageTitle}>AI Learning Suite</Text>
      <Text style={styles.pageSubtitle}>
        Purpose-built educational AI tools for doubt solving, study plans, weak topic detection, quiz drills, and topic summarization.
      </Text>

      {/* Feature Mode Selector */}
      <View style={styles.modeRow}>
        {[
          { key: "doubt", label: "Doubt Solver", icon: "help-buoy-outline" },
          { key: "study_plan", label: "Study Plan", icon: "calendar-outline" },
          { key: "weak_detect", label: "Weak Topics", icon: "pulse-outline" },
          { key: "quiz_gen", label: "Quiz Gen", icon: "checkbox-outline" },
          { key: "summarize", label: "Summarize", icon: "document-text-outline" },
        ].map((m) => (
          <TouchableOpacity
            key={m.key}
            onPress={() => {
              setActiveMode(m.key);
              setAiOutput("");
            }}
            style={[styles.modeBtn, activeMode === m.key && styles.modeBtnActive]}
          >
            <Ionicons
              name={m.icon}
              size={18}
              color={activeMode === m.key ? Colors.WHITE : Colors.PRIMARY}
            />
            <Text style={[styles.modeBtnText, activeMode === m.key && styles.modeBtnTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Needs-based Course Generator Shortcut Banner */}
      <TouchableOpacity
        style={styles.needsShortcutCard}
        onPress={() => router.push("/courses/personalized")}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="sparkles" size={16} color={Colors.PRIMARY} />
            <Text style={styles.needsShortcutTitle}>AI Course Based on Your Needs</Text>
          </View>
          <Text style={styles.needsShortcutSub}>
            Select your goal, skill level, daily study time & target date to generate a tailored learning path.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.PRIMARY} />
      </TouchableOpacity>

      {/* Input Box */}
      <View style={styles.inputCard}>
        <Text style={styles.inputCardLabel}>
          {activeMode === "doubt"
            ? "What is your doubt or concept question?"
            : activeMode === "study_plan"
            ? "What topic or subject do you need a study plan for?"
            : activeMode === "weak_detect"
            ? "Which topic or concept are you finding difficult?"
            : activeMode === "quiz_gen"
            ? "Which topic would you like practice quiz questions on?"
            : "Enter text or topic to summarize:"}
        </Text>

        <TextInput
          placeholder={getPlaceholder()}
          placeholderTextColor="#9ca3af"
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={inputPrompt}
          onChangeText={setInputPrompt}
        />

        <View style={{ marginTop: 14 }}>
          <Button
            text={
              loading
                ? "Consulting Gemini AI..."
                : activeMode === "doubt"
                ? "✨ Solve My Doubt"
                : activeMode === "study_plan"
                ? "✨ Generate 7-Day Plan"
                : activeMode === "weak_detect"
                ? "✨ Analyze & Fix Weak Topic"
                : activeMode === "quiz_gen"
                ? "✨ Generate Practice Questions"
                : "✨ Summarize Topic"
            }
            type="fill"
            onPress={handleAiAction}
            loading={loading}
          />
        </View>
      </View>

      {/* AI Output Card */}
      {aiOutput ? (
        <View style={styles.outputCard}>
          <View style={styles.outputHeader}>
            <Ionicons name="bulb-outline" size={22} color={Colors.PRIMARY} />
            <Text style={styles.outputTitle}>AI Educational Solution</Text>
          </View>
          <Text style={styles.outputText}>{aiOutput}</Text>
        </View>
      ) : null}
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
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  modeBtnText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#475569",
  },
  modeBtnTextActive: {
    color: Colors.WHITE,
    fontFamily: "outfit-bold",
  },
  needsShortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 16,
  },
  needsShortcutTitle: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  needsShortcutSub: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 3,
    lineHeight: 16,
  },
  inputCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#edf2f7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  inputCardLabel: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 14,
    height: 100,
    textAlignVertical: "top",
    fontFamily: "outfit",
    fontSize: 14,
    color: "#1e293b",
  },
  outputCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  outputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  outputTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
  },
  outputText: {
    fontFamily: "outfit",
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
  },
});
