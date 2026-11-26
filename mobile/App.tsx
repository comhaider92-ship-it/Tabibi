import React,{useState} from 'react';
import {PreviewApp} from './src/PreviewApp';
import {ActivityIndicator,View,Text,Pressable} from 'react-native';
import {NavigationContainer,useNavigation} from '@react-navigation/native';
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
function HeaderActions({logout,color='#087E8B'}:{logout:()=>void;color?:string}){const navigation=useNavigation<any>();return <View style={{flexDirection:'row',alignItems:'center',gap:14}}><NotificationHeaderButton navigation={navigation} color={color}/><Pressable onPress={()=>navigation.navigate('AccountSecurity')}><Text style={{color,fontWeight:'700'}}>الأمان</Text></Pressable><Pressable onPress={logout}><Text style={{color,fontWeight:'700'}}>تبديل الحساب</Text></Pressable></View>;}

function LiveApp(){
 const [role,setRole]=useState<string|null>(null);const [ready,setReady]=useState(false);const [pushDeviceId,setPushDeviceId]=useState<string|null>(null);const [kind,setKind]=useState<'doctors'|'facilities'>('doctors');const [query,setQuery]=useState('');const [selected,setSelected]=useState<any>(null);
 React.useEffect(()=>{let alive=true;(async()=>{try{const token=await restoreAccessToken();if(token){const user=await api.me();if(alive&&['patient','doctor','owner'].includes(user.role))setRole(user.role);else await setAccessToken(null);}}catch{await setAccessToken(null);}finally{if(alive)setReady(true);}})();return()=>{alive=false;};},[]);
 React.useEffect(()=>{let alive=true;if(role){registerPushDevice().then(id=>{if(alive&&id)setPushDeviceId(id);}).catch(()=>{});}return()=>{alive=false;};},[role]);
 const logout=async()=>{if(pushDeviceId)await api.removePushDevice(pushDeviceId).catch(()=>{});setPushDeviceId(null);await setAccessToken(null);setRole(null);};
 if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F6F8FB'}}><ActivityIndicator size="large" color="#087E8B"/><Text style={{marginTop:12,color:'#506176'}}>جارٍ تجهيز طبيبي...</Text></View>;
 return <NavigationContainer><Stack.Navigator screenOptions={{headerTitleAlign:'center',headerTintColor:'#087E8B'}}>
 {!role?<Stack.Screen name="Login" options={{title:'تسجيل الدخول'}}>{()=> <LoginScreen onLogin={setRole}/>}</Stack.Screen>:role==='doctor'?<>
  <Stack.Screen name="DoctorDashboard" options={({navigation}:any)=>({title:'لوحة الطبيب',headerRight:({tintColor}:any)=><HeaderActions logout={logout} color={tintColor||'#087E8B'}/>})}>{({navigation})=> <DoctorDashboardScreen onManageSchedule={()=>navigation.navigate('Schedule' as never)} onManageProfile={()=>navigation.navigate('DoctorProfile' as never)} onManageSubscription={()=>navigation.navigate('DoctorSubscription' as never)}/>}</Stack.Screen>
  <Stack.Screen name="AccountSecurity" options={{title:'أمان الحساب'}}>{()=> <AccountSecurityScreen onLogout={logout}/>}</Stack.Screen>
  <Stack.Screen name="Notifications" options={{title:'الإشعارات'}}>{({navigation})=><NotificationsScreen role="doctor" onOpenRelated={()=>navigation.navigate('DoctorDashboard' as never)}/>}</Stack.Screen>
  <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{title:'الملف المهني'}}/>
  <Stack.Screen name="DoctorSubscription" component={DoctorSubscriptionScreen} options={{title:'الاشتراك'}}/>
  <Stack.Screen name="Schedule" options={{title:'إدارة الدوام والمواعيد'}}>{()=> <ScheduleManagementScreen role="doctor"/>}</Stack.Screen>
 </>:role==='owner'?<>
  <Stack.Screen name="OwnerDashboard" options={({navigation}:any)=>({title:'إدارة المنشآت',headerRight:({tintColor}:any)=><HeaderActions logout={logout} color={tintColor||'#087E8B'}/>})}>{({navigation})=> <OwnerDashboardScreen onManageSchedule={()=>navigation.navigate('Schedule' as never)} onManageServices={()=>navigation.navigate('FacilityServices' as never)} onReview={()=>navigation.navigate('OwnerReview' as never)} onManageSubscriptions={()=>navigation.navigate('OwnerSubscriptions' as never)} onManageAds={()=>navigation.navigate('OwnerAds' as never)} onManageFinance={()=>navigation.navigate('OwnerFinance' as never)} onCreateFacility={()=>navigation.navigate('OwnerFacilityCreate' as never)} onManageUsers={()=>navigation.navigate('OwnerUsers' as never)} onManageFacilities={()=>navigation.navigate('OwnerFacilities' as never)} onAudit={()=>navigation.navigate('OwnerAudit' as never)} onMessageReports={()=>navigation.navigate('OwnerMessageReports' as never)}/>}</Stack.Screen>
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
  <Stack.Screen name="Home" options={({navigation}:any)=>({title:'طبيبي',headerRight:({tintColor}:any)=><View style={{flexDirection:'row',alignItems:'center',gap:14}}><NotificationHeaderButton navigation={navigation} color={tintColor||'#087E8B'}/><Pressable onPress={logout}><Text style={{color:tintColor||'#087E8B',fontWeight:'700'}}>تبديل الحساب</Text></Pressable></View>})}>{({navigation})=><HomeScreen onSearch={(k,q)=>{setKind(k);setQuery(q);navigation.navigate('Search' as never);}} onBookings={()=>navigation.navigate('Bookings' as never)} onProfile={()=>navigation.navigate('PatientProfile' as never)} onHealthFile={()=>navigation.navigate('PatientHealthFile' as never)} onNotifications={()=>navigation.navigate('Notifications' as never)} onAdTarget={ad=>{setKind(ad.targetType==='doctor'?'doctors':'facilities');api.publicAdTarget(ad.targetType,ad.targetId).then((x:any)=>{setSelected(x);navigation.navigate('Detail' as never);}).catch(()=>{});}}/>}</Stack.Screen>
  <Stack.Screen name="Notifications" options={{title:'الإشعارات'}}>{({navigation})=><NotificationsScreen role="patient" onOpenRelated={()=>navigation.navigate('Bookings' as never)}/>}</Stack.Screen>
  <Stack.Screen name="Search" options={{title:'البحث'}}>{({navigation})=><SearchScreen kind={kind} initial={query} onSelect={x=>{setSelected(x);navigation.navigate('Detail' as never);}} onAdTarget={ad=>{setKind(ad.targetType==='doctor'?'doctors':'facilities');api.publicAdTarget(ad.targetType,ad.targetId).then((x:any)=>{setSelected(x);navigation.navigate('Detail' as never);}).catch(()=>{});}}/>}</Stack.Screen>
  <Stack.Screen name="Detail" options={{title:'التفاصيل'}}>{({navigation})=><DetailScreen item={selected} kind={kind} onBook={()=>navigation.navigate('Booking' as never)}/>}</Stack.Screen>
  <Stack.Screen name="Booking" options={{title:'الحجز'}}>{({navigation})=><BookingScreen item={selected} kind={kind} onDone={()=>navigation.navigate('Bookings' as never)}/>}</Stack.Screen>
  <Stack.Screen name="Bookings" options={{title:'حجوزاتي'}}>{()=> <BookingsScreen/>}</Stack.Screen>
  <Stack.Screen name="PatientHealthFile" component={PatientHealthFileScreen} options={{title:'ملفي الصحي'}}/>
  <Stack.Screen name="PatientProfile" options={{title:'ملفي الشخصي'}}>{()=> <PatientProfileScreen onLogout={logout}/>}</Stack.Screen>
 </>}
 </Stack.Navigator></NavigationContainer>;
}


// Demo mode is a separate offline UI. Normal builds keep the real API-backed app.
export default function App(){
 if(process.env.EXPO_PUBLIC_DEMO_MODE==='1') return <PreviewApp/>;
 return <LiveApp/>;
}
