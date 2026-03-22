import React,{useContext, useState} from 'react'
import { View, Text,Image, TextInput, TouchableOpacity, ToastAndroid  } from 'react-native'
import Colors from "../../constant/Colors";
import { StyleSheet,Pressable } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../../config/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { UserDetailContext } from '../../context/UserDetailContext';


const Signin = () => {

    const router=useRouter();
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const {userDetail,setUserDetail}=useContext(UserDetailContext);
    const [loading,setLoading]=useState(false);
    const onSignInClick=async()=>{
        setLoading(true);
        await signInWithEmailAndPassword(auth,email,password).then(async(userCredential)=>{
            const user=userCredential.user;
            console.log(user);
            await getUserDetail();
            ToastAndroid.show("Sign in successful!", ToastAndroid.SHORT); 
            setLoading(false);
            router.replace('/{tabs}/Home');
            // router.push('/home');
        }).catch((error)=>{         
            const errorCode=error.code;
            const errorMessage=error.message;
            console.log(errorCode,errorMessage);
            setLoading(false);
            ToastAndroid.show("Error signing in. Please check your credentials and try again.", ToastAndroid.LONG); 
        })
    }

    const getUserDetail=async()=>{
        const result=await getDoc(doc(db,"users",email));
        if(result.exists()){
            console.log("User Detail:",result.data());
            setUserDetail(result.data());
        }else{
            console.log("No such user in database");
        }
    }

  return (
     <View style={{ display: "flex",  alignItems: "center", padding:25, paddingTop: 100,flex: 1,backgroundColor:Colors.WHITE

      }}>
        <Image source={require("../../assets/images/adaptive-icon.png")}
        style={{ width: 180, height: 180 }} />
        <Text style={{ fontSize: 30, fontFamily: "outfit-bold" }}>Welcome Back</Text>
        
        <TextInput placeholder="Email" onChangeText={(value)=>setEmail(value)} style={styles.textInput}></TextInput>
        <TextInput placeholder="Password" onChangeText={(value)=>setPassword(value)} secureTextEntry={true} style={styles.textInput}></TextInput>
        <TouchableOpacity disabled={loading} onPress={onSignInClick} style={{ backgroundColor: Colors.PRIMARY, padding: 15, width: "100%", borderRadius: 10, marginTop: 25 }}>
            {!loading? <Text style={{ color: Colors.WHITE, fontSize: 20, fontFamily: "outfit" ,textAlign:'center'}}>Sign In</Text> : <Text style={{ color: Colors.WHITE, fontSize: 20, fontFamily: "outfit" ,textAlign:'center'}}>Signing In...</Text>}
           
        </TouchableOpacity >
         <View style={{ display: "flex", flexDirection: "row", marginTop: 20,gap:5 }}>
            <Text>Don't have an account?
            <Pressable onPress={()=>router.push('/auth/SignUp')}>
                <Text style={{ color: Colors.PRIMARY, fontSize: 16, fontFamily: "outfit" }}> Sign Up Here</Text>
            </Pressable>
         </Text>
         </View>
            
     </View>
  )
}

export default Signin

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