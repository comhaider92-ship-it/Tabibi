import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {Screen} from '../components/Screen';
import {Action,Body,Heading,Item,Loading} from '../components/UI';
import {api} from '../api/client';

export function OwnerFacilityManagersScreen(){
 const [rows,setRows]=useState<any[]>([]);
 const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{setBusy(true);try{setRows(await api.pendingFacilityManagers());}catch(e){Alert.alert('تعذر تحميل الطلبات',e instanceof Error?e.message:'حدث خطأ');}finally{setBusy(false);}},[]);
 useEffect(()=>{load();},[load]);
 const approve=async(id:string)=>{setBusy(true);try{const result=await api.approveFacilityManager(id);Alert.alert('تم اعتماد الحساب',result.message);await load();}catch(e){Alert.alert('تعذر اعتماد الحساب',e instanceof Error?e.message:'حدث خطأ');}finally{setBusy(false);}};
 if(busy&&!rows.length)return <Loading/>;
 return <Screen><Heading>طلبات مديري المنشآت</Heading><Body>لا يستطيع مدير المنشأة تسجيل الدخول أو إدارة بيانات أي منشأة قبل موافقتك. وبعد الاعتماد، تبقى صلاحياته محصورة بالمنشآت المسجلة باسمه.</Body><Heading>طلبات بانتظار الموافقة ({rows.length})</Heading>{rows.length?rows.map(x=><View key={x.id} style={{backgroundColor:'#fff',padding:13,borderRadius:12,marginVertical:6}}><Text style={{textAlign:'right',fontWeight:'700',color:'#172B4D'}}>{x.displayName}</Text><Text style={{textAlign:'right',color:'#68788D',marginTop:4}}>{x.email||x.phone||'لا توجد وسيلة اتصال'}</Text><Action title="اعتماد حساب مدير المنشأة" onPress={()=>approve(x.id)} disabled={busy}/></View>):<Body>لا توجد طلبات معلّقة حالياً.</Body>}<Action title={busy?'جارٍ التحديث...':'تحديث القائمة'} onPress={load} disabled={busy}/></Screen>;
}
