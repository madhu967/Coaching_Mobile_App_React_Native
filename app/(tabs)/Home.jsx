import Header from "../../components/Home/Header";
import React, { useContext } from "react";
import { View, Text, Platform } from "react-native";
import { UserDetailContext } from "../../context/UserDetailContext";
import Colors from "../../constant/Colors";
import NoCourse from "../../components/Home/NoCourse";

const Home = () => {
  const { userDetail } = useContext(UserDetailContext);

  return (
    <View style={{ padding: 25, paddingTop: Platform.OS === "ios" && 45,flex: 1, backgroundColor: Colors.WHITE }}>
      <Header userDetail={userDetail}></Header>
      <NoCourse></NoCourse>
    </View>
  );
};

export default Home;
