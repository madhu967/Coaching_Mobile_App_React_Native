import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import Colors from "../../constant/Colors";
import { StyleSheet } from "react-native";
import Button from "../../components/Shared/Button";
import { generateCourseTopic } from "../../constant/Prompt";
import generateContentWithAI from "../../config/AiModel";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { saveCourse } from "../../services/courseStorage";

export default function AddCourse() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);

  const onGenerateToipic = async () => {
    if (!userInput.trim()) {
      alert("Please enter a course topic");
      return;
    }

    if (loading) {
      alert("Please wait for the previous request to complete");
      return;
    }

    try {
      setLoading(true);
      const PROMPT = generateCourseTopic.idea + "\n\nUser Input: " + userInput;
      const aiResponse = await generateContentWithAI(PROMPT);
      console.log("Generated Topics:", aiResponse);

      try {
        const parsedData = JSON.parse(aiResponse);
        const parsedTopics = parsedData?.topics || [];
        setTopics(parsedTopics);
        // Select all by default
        setSelectedTopics(parsedTopics.map((t) => t.id));
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        alert("Response format error. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate topics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [creatingCourse, setCreatingCourse] = useState(false);

  const toggleSelectTopic = (topicId) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter((id) => id !== topicId));
    } else {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  const onCreateCourse = async () => {
    if (selectedTopics.length === 0) {
      alert("Please select at least one topic");
      return;
    }

    try {
      setCreatingCourse(true);
      const chosenTopics = topics.filter((t) => selectedTopics.includes(t.id));
      await saveCourse({
        courseTitle: userInput.trim(),
        topics: chosenTopics,
        topicCount: chosenTopics.length,
      });

      console.log("✅ Course successfully saved! Redirecting to Explore...");
      setUserInput("");
      setTopics([]);
      setSelectedTopics([]);
      router.replace("/(tabs)/Explore");
    } catch (saveErr) {
      console.error("Error creating course:", saveErr);
      alert("Failed to save course. Please try again.");
    } finally {
      setCreatingCourse(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: Colors.WHITE, flex: 1 }} contentContainerStyle={{ padding: 25, paddingBottom: 60 }}>
      <Text style={{ fontFamily: "outfit-bold", fontSize: 25, marginTop: 20 }}>
        Create New Course
      </Text>
      <Text style={{ fontFamily: "outfit", fontSize: 20, marginTop: 5 }}>
        What you want to learn today?
      </Text>
      <Text style={{ fontFamily: "outfit", fontSize: 14, color: Colors.GRAY, marginTop: 5 }}>
        What course would you like to create? (e.g. Learn Python, Learn React)
      </Text>

      <TextInput
        placeholder="(Ex. Learn Python, Learn Digital Marketing)"
        style={styles.TextInput}
        numberOfLines={3}
        multiline={true}
        value={userInput}
        onChangeText={(value) => setUserInput(value)}
      />

      <Button
        text={"Generate Topic"}
        type="outline"
        onPress={() => onGenerateToipic()}
        loading={loading}
      />

      {topics.length > 0 && (
        <View style={{ marginTop: 25 }}>
          <Text style={{ fontFamily: "outfit-bold", fontSize: 20, marginBottom: 5 }}>
            Course Topics
          </Text>
          <Text style={{ fontFamily: "outfit", fontSize: 13, color: Colors.GRAY, marginBottom: 15 }}>
            Select the topics you want in your curriculum ({selectedTopics.length}/{topics.length} selected):
          </Text>

          {topics.map((topic, index) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <TouchableOpacity
                key={topic.id || index}
                onPress={() => toggleSelectTopic(topic.id)}
                style={[
                  styles.topicCard,
                  isSelected && styles.topicCardSelected,
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.topicTitle, isSelected && { color: Colors.PRIMARY }]}>
                      {index + 1}. {topic.title}
                    </Text>
                    <Text style={styles.topicDesc}>{topic.description}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkbox" : "square-outline"}
                    size={24}
                    color={isSelected ? Colors.PRIMARY : Colors.GRAY}
                  />
                </View>
              </TouchableOpacity>
            );
          })}

          <Button
            text={`Create Course (${selectedTopics.length} Topics)`}
            type="fill"
            onPress={onCreateCourse}
            loading={creatingCourse}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  TextInput: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    height: 90,
    textAlignVertical: "top",
    fontSize: 15,
  },
  topicCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    marginBottom: 12,
  },
  topicCardSelected: {
    borderColor: Colors.PRIMARY,
    backgroundColor: "#f0f7ff",
  },
  topicTitle: {
    fontFamily: "outfit-bold",
    fontSize: 16,
    color: "#222",
    marginBottom: 4,
  },
  topicDesc: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
});
