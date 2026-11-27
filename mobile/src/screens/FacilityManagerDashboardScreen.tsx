import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Text,TextInput,View} from 'react-native';
import {Screen} from '../components/Screen';
import {Action,Body,Heading,Item,Loading} from '../components/UI';
import {api} from '../api/client';

export function FacilityManagerDashboardScreen({onManageFacilities,onCreateFacility,onManageServices,onManageSchedule}:{onManageFacilities:()=>void;onCreateFacility:()=>void;onManageServices:()=>void;onManageSchedule:()=>void}){
 const [facilities,setFacilities]=useState<any[]>([]);
 const [selected,setSelected]=useState<any>(null);
 const [summary,setSummary]=useState<any>(null);
 const [bookings,setBookings]=useState<any[]>([]);
 const [busy,setBusy]=useState(false);
 const [rejectReasons,setRejectReasons]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{
  setBusy(true);
  try{
   const rows=await api.ownerFacilities();
   setFacilities(rows);
   const current=rows.find((x:any)=>x.id===selected?.id)??rows[0]??null;
   setSelected(current);
   if(current){
    const [d,b]=await Promise.all([api.facilityDashboard(current.id),api.ownerFacilityBookings(current.id)]);
    setSummary(d);
    setBookings(b);
   }else{setSummary(null);setBookings([]);}
  }catch(e){Alert.alert('تعذر تحميل منشأتك',e instanceof Error?e.message:'حدث خطأ');}
  finally{setBusy(false);}
 },[selected?.id]);
 const decide=async(id:string,status:'confirmed'|'rejected')=>{const reason=rejectReasons[id]?.trim();if(status==='rejected'&&!reason){Alert.alert('سبب الرفض مطلوب','اكتب سبباً مختصراً لرفض طلب الحجز.');return;}try{await api.updateFacilityBooking(id,status,reason||undefined);setRejectReasons(old=>({...old,[id]:''}));await load();}catch(e){Alert.alert('تعذر تحديث الحجز',e instanceof Error?e.message:'حدث خطأ');}};
 useEffect(()=>{load();},[]);
 if(busy&&!facilities.length)return <Loading/>;
 return <Screen>
  <Heading>إدارة منشأتي الطبية</Heading>
  <Body>هذه مساحة خاصة بمدير المنشأة. تقدر تدير منشأتك وخدماتها ومواعيدها وطلبات الحجز، من دون الوصول إلى أدوات المالك أو بيانات المنشآت الأخرى.</Body>
  <Action title="تسجيل منشأة جديدة" onPress={onCreateFacility}/>
  <Action title="بيانات منشأتي" onPress={onManageFacilities}/>
  <Action title="إدارة الأقسام والخدمات والأسعار" onPress={onManageServices}/>
  <Action title="إدارة الدوام والمواعيد" onPress={onManageSchedule}/>
  <Heading>منشآتي ({facilities.length})</Heading>
  {facilities.length?facilities.map(f=><Item key={f.id} title={f.name} subtitle={f.city+' · '+(f.status==='approved'?'معتمدة':f.status==='pending'?'بانتظار اعتماد طبيبي':f.status)} onPress={()=>setSelected(f)}/>):<Body>ما عندك منشأة مسجلة بعد. سجّل منشأتك حتى تبدأ بإضافة الأقسام والخدمات.</Body>}
  {selected&&<><Heading>{selected.name}</Heading><Body>حالة المنشأة: {selected.status==='approved'?'معتمدة':selected.status==='pending'?'بانتظار اعتماد إدارة طبيبي':selected.status}</Body>{summary&&<View style={{backgroundColor:'#fff',padding:14,borderRadius:12,marginVertical:8}}><Text style={{textAlign:'right',color:'#087E8B',fontWeight:'700'}}>طلبات جديدة: {summary.summary?.requestedBookings??0}</Text><Text style={{textAlign:'right',color:'#40536A',marginTop:6}}>حجوزات مؤكدة: {summary.summary?.confirmedBookings??0} · مكتملة: {summary.summary?.completedBookings??0}</Text><Text style={{textAlign:'right',color:'#40536A',marginTop:6}}>مواعيد متاحة: {summary.summary?.availableSlots??0}</Text></View>}<Heading>آخر طلبات الحجز ({bookings.length})</Heading>{bookings.slice(0,8).map(b=><View key={b.id} style={{backgroundColor:'#fff',padding:12,borderRadius:12,marginVertical:5}}><Text style={{textAlign:'right',fontWeight:'700',color:'#172B4D'}}>{b.patientName}</Text><Text style={{textAlign:'right',color:'#68788D',marginTop:4}}>{new Date(b.startsAt).toLocaleDateString('ar-IQ')} · {b.status==='requested'?'بانتظار الرد':b.status==='confirmed'?'مؤكد':b.status}</Text>{b.status==='requested'&&<><TextInput value={rejectReasons[b.id]??''} onChangeText={v=>setRejectReasons(old=>({...old,[b.id]:v}))} placeholder="سبب الرفض (مطلوب عند الرفض)" placeholderTextColor="#8290A3" textAlign="right" multiline maxLength={500} style={{backgroundColor:'#F6F8FB',borderWidth:1,borderColor:'#DCE3EB',borderRadius:9,padding:10,color:'#172B4D',marginTop:8,minHeight:42}}/><View style={{marginTop:5}}><Action title="قبول طلب الحجز" onPress={()=>decide(b.id,'confirmed')} disabled={busy}/><Action title="رفض طلب الحجز" onPress={()=>decide(b.id,'rejected')} disabled={busy}/></View></>}</View>)}</>}
  <Action title={busy?'جارٍ التحديث...':'تحديث البيانات'} onPress={load} disabled={busy}/>
 </Screen>;
}
