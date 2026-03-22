import React, { use } from "react";
import { View, Text,Image, TextInput, TouchableOpacity } from "react-native";
import Colors from "../../constant/Colors";
import { StyleSheet,Pressable } from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { useState } from "react";
import { setDoc, doc } from "firebase/firestore";
import { UserDetailContext } from "./../../context/UserDetailContext"

const SignUp = () => {
    const router=useRouter();
    const [fullName,setFullName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");  
    const {userDetail,setUserDetail}=use(UserDetailContext);

    const CreateNewAccount= ()=>{
        createUserWithEmailAndPassword(auth,email,password).then(async (userCredential)=>{
            const user=userCredential.user;
            console .log(user);
            await SaveUser(user);
            //save user to database
        }).catch((error)=>{
            const errorCode=error.code;
            const errorMessage=error.message;
            console.log(errorCode,errorMessage);
        })
    }

    const SaveUser=async (user)=>{
        await setDoc(doc(db,"users",email),{
            name:fullName,
            email:email,
            member:false,
            uid:user?.uid
        }).then(()=>{
            console.log("User saved to database");
        }).catch((error)=>{
            console.log("Error saving user to database",error);
        })

        setUserDetail({
            name:fullName,
            email:email,
            member:false,
            uid:user?.uid   
        })

        
    }
  return (
     <View style={{ display: "flex",  alignItems: "center", padding:25, paddingTop: 100,flex: 1,backgroundColor:Colors.WHITE

      }}>
        <Image source={require("../../assets/images/adaptive-icon.png")}
        style={{ width: 180, height: 180 }} />
        <Text style={{ fontSize: 30, fontFamily: "outfit-bold" }}>Create New Account</Text>
        <TextInput onChangeText={(value)=>setFullName(value)} placeholder="Full Name" style={styles.textInput}></TextInput>
        <TextInput onChangeText={(value)=>setEmail(value)} placeholder="Email" style={styles.textInput}></TextInput>
        <TextInput onChangeText={(value)=>setPassword(value)} placeholder="Password" secureTextEntry={true} style={styles.textInput}></TextInput>
        <TouchableOpacity onPress={CreateNewAccount} style={{ backgroundColor: Colors.PRIMARY, padding: 15, width: "100%", borderRadius: 10, marginTop: 25 }}>
            <Text style={{ color: Colors.WHITE, fontSize: 20, fontFamily: "outfit" ,textAlign:'center'}}>Create Account</Text>
           
        </TouchableOpacity>
         <View style={{ display: "flex", flexDirection: "row", marginTop: 20,gap:5 }}>
            <Text>Already have an account?
            <Pressable onPress={()=>router.push('/auth/Signin')}>
                <Text style={{ color: Colors.PRIMARY, fontSize: 16, fontFamily: "outfit" }}> Sign In Here</Text>
            </Pressable>
         </Text>
         </View>
            
     </View>
  );
};

export default SignUp;


const styles=StyleSheet.create({
    textInput:{
        borderWidth:1,
        padding:15,
        width:"100%",
        fontSize:18,
        marginTop:20,
        borderRadius:8
    }
})