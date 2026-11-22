import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
export function Screen({children, style}:{children:React.ReactNode;style?:ViewStyle}) { return <ScrollView style={styles.root} contentContainerStyle={[styles.content,style]} keyboardShouldPersistTaps="handled"><View>{children}</View></ScrollView>; }
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#F6F8FB'},content:{padding:18,paddingBottom:36}});
