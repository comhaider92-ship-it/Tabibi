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
const patientTabs=[{key:'Home',label:'الرئيسية',icon:'⌂'},{key:'Bookings',label:'المواعيد',icon:'▦'},{key:'Notifications',label:'الإشعارات',icon:'♧'},{key:'PatientProfile',label:'حسابي',icon:'♙'},{key:'More',label:'المزيد',icon:'⋯'}];
function PatientTabBar({navigation,active}:{navigation:any;active:string}){
 return <View style={{flexDirection:'row',backgroundColor:'#FFFFFF',borderTopWidth:1,borderTopColor:'#DCEBEA',paddingTop:8,paddingBottom:7,paddingHorizontal:5}}>
  {patientTabs.map(tab=><Pressable key={tab.key} onPress={()=>navigation.navigate(tab.key as never)} style={{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:3}}>
   <Text style={{fontSize:22,color:active===tab.key?'#078B91':'#8293A1',fontWeight:'900'}}>{tab.icon}</Text>
   <Text style={{fontSize:10,fontWeight:active===tab.key?'900':'600',color:active===tab.key?'#078B91':'#718596',marginTop:2}}>{tab.label}</Text>
   {active===tab.key&&<View style={{height:3,width:18,backgroundColor:'#078B91',borderRadius:3,marginTop:3}}/>}
  </Pressable>)}
 </View>;
}
function PatientTabScreen({children,navigation,active}:{children:any;navigation:any;active:string}){
 return <View style={{flex:1,backgroundColor:'#F7FAFC'}}><View style={{flex:1}}>{children}</View><PatientTabBar navigation={navigation} active={active}/></View>;
}
function PatientMoreScreen({navigation,onLogout}:{navigation:any;onLogout:()=>void}){
 const links=[{title:'الملف الصحي',subtitle:'تقاريرك ومعلوماتك الصحية',screen:'PatientHealthFile',icon:'＋'},{title:'الملف الشخصي',subtitle:'بيانات الحساب ومعلومات التواصل',screen:'PatientProfile',icon:'◉'},{title:'حجوزاتي',subtitle:'متابعة مواعيدك الطبية',screen:'Bookings',icon:'▦'}];
 return <View style={{flex:1,backgroundColor:'#F7FAFC',padding:18}}>
  <Text style={{fontSize:24,fontWeight:'900',color:'#142D42',textAlign:'right',marginBottom:8}}>المزيد من طبيبي</Text>
  <Text style={{fontSize:14,color:'#718596',textAlign:'right',lineHeight:23,marginBottom:12}}>كل ما تحتاجه لإدارة تجربتك الصحية في مكان واحد.</Text>
  {links.map(x=><Pressable key={x.screen} onPress={()=>navigation.navigate(x.screen as never)} style={{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E3ECEF',borderRadius:18,padding:16,marginVertical:6,flexDirection:'row',alignItems:'center',gap:12}}>
   <View style={{width:46,height:46,borderRadius:15,backgroundColor:'#E8F6F4',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:23,color:'#078B91'}}>{x.icon}</Text></View>
   <View style={{flex:1}}><Text style={{fontSize:16,fontWeight:'800',color:'#142D42',textAlign:'right'}}>{x.title}</Text><Text style={{fontSize:12,color:'#718596',textAlign:'right',marginTop:4}}>{x.subtitle}</Text></View>
   <Text style={{fontSize:24,color:'#078B91'}}>‹</Text>
  </Pressable>)}
  <Pressable onPress={onLogout} style={{marginTop:18,padding:16,borderRadius:16,backgroundColor:'#FFF1F0',alignItems:'center'}}><Text style={{fontSize:15,fontWeight:'800',color:'#B5473C'}}>تسجيل الخروج</Text></Pressable>
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
  <Stack.Screen name="DoctorDashboard" options={{title:'لوحة الطبيب',headerRight:({tintColor,navigation}:any)=> <View style={{flexDirection:'row',alignItems:'center',gap:14}}><NotificationHeaderButton navigation={navigation} color={tintColor||'#087E8B'}/><Pressable onPress={()=>navigation.navigate('AccountSecurity' as never)}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>الأمان</Text></Pressable><Pressable onPress={logout}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>خروج</Text></Pressable></View>}}>{({navigation})=> <DoctorDashboardScreen onManageSchedule={()=>navigation.navigate('Schedule' as never)} onManageProfile={()=>navigation.navigate('DoctorProfile' as never)} onManageSubscription={()=>navigation.navigate('DoctorSubscription' as never)}/>}</Stack.Screen>
  <Stack.Screen name="AccountSecurity" options={{title:'أمان الحساب'}}>{()=> <AccountSecurityScreen onLogout={logout}/>}</Stack.Screen>
  <Stack.Screen name="Notifications" options={{title:'الإشعارات'}}>{({navigation})=><NotificationsScreen role="doctor" onOpenRelated={()=>navigation.navigate('DoctorDashboard' as never)}/>}</Stack.Screen>
  <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{title:'الملف المهني'}}/>
  <Stack.Screen name="DoctorSubscription" component={DoctorSubscriptionScreen} options={{title:'الاشتراك'}}/>
  <Stack.Screen name="Schedule" options={{title:'إدارة الدوام والمواعيد'}}>{()=> <ScheduleManagementScreen role="doctor"/>}</Stack.Screen>
 </>:role==='owner'?<>
  <Stack.Screen name="OwnerDashboard" options={{title:'إدارة المنشآت',headerRight:({tintColor,navigation}:any)=> <View style={{flexDirection:'row',alignItems:'center',gap:14}}><NotificationHeaderButton navigation={navigation} color={tintColor||'#087E8B'}/><Pressable onPress={()=>navigation.navigate('AccountSecurity' as never)}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>الأمان</Text></Pressable><Pressable onPress={logout}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>خروج</Text></Pressable></View>}}>{({navigation})=> <OwnerDashboardScreen onManageSchedule={()=>navigation.navigate('Schedule' as never)} onManageServices={()=>navigation.navigate('FacilityServices' as never)} onReview={()=>navigation.navigate('OwnerReview' as never)} onManageSubscriptions={()=>navigation.navigate('OwnerSubscriptions' as never)} onManageAds={()=>navigation.navigate('OwnerAds' as never)} onManageFinance={()=>navigation.navigate('OwnerFinance' as never)} onCreateFacility={()=>navigation.navigate('OwnerFacilityCreate' as never)} onManageUsers={()=>navigation.navigate('OwnerUsers' as never)} onManageFacilities={()=>navigation.navigate('OwnerFacilities' as never)} onAudit={()=>navigation.navigate('OwnerAudit' as never)} onMessageReports={()=>navigation.navigate('OwnerMessageReports' as never)}/>}</Stack.Screen>
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
  <Stack.Screen name="Home" options={{title:'طبيبي',headerRight:({tintColor,navigation}:any)=> <View style={{flexDirection:'row',alignItems:'center',gap:14}}><NotificationHeaderButton navigation={navigation} color={tintColor||'#087E8B'}/><Pressable onPress={logout}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>خروج</Text></Pressable></View>}}>{({navigation})=><PatientTabScreen navigation={navigation} active="Home"><HomeScreen onSearch={(k,q)=>{setKind(k);setQuery(q);navigation.navigate('Search' as never);}} onBookings={()=>navigation.navigate('Bookings' as never)} onProfile={()=>navigation.navigate('PatientProfile' as never)} onHealthFile={()=>navigation.navigate('PatientHealthFile' as never)} onAdTarget={ad=>{setKind(ad.targetType==='doctor'?'doctors':'facilities');api.publicAdTarget(ad.targetType,ad.targetId).then((x:any)=>{setSelected(x);navigation.navigate('Detail' as never);}).catch(()=>{});}}/></PatientTabScreen>}</Stack.Screen>
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
