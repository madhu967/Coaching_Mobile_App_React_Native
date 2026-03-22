import { useRouter } from "expo-router";
import Colors from "../constant/Colors";
import { Text, Image, View, TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useContext, useEffect } from "react";
import { UserDetailContext } from "../context/UserDetailContext";
import { auth } from "../config/firebaseConfig";

export default function Index() {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        console.log(user);
        const result = await getDoc(doc(db, "users", user.email));
        setUserDetail(result.data());
        router.replace('/(tabs)/Home');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
      }}
    >
      <Image
        source={require("./../assets/images/landing.png")}
        style={{
          width: "100%",
          height: 300,
          marginTop: 70,
        }}
      ></Image>
      <View
        style={{
          padding: 25,
          backgroundColor: Colors.PRIMARY,
          height: "100%",
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "bold",
            textAlign: "center",
            color: Colors.WHITE,
            fontFamily: "outfit-bold",
          }}
        >
          Welcome to Coaching Guru
        </Text>
        <Text
          style={{
            color: Colors.WHITE,
            fontSize: 20,
            marginTop: 20,
            textAlign: "center",
            fontFamily: "outfit",
          }}
        >
          Transform your ideas into engaging educational content, effortlessly
          with AI!
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/SignUp")}
        >
          <Text style={[styles.buttonText, { color: Colors.PRIMARY }]}>
            Get Started
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: Colors.PRIMARY,
              borderWidth: 1,
              borderColor: Colors.WHITE,
            },
          ]}
          onPress={() => router.push("/auth/Signin")}
        >
          <Text style={[styles.buttonText, { color: Colors.WHITE }]}>
            Already have an Account?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.WHITE,
    padding: 15,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    textAlign: "center",
  },
});
