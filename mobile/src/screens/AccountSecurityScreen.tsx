import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {Screen} from '../components/Screen';
import {Action,Body,Heading,Loading} from '../components/UI';
import {api} from '../api/client';

export function AccountSecurityScreen({onLogout}:{onLogout:()=>void}){
 const [items,setItems]=useState<any[]>([]);const [busy,setBusy]=useState(true);const [working,setWorking]=useState(false);
 const [activity,setActivity]=useState<Array<{id:string;result:'success'|'failed';createdAt:string}>>([]);
 const [activityBusy,setActivityBusy]=useState(true);
 const load=useCallback(async()=>{
  setBusy(true);setActivityBusy(true);
  const [sessionsResult,activityResult]=await Promise.allSettled([api.mySessions(),api.myLoginSecurityActivity()]);
  if(sessionsResult.status==='fulfilled')setItems(sessionsResult.value);
  else Alert.alert('تعذر تحميل الجلسات',sessionsResult.reason?.message||'حاول مجدداً.');
  if(activityResult.status==='fulfilled')setActivity(activityResult.value);
  else Alert.alert('تعذر تحميل سجل محاولات الدخول',activityResult.reason?.message||'حاول مجدداً.');
  setBusy(false);setActivityBusy(false);
 },[]);
 useEffect(()=>{load();},[load]);
 const revoke=(item:any)=>Alert.alert('إنهاء الجلسة','هل تريد إنهاء '+item.device+'؟',[{text:'إلغاء',style:'cancel'},{text:'إنهاء',style:'destructive',onPress:async()=>{setWorking(true);try{await api.revokeSession(item.id);if(item.isCurrent){Alert.alert('تم إنهاء الجلسة','سجل الدخول مجدداً.',[{text:'حسناً',onPress:onLogout}]);}else{await load();Alert.alert('تم','انتهت الجلسة المحددة.');}}catch(e:any){Alert.alert('تعذر إنهاء الجلسة',e.message);}finally{setWorking(false);}}}]);
 return <Screen>
  <Heading>أمان الحساب</Heading>
  <Heading>الأجهزة والجلسات النشطة</Heading>
  <Body>راجع الأجهزة التي سجلت الدخول إلى حسابك. يمكنك إنهاء أي جلسة لا تعرفها، من دون التأثير على بقية أجهزتك.</Body>
  <Action title={busy||activityBusy?'جارٍ التحديث...':'تحديث معلومات الأمان'} onPress={load} disabled={busy||activityBusy||working}/>
  {busy?<Loading/>:items.length===0?<Body>لا توجد جلسات نشطة حالياً.</Body>:items.map(item=><View key={item.id} style={{backgroundColor:'#fff',borderRadius:12,padding:14,marginVertical:6}}><Text style={{textAlign:'right',fontWeight:'800',fontSize:16,color:'#172B4D'}}>{item.device}{item.isCurrent?' · هذا الجهاز':''}</Text><Text style={{textAlign:'right',fontSize:12,color:'#506176',marginTop:8}}>آخر نشاط: {new Date(item.lastSeenAt).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})}</Text><Text style={{textAlign:'right',fontSize:12,color:'#506176',marginTop:4}}>تاريخ الدخول: {new Date(item.createdAt).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})}</Text><Text style={{textAlign:'right',fontSize:12,color:'#506176',marginTop:4}}>انتهاء الجلسة: {new Date(item.expiresAt).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})}</Text><Action title="إنهاء هذه الجلسة" onPress={()=>revoke(item)} disabled={working}/></View>)}
  <Heading>سجل محاولات تسجيل الدخول</Heading>
  <Body>يعرض آخر محاولات الدخول المرتبطة ببيانات حسابك. إذا لاحظت محاولة ناجحة لا تعرفها، أنهِ الجلسة غير المعروفة وغيّر كلمة المرور.</Body>
  {activityBusy?<Loading/>:activity.length===0?<Body>لا توجد محاولات دخول مسجلة لهذا الحساب.</Body>:activity.map(event=><View key={event.id} style={{backgroundColor:'#fff',borderRadius:12,padding:14,marginVertical:5}}><Text style={{textAlign:'right',fontWeight:'800',color:event.result==='success'?'#16794B':'#B42318'}}>{event.result==='success'?'تسجيل دخول ناجح':'محاولة دخول غير ناجحة'}</Text><Text style={{textAlign:'right',fontSize:12,color:'#506176',marginTop:5}}>{new Date(event.createdAt).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})}</Text></View>)}
 </Screen>;
}
