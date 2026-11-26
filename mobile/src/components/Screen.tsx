import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
export function Screen({children, style, footer}:{children:React.ReactNode;style?:ViewStyle;footer?:React.ReactNode}) { return <View style={styles.root}><ScrollView style={styles.scroll} contentContainerStyle={[styles.content,style]} keyboardShouldPersistTaps="handled"><View>{children}</View></ScrollView>{footer}</View>; }
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#F6F8FB'},scroll:{flex:1},content:{padding:18,paddingBottom:36}});
