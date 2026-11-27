import React,{useCallback,useEffect,useState} from 'react';
import {Alert} from 'react-native';
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
 return <Screen><Heading>طلبات مديري المنشآت</Heading><Body>لا يستطيع مدير المنشأة تسجيل الدخول أو إدارة بيانات أي منشأة قبل موافقتك. وبعد الاعتماد، تبقى صلاحياته محصورة بالمنشآت المسجلة باسمه.</Body><Heading>طلبات بانتظار الموافقة ({rows.length})</Heading>{rows.length?rows.map(x=><Item key={x.id} title={x.displayName} subtitle={x.email||x.phone||'لا توجد وسيلة اتصال'} />):<Body>لا توجد طلبات معلّقة حالياً.</Body>}{rows.map(x=><Action key={'approve-'+x.id} title={'اعتماد حساب '+x.displayName} onPress={()=>approve(x.id)} disabled={busy}/>)}<Action title={busy?'جارٍ التحديث...':'تحديث القائمة'} onPress={load} disabled={busy}/></Screen>;
}
