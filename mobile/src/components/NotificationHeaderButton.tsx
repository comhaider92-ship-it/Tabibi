import React,{useCallback,useEffect,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {api} from '../api/client';

/** Header entry that refreshes the signed-in account's unread count on navigation focus. */
export function NotificationHeaderButton({navigation,color='#087E8B'}:{navigation:any;color?:string}){
 const [count,setCount]=useState(0);
 const refresh=useCallback(async()=>{try{const result=await api.unreadNotifications();setCount(Math.max(0,result.unreadCount||0));}catch{/* Keep navigation usable if notifications are temporarily unavailable. */}},[]);
 useEffect(()=>{refresh();const unsubscribe=navigation.addListener?.('focus',refresh);return()=>{if(typeof unsubscribe==='function')unsubscribe();};},[navigation,refresh]);
 return <Pressable accessibilityRole="button" accessibilityLabel={count?`الإشعارات، ${count} غير مقروء`:'الإشعارات'} onPress={()=>navigation.navigate('Notifications')} style={{paddingHorizontal:4,paddingVertical:6}}>
  <View style={{position:'relative',paddingRight:5}}>
   <Text style={{color,fontWeight:'700'}}>الإشعارات</Text>
   {count>0&&<View style={{position:'absolute',top:-9,right:-9,minWidth:18,height:18,borderRadius:9,backgroundColor:'#D94841',alignItems:'center',justifyContent:'center',paddingHorizontal:4}}><Text style={{color:'#FFFFFF',fontSize:10,fontWeight:'800'}}>{count>99?'99+':count}</Text></View>}
  </View>
 </Pressable>;
}
