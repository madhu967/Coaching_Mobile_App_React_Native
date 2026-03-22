import { View, Text,Image } from 'react-native'
import React from 'react'

export default function NoCourse() {
  return (
    <View style={{marginTop: 40,display:'flex',alignItems:'center',gap:10}}>
      <Image source={require('../../assets/images/book.png')} 
      style={{
        height:200,
        width:200
      }}/>
      <Text style={{ fontSize: 18, fontWeight: "outfit-bold" }}>
        You Don't Have Any Courses Enrolled
      </Text>
    </View>
  )
}