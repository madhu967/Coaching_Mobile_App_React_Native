import { View, Text,Image } from 'react-native'
import React from 'react'
import Button from '../Shared/Button'
import { useRouter } from 'expo-router'

export default function NoCourse() {
  const router=useRouter();
  return (
    <View style={{marginTop: 40,display:'flex',alignItems:'center',gap:10}}>
      <Image source={require('../../assets/images/book.png')} 
      style={{
        height:200,
        width:200
      }}/>
      <Text style={{ fontSize: 20, fontWeight: "outfit-bold" }}>
        {"You Don't Have Any Courses Enrolled"}
      </Text>
      <Button text={'+ Create New Course'} onPress={()=>router.push('/AddCourse')}></Button>
      <Button text={'Explore Existing Courses'} type='outline' onPress={()=>router.push('/(tabs)/Explore')}></Button>
    </View>
  )
}