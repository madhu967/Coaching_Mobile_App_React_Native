import React from "react";
import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";

const TabLayout = () => {
  return (
    <Tabs screenOptions={{
      headerShown:false
    }}>
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" size={size} color={color} />
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="Explore"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="compass" size={size} color={color} />
          ),
          tabBarLabel: "Explore",
        }}
      />
      <Tabs.Screen
        name="Progress"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="bars" size={size} color={color} />
          ),
          tabBarLabel: "Progress",
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" size={size} color={color} />
          ),
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
