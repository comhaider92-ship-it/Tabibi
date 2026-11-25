import React,{useState} from 'react';
import {Alert,ScrollView,Text,View,Pressable} from 'react-native';
import {Screen} from './components/Screen';
import {Action,Body,Field,Heading,Item} from './components/UI';

type Role='patient'|'doctor'|'owner';
const colors={ink:'#172B4D',muted:'#506176',teal:'#087E8B',pale:'#EAF5F6'};
const doctors=[
 {name:'د. أحمد علي',spec:'طب الأطفال',city:'البصرة',clinic:'عيادة الأمل',days:'الأحد والثلاثاء والخميس'},
 {name:'د. زهراء كريم',spec:'أمراض النساء',city:'البصرة',clinic:'مركز الحياة الطبي',days:'السبت والاثنين والأربعاء'},
 {name:'د. مصطفى حسن',spec:'الباطنية والقلب',city:'بغداد',clinic:'مستشفى الشفاء',days:'الأحد والثلاثاء'},
];
const facilities=[
 {name:'مختبر النور',spec:'تحاليل مختبرية',city:'البصرة',clinic:'العشار'},
 {name:'مركز الحياة للأشعة',spec:'سونار وأشعة',city:'البصرة',clinic:'البراضعية'},
];
export function PreviewApp(){
 const [role,setRole]=useState<Role|null>(null);
 const [page,setPage]=useState('home');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<any>(null);
 const [booked,setBooked]=useState(false);
 const [doctorName,setDoctorName]=useState('');
 const [doctorSpec,setDoctorSpec]=useState('');
 const [doctorPhone,setDoctorPhone]=useState('');
 const [patientName,setPatientName]=useState('علي محمد');
 const [facilityApproved,setFacilityApproved]=useState(false);
 const [doctorApproved,setDoctorApproved]=useState(false);
 const [subscriptionApproved,setSubscriptionApproved]=useState(false);
 const [adTitle,setAdTitle]=useState('إعلان تجريبي: مركز الحياة الطبي');
 const go=(p:string)=>setPage(p);
 const back=()=>{if(page==='home'){setRole(null);return;}setPage('home');};
 const title=role==='patient'?'حساب المريض':role==='doctor'?'حساب الطبيب':'لوحة المالك';
 const button=(label:string,fn:()=>void)=> <Action title={label} onPress={fn}/>;
 const note=(s:string)=><View style={{backgroundColor:colors.pale,borderRadius:12,padding:12,marginVertical:8}}><Text style={{textAlign:'right',color:colors.ink,lineHeight:23}}>{s}</Text></View>;
 const header=<><Heading>طبيبي</Heading><Body>نسخة معاينة للواجهات — بيانات تجريبية فقط</Body><View style={{marginTop:10,marginBottom:14}}><Text style={{textAlign:'right',color:colors.teal,fontWeight:'800'}}>{title}</Text><Pressable onPress={back}><Text style={{textAlign:'right',color:colors.muted,marginTop:8}}>‹ رجوع / تغيير الدور</Text></Pressable></View></>;
 if(!role)return <Screen><Heading>مرحباً بك في طبيبي</Heading><Body>اختر الواجهة التي تريد استعراضها. لا تحتاج هذه المعاينة إلى تسجيل دخول أو خادم.</Body>{note('هذه نسخة عرض منفصلة. الأزرار تعرض تنقلاً وبيانات توضيحية، ولا تنشئ حسابات أو حجوزات حقيقية.')}{button('استعراض واجهة المريض',()=>{setRole('patient');go('home');})}{button('استعراض واجهة الطبيب',()=>{setRole('doctor');go('home');})}{button('استعراض لوحة المالك',()=>{setRole('owner');go('home');})}</Screen>;
 return <Screen>{header}
 {role==='patient'&&page==='home'&&<><Heading>الرعاية الصحية أقرب إليك</Heading><Field value={query} onChangeText={setQuery} placeholder="ابحث عن طبيب أو مختبر أو خدمة"/>{button('البحث عن طبيب',()=>go('doctors'))}{button('المختبرات ومراكز الفحوصات',()=>go('facilities'))}{button('حجوزاتي',()=>go('bookings'))}{button('ملفي الشخصي',()=>go('profile'))}{note('إعلان تجريبي: مركز طبي أو طبيب يمكن أن يظهر هنا.')}</>}
 {role==='patient'&&page==='doctors'&&<><Heading>الأطباء والاختصاصات</Heading>{doctors.filter(d=>(d.name+d.spec+d.city).includes(query)||!query).map((d,i)=><Item key={i} title={d.name} subtitle={d.spec+' · '+d.city+' · '+d.clinic} onPress={()=>{setSelected(d);go('detail');}}/> )}</>}
 {role==='patient'&&page==='facilities'&&<><Heading>المختبرات ومراكز الفحوصات</Heading>{facilities.map((d,i)=><Item key={i} title={d.name} subtitle={d.spec+' · '+d.city+' · '+d.clinic} onPress={()=>{setSelected(d);go('detail');}}/> )}</>}
 {role==='patient'&&page==='detail'&&<><Heading>{selected?.name}</Heading><Body>{selected?.spec} · {selected?.city}</Body>{note('المواعيد المتاحة: '+(selected?.days||'طوال أيام الأسبوع'))}{button('حجز موعد',()=>go('booking'))}</>}
 {role==='patient'&&page==='booking'&&<><Heading>تأكيد الحجز</Heading><Body>الجهة: {selected?.name||'الطبيب المختار'}</Body><Field value={patientName} onChangeText={setPatientName} placeholder="اسم المراجع"/>{button('تأكيد حجز تجريبي',()=>{setBooked(true);go('bookings');Alert.alert('معاينة فقط','تم عرض حجز تجريبي محلياً، ولم يُرسل إلى خادم.');})}</>}
 {role==='patient'&&page==='bookings'&&<><Heading>حجوزاتي</Heading>{booked?<Item title="حجز تجريبي" subtitle={(selected?.name||'الطبيب')+' · بانتظار التأكيد (بيانات عرض)'}/>:<Body>لا توجد حجوزات في المعاينة بعد. يمكنك تجربة البحث وإنشاء حجز توضيحي.</Body>}{button('العودة للبحث',()=>go('doctors'))}</>}
 {role==='patient'&&page==='profile'&&<><Heading>ملفي الشخصي</Heading><Field value={patientName} onChangeText={setPatientName} placeholder="الاسم الكامل"/><Body>رقم الهاتف: 07XXXXXXXXX</Body><Body>حالة الحساب: حساب تجريبي</Body></>}
 {role==='doctor'&&page==='home'&&<><Heading>بوابة الطبيب</Heading>{note('ملف الطبيب: '+(doctorApproved?'معتمد تجريبياً':'بانتظار مراجعة المالك'))}{button('تسجيل طبيب جديد / استعراض الطلب',()=>go('doctorRegister'))}{button('لوحة الطبيب والحجوزات',()=>go('doctorDashboard'))}{button('الاشتراك',()=>go('subscription'))}{button('إدارة الدوام',()=>go('schedule'))}</>}
 {role==='doctor'&&page==='doctorRegister'&&<><Heading>تسجيل طبيب</Heading><Field value={doctorName} onChangeText={setDoctorName} placeholder="اسم الطبيب الكامل"/><Field value={doctorSpec} onChangeText={setDoctorSpec} placeholder="الاختصاص الطبي"/><Field value={doctorPhone} onChangeText={setDoctorPhone} placeholder="رقم الهاتف" keyboardType="phone-pad"/>{note('في التطبيق الفعلي تُرفق وثائق التخرج والهوية المهنية لمراجعة المالك.')}{button('إرسال طلب تجريبي',()=>{Alert.alert('معاينة فقط','تم توضيح مسار التسجيل. لا يتم حفظ أو إرسال البيانات.');go('doctorDashboard');})}</>}
 {role==='doctor'&&page==='doctorDashboard'&&<><Heading>لوحة الطبيب</Heading>{note('حالة الملف: '+(doctorApproved?'معتمد':'بانتظار مراجعة المالك'))}<Heading>حجوزات المرضى</Heading><Item title="سارة أحمد" subtitle="حجز تجريبي · الأحد · مؤكد"/><Item title="محمد علي" subtitle="حجز تجريبي · الثلاثاء · مؤكد"/>{button('إدارة الدوام',()=>go('schedule'))}</>}
 {role==='doctor'&&page==='subscription'&&<><Heading>اشتراك الطبيب</Heading><Body>نوع الاشتراك: تجريبي — دفع يدوي بعد موافقة المالك.</Body>{note(subscriptionApproved?'حالة الاشتراك: مفعل تجريبياً':'حالة الاشتراك: بانتظار مراجعة المالك')}{button('طلب اشتراك تجريبي',()=>Alert.alert('معاينة فقط','هذا المسار توضيحي ولا ينفذ دفعة مالية.'))}</>}
 {role==='doctor'&&page==='schedule'&&<><Heading>إدارة الدوام والمواعيد</Heading>{['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'].map(d=><Item key={d} title={d} subtitle="متاح للحجز · نموذج عرض"/> )}</>}
 {role==='owner'&&page==='home'&&<><Heading>لوحة تحكم المالك</Heading>{note('صلاحية المالك الكاملة — معاينة توضيحية')}{button('مراجعة طلبات الأطباء',()=>go('review'))}{button('مراجعة المنشآت',()=>go('facilitiesReview'))}{button('مراجعة الاشتراكات',()=>go('ownerSubscriptions'))}{button('إدارة الإعلانات',()=>go('ads'))}{button('إدارة المستخدمين',()=>go('users'))}</>}
 {role==='owner'&&page==='review'&&<><Heading>مراجعة ملفات الأطباء</Heading><Item title={doctorName||'د. أحمد علي'} subtitle={doctorSpec||'طب الأطفال'} />{note('راجع بيانات الطبيب ووثائقه قبل الموافقة أو الرفض.')}{button('موافقة تجريبية',()=>{setDoctorApproved(true);Alert.alert('معاينة فقط','تم تغيير حالة العرض محلياً.');})}{button('رفض تجريبي',()=>Alert.alert('معاينة فقط','لم يُرسل قرار إلى الخادم.'))}</>}
 {role==='owner'&&page==='facilitiesReview'&&<><Heading>مراجعة المنشآت</Heading><Item title="مركز الحياة الطبي" subtitle="البصرة · طلب اعتماد تجريبي"/>{button(facilityApproved?'معتمد تجريبياً':'موافقة تجريبية',()=>setFacilityApproved(true))}</>}
 {role==='owner'&&page==='ownerSubscriptions'&&<><Heading>الاشتراكات والمدفوعات</Heading><Item title="طلب اشتراك د. أحمد" subtitle="دفع يدوي · قيد المراجعة"/>{button('تأكيد الاشتراك تجريبياً',()=>setSubscriptionApproved(true))}</>}
 {role==='owner'&&page==='ads'&&<><Heading>إدارة الإعلانات</Heading><Field value={adTitle} onChangeText={setAdTitle} placeholder="عنوان الإعلان"/>{note(adTitle)}{button('حفظ إعلان تجريبي',()=>Alert.alert('معاينة فقط','لم يتم حفظ إعلان فعلي.'))}</>}
 {role==='owner'&&page==='users'&&<><Heading>إدارة المستخدمين</Heading><Item title="علي محمد" subtitle="مريض · حساب تجريبي"/><Item title={doctorName||'د. أحمد علي'} subtitle="طبيب · حساب تجريبي"/></>}
 <View style={{height:12}}/>{button('الصفحة الرئيسية لهذا الدور',()=>go('home'))}{button('تغيير الدور',()=>{setRole(null);setPage('home');})}
 </Screen>;
}
