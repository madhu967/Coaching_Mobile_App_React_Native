import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { UserDetailContext } from "../../context/UserDetailContext";
import Feather from '@expo/vector-icons/Feather';

const Header = () => {
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  return (
    <View style={{diaplay:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
      <View>
        <Text style={{ fontSize: 24, fontWeight: "bold" ,marginTop: 20,fontFamily: "outfit-bold"}}>
        Hello, {userDetail?.name || "Guest"}!
      </Text>
      <Text style={{ fontSize: 16,fontFamily: "outfit", color: "#666" }}>
        Let's get started!
      </Text>
      </View>
      <View>
        <TouchableOpacity><Feather name="settings" size={30} color="black" /></TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
