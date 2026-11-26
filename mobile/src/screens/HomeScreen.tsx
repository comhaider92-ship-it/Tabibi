import React,{useEffect,useState} from 'react';
import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Field, Loading, Body } from '../components/UI';
import { api } from '../api/client';

const C={ink:'#15384D',muted:'#718596',teal:'#078B91',deep:'#087783',mint:'#E9F7F5',line:'#DCEBEA',white:'#FFFFFF'};
const specialtyIcons:Record<string,string>={'طب الأطفال':'👶','أمراض النساء':'🌷','النساء والولادة':'🌷','القلب':'❤️','القلب والأوعية':'❤️','الباطنية':'🩺','الأسنان':'🦷','الجلدية':'✨','العيون':'👁️','العظام':'🦴','الأعصاب':'🧠','الأنف والأذن':'👂','طب الأسرة':'🏡'};
const serviceTiles=[{title:'الأشعة',subtitle:'تصوير طبي',icon:'🩻',query:'أشعة'},{title:'الرنين المغناطيسي',subtitle:'MRI',icon:'🧲',query:'رنين مغناطيسي'},{title:'المفراس',subtitle:'CT scan',icon:'🖥️',query:'مفراس'},{title:'السونار',subtitle:'Ultrasound',icon:'🌊',query:'سونار'}];
function Tile({icon,title,subtitle,onPress}:{icon:string;title:string;subtitle?:string;onPress:()=>void}){return <Pressable onPress={onPress} style={({pressed})=>({width:'48.2%',backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:21,paddingVertical:15,paddingHorizontal:10,alignItems:'center',marginBottom:10,opacity:pressed?.82:1})}><View style={{width:54,height:54,borderRadius:18,backgroundColor:C.mint,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:29}}>{icon}</Text></View><Text style={{fontSize:14,fontWeight:'900',color:C.ink,textAlign:'center',marginTop:9}}>{title}</Text>{!!subtitle&&<Text style={{fontSize:11,color:C.muted,marginTop:3}}>{subtitle}</Text>}</Pressable>}
export function HomeScreen({onSearch,onBookings,onProfile,onHealthFile,onAdTarget}:{onSearch:(kind:'doctors'|'facilities',q:string)=>void;onBookings:()=>void;onProfile:()=>void;onHealthFile:()=>void;onAdTarget:(ad:any)=>void}){
 const [q,setQ]=useState('');const [cats,setCats]=useState<{doctors:{code:string;name:string}[];diagnostics:{code:string;name:string}[]}|null>(null);const [busy,setBusy]=useState(true);const [ad,setAd]=useState<any>(null);
 useEffect(()=>{api.categories().then(setCats).catch(e=>Alert.alert('تعذر تحميل الأقسام',e.message)).finally(()=>setBusy(false));api.publicAds('home').then(rows=>{const first=rows?.[0];if(first){setAd(first);api.recordAdImpression(first.id).catch(()=>{});}}).catch(()=>{});},[]);
 const openAd=async()=>{if(!ad)return;try{await api.recordAdClick(ad.id);if(ad.targetType&&ad.targetType!=='none'&&ad.targetId){onAdTarget(ad);return;}if(ad.targetUrl)await Linking.openURL(ad.targetUrl);}catch{Alert.alert('تعذر فتح الإعلان','تحقق من اتصال الإنترنت أو رابط الإعلان.');}};
 const search=(kind:'doctors'|'facilities',text=q)=>onSearch(kind,text.trim());
 return <Screen>
  <View style={{backgroundColor:'#E8F6F4',borderRadius:28,padding:20,marginBottom:14,borderWidth:1,borderColor:'#D4EBE7'}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
    <View style={{width:48,height:48,borderRadius:17,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:27}}>🩺</Text></View>
    <View style={{flex:1,alignItems:'flex-end',marginRight:10}}><Text style={{fontSize:27,fontWeight:'900',color:C.ink}}>طبيبي</Text><Text style={{fontSize:12,color:C.deep,fontWeight:'700'}}>صحتك... بين يديك</Text></View>
   </View>
   <Text style={{fontSize:22,fontWeight:'900',color:C.ink,textAlign:'right',marginTop:17}}>رعايتك الصحية أقرب وأسهل</Text>
   <Text style={{fontSize:13,color:'#557383',textAlign:'right',marginTop:5,lineHeight:22}}>ابحث عن طبيبك أو المركز والخدمة التي تحتاجها بكل راحة.</Text>
  </View>
  <Field value={q} onChangeText={setQ} placeholder="🔎  ابحث عن طبيب أو مركز أو خدمة..." returnKeyType="search" onSubmitEditing={()=>search('doctors')}/>
  <View style={{flexDirection:'row',gap:9,marginBottom:12}}>
   <Pressable onPress={()=>search('doctors')} style={{flex:1,backgroundColor:C.teal,borderRadius:15,padding:13,alignItems:'center'}}><Text style={{color:'#fff',fontWeight:'900'}}>ابحث عن طبيب</Text></Pressable>
   <Pressable onPress={()=>search('facilities')} style={{flex:1,backgroundColor:'#DDF2EF',borderRadius:15,padding:13,alignItems:'center'}}><Text style={{color:C.deep,fontWeight:'900'}}>ابحث عن مركز</Text></Pressable>
  </View>
  {ad&&<Pressable onPress={openAd} style={{backgroundColor:'#DDF3F0',borderRadius:22,padding:13,marginBottom:17,borderWidth:1,borderColor:'#C5E6E1'}}>
   <Text style={{textAlign:'right',fontSize:11,color:C.deep,fontWeight:'900'}}>إعلان مميز</Text>
   {ad.imageUrl&&<Image source={{uri:ad.imageUrl}} style={{width:'100%',height:125,borderRadius:15,marginTop:8}} resizeMode="cover"/>}
   <Text style={{textAlign:'right',fontWeight:'900',fontSize:16,color:C.ink,marginTop:8}}>{ad.title}</Text>
   {!!ad.description&&<Text style={{textAlign:'right',color:'#557383',marginTop:4,lineHeight:21}}>{ad.description}</Text>}
   <Text style={{textAlign:'right',color:C.deep,fontWeight:'800',marginTop:7}}>اكتشف التفاصيل ←</Text>
  </Pressable>}
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:5,marginBottom:8}}><Text style={{fontSize:21,fontWeight:'900',color:C.ink}}>الاختصاصات الطبية</Text><Text style={{fontSize:11,color:C.muted}}>اختر الاختصاص</Text></View>
  {busy?<Loading/>:<View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>{cats?.doctors.map(x=><Tile key={x.code} icon={specialtyIcons[x.name]||'✚'} title={x.name} onPress={()=>search('doctors',x.name)}/>)}</View>}
  <Text style={{fontSize:21,fontWeight:'900',color:C.ink,textAlign:'right',marginTop:10,marginBottom:10}}>خدمات الفحوصات والتصوير</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>{serviceTiles.map(x=><Tile key={x.title} icon={x.icon} title={x.title} subtitle={x.subtitle} onPress={()=>search('facilities',x.query)}/>)}</View>
  <Text style={{fontSize:21,fontWeight:'900',color:C.ink,textAlign:'right',marginTop:8,marginBottom:10}}>المراكز والخدمات الأخرى</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>
   <Tile icon="🏥" title="المستشفيات" subtitle="استعرض المستشفيات" onPress={()=>search('facilities','مستشفى')}/>
   <Tile icon="🩺" title="الأطباء" subtitle="دليل الأطباء" onPress={()=>search('doctors','')}/>
   <Tile icon="🏨" title="المراكز الطبية" subtitle="مراكز وعيادات" onPress={()=>search('facilities','مركز طبي')}/>
   <Tile icon="🧪" title="المختبرات" subtitle="تحاليل وفحوصات" onPress={()=>search('facilities','مختبر')}/>
   <Tile icon="💊" title="الصيدليات" subtitle="خدمات الصيدلة" onPress={()=>search('facilities','صيدلية')}/>
   <Tile icon="✚" title="خدمات أخرى" subtitle="اكتشف المزيد" onPress={()=>search('facilities','')}/>
  </View>
  <View style={{backgroundColor:'#EAF6F4',borderRadius:21,padding:17,marginTop:5,marginBottom:13}}>
   <Text style={{fontSize:17,fontWeight:'900',color:C.deep,textAlign:'right'}}>صحتك تهمنا 💚</Text>
   <Text style={{fontSize:13,color:'#557383',textAlign:'right',lineHeight:23,marginTop:5}}>خطوة بسيطة اليوم قد تصنع فرقاً كبيراً في عنايتك بصحتك.</Text>
  </View>
  <View style={{flexDirection:'row',justifyContent:'space-between',gap:8}}>
   <Pressable onPress={onBookings} style={{flex:1,padding:13,backgroundColor:'#fff',borderWidth:1,borderColor:C.line,borderRadius:15,alignItems:'center'}}><Text style={{fontSize:20}}>📅</Text><Text style={{color:C.ink,fontWeight:'800',marginTop:4}}>المواعيد</Text></Pressable>
   <Pressable onPress={onHealthFile} style={{flex:1,padding:13,backgroundColor:'#fff',borderWidth:1,borderColor:C.line,borderRadius:15,alignItems:'center'}}><Text style={{fontSize:20}}>📁</Text><Text style={{color:C.ink,fontWeight:'800',marginTop:4}}>ملفي الصحي</Text></Pressable>
   <Pressable onPress={onProfile} style={{flex:1,padding:13,backgroundColor:'#fff',borderWidth:1,borderColor:C.line,borderRadius:15,alignItems:'center'}}><Text style={{fontSize:20}}>👤</Text><Text style={{color:C.ink,fontWeight:'800',marginTop:4}}>حسابي</Text></Pressable>
  </View>
 </Screen>;
}
