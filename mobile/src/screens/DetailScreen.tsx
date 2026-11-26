import React,{useEffect,useState} from 'react';
import { Alert, Image, Linking, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Action, Heading, Body, Item, Loading } from '../components/UI';
import { api, resolveApiAssetUrl } from '../api/client';
export function DetailScreen({item,kind,onBook}:{item:any;kind:'doctors'|'facilities';onBook:()=>void}){
 const [detail,setDetail]=useState<any>(item||{});const [services,setServices]=useState<any[]>([]);const [busy,setBusy]=useState(true);
 useEffect(()=>{let alive=true;setDetail(item||{});setServices([]);setBusy(true);const load=async()=>{try{if(kind==='doctors'){const full=await api.doctor(item.id);if(alive)setDetail(full);}else{const list=await api.facilityServices(item.id);if(alive)setServices(Array.isArray(list)?list:[]);}}catch(e){if(alive)Alert.alert('تعذر تحميل بعض التفاصيل',e instanceof Error?e.message:'سيتم عرض المعلومات المتاحة.');}finally{if(alive)setBusy(false);}};if(item?.id)load();else setBusy(false);return()=>{alive=false;};},[item?.id,kind]);
 const name=detail.fullName||detail.name||'التفاصيل';
 const photoUri=resolveApiAssetUrl(detail.photoUrl||detail.imageUrl||detail.logoUrl);
 const latitude=Number(detail.latitude??detail.lat);const longitude=Number(detail.longitude??detail.lng??detail.lon);const hasCoordinates=Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180&&(latitude!==0||longitude!==0);
 const mapAddress=[detail.address,detail.city].filter(Boolean).join('، ');
 const openMap=async()=>{if(!hasCoordinates&&!mapAddress.trim()){Alert.alert('الموقع غير متوفر','لم تتم إضافة عنوان أو إحداثيات لهذه الجهة بعد.');return;}const query=hasCoordinates?`${latitude},${longitude}`:mapAddress;try{await Linking.openURL('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query));}catch{Alert.alert('تعذر فتح الخرائط','تأكد من توفر تطبيق خرائط أو متصفح.');}};
 const contactPhone=detail.contactPhone||detail.phone;
 const callProvider=async()=>{if(!contactPhone){Alert.alert('رقم التواصل غير متوفر','لم تتم إضافة رقم هاتف لهذه الجهة بعد.');return;}try{await Linking.openURL('tel:'+String(contactPhone).replace(/[^+0-9]/g,''));}catch{Alert.alert('تعذر الاتصال','تحقق من رقم الهاتف أو إعدادات الجهاز.');}};
 return <Screen>
  {photoUri&&<Image source={{uri:photoUri}} style={{width:'100%',height:170,borderRadius:20,alignSelf:'center',marginBottom:14,backgroundColor:'#E8F3F2'}} resizeMode="cover"/>}
  <Heading>{name}</Heading>
  {kind==='facilities'?<Body>{detail.facilityType==='hospital'?'مستشفى وخدمات رعاية صحية':detail.facilityType==='laboratory'?'مختبر للتحاليل والفحوصات':detail.facilityType==='radiology'?'مركز أشعة وتصوير طبي':detail.facilityType==='diagnostics'?'مركز فحوصات وتشخيص':'منشأة وخدمات طبية'}</Body>:<Body>{detail.specialty||detail.description||''}</Body>}
  {busy&&<Loading/>}
  {kind==='doctors'&&<>
   {detail.subSpecialty&&<Item title="الاختصاص الدقيق" subtitle={detail.subSpecialty}/>}
   {detail.qualifications&&<Item title="المؤهلات" subtitle={detail.qualifications}/>}
   {detail.experienceYears!==undefined&&detail.experienceYears!==null&&<Item title="سنوات الخبرة" subtitle={`${detail.experienceYears} سنة`}/>}
   {detail.ratingCount>0&&<Item title="تقييم المرضى" subtitle={`${Number(detail.ratingAverage||0).toFixed(1)} من 5 · ${detail.ratingCount} تقييم`}/>}
   {detail.bio&&<><Heading>نبذة عن الطبيب</Heading><Body>{detail.bio}</Body></>}
   {detail.clinicName&&<Item title="العيادة" subtitle={detail.clinicName}/>}
  </>}
  {kind==='facilities'&&<>
   {detail.description&&<><Heading>نبذة عن المنشأة</Heading><Body>{detail.description}</Body></>}
   {detail.facilityType==='hospital'&&<Body>تعرض هذه الصفحة بيانات المستشفى والخدمات التي سجلتها الإدارة. قد تختلف الأقسام والتخصصات المتاحة بحسب ما تم إدخاله واعتماده.</Body>}
  </>}
  {(detail.city||detail.address||hasCoordinates)&&<>
   <Heading>الموقع والعنوان</Heading>
   {detail.city&&<Item title="المحافظة" subtitle={detail.city}/>}
   {detail.address&&<Item title="العنوان المسجل" subtitle={detail.address}/>}
   {hasCoordinates&&<Body>تم تسجيل إحداثيات الموقع لهذه الجهة.</Body>}
   <Action title="عرض الموقع والاتجاهات على الخريطة" onPress={openMap}/>
  </>}
  {contactPhone&&<><Heading>التواصل</Heading><Item title="رقم التواصل" subtitle={contactPhone}/><Action title="اتصال" onPress={callProvider}/></>}
  {kind==='facilities'&&<>
   <Heading>الأقسام والخدمات المتاحة</Heading>
   <Body>هذه الخدمات التي أضافتها المنشأة إلى ملفها. السعر والمدة يظهران عند تسجيلهما فقط.</Body>
   {services.length?services.map(s=><View key={s.id} style={{backgroundColor:'#fff',borderWidth:1,borderColor:'#DCEBEA',borderRadius:15,padding:14,marginVertical:6}}>
    <Text style={{textAlign:'right',fontWeight:'900',fontSize:15,color:'#15384D'}}>{s.name}</Text>
    <Text style={{textAlign:'right',color:'#718596',marginTop:6,lineHeight:21}}>{s.priceIqd!==undefined&&s.priceIqd!==null?`السعر: ${Number(s.priceIqd).toLocaleString('ar-IQ')} د.ع`:'السعر: غير محدد'}{s.expectedDurationMinutes?` · المدة التقريبية: ${s.expectedDurationMinutes} دقيقة`:''}</Text>
   </View>):!busy&&<Body>لم تسجل هذه المنشأة خدمات للعرض حالياً. يمكنك التواصل معها للاستفسار عن خدماتها.</Body>}
  </>}
  {kind==='doctors'&&<Body>اختر موعداً متاحاً من جدول الطبيب. المواعيد المعروضة تُحدَّث من جدول الدوام الفعلي.</Body>}
  <Action title={kind==='doctors'?'عرض المواعيد والحجز':'اختيار الخدمة والموعد'} onPress={onBook}/>
 </Screen>;
}
