import { Stack } from "expo-router";
import { useFonts} from 'expo-font';
import { UserDetailContext } from "../context/UserDetailContext";
import { RoleProvider } from "../context/RoleContext";
import { useState } from "react";

export default function RootLayout() {

  useFonts({
    'outfit': require('./../assets/fonts/Outfit-Regular.ttf'),
    'outfit-bold': require('./../assets/fonts/Outfit-Bold.ttf'),
  });

  const [userDetail,setUserDetail]=useState();
  return (
    <RoleProvider>
      <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
        <Stack screenOptions={{
          headerShown:false
        }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </UserDetailContext.Provider>
    </RoleProvider>
  );
}
