import React,{useState} from 'react';
import {PreviewApp} from './src/PreviewApp';
import {ActivityIndicator,View,Text,Pressable} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LoginScreen} from './src/screens/LoginScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {SearchScreen} from './src/screens/SearchScreen';
import {DetailScreen} from './src/screens/DetailScreen';
import {BookingScreen} from './src/screens/BookingScreen';
import {BookingsScreen} from './src/screens/BookingsScreen';
import {PatientProfileScreen} from './src/screens/PatientProfileScreen';
import {PatientHealthFileScreen} from './src/screens/PatientHealthFileScreen';
import {AccountSecurityScreen} from './src/screens/AccountSecurityScreen';
import {DoctorDashboardScreen,OwnerDashboardScreen} from './src/screens/ProviderDashboardScreen';
import {ScheduleManagementScreen} from './src/screens/ScheduleManagementScreen';
import {DoctorProfileScreen} from './src/screens/DoctorProfileScreen';
import {OwnerReviewScreen} from './src/screens/OwnerReviewScreen';
import {FacilityServicesScreen} from './src/screens/FacilityServicesScreen';
import {DoctorSubscriptionScreen} from './src/screens/DoctorSubscriptionScreen';
import {OwnerSubscriptionsScreen} from './src/screens/OwnerSubscriptionsScreen';
import {OwnerAdsScreen} from './src/screens/OwnerAdsScreen';
import {OwnerFinanceScreen} from './src/screens/OwnerFinanceScreen';
import {OwnerFacilityCreateScreen} from './src/screens/OwnerFacilityCreateScreen';
import {OwnerUsersScreen} from './src/screens/OwnerUsersScreen';
import {OwnerFacilitiesScreen} from './src/screens/OwnerFacilitiesScreen';
import {OwnerAuditScreen} from './src/screens/OwnerAuditScreen';
import {OwnerMessageReportsScreen} from './src/screens/OwnerMessageReportsScreen';
import {NotificationsScreen} from './src/screens/NotificationsScreen';
import {NotificationHeaderButton} from './src/components/NotificationHeaderButton';
import {api,restoreAccessToken,setAccessToken} from './src/api/client';
import {registerPushDevice} from './src/notifications/registerPush';
const Stack=createNativeStackNavigator();
const patientTabs=[{key:'Home',label:'الرئيسية',icon:'home'},{key:'Bookings',label:'المواعيد',icon:'calendar'},{key:'Notifications',label:'الإشعارات',icon:'bell'},{key:'PatientProfile',label:'حسابي',icon:'user'},{key:'More',label:'المزيد',icon:'more'}];
function TabGlyph({name,active}:{name:string;active:boolean}){
 const color=active?'#078B91':'#8293A1';
 const line={borderColor:color,borderWidth:2} as const;
 if(name==='home')return <View style={{width:24,height:24,alignItems:'center',justifyContent:'center'}}><View style={{width:13,height:13,borderLeftWidth:2,borderTopWidth:2,borderColor:color,transform:[{rotate:'45deg'}],position:'absolute',top:3}}/><View style={{width:15,height:12,borderTopWidth:2,borderLeftWidth:2,borderRightWidth:2,borderColor:color,position:'absolute',bottom:2,borderTopLeftRadius:2,borderTopRightRadius:2}}/><View style={{width:4,height:7,backgroundColor:color,position:'absolute',bottom:2,borderTopLeftRadius:2,borderTopRightRadius:2}}/></View>;
 if(name==='calendar')return <View style={[{width:19,height:18,borderRadius:5,alignItems:'center',justifyContent:'center'},line]}><View style={{position:'absolute',top:4,left:0,right:0,height:2,backgroundColor:color}}/><View style={{flexDirection:'row',gap:3,marginTop:6}}><View style={{width:3,height:3,borderRadius:2,backgroundColor:color}}/><View style={{width:3,height:3,borderRadius:2,backgroundColor:color}}/><View style={{width:3,height:3,borderRadius:2,backgroundColor:color}}/></View><View style={{position:'absolute',top:-4,left:4,width:2,height:6,backgroundColor:color,borderRadius:2}}/><View style={{position:'absolute',top:-4,right:4,width:2,height:6,backgroundColor:color,borderRadius:2}}/></View>;
 if(name==='bell')return <View style={{width:22,height:24,alignItems:'center',justifyContent:'center'}}><View style={{width:15,height:16,borderTopLeftRadius:9,borderTopRightRadius:9,borderBottomLeftRadius:4,borderBottomRightRadius:4,borderWidth:2,borderColor:color,borderBottomWidth:3}}/><View style={{width:6,height:3,backgroundColor:color,borderRadius:3,marginTop:1}}/><View style={{position:'absolute',top:2,right:2,width:4,height:4,borderRadius:3,backgroundColor:active?'#E99B53':color}}/></View>;
 if(name==='user')return <View style={{width:22,height:24,alignItems:'center',justifyContent:'center',gap:2}}><View style={[{width:8,height:8,borderRadius:5},line]}/><View style={{width:17,height:9,borderTopLeftRadius:10,borderTopRightRadius:10,borderWidth:2,borderBottomWidth:0,borderColor:color,marginTop:1}}/></View>;
 if(name==='health')return <View style={{width:22,height:22,borderRadius:8,borderWidth:2,borderColor:color,alignItems:'center',justifyContent:'center'}}><View style={{width:10,height:2,backgroundColor:color,borderRadius:2}}/><View style={{position:'absolute',width:2,height:10,backgroundColor:color,borderRadius:2}}/></View>;
 return <View style={{width:24,height:24,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:3}}>{[0,1,2].map(i=><View key={i} style={{width:4.5,height:4.5,borderRadius:3,backgroundColor:color}}/>)}</View>;
}
function PatientTabBar({navigation,active}:{navigation:any;active:string}){
 return <View style={{flexDirection:'row',backgroundColor:'#FFFFFF',borderTopWidth:1,borderTopColor:'#DCEBEA',paddingTop:7,paddingBottom:8,paddingHorizontal:5}}>
  {patientTabs.map(tab=>{const selected=active===tab.key;return <Pressable key={tab.key} accessibilityRole="button" accessibilityLabel={tab.label} onPress={()=>navigation.navigate(tab.key as never)} style={{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:2}}>
   <View style={{minWidth:38,height:30,paddingHorizontal:9,borderRadius:15,backgroundColor:selected?'#E7F5F3':'transparent',alignItems:'center',justifyContent:'center'}}><TabGlyph name={tab.icon} active={selected}/></View>
   <Text style={{fontSize:10,fontWeight:selected?'900':'600',color:selected?'#078B91':'#718596',marginTop:3}}>{tab.label}</Text>
   {selected&&<View style={{height:2.5,width:18,backgroundColor:'#078B91',borderRadius:3,marginTop:3}}/>}
  </Pressable>;})}
 </View>;
}
function PatientTabScreen({children,navigation,active}:{children:any;navigation:any;active:string}){
 return <View style={{flex:1,backgroundColor:'#F7FAFC'}}><View style={{flex:1}}>{children}</View><PatientTabBar navigation={navigation} active={active}/></View>;
}
function PatientMoreScreen({navigation,onLogout}:{navigation:any;onLogout:()=>void}){
 const links=[{title:'الملف الصحي',subtitle:'تقاريرك ومعلوماتك الصحية',screen:'PatientHealthFile',icon:'health'},{title:'الملف الشخصي',subtitle:'بيانات الحساب ومعلومات التواصل',screen:'PatientProfile',icon:'user'},{title:'حجوزاتي',subtitle:'متابعة مواعيدك الطبية',screen:'Bookings',icon:'calendar'}];
 return <View style={{flex:1,backgroundColor:'#F7FAFC',padding:18}}>
  <Text style={{fontSize:24,fontWeight:'900',color:'#142D42',textAlign:'right',marginBottom:8}}>المزيد من طبيبي</Text>
  <Text style={{fontSize:14,color:'#718596',textAlign:'right',lineHeight:23,marginBottom:12}}>كل ما تحتاجه لإدارة تجربتك الصحية في مكان واحد.</Text>
  {links.map(x=><Pressable key={x.screen} onPress={()=>navigation.navigate(x.screen as never)} style={{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E3ECEF',borderRadius:18,padding:16,marginVertical:6,flexDirection:'row',alignItems:'center',gap:12}}>
   <View style={{width:46,height:46,borderRadius:15,backgroundColor:'#E8F6F4',alignItems:'center',justifyContent:'center'}}><TabGlyph name={x.icon} active={true}/></View>
   <View style={{flex:1}}><Text style={{fontSize:16,fontWeight:'800',color:'#142D42',textAlign:'right'}}>{x.title}</Text><Text style={{fontSize:12,color:'#718596',textAlign:'right',marginTop:4}}>{x.subtitle}</Text></View>
   <Text style={{fontSize:24,color:'#078B91'}}>‹</Text>
  </Pressable>)}
  <Pressable onPress={onLogout} style={{marginTop:18,padding:16,borderRadius:16,backgroundColor:'#FFF1F0',alignItems:'center'}}><Text style={{fontSize:15,fontWeight:'800',color:'#B5473C'}}>تبديل الحساب</Text></Pressable>
 </View>;
}
function LiveApp(){
 const [role,setRole]=useState<string|null>(null);const [ready,setReady]=useState(false);const [pushDeviceId,setPushDeviceId]=useState<string|null>(null);const [kind,setKind]=useState<'doctors'|'facilities'>('doctors');const [query,setQuery]=useState('');const [selected,setSelected]=useState<any>(null);
 React.useEffect(()=>{let alive=true;(async()=>{try{const token=await restoreAccessToken();if(token){const user=await api.me();if(alive&&['patient','doctor','owner'].includes(user.role))setRole(user.role);else await setAccessToken(null);}}catch{await setAccessToken(null);}finally{if(alive)setReady(true);}})();return()=>{alive=false;};},[]);
 React.useEffect(()=>{let alive=true;if(role){registerPushDevice().then(id=>{if(alive&&id)setPushDeviceId(id);}).catch(()=>{});}return()=>{alive=false;};},[role]);
 const logout=async()=>{if(pushDeviceId)await api.removePushDevice(pushDeviceId).catch(()=>{});setPushDeviceId(null);await setAccessToken(null);setRole(null);};
 if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F6F8FB'}}><ActivityIndicator size="large" color="#087E8B"/><Text style={{marginTop:12,color:'#506176'}}>جارٍ تجهيز طبيبي...</Text></View>;
 return <NavigationContainer><Stack.Navigator screenOptions={{headerTitleAlign:'center',headerTintColor:'#087E8B'}}>
 {!role?<Stack.Screen name="Login" options={{title:'تسجيل الدخول'}}>{()=> <LoginScreen onLogin={setRole}/>}</Stack.Screen>:role==='doctor'?<>
  <Stack.Screen name="DoctorDashboard" options={{title:'بوابة الطبيب',headerRight:({tintColor,navigation}:any)=> <View style={{flexDirection:'row',alignItems:'center',gap:14}}><NotificationHeaderButton navigation={navigation} color={tintColor||'#087E8B'}/><Pressable onPress={()=>navigation.navigate('AccountSecurity' as never)}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>الأمان</Text></Pressable><Pressable onPress={logout}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>تبديل الحساب</Text></Pressable></View>}}>{({navigation})=> <DoctorDashboardScreen onManageSchedule={()=>navigation.navigate('Schedule' as never)} onManageProfile={()=>navigation.navigate('DoctorProfile' as never)} onManageSubscription={()=>navigation.navigate('DoctorSubscription' as never)}/>}</Stack.Screen>
  <Stack.Screen name="AccountSecurity" options={{title:'أمان الحساب'}}>{()=> <AccountSecurityScreen onLogout={logout}/>}</Stack.Screen>
  <Stack.Screen name="Notifications" options={{title:'الإشعارات'}}>{({navigation})=><NotificationsScreen role="doctor" onOpenRelated={()=>navigation.navigate('DoctorDashboard' as never)}/>}</Stack.Screen>
  <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{title:'الملف المهني'}}/>
  <Stack.Screen name="DoctorSubscription" component={DoctorSubscriptionScreen} options={{title:'الاشتراك'}}/>
  <Stack.Screen name="Schedule" options={{title:'إدارة الدوام والمواعيد'}}>{()=> <ScheduleManagementScreen role="doctor"/>}</Stack.Screen>
 </>:role==='owner'?<>
  <Stack.Screen name="OwnerDashboard" options={{title:'بوابة المالك',headerRight:({tintColor,navigation}:any)=> <View style={{flexDirection:'row',alignItems:'center',gap:14}}><NotificationHeaderButton navigation={navigation} color={tintColor||'#087E8B'}/><Pressable onPress={()=>navigation.navigate('AccountSecurity' as never)}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>الأمان</Text></Pressable><Pressable onPress={logout}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>تبديل الحساب</Text></Pressable></View>}}>{({navigation})=> <OwnerDashboardScreen onManageSchedule={()=>navigation.navigate('Schedule' as never)} onManageServices={()=>navigation.navigate('FacilityServices' as never)} onReview={()=>navigation.navigate('OwnerReview' as never)} onManageSubscriptions={()=>navigation.navigate('OwnerSubscriptions' as never)} onManageAds={()=>navigation.navigate('OwnerAds' as never)} onManageFinance={()=>navigation.navigate('OwnerFinance' as never)} onCreateFacility={()=>navigation.navigate('OwnerFacilityCreate' as never)} onManageUsers={()=>navigation.navigate('OwnerUsers' as never)} onManageFacilities={()=>navigation.navigate('OwnerFacilities' as never)} onAudit={()=>navigation.navigate('OwnerAudit' as never)} onMessageReports={()=>navigation.navigate('OwnerMessageReports' as never)}/>}</Stack.Screen>
  <Stack.Screen name="AccountSecurity" options={{title:'أمان الحساب'}}>{()=> <AccountSecurityScreen onLogout={logout}/>}</Stack.Screen>
  <Stack.Screen name="Notifications" options={{title:'الإشعارات'}}>{({navigation})=><NotificationsScreen role="owner" onOpenRelated={(item)=>{const target=item?.data?.screen;navigation.navigate((target==='OwnerSubscriptions'?'OwnerSubscriptions':target==='OwnerReview'?'OwnerReview':target==='OwnerMessageReports'?'OwnerMessageReports':'OwnerDashboard') as never);}}/>}</Stack.Screen>
  <Stack.Screen name="OwnerSubscriptions" component={OwnerSubscriptionsScreen} options={{title:'لوحة المالك والاشتراكات'}}/>
  <Stack.Screen name="OwnerAds" component={OwnerAdsScreen} options={{title:'إدارة الإعلانات'}}/>
  <Stack.Screen name="OwnerFinance" component={OwnerFinanceScreen} options={{title:'التقارير المالية'}}/>
  <Stack.Screen name="OwnerFacilityCreate" options={{title:'إضافة منشأة طبية'}}>{({navigation})=><OwnerFacilityCreateScreen onCreated={()=>navigation.navigate('OwnerReview' as never)}/>}</Stack.Screen>
  <Stack.Screen name="OwnerUsers" component={OwnerUsersScreen} options={{title:'إدارة الحسابات'}}/>
  <Stack.Screen name="OwnerFacilities" component={OwnerFacilitiesScreen} options={{title:'إدارة المنشآت'}}/>
  <Stack.Screen name="OwnerAudit" component={OwnerAuditScreen} options={{title:'سجل عمليات المالك'}}/>
  <Stack.Screen name="OwnerMessageReports" component={OwnerMessageReportsScreen} options={{title:'بلاغات الرسائل'}}/>
  <Stack.Screen name="FacilityServices" component={FacilityServicesScreen} options={{title:'إدارة الخدمات'}}/>
  <Stack.Screen name="OwnerReview" component={OwnerReviewScreen} options={{title:'مراجعة الطلبات'}}/>
  <Stack.Screen name="Schedule" options={{title:'إدارة الدوام والمواعيد'}}>{()=> <ScheduleManagementScreen role="owner"/>}</Stack.Screen>
 </>:<>
  <Stack.Screen name="Home" options={{title:'طبيبي',headerRight:({tintColor,navigation}:any)=> <View style={{flexDirection:'row',alignItems:'center',gap:14}}><NotificationHeaderButton navigation={navigation} color={tintColor||'#087E8B'}/><Pressable onPress={logout}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>تبديل الحساب</Text></Pressable></View>}}>{({navigation})=><PatientTabScreen navigation={navigation} active="Home"><HomeScreen onSearch={(k,q)=>{setKind(k);setQuery(q);navigation.navigate('Search' as never);}} onBookings={()=>navigation.navigate('Bookings' as never)} onProfile={()=>navigation.navigate('PatientProfile' as never)} onHealthFile={()=>navigation.navigate('PatientHealthFile' as never)} onAdTarget={ad=>{setKind(ad.targetType==='doctor'?'doctors':'facilities');api.publicAdTarget(ad.targetType,ad.targetId).then((x:any)=>{setSelected(x);navigation.navigate('Detail' as never);}).catch(()=>{});}}/></PatientTabScreen>}</Stack.Screen>
  <Stack.Screen name="Notifications" options={{title:'الإشعارات'}}>{({navigation})=><PatientTabScreen navigation={navigation} active="Notifications"><NotificationsScreen role="patient" onOpenRelated={()=>navigation.navigate('Bookings' as never)}/></PatientTabScreen>}</Stack.Screen>
  <Stack.Screen name="Search" options={{title:'البحث'}}>{({navigation})=><PatientTabScreen navigation={navigation} active="Home"><SearchScreen kind={kind} initial={query} onSelect={x=>{setSelected(x);navigation.navigate('Detail' as never);}} onAdTarget={ad=>{setKind(ad.targetType==='doctor'?'doctors':'facilities');api.publicAdTarget(ad.targetType,ad.targetId).then((x:any)=>{setSelected(x);navigation.navigate('Detail' as never);}).catch(()=>{});}}/></PatientTabScreen>}</Stack.Screen>
  <Stack.Screen name="Detail" options={{title:'التفاصيل'}}>{({navigation})=><PatientTabScreen navigation={navigation} active="Home"><DetailScreen item={selected} kind={kind} onBook={()=>navigation.navigate('Booking' as never)}/></PatientTabScreen>}</Stack.Screen>
  <Stack.Screen name="Booking" options={{title:'الحجز'}}>{({navigation})=><PatientTabScreen navigation={navigation} active="Bookings"><BookingScreen item={selected} kind={kind} onDone={()=>navigation.navigate('Bookings' as never)}/></PatientTabScreen>}</Stack.Screen>
  <Stack.Screen name="Bookings" options={{title:'حجوزاتي'}}>{({navigation})=><PatientTabScreen navigation={navigation} active="Bookings"><BookingsScreen/></PatientTabScreen>}</Stack.Screen>
  <Stack.Screen name="PatientHealthFile" options={{title:'الملف الصحي'}}>{({navigation})=><PatientTabScreen navigation={navigation} active="More"><PatientHealthFileScreen/></PatientTabScreen>}</Stack.Screen>
  <Stack.Screen name="More" options={{title:'المزيد'}}>{({navigation})=><PatientTabScreen navigation={navigation} active="More"><PatientMoreScreen navigation={navigation} onLogout={logout}/></PatientTabScreen>}</Stack.Screen>
  <Stack.Screen name="PatientProfile" options={{title:'ملفي الشخصي'}}>{({navigation})=><PatientTabScreen navigation={navigation} active="PatientProfile"><PatientProfileScreen onLogout={logout}/></PatientTabScreen>}</Stack.Screen>
 </>}
 </Stack.Navigator></NavigationContainer>;
}


// Demo mode is a separate offline UI. Normal builds keep the real API-backed app.
export default function App(){
 if(process.env.EXPO_PUBLIC_DEMO_MODE==='1') return <PreviewApp/>;
 return <LiveApp/>;
}
