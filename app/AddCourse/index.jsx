import { View, Text, TextInput } from "react-native";
import React, { useState } from "react";
import Colors from "../../constant/Colors";
import { StyleSheet } from "react-native";
import Button from "../../components/Shared/Button";
import { generateCourseTopic } from "../../constant/Prompt";
import generateContentWithAI from "../../config/AiModel";

export default function AddCourse() {
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [lastRequest, setLastRequest] = useState(null);

  const onGenerateToipic = async () => {
    if (!userInput.trim()) {
      alert("Please enter a course topic");
      return;
    }

    // Prevent duplicate requests
    if (loading) {
      alert("Please wait for the previous request to complete");
      return;
    }

    try {
      setLoading(true);
      setLastRequest(userInput);

      //Combine prompt with user input
      const PROMPT = generateCourseTopic.idea + "\n\nUser Input: " + userInput;
      const aiResponse = await generateContentWithAI(PROMPT);
      console.log("Generated Topics:", aiResponse);

      // Parse and validate JSON response
      try {
        const parsedTopics = JSON.parse(aiResponse);
        console.log("Parsed Topics:", parsedTopics);
        //TODO: Navigate to next screen with topics
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

  return (
    <View style={{ padding: 25, backgroundColor: Colors.WHITE, flex: 1 }}>
      <Text style={{ fontFamily: "outfit-bold", fontSize: 25, marginTop: 25 }}>
        Create New Course
      </Text>
      <Text style={{ fontFamily: "outfit", fontSize: 20 }}>
        What you want to learn today?
      </Text>
      <Text style={{ fontFamily: "outfit", fontSize: 15, color: Colors.GRAY }}>
        What course would you like to create?(ex.Learn React,Digital Marketing)
      </Text>
      <TextInput
        placeholder="(Ex.Learn Python,Learn Digital Marketing)"
        style={styles.TextInput}
        numberOfLines={3}
        multiline={true}
        onChangeText={(value) => setUserInput(value)}
      ></TextInput>
      <Button
        text={"Generate Topic"}
        type="outline"
        onPress={() => onGenerateToipic()}
        loading={loading}
      ></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  TextInput: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    height: 100,
    textAlignVertical: "top",
    alignItems: "flex-start",
    fontSize: 15,
  },
});
