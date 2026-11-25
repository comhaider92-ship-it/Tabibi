import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function Heading({children}:{children:React.ReactNode}){return <Text style={s.heading}>{children}</Text>}
export function Body({children}:{children:React.ReactNode}){return <Text style={s.body}>{children}</Text>}
export function Field(props:React.ComponentProps<typeof TextInput>){return <TextInput placeholderTextColor="#98A6B7" textAlign="right" style={s.field} {...props}/>}
export function Action({title,onPress,disabled}:{title:string;onPress:()=>void;disabled?:boolean}){return <Pressable disabled={disabled} onPress={onPress} style={[s.action,disabled&&{opacity:.55}]}><Text style={s.actionText}>{title}</Text></Pressable>}
export function Loading(){return <ActivityIndicator size="large" color="#087E8B" style={{margin:24}}/>}
export function Item({title,subtitle,onPress,icon}:{title:string;subtitle?:string;onPress?:()=>void;icon?:string}){return <Pressable onPress={onPress} style={s.item}><View style={s.iconBox}><Text style={s.icon}>{icon||'✦'}</Text></View><View style={{flex:1}}><Text style={s.itemTitle}>{title}</Text>{!!subtitle&&<Text style={s.sub}>{subtitle}</Text>}</View><Text style={s.arrow}>‹</Text></Pressable>}
const s=StyleSheet.create({
 heading:{fontSize:24,fontWeight:'900',color:'#123047',textAlign:'right',marginBottom:14,marginTop:8},
 body:{fontSize:15,color:'#586B7D',textAlign:'right',lineHeight:25,marginBottom:5},
 field:{backgroundColor:'#fff',borderWidth:1,borderColor:'#DFE8EC',borderRadius:16,paddingHorizontal:16,paddingVertical:14,fontSize:16,marginVertical:8,color:'#123047',shadowColor:'#123047',shadowOpacity:.035,shadowRadius:8,elevation:1},
 action:{backgroundColor:'#087E8B',borderRadius:16,padding:16,alignItems:'center',marginTop:12,shadowColor:'#087E8B',shadowOpacity:.12,shadowRadius:8,elevation:2},
 actionText:{color:'#fff',fontWeight:'800',fontSize:16},
 item:{backgroundColor:'#fff',padding:14,borderRadius:18,marginVertical:7,flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:'#E8EFF2',shadowColor:'#123047',shadowOpacity:.04,shadowRadius:8,elevation:1},
 itemTitle:{fontSize:16,fontWeight:'800',color:'#123047',textAlign:'right'},
 sub:{fontSize:13,color:'#708294',textAlign:'right',marginTop:5,lineHeight:20},
 arrow:{fontSize:26,color:'#087E8B',paddingLeft:2},
 iconBox:{width:48,height:48,borderRadius:15,backgroundColor:'#E8F5F5',alignItems:'center',justifyContent:'center'},
 icon:{fontSize:23},});
