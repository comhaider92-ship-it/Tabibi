import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Pressable,Text,View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {Screen} from '../components/Screen';
import {Action,Body,Heading,Loading} from '../components/UI';
import {api,downloadMedicalAttachment,uploadMedicalAttachment} from '../api/client';

const types=[
 {key:'',label:'الكل'},
 {key:'visit_summary',label:'ملخص زيارة'},
 {key:'diagnosis',label:'تشخيص'},
 {key:'prescription',label:'وصفة طبية'},
 {key:'test_result',label:'نتيجة تحليل'},
 {key:'note',label:'ملاحظة'},
];
const labels:Record<string,string>={note:'ملاحظة طبية',diagnosis:'تشخيص',prescription:'وصفة طبية',test_result:'نتيجة تحليل',visit_summary:'ملخص زيارة'};
const actionColors:Record<string,string>={attachment_download:'#087E8B',share_revoke:'#B42318',delete:'#B42318'};
const dateText=(value?:string)=>value?new Date(value).toLocaleDateString('ar-IQ',{timeZone:'Asia/Baghdad',year:'numeric',month:'long',day:'numeric'}):'—';
export function PatientHealthFileScreen(){
 const [rows,setRows]=useState<any[]>([]);const [attachments,setAttachments]=useState<Record<string,any[]>>({});const [attachmentBusy,setAttachmentBusy]=useState<string|null>(null);const [uploadBusy,setUploadBusy]=useState<string|null>(null);const [shares,setShares]=useState<any[]>([]);const [sharesBusy,setSharesBusy]=useState(false);const [shareExpanded,setShareExpanded]=useState(false);const [history,setHistory]=useState<any[]>([]);const [historyBusy,setHistoryBusy]=useState(false);const [historyExpanded,setHistoryExpanded]=useState(false);const [page,setPage]=useState(1);const [pages,setPages]=useState(0);const [total,setTotal]=useState(0);const [filter,setFilter]=useState('');const [expanded,setExpanded]=useState<string|null>(null);const [busy,setBusy]=useState(true);const [moreBusy,setMoreBusy]=useState(false);
 const load=useCallback(async(reset=true)=>{if(reset)setBusy(true);else setMoreBusy(true);try{const target=reset?1:page+1;const result=await api.patientHealthFile(target,20,filter||undefined);setRows(old=>reset?result.items:[...old,...result.items]);setPage(result.pagination.page);setPages(result.pagination.pages);setTotal(result.pagination.total);if(reset)setExpanded(null);}catch(e:any){Alert.alert('تعذر تحميل الملف الصحي',e?.message||'تحقق من الاتصال وحاول مجدداً.');}finally{setBusy(false);setMoreBusy(false);}},[filter,page]);
 useEffect(()=>{load(true);},[filter]);
 const loadAttachments=async(recordId:string)=>{setAttachmentBusy(recordId);try{const result=await api.medicalRecordAttachments(recordId);setAttachments(old=>({...old,[recordId]:result}));}catch(e:any){Alert.alert('تعذر تحميل المرفقات',e?.message||'حاول مجدداً.');}finally{setAttachmentBusy(null);}};
 const loadShares=async()=>{setSharesBusy(true);try{setShares(await api.medicalShareConsents());}catch(e:any){Alert.alert('تعذر تحميل المشاركات',e?.message||'حاول مجدداً.');}finally{setSharesBusy(false);}};
 const loadHistory=async()=>{setHistoryBusy(true);try{setHistory(await api.medicalAccessHistory());}catch(e:any){Alert.alert('تعذر تحميل سجل الاطلاع',e?.message||'حاول مجدداً.');}finally{setHistoryBusy(false);}};
 const revokeShare=(id:string)=>Alert.alert('سحب صلاحية المشاركة','بعد السحب لن يستطيع الطبيب فتح السجلات أو تنزيل مرفقاتها من خلال هذه الموافقة.',[{text:'إلغاء',style:'cancel'},{text:'سحب الصلاحية',style:'destructive',onPress:async()=>{try{await api.revokeMedicalShare(id);setShares(old=>old.map(x=>x.id===id?{...x,revokedAt:new Date().toISOString()}:x));Alert.alert('تم سحب الصلاحية','أصبحت هذه المشاركة ملغاة.');}catch(e:any){Alert.alert('تعذر سحب الصلاحية',e?.message||'حاول مجدداً.');}}}]);
 const revokeSharedRecord=(consentId:string,recordId:string,title:string)=>Alert.alert('إلغاء مشاركة سجل واحد',`سيُمنع الطبيب من الوصول إلى «${title||'هذا السجل'}» عبر هذه الموافقة، مع بقاء بقية السجلات المشتركة متاحة.`,[{text:'تراجع',style:'cancel'},{text:'إلغاء مشاركة السجل',style:'destructive',onPress:async()=>{try{await api.revokeMedicalSharedRecord(consentId,recordId);await loadShares();Alert.alert('تم تحديث المشاركة','أُلغي وصول الطبيب إلى هذا السجل فقط.');}catch(e:any){Alert.alert('تعذر تحديث المشاركة',e?.message||'حاول مجدداً.');}}}]);
 const openAttachment=async(file:any)=>{try{await downloadMedicalAttachment(file.id,file.fileName,file.mimeType);}catch(e:any){Alert.alert('تعذر فتح المرفق',e?.message||'حاول مجدداً.');}};
 const addMedicalAttachment=async(recordId:string)=>{
  try{
   const picked=await DocumentPicker.getDocumentAsync({type:['image/jpeg','image/png','image/webp','application/pdf'],copyToCacheDirectory:true,multiple:false});
   if(picked.canceled||!picked.assets?.length)return;
   const file=picked.assets[0];
   const extension=file.name.toLowerCase().split('.').pop();
   const mime=file.mimeType||({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf'} as Record<string,string>)[extension||'']||'';
   const allowed=['image/jpeg','image/png','image/webp','application/pdf'];
   if(!allowed.includes(mime)){Alert.alert('نوع ملف غير مدعوم','اختر صورة JPG أو PNG أو WEBP أو ملف PDF.');return;}
   const fileInfo=await FileSystem.getInfoAsync(file.uri);
   const fileSize=file.size||(fileInfo.exists?fileInfo.size:0);
   if(!fileSize||fileSize>10*1024*1024){Alert.alert('حجم الملف غير مناسب','الحد الأقصى للملف الواحد هو 10 ميغابايت.');return;}
   Alert.alert('تأكيد رفع الملف',`الملف: ${file.name}\\nالحجم: ${(fileSize/1024/1024).toFixed(2)} ميغابايت\\nسيُرفع إلى سجلك الصحي الخاص، ولن تتم مشاركته مع الطبيب إلا بموافقة منفصلة منك.`,[
    {text:'إلغاء',style:'cancel'},
    {text:'رفع الملف',onPress:async()=>{
     setUploadBusy(recordId);
     try{
      const base64=await FileSystem.readAsStringAsync(file.uri,{encoding:FileSystem.EncodingType.Base64});
      const uploaded=await uploadMedicalAttachment(file.name,mime,base64);
      await api.linkMedicalAttachment(recordId,uploaded.id);
      const refreshed=await api.medicalRecordAttachments(recordId);
      setAttachments(old=>({...old,[recordId]:refreshed}));
      setRows(old=>old.map(row=>row.id===recordId?{...row,attachmentCount:(row.attachmentCount||0)+1}:row));
      Alert.alert('تم رفع الملف','أُضيف الملف بنجاح إلى السجل الصحي.');
     }catch(e:any){Alert.alert('تعذر رفع الملف',e?.message||'تحقق من الاتصال وحاول مجدداً.');}
     finally{setUploadBusy(null);}
    }}
   ]);
  }catch(e:any){Alert.alert('تعذر اختيار الملف',e?.message||'حاول مجدداً.');}
 };
 const dateTime=(value?:string)=>value?new Date(value).toLocaleDateString('ar-IQ',{timeZone:'Asia/Baghdad',year:'numeric',month:'short',day:'numeric'}):'—';
 const refresh=()=>load(true);
 return <Screen>
  <Heading>ملفي الصحي</Heading>
  <Body>تجد هنا سجلاتك الطبية مرتبة من الأحدث إلى الأقدم، بما فيها الوصفات ونتائج التحاليل والتقارير التي أضافها الطبيب. هذا السجل للعرض والتنظيم ولا يُعد تشخيصاً طبياً آلياً.</Body>
  <View style={{backgroundColor:'#EAF4F5',borderRadius:12,padding:13,marginTop:12,marginBottom:10}}>
   <Text style={{textAlign:'right',fontSize:13,color:'#087E8B',fontWeight:'800'}}>إجمالي السجلات</Text>
   <Text style={{textAlign:'right',fontSize:25,color:'#172B4D',fontWeight:'900',marginTop:3}}>{total}</Text>
  </View>
  <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:7,marginVertical:9}}>{types.map(t=><Pressable key={t.key||'all'} onPress={()=>setFilter(t.key)} style={{paddingVertical:9,paddingHorizontal:12,borderRadius:20,backgroundColor:filter===t.key?'#087E8B':'#EEF2F6',borderWidth:1,borderColor:filter===t.key?'#087E8B':'#DCE3EB'}}><Text style={{color:filter===t.key?'#fff':'#40536A',fontWeight:'700',fontSize:12}}>{t.label}</Text></Pressable>)}</View>
  <Action title="تحديث السجل" onPress={refresh} disabled={busy||moreBusy}/>
  <View style={{marginTop:12,backgroundColor:'#F0F6F8',borderRadius:13,padding:12}}>
   <Pressable onPress={()=>{const next=!shareExpanded;setShareExpanded(next);if(next&&shares.length===0)loadShares();}}><Text style={{textAlign:'right',fontWeight:'800',fontSize:15,color:'#087E8B'}}>إدارة صلاحيات مشاركة ملفي الصحي {shareExpanded?'−':'+'}</Text></Pressable>
   {shareExpanded&&<View style={{marginTop:8}}><Body>يمكنك مراجعة الموافقات التي منحتها للأطباء، وإلغاء مشاركة سجل محدد أو سحب صلاحية الطبيب بالكامل. الإلغاء يمنع الوصول اللاحق عبر هذه المشاركة.</Body><Action title={sharesBusy?'جارٍ التحديث...':'تحديث المشاركات'} onPress={loadShares} disabled={sharesBusy}/>{sharesBusy?<Loading/>:shares.length===0?<Body>لا توجد موافقات مشاركة مسجلة.</Body>:shares.map((item:any)=>{const expired=new Date(item.expiresAt)<=new Date();const revoked=!!item.revokedAt;return <View key={item.id} style={{backgroundColor:'#fff',borderRadius:10,padding:11,marginTop:8}}><Text style={{...line,fontWeight:'900',color:'#172B4D'}}>{item.doctor?.fullName||'طبيب غير متاح حالياً'}</Text><Text style={line}>الاختصاص: {item.doctor?.specialty||'غير متوفر'}</Text><Text style={line}>العيادة: {item.doctor?.clinicName||'غير متوفر'}{item.doctor?.city?` — ${item.doctor.city}`:''}</Text>{item.doctor&&!item.doctor.currentlyApproved&&<Text style={{...line,color:'#A15C00'}}>تنبيه: ملف الطبيب لم يعد معتمداً حالياً.</Text>}<Text style={line}>السجلات المشمولة: {item.records?.length||0}</Text>{(item.records||[]).map((record:any)=><View key={record.id} style={{marginTop:5,backgroundColor:'#F6F8FB',borderRadius:8,padding:8}}><Text style={line}>{record.title||'سجل طبي'}</Text><Text style={{...line,fontSize:11}}>النوع: {labels[record.recordType]||record.recordType} · {dateText(record.createdAt)} · المرفقات: {record.attachmentCount||0}</Text>{!revoked&&!expired&&<Action title="إلغاء مشاركة هذا السجل فقط" onPress={()=>revokeSharedRecord(item.id,record.id,record.title)}/>}</View>)}<Text style={line}>تنتهي في: {dateTime(item.expiresAt)}</Text><Text style={line}>السماح للطبيب بتنزيل المرفقات: {item.allowDownload?'نعم':'لا'}</Text><Text style={{...line,color:revoked?'#B42318':expired?'#A15C00':'#087E8B',fontWeight:'800'}}>الحالة: {revoked?'ملغاة':expired?'منتهية':'سارية'}</Text>{!revoked&&!expired&&<Action title="سحب صلاحية الطبيب" onPress={()=>revokeShare(item.id)}/>}</View>})}</View>}
  </View>
  <View style={{marginTop:12,backgroundColor:'#F0F6F8',borderRadius:13,padding:12}}>
   <Pressable onPress={()=>{const next=!historyExpanded;setHistoryExpanded(next);if(next&&history.length===0)loadHistory();}}><Text style={{textAlign:'right',fontWeight:'800',fontSize:15,color:'#087E8B'}}>سجل الاطلاع والنشاط على ملفي الصحي {historyExpanded?'−':'+'}</Text></Pressable>
   {historyExpanded&&<View style={{marginTop:8}}><Body>يعرض هذا السجل الأنشطة المسجلة على ملفك، مثل فتح السجلات والوصفات والتقارير، وعرض المرفقات وتنزيلها، ومنح المشاركة أو إلغائها. قد لا تظهر هنا الأنشطة التي لم يسجلها النظام.</Body><Action title={historyBusy?'جارٍ التحديث...':'تحديث سجل الاطلاع'} onPress={loadHistory} disabled={historyBusy}/>{historyBusy?<Loading/>:history.length===0?<Body>لا توجد أنشطة مسجلة حتى الآن.</Body>:history.map((event:any)=><View key={event.id} style={{backgroundColor:'#fff',borderRadius:10,padding:11,marginTop:8,borderRightWidth:3,borderRightColor:actionColors[event.action]||'#9AAAB8'}}><Text style={{...line,fontWeight:'900',color:'#172B4D'}}>{event.actionLabel}</Text><Text style={line}>بواسطة: {event.actorName} · {event.actorIsPatient?'صاحب الملف':event.actorRole==='doctor'?'طبيب':event.actorRole==='owner'?'مالك':'مستخدم'}</Text>{!!event.recordTitle&&<Text style={line}>السجل: {event.recordTitle}{event.recordDeleted?' (محذوف حالياً)':''}</Text>}<Text style={line}>التاريخ: {new Date(event.createdAt).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</Text></View>)}</View>}
  </View>
  {busy?<Loading/>:rows.length===0?<View style={{padding:18,backgroundColor:'#fff',borderRadius:12,marginTop:12}}><Body>لا توجد سجلات طبية ضمن هذا التصنيف حالياً. ستظهر هنا السجلات التي تُضاف إلى حسابك بعد الزيارات الطبية.</Body></View>:rows.map(item=>{const open=expanded===item.id;const prescription=item.prescription;const lab=item.labResult;const report=item.clinicalReport;return <View key={item.id} style={{backgroundColor:'#fff',borderWidth:1,borderColor:'#E3EAF0',borderRadius:14,padding:13,marginTop:10}}>
   <Pressable onPress={()=>setExpanded(open?null:item.id)}>
    <View style={{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontSize:15,fontWeight:'800',color:'#172B4D',flex:1,textAlign:'right'}}>{item.title||labels[item.recordType]||'سجل طبي'}</Text><Text style={{color:'#087E8B',fontWeight:'800',marginLeft:8}}>{open?'−':'+'}</Text></View>
    <Text style={{textAlign:'right',color:'#087E8B',fontSize:12,fontWeight:'700',marginTop:7}}>{labels[item.recordType]||item.recordType}</Text>
    <Text style={{textAlign:'right',color:'#68788D',fontSize:12,marginTop:5}}>{dateText(item.createdAt)}</Text>
    <Text numberOfLines={open?undefined:2} style={{textAlign:'right',color:'#40536A',fontSize:13,lineHeight:21,marginTop:8}}>{item.content||'لا يوجد وصف إضافي.'}</Text>
    <Text style={{textAlign:'right',color:'#68788D',fontSize:11,marginTop:7}}>المرفقات الخاصة: {item.attachmentCount||0}</Text>
   </Pressable>
   {open&&<View style={{borderTopWidth:1,borderTopColor:'#E8EDF2',marginTop:12,paddingTop:10}}>
    {!!prescription&&<><Text style={section}>تفاصيل الوصفة</Text>{(prescription.medications||[]).map((m:any,i:number)=><View key={i} style={{backgroundColor:'#F6F8FB',padding:10,borderRadius:9,marginTop:7}}><Text style={line}>الدواء: {m.medicationName}</Text>{!!m.strength&&<Text style={line}>التركيز: {m.strength}</Text>}<Text style={line}>الجرعة: {m.dosage}</Text><Text style={line}>التكرار: {m.frequency}</Text><Text style={line}>المدة: {m.duration}</Text>{!!m.instructions&&<Text style={line}>تعليمات: {m.instructions}</Text>}</View>)}{!!prescription.generalInstructions&&<Text style={line}>تعليمات عامة: {prescription.generalInstructions}</Text>}</>}
    {!!lab&&<><Text style={section}>نتيجة التحليل</Text><Text style={line}>اسم الفحص: {lab.testName}</Text>{!!lab.resultValue&&<Text style={line}>النتيجة: {lab.resultValue} {lab.unit||''}</Text>}{!!lab.referenceRange&&<Text style={line}>المدى المرجعي: {lab.referenceRange}</Text>}{!!lab.interpretation&&<Text style={line}>حالة التفسير: {lab.interpretation}</Text>}{!!lab.clinicalComment&&<Text style={line}>ملاحظة الطبيب: {lab.clinicalComment}</Text>}</>}
    {!!report&&<><Text style={section}>التقرير السريري</Text><Text style={line}>نوع التقرير: {report.reportKind}</Text><Text style={line}>{report.summary}</Text>{(report.sections||[]).map((s:any,i:number)=><View key={i} style={{marginTop:7}}><Text style={line}>{s.heading}</Text><Text style={line}>{s.body}</Text></View>)}{!!report.recommendations&&<Text style={line}>التوصيات: {report.recommendations}</Text>}{!!report.followUpPlan&&<Text style={line}>خطة المتابعة: {report.followUpPlan}</Text>}</>}
    {!prescription&&!lab&&!report&&<Text style={line}>لا توجد تفاصيل منظمة إضافية لهذا السجل.</Text>}
    <View style={{marginTop:10}}>
     <Action title={uploadBusy===item.id?'جارٍ رفع الملف...':'إضافة صورة تحليل أو تقرير / PDF'} onPress={()=>addMedicalAttachment(item.id)} disabled={uploadBusy!==null}/>
     {!!item.attachmentCount&&<Action title={attachmentBusy===item.id?'جارٍ تحميل المرفقات...':attachments[item.id]?'تحديث قائمة المرفقات':'عرض المرفقات الطبية'} onPress={()=>loadAttachments(item.id)} disabled={attachmentBusy!==null||uploadBusy!==null}/>}
     {attachments[item.id]?.map((file:any)=><View key={file.id} style={{backgroundColor:'#F6F8FB',borderRadius:9,padding:10,marginTop:7}}><Text style={line}>الملف: {file.fileName}</Text><Text style={line}>النوع: {file.mimeType}</Text><Text style={line}>الحجم: {Math.max(1,Math.round((file.sizeBytes||0)/1024))} كيلوبايت</Text><Text style={line}>تاريخ الإضافة: {dateTime(file.createdAt)}</Text>{file.canDownload?<Action title="فتح / مشاركة الملف" onPress={()=>openAttachment(file)}/>:<Text style={[line,{color:'#A15C00'}]}>التنزيل غير مسموح ضمن صلاحية المشاركة الحالية.</Text>}</View>)}{attachments[item.id]?.length===0&&<Body>لا توجد ملفات مرفقة بهذا السجل.</Body>}</View>
   </View>}
  </View>})}
  {!busy&&page<pages&&<Action title={moreBusy?'جارٍ تحميل المزيد...':'عرض سجلات أقدم'} onPress={()=>load(false)} disabled={moreBusy}/>}
  {!busy&&rows.length>0&&<Text style={{textAlign:'center',color:'#68788D',fontSize:12,marginTop:10}}>عرض {rows.length} من أصل {total} سجل</Text>}
 </Screen>;
}
const section={textAlign:'right' as const,fontSize:14,fontWeight:'800' as const,color:'#087E8B',marginTop:8,marginBottom:4};
const line={textAlign:'right' as const,fontSize:13,color:'#40536A',lineHeight:21,marginTop:4};
