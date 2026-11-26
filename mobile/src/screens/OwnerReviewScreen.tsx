import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Text,View,Pressable} from 'react-native';
import {Screen} from '../components/Screen';
import {Action,Body,Heading,Loading,Field} from '../components/UI';
import {api} from '../api/client';

type ReviewTab='all'|'doctors'|'facilities';
export function OwnerReviewScreen({initialTab='all'}:{initialTab?:ReviewTab}){
 const [activeTab,setActiveTab]=useState<ReviewTab>(initialTab);
 const [doctors,setDoctors]=useState<any[]>([]);
 const [facilities,setFacilities]=useState<any[]>([]);
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  setBusy(true);
  try{
   const [d,f]=await Promise.all([api.pendingDoctors(),api.pendingFacilities()]);
   setDoctors(d);setFacilities(f);
  }catch(e){Alert.alert('تعذر تحميل طلبات المراجعة',e instanceof Error?e.message:'حدث خطأ');}
  finally{setBusy(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 const reviewDoctor=async(id:string,decision:'approved'|'rejected')=>{
  try{setBusy(true);await api.reviewDoctor(id,decision,notes[id]);await load();}
  catch(e){Alert.alert('تعذر مراجعة ملف الطبيب',e instanceof Error?e.message:'حدث خطأ');}
  finally{setBusy(false);}
 };
 const reviewFacility=async(id:string,status:'approved'|'rejected')=>{
  try{setBusy(true);await api.reviewFacility(id,status);await load();}
  catch(e){Alert.alert('تعذر مراجعة المنشأة',e instanceof Error?e.message:'حدث خطأ');}
  finally{setBusy(false);}
 };
 if(busy&&!doctors.length&&!facilities.length)return <Loading/>;
 return <Screen>
  <Heading>مراجعة الطلبات والاعتمادات</Heading>
  <Body>اختر نوع الطلب لمراجعته بصورة مستقلة. راجع البيانات والوثائق المتاحة قبل الموافقة أو الرفض.</Body>
  <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
   {([['all','الكل'],['doctors','طلبات الأطباء'],['facilities','اعتماد المنشآت']] as const).map(([key,label])=><Pressable key={key} onPress={()=>setActiveTab(key)} style={{flex:1,padding:11,borderRadius:13,backgroundColor:activeTab===key?'#087E8B':'#E8F1F3'}}>
    <Text style={{textAlign:'center',fontWeight:'800',fontSize:12,color:activeTab===key?'#FFFFFF':'#40536A'}}>{label}</Text>
   </Pressable>)}
  </View>
  {(activeTab==='all'||activeTab==='doctors')&&<>
   <Heading>طلبات الأطباء بانتظار المراجعة ({doctors.length})</Heading>
   {doctors.length===0?<Body>لا توجد ملفات أطباء معلقة حالياً.</Body>:doctors.map(d=><View key={d.id} style={{backgroundColor:'#fff',padding:14,borderRadius:13,marginVertical:7,borderWidth:1,borderColor:'#E8EDF2'}}>
    <Text style={{textAlign:'right',fontWeight:'800',fontSize:16,color:'#172B4D'}}>{d.fullName}</Text>
    <Text style={{textAlign:'right',color:'#506176',marginTop:5}}>{d.specialty}{d.subSpecialty? ` · ${d.subSpecialty}`:''}</Text>
    <Text style={{textAlign:'right',color:'#506176',marginTop:4}}>{d.clinicName} · {d.city}</Text>
    <Text style={{textAlign:'right',color:'#506176',marginTop:4}}>المؤهلات: {d.qualifications||'لم تُذكر'}</Text>
    <Text style={{textAlign:'right',color:'#506176',marginTop:4}}>الخبرة: {d.experienceYears??0} سنة</Text>
    <Field value={notes[d.id]??''} onChangeText={v=>setNotes(old=>({...old,[d.id]:v}))} placeholder="ملاحظة للمراجعة أو سبب الرفض (اختياري)"/>
    <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Action title="موافقة" onPress={()=>reviewDoctor(d.id,'approved')} disabled={busy}/></View><View style={{flex:1}}><Action title="رفض" onPress={()=>reviewDoctor(d.id,'rejected')} disabled={busy}/></View></View>
   </View>)}
  </>}
  {(activeTab==='all'||activeTab==='facilities')&&<>
   <Heading>طلبات اعتماد المنشآت ({facilities.length})</Heading>
   {facilities.length===0?<Body>لا توجد منشآت معلقة حالياً.</Body>:facilities.map(f=><View key={f.id} style={{backgroundColor:'#fff',padding:14,borderRadius:13,marginVertical:7,borderWidth:1,borderColor:'#E8EDF2'}}>
    <Text style={{textAlign:'right',fontWeight:'800',fontSize:16,color:'#172B4D'}}>{f.name}</Text>
    <Text style={{textAlign:'right',color:'#506176',marginTop:5}}>النوع: {f.facilityType} · {f.city}</Text>
    <Text style={{textAlign:'right',color:'#506176',marginTop:4}}>{f.address}</Text>
    <Text style={{textAlign:'right',color:'#506176',marginTop:4}}>{f.phone??'لا يوجد رقم هاتف'}</Text>
    <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Action title="موافقة" onPress={()=>reviewFacility(f.id,'approved')} disabled={busy}/></View><View style={{flex:1}}><Action title="رفض" onPress={()=>reviewFacility(f.id,'rejected')} disabled={busy}/></View></View>
   </View>)}
  </>}
  <Action title="تحديث الطلبات" onPress={load} disabled={busy}/>
 </Screen>;
}
