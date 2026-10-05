import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../constant/Colors";
import Button from "../../components/Shared/Button";
import { getLmsStore, submitTestResult } from "../../services/lmsStore";

export default function TakeTestScreen() {
  const router = useRouter();
  const { testId } = useLocalSearchParams();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins default
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const store = await getLmsStore();
        const found = store.tests.find((t) => t.id === testId) || store.tests[0];
        setTest(found);
        if (found) {
          setTimeLeft(found.durationMinutes * 60);
        }
      } catch (e) {
        console.error("Test fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  // Countdown Timer & Auto-Submit
  useEffect(() => {
    if (loading || isSubmitted || !test) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, isSubmitted, test]);

  const handleAutoSubmit = async () => {
    Alert.alert("Time Expired! ⏰", "Your test is being auto-submitted now.");
    await finalizeSubmission();
  };

  const handleManualSubmit = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalCount = test.questions.length;

    Alert.alert(
      "Submit Test",
      `You answered ${answeredCount} of ${totalCount} questions. Submit now?`,
      [
        { text: "Keep Reviewing", style: "cancel" },
        {
          text: "Submit",
          onPress: finalizeSubmission,
        },
      ]
    );
  };

  const finalizeSubmission = async () => {
    clearInterval(timerRef.current);
    const spentSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
    const res = await submitTestResult(test.id, selectedAnswers, spentSecs);
    setResult(res);
    setIsSubmitted(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading || !test) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={{ marginTop: 10, color: Colors.GRAY, fontFamily: "outfit" }}>
          Preparing test paper...
        </Text>
      </View>
    );
  }

  const questions = test.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  /* =======================================================================
     RESULT & PERFORMANCE REVIEW VIEW
     ======================================================================= */
  if (isSubmitted && result) {
    const isPassed = result.score >= (test.passMarks || 2);
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Header Result Card */}
        <View style={styles.resultHeaderCard}>
          <View style={[styles.resultIconCircle, { backgroundColor: isPassed ? "#f0fdf4" : "#fef2f2" }]}>
            <Ionicons
              name={isPassed ? "trophy" : "alert-circle"}
              size={48}
              color={isPassed ? "#16a34a" : "#dc2626"}
            />
          </View>

          <Text style={styles.resultTitle}>
            {isPassed ? "Test Passed Successfully! 🎉" : "Test Completed"}
          </Text>
          <Text style={styles.resultSubtitle}>
            {test.title} • {test.subject}
          </Text>

          {/* Metric Badges */}
          <View style={styles.resultMetricsRow}>
            <View style={styles.resultMetricBox}>
              <Text style={styles.resultMetricVal}>
                {result.score}/{result.total}
              </Text>
              <Text style={styles.resultMetricLabel}>Final Score</Text>
            </View>
            <View style={styles.resultMetricDivider} />
            <View style={styles.resultMetricBox}>
              <Text style={[styles.resultMetricVal, { color: isPassed ? "#16a34a" : "#dc2626" }]}>
                {result.accuracy}%
              </Text>
              <Text style={styles.resultMetricLabel}>Accuracy</Text>
            </View>
            <View style={styles.resultMetricDivider} />
            <View style={styles.resultMetricBox}>
              <Text style={styles.resultMetricVal}>
                {Math.round(result.timeSpentSeconds / 60)}m {result.timeSpentSeconds % 60}s
              </Text>
              <Text style={styles.resultMetricLabel}>Time Taken</Text>
            </View>
          </View>
        </View>

        {/* Detailed Answers Review */}
        <Text style={styles.reviewSectionHeading}>Detailed Question Review:</Text>

        {result.questionDetails?.map((qd, index) => {
          return (
            <View
              key={qd.id || index}
              style={[
                styles.questionReviewCard,
                qd.isCorrect ? styles.correctReviewBorder : styles.wrongReviewBorder,
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.qReviewNumber}>Question {index + 1}</Text>
                <View
                  style={[
                    styles.qResultBadge,
                    { backgroundColor: qd.isCorrect ? "#f0fdf4" : "#fef2f2" },
                  ]}
                >
                  <Ionicons
                    name={qd.isCorrect ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={qd.isCorrect ? "#16a34a" : "#dc2626"}
                  />
                  <Text
                    style={[
                      styles.qResultBadgeText,
                      { color: qd.isCorrect ? "#16a34a" : "#dc2626" },
                    ]}
                  >
                    {qd.isCorrect ? "Correct (+1)" : "Incorrect (0)"}
                  </Text>
                </View>
              </View>

              <Text style={styles.qReviewTitle}>{qd.question}</Text>

              {qd.options?.map((opt, optIdx) => {
                const wasSelected = qd.selectedOptionIndex === optIdx;
                const isTheCorrectOne = qd.correctIndex === optIdx;

                let optStyle = styles.optReviewNormal;
                let optTextCol = "#475569";

                if (isTheCorrectOne) {
                  optStyle = styles.optReviewCorrect;
                  optTextCol = "#16a34a";
                } else if (wasSelected && !qd.isCorrect) {
                  optStyle = styles.optReviewWrong;
                  optTextCol = "#dc2626";
                }

                return (
                  <View key={optIdx} style={[styles.optReviewBox, optStyle]}>
                    <Text style={[styles.optReviewText, { color: optTextCol }]}>
                      {String.fromCharCode(65 + optIdx)}. {opt}
                    </Text>
                    {isTheCorrectOne && (
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    )}
                    {wasSelected && !qd.isCorrect && (
                      <Ionicons name="close-circle" size={16} color="#dc2626" />
                    )}
                  </View>
                );
              })}

              {qd.explanation ? (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationTitle}>💡 Explanation:</Text>
                  <Text style={styles.explanationText}>{qd.explanation}</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        <View style={{ marginTop: 20 }}>
          <Button
            text="Back to Tests"
            type="fill"
            onPress={() => router.replace("/tests")}
          />
        </View>
      </ScrollView>
    );
  }

  /* =======================================================================
     ACTIVE TEST TAKING VIEW
     ======================================================================= */
  return (
    <View style={styles.container}>
      {/* Top Test Header with Timer */}
      <View style={styles.testNavbar}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Exit Test?", "Your progress will be lost if you leave now.", [
              { text: "Stay", style: "cancel" },
              { text: "Exit", onPress: () => router.back() },
            ])
          }
          style={styles.exitBtn}
        >
          <Ionicons name="close" size={20} color={Colors.GRAY} />
        </TouchableOpacity>

        {/* Live Countdown Timer */}
        <View style={[styles.timerBadge, timeLeft < 120 && { backgroundColor: "#fef2f2", borderColor: "#fca5a5" }]}>
          <Ionicons
            name="timer-outline"
            size={18}
            color={timeLeft < 120 ? "#dc2626" : Colors.PRIMARY}
          />
          <Text style={[styles.timerText, timeLeft < 120 && { color: "#dc2626" }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>

        <TouchableOpacity onPress={handleManualSubmit} style={styles.finishTopBtn}>
          <Text style={styles.finishTopBtnText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={styles.progressLabel}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.progressSubject}>{test.subject}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Active Question Card */}
      <ScrollView contentContainerStyle={styles.questionContent}>
        <Text style={styles.questionText}>{currentQ?.question}</Text>

        {/* Options */}
        <View style={styles.optionsWrap}>
          {currentQ?.options?.map((option, idx) => {
            const isSelected = selectedAnswers[currentQ.id] === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() =>
                  setSelectedAnswers({
                    ...selectedAnswers,
                    [currentQ.id]: idx,
                  })
                }
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.optionLetterBox,
                    isSelected && { backgroundColor: Colors.PRIMARY },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetterText,
                      isSelected && { color: Colors.WHITE },
                    ]}
                  >
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.optionText,
                    isSelected && { color: Colors.PRIMARY, fontFamily: "outfit-bold" },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          disabled={currentQuestionIndex === 0}
          onPress={() => setCurrentQuestionIndex((prev) => prev - 1)}
          style={[
            styles.footerPrevBtn,
            currentQuestionIndex === 0 && { opacity: 0.4 },
          ]}
        >
          <Ionicons name="arrow-back" size={16} color={Colors.PRIMARY} />
          <Text style={styles.footerPrevText}>Previous</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            onPress={handleManualSubmit}
            style={styles.footerSubmitBtn}
          >
            <Text style={styles.footerSubmitText}>Submit Test 🚀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setCurrentQuestionIndex((prev) => prev + 1)}
            style={styles.footerNextBtn}
          >
            <Text style={styles.footerNextText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.WHITE} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  testNavbar: {
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
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 6,
  },
  timerText: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: Colors.PRIMARY,
  },
  finishTopBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.PRIMARY,
  },
  finishTopBtnText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.WHITE,
  },
  progressContainer: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  progressLabel: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#334155",
  },
  progressSubject: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 3,
  },
  questionContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionText: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsWrap: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionButtonSelected: {
    borderColor: Colors.PRIMARY,
    backgroundColor: "#f0f7ff",
  },
  optionLetterBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionLetterText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: "#475569",
  },
  optionText: {
    fontFamily: "outfit",
    fontSize: 15,
    color: "#334155",
    flex: 1,
  },
  footerNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
  },
  footerPrevBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    gap: 6,
  },
  footerPrevText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.PRIMARY,
  },
  footerNextBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.PRIMARY,
    gap: 6,
  },
  footerNextText: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.WHITE,
  },
  footerSubmitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#16a34a",
  },
  footerSubmitText: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.WHITE,
  },
  resultHeaderCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#edf2f7",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  resultIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resultTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: "#1e293b",
  },
  resultSubtitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 2,
  },
  resultMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  resultMetricBox: {
    alignItems: "center",
  },
  resultMetricVal: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#1e293b",
  },
  resultMetricLabel: {
    fontFamily: "outfit",
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 2,
  },
  resultMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#e2e8f0",
  },
  reviewSectionHeading: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 12,
  },
  questionReviewCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  correctReviewBorder: {
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
  },
  wrongReviewBorder: {
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },
  qReviewNumber: {
    fontFamily: "outfit-bold",
    fontSize: 13,
    color: Colors.GRAY,
  },
  qResultBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  qResultBadgeText: {
    fontFamily: "outfit-bold",
    fontSize: 11,
  },
  qReviewTitle: {
    fontFamily: "outfit-bold",
    fontSize: 15,
    color: "#1e293b",
    marginVertical: 10,
    lineHeight: 22,
  },
  optReviewBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  optReviewNormal: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  optReviewCorrect: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  optReviewWrong: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  optReviewText: {
    fontFamily: "outfit",
    fontSize: 13,
    flex: 1,
  },
  explanationBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  explanationTitle: {
    fontFamily: "outfit-bold",
    fontSize: 12,
    color: Colors.PRIMARY,
    marginBottom: 2,
  },
  explanationText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#334155",
    lineHeight: 16,
  },
});
