import React,{useEffect,useState} from 'react';
import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Action, Field, Heading, Item, Loading, Body } from '../components/UI';
import { api } from '../api/client';

const tile={backgroundColor:'#EAF5F6',borderColor:'#D5E9EA',borderWidth:1,borderRadius:14,padding:13,marginBottom:9};
const ink='#172B4D',teal='#087E8B',muted='#506176';
export function HomeScreen({onSearch,onBookings,onProfile,onHealthFile,onAdTarget}:{onSearch:(kind:'doctors'|'facilities',q:string)=>void;onBookings:()=>void;onProfile:()=>void;onHealthFile:()=>void;onAdTarget:(ad:any)=>void}){
 const [q,setQ]=useState('');const [cats,setCats]=useState<{doctors:{code:string;name:string}[];diagnostics:{code:string;name:string}[]}|null>(null);const [busy,setBusy]=useState(true);const [ad,setAd]=useState<any>(null);
 useEffect(()=>{api.categories().then(setCats).catch(e=>Alert.alert('تعذر تحميل الأقسام',e.message)).finally(()=>setBusy(false));api.publicAds('home').then(rows=>{const first=rows?.[0];if(first){setAd(first);api.recordAdImpression(first.id).catch(()=>{});}}).catch(()=>{});},[]);
 const search=(kind:'doctors'|'facilities',term=q)=>onSearch(kind,term.trim());
 const openAd=async()=>{if(!ad)return;try{await api.recordAdClick(ad.id);if(ad.targetType&&ad.targetType!=='none'&&ad.targetId){onAdTarget(ad);return;}if(ad.targetUrl)await Linking.openURL(ad.targetUrl);}catch{Alert.alert('تعذر فتح الإعلان','تحقق من اتصال الإنترنت أو رابط الإعلان.');}};
 return <Screen>
  <View style={{padding:4,marginBottom:8}}><Heading>طبيبي ♡</Heading><Body>اهتم بصحتك، وكل الخدمات الطبية قريبة منك.</Body></View>
  <View style={{backgroundColor:'#EAF5F6',padding:14,borderRadius:18,marginBottom:12}}><Text style={{textAlign:'right',fontSize:18,fontWeight:'800',color:ink}}>كيف نساعدك اليوم؟</Text><Text style={{textAlign:'right',color:muted,marginTop:4}}>ابحث عن طبيب أو مركز أو خدمة صحية.</Text><Field value={q} onChangeText={setQ} placeholder="اسم الطبيب، اختصاص، مركز أو خدمة" returnKeyType="search" onSubmitEditing={()=>search('doctors')}/><Action title="بحث" onPress={()=>search('doctors')}/></View>
  {ad&&<Pressable onPress={openAd} style={{backgroundColor:'#F0F7F4',borderRadius:16,padding:12,marginVertical:5,borderWidth:1,borderColor:'#D5E9EA'}}>{ad.imageUrl&&<Image source={{uri:ad.imageUrl}} style={{width:'100%',height:150,borderRadius:12,marginBottom:8}} resizeMode="cover"/>}<Text style={{textAlign:'right',fontSize:11,color:teal,fontWeight:'800'}}>إعلان مميز</Text><Text style={{textAlign:'right',fontWeight:'800',fontSize:16,color:ink,marginTop:3}}>{ad.title}</Text>{!!ad.description&&<Text style={{textAlign:'right',color:muted,marginTop:4}}>{ad.description}</Text>}</Pressable>}
  <Heading>خدمات سريعة</Heading><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>
   {[{label:'مواعيدي',action:onBookings,mark:'📅'},{label:'ملفي الصحي',action:onHealthFile,mark:'♡'},{label:'حسابي',action:onProfile,mark:'👤'},{label:'مراكز طبية',action:()=>search('facilities',''),mark:'🏥'}].map(x=><Pressable key={x.label} onPress={x.action} style={{...tile,width:'48%',alignItems:'center'}}><Text style={{fontSize:25,marginBottom:6}}>{x.mark}</Text><Text style={{fontWeight:'800',color:ink,textAlign:'center'}}>{x.label}</Text></Pressable>)}
  </View>
  <Heading>الأطباء والاختصاصات</Heading>{busy?<Loading/>:cats?.doctors.map(x=><Item key={x.code} title={x.name} onPress={()=>search('doctors',x.name)}/>)}
  <Heading>الفحوصات والمراكز الطبية</Heading><Body>اختر الخدمة للوصول إلى المختبرات والمنشآت المناسبة.</Body>{busy?<Loading/>:cats?.diagnostics.map(x=><Item key={x.code} title={x.name} onPress={()=>search('facilities',x.name)}/>)}
  <View style={{marginTop:12,backgroundColor:'#F3F7FA',borderRadius:14,padding:12}}><Text style={{textAlign:'right',fontWeight:'800',color:ink}}>صحتك أولاً</Text><Text style={{textAlign:'right',color:muted,marginTop:4}}>اجمع خيارات الرعاية الصحية والبحث والحجوزات في مكان واحد وبسهولة.</Text></View>
 </Screen>;
}