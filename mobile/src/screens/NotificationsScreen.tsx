import React,{useCallback,useMemo,useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {ActivityIndicator,Alert,Pressable,RefreshControl,ScrollView,Text,TextInput,View} from 'react-native';
import {api} from '../api/client';

type Filter='all'|'unread'|'appointments'|'messages'|'system';
type NotificationRow={id:string;type:string;title:string;body:string;createdAt:string;isRead:boolean;appointmentId?:string|null;data?:Record<string,any>};
const palette={ink:'#172B4D',muted:'#68788D',line:'#E1E8EF',teal:'#087E8B',bg:'#F6F8FB',unread:'#EAF5F6',white:'#FFFFFF',amber:'#A66A12'};
const dateLabel=(value?:string)=>value?new Date(value).toLocaleString('ar-IQ',{dateStyle:'medium',timeStyle:'short'}):'';
const groupOf=(item:NotificationRow):Exclude<Filter,'all'|'unread'>=>{
 const t=String(item.type||'');
 if(t.includes('message'))return 'messages';
 if(t.includes('appointment')||t.includes('booking')||item.appointmentId||item.data?.facilityBookingId||item.data?.bookingId)return 'appointments';
 return 'system';
};
const categoryLabel=(item:NotificationRow)=>groupOf(item)==='appointments'?'حجوزات ومواعيد':groupOf(item)==='messages'?'الرسائل':'تنبيهات الحساب';
const hasDestination=(item:NotificationRow)=>!!(item.appointmentId||item.data?.appointmentId||item.data?.facilityBookingId||item.data?.bookingId||item.data?.messageId||item.data?.screen);
const dayGroup=(value:string)=>{const d=new Date(value);const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();const day=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();if(day===today)return 'اليوم';if(day===today-86400000)return 'أمس';return 'سابقاً';};
export function NotificationsScreen({role,onOpenRelated}:{role:'patient'|'doctor'|'owner';onOpenRelated:(item:any)=>void}){
 const [rows,setRows]=useState<NotificationRow[]>([]);const [unread,setUnread]=useState(0);const [busy,setBusy]=useState(true);const [refreshing,setRefreshing]=useState(false);const [filter,setFilter]=useState<Filter>('all');const [search,setSearch]=useState('');const [opening,setOpening]=useState<string|null>(null);
 const load=useCallback(async()=>{try{const result=await api.notifications(1,50);setRows(result.items||[]);setUnread(result.unreadCount||0);}catch(e){Alert.alert('تعذر تحميل الإشعارات',e instanceof Error?e.message:'حدث خطأ');}finally{setBusy(false);setRefreshing(false);}},[]);
 useFocusEffect(useCallback(()=>{load();},[load]));
 const visible=useMemo(()=>rows.filter(item=>{const matchFilter=filter==='all'||(filter==='unread'?!item.isRead:groupOf(item)===filter);const q=search.trim().toLocaleLowerCase('ar');const matchSearch=!q||`${item.title||''} ${item.body||''} ${item.type||''}`.toLocaleLowerCase('ar').includes(q);return matchFilter&&matchSearch;}),[rows,filter,search]);
 const groups=useMemo(()=>{const out:{label:string;items:NotificationRow[]}[]=[];for(const item of visible){const label=dayGroup(item.createdAt);let group=out.find(x=>x.label===label);if(!group){group={label,items:[]};out.push(group);}group.items.push(item);}return out;},[visible]);
 const markAll=async()=>{try{await api.markAllNotificationsRead();setRows(old=>old.map(x=>({...x,isRead:true})));setUnread(0);}catch(e){Alert.alert('تعذر تحديث الإشعارات',e instanceof Error?e.message:'حدث خطأ');}};
 const open=async(item:NotificationRow)=>{if(opening)return;setOpening(item.id);try{if(!item.isRead){await api.markNotificationRead(item.id);setRows(old=>old.map(x=>x.id===item.id?{...x,isRead:true}:x));setUnread(old=>Math.max(0,old-1));}if(hasDestination(item))onOpenRelated(item);}catch(e){Alert.alert('تعذر فتح الإشعار',e instanceof Error?e.message:'حدث خطأ');}finally{setOpening(null);}};
 const filters:{key:Filter;label:string}[]=[{key:'all',label:'الكل'},{key:'unread',label:`غير مقروء (${unread})`},{key:'appointments',label:'الحجوزات'},{key:'messages',label:'الرسائل'},{key:'system',label:'الحساب'}];
 return <ScrollView style={{flex:1,backgroundColor:palette.bg}} contentContainerStyle={{padding:18,paddingBottom:40}} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={palette.teal}/> }>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:5}}><Text style={{fontSize:23,fontWeight:'900',color:palette.ink}}>مركز الإشعارات الذكي</Text><View style={{backgroundColor:palette.teal,borderRadius:18,paddingHorizontal:11,paddingVertical:6}}><Text style={{color:'#fff',fontWeight:'800'}}>{unread} جديد</Text></View></View>
  <Text style={{textAlign:'right',color:palette.muted,lineHeight:23,marginBottom:13}}>تنبيهات الحجوزات والرسائل وتحديثات الحساب، مرتبة لتصل إلى المهم بسرعة. الإشعارات غير المقروءة: {unread}</Text>
  <TextInput value={search} onChangeText={setSearch} placeholder="ابحث في الإشعارات..." placeholderTextColor="#8290A3" textAlign="right" style={{backgroundColor:'#fff',borderWidth:1,borderColor:palette.line,borderRadius:12,padding:13,fontSize:15,color:palette.ink,marginBottom:11}}/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,flexDirection:'row-reverse',paddingBottom:10}}>{filters.map(f=><Pressable key={f.key} onPress={()=>setFilter(f.key)} style={{paddingVertical:9,paddingHorizontal:13,borderRadius:20,backgroundColor:filter===f.key?palette.teal:'#fff',borderWidth:1,borderColor:filter===f.key?palette.teal:palette.line}}><Text style={{color:filter===f.key?'#fff':palette.ink,fontWeight:'700'}}>{f.label}</Text></Pressable>)}</ScrollView>
  {unread>0&&<Pressable onPress={markAll} style={{alignSelf:'flex-start',paddingVertical:8,paddingHorizontal:12,marginBottom:8}}><Text style={{color:palette.teal,fontWeight:'800'}}>تحديد الكل كمقروء</Text></Pressable>}
  {busy?<ActivityIndicator size="large" color={palette.teal} style={{margin:30}}/>:groups.length===0?<View style={{backgroundColor:'#fff',borderRadius:16,padding:25,alignItems:'center',marginTop:12}}><Text style={{fontSize:30,marginBottom:8}}>✓</Text><Text style={{fontSize:17,fontWeight:'800',color:palette.ink}}>{search?'لا توجد نتائج مطابقة':'لا توجد إشعارات هنا'}</Text><Text style={{color:palette.muted,textAlign:'center',marginTop:6,lineHeight:22}}>{filter==='unread'?'أنت على اطلاع بكل الإشعارات.':'ستظهر هنا التنبيهات الجديدة عند وصولها.'}</Text></View>:groups.map(group=><View key={group.label} style={{marginTop:10}}><Text style={{textAlign:'right',fontSize:15,fontWeight:'900',color:palette.ink,marginBottom:5}}>{group.label}</Text>{group.items.map(item=><View key={item.id} style={{backgroundColor:item.isRead?palette.white:palette.unread,borderColor:item.isRead?palette.line:'#B8DDE0',borderWidth:1,borderRadius:14,padding:14,marginVertical:5}}>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:11,color:item.isRead?palette.muted:palette.teal,fontWeight:'800'}}>{item.isRead?'مقروء':'● جديد'}</Text><Text style={{fontSize:11,color:palette.muted}}>{categoryLabel(item)}</Text></View>
   <Text style={{textAlign:'right',fontSize:16,fontWeight:'900',color:palette.ink,marginTop:8}}>{item.title||'إشعار من طبيبي'}</Text><Text style={{textAlign:'right',fontSize:14,color:'#506176',lineHeight:22,marginTop:5}}>{item.body}</Text><Text style={{textAlign:'right',fontSize:11,color:'#8290A3',marginTop:8}}>{dateLabel(item.createdAt)}</Text>
   <Pressable disabled={opening===item.id} onPress={()=>open(item)} style={{backgroundColor:hasDestination(item)?palette.teal:'#EEF3F6',borderRadius:10,padding:11,alignItems:'center',marginTop:10}}><Text style={{fontWeight:'800',color:hasDestination(item)?'#fff':palette.ink}}>{opening===item.id?'جارٍ الفتح...':hasDestination(item)?item.data?.messageId?'فتح المحادثة':item.data?.facilityBookingId||item.data?.bookingId?'عرض الحجز':'عرض التفاصيل':'تحديد كمقروء'}</Text></Pressable>
  </View>)}</View>)}
  <Text style={{textAlign:'center',fontSize:11,color:palette.muted,marginTop:15}}>المعروض {visible.length} من {rows.length} إشعار · يتم تحديث القائمة عند فتح المركز أو السحب للأسفل</Text>
 </ScrollView>;
}
