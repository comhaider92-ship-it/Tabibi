import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
export type Role = 'patient' | 'doctor' | 'owner';
export type ApiError = { message?: string | string[] };

// Deliberately has no localhost fallback: a release APK on a phone cannot reach
// the developer machine through localhost. Configure EXPO_PUBLIC_API_URL at build time.
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
function assertApiConfiguration() {
  if (!API_BASE_URL) {
    throw new Error('عنوان خادم طبيبي غير مضبوط. أضف EXPO_PUBLIC_API_URL بعنوان الخادم ثم أعد بناء التطبيق.');
  }
  let parsed: URL;
  try { parsed = new URL(API_BASE_URL); }
  catch { throw new Error('عنوان خادم طبيبي غير صالح. استخدم رابطاً يبدأ بـ https:// أو http://.'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('عنوان الخادم يجب أن يستخدم HTTP أو HTTPS.');
  }
  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) {
    throw new Error('لا تستخدم localhost داخل نسخة الهاتف. استخدم عنوان الخادم المتاح للهاتف أو رابط HTTPS.');
  }
}
export const getApiBaseUrl = () => API_BASE_URL;
export async function uploadMedicalAttachment(fileName:string,mimeType:string,base64:string){
  assertApiConfiguration();
  if(!accessToken) throw new Error('انتهت جلسة الدخول. سجّل الدخول مجدداً.');
  if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(mimeType)) throw new Error('نوع الملف غير مدعوم.');
  if(!base64 || base64.length > 14 * 1024 * 1024) throw new Error('حجم الملف يتجاوز الحد المسموح.');
  return request<any>('/uploads',{method:'POST',body:JSON.stringify({fileName,mimeType,base64,category:'medical_attachment'})});
}
export async function downloadMedicalAttachment(id:string,fileName:string,mimeType?:string){
  assertApiConfiguration();
  if(!accessToken) throw new Error('انتهت جلسة الدخول. سجّل الدخول مجدداً.');
  const safeName=(fileName||'medical-file').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,100)||'medical-file';
  if(!FileSystem.cacheDirectory) throw new Error('مساحة الملفات المؤقتة غير متاحة على الجهاز.');
  const target=`${FileSystem.cacheDirectory}${Date.now()}-${safeName}`;
  const result=await FileSystem.downloadAsync(`${API_BASE_URL}/uploads/${encodeURIComponent(id)}/download`,target,{headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/octet-stream'}});
  if(result.status<200||result.status>=300) throw new Error('تعذر تنزيل المرفق الطبي.');
  if(await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri,{mimeType,dialogTitle:'فتح المرفق الطبي'});
  else throw new Error('مشاركة الملفات غير متاحة على هذا الجهاز.');
}
let accessToken: string | null = null;
const TOKEN_KEY = 'tabibi.accessToken';
export const setAccessToken = async (token: string | null) => {
  accessToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
};
export const restoreAccessToken = async () => { accessToken = await SecureStore.getItemAsync(TOKEN_KEY); return accessToken; };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertApiConfiguration();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as ApiError | null)?.message;
    throw new Error(Array.isArray(message) ? message.join('، ') : message || `تعذر إكمال الطلب (${response.status})`);
  }
  return body as T;
}

const queryString = (values: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const api = {
  login: (identifier: string, password: string) => request<{accessToken: string; user: {id:string; role:Role; displayName:string}}>('/auth/login', {method:'POST', body:JSON.stringify({identifier,password})}),
  me: () => request<{id:string;displayName:string;email:string|null;phone:string|null;role:Role;isVerified:boolean}>('/auth/me'),
  changePassword: (currentPassword:string,newPassword:string) => request<{message:string}>('/auth/me/password/change',{method:'POST',body:JSON.stringify({currentPassword,newPassword})}),
  revokeAllSessions: () => request<{message:string}>('/auth/me/sessions/revoke-all',{method:'POST'}),
  mySessions: () => request<Array<{id:string;device:string;createdAt:string;lastSeenAt:string;expiresAt:string;isCurrent:boolean}>>('/auth/me/sessions'),
  revokeSession: (id:string) => request<{message:string}>(`/auth/me/sessions/${encodeURIComponent(id)}/revoke`,{method:'POST'}),
  myLoginSecurityActivity: () => request<Array<{id:string;result:'success'|'failed';createdAt:string}>>('/auth/me/security/activity'),
  updatePatientProfile: (displayName:string) => request<{id:string;displayName:string;email:string|null;phone:string|null;role:Role;isVerified:boolean}>('/auth/me/profile',{method:'PATCH',body:JSON.stringify({displayName})}),
  requestContactChange: (contactType:'phone'|'email',value:string) => request<{message:string;expiresInSeconds:number}>('/auth/me/contact-change/request',{method:'POST',body:JSON.stringify({contactType,value})}),
  confirmContactChange: (contactType:'phone'|'email',value:string,code:string) => request<{message:string}>('/auth/me/contact-change/confirm',{method:'POST',body:JSON.stringify({contactType,value,code})}),
  register: (data: {displayName:string; phone?:string; email?:string; password:string; role:'patient'}) => request<{id:string;displayName:string;role:Role;isVerified:boolean;message:string}>('/auth/register', {method:'POST',body:JSON.stringify(data)}),
  requestOtp: (identifier:string, purpose:'verify_account'|'reset_password') => request<{message:string;expiresInSeconds?:number}>('/auth/otp/request',{method:'POST',body:JSON.stringify({identifier,purpose})}),
  confirmOtp: (identifier:string, purpose:'verify_account'|'reset_password', code:string, newPassword?:string) => request<{message:string}>('/auth/otp/confirm',{method:'POST',body:JSON.stringify({identifier,purpose,code,newPassword})}),
  categories: () => request<{doctors:{code:string;name:string}[];diagnostics:{code:string;name:string}[]}>('/medical-directory/categories'),
  doctors: (q:string, city?:string) => request<{items:any[];pagination?:any}>(`/doctors${queryString({q,city})}`),
  doctor: (id:string) => request<any>(`/doctors/${id}`),
  doctorSlots: (id:string, from:string, to:string) => request<any[]>(`/doctors/${id}/available-slots${queryString({from,to})}`),
  bookDoctor: (data:{doctorProfileId:string;beneficiaryId?:string;beneficiaryName?:string;beneficiaryPhone?:string;startsAt:string;endsAt:string;patientNote?:string}, key:string) => request('/appointments',{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(data)}),
  facilities: (q:string, city?:string) => request<any[]>(`/facilities${queryString({q,city})}`),
  facilityServices: (id:string) => request<any[]>(`/facilities/${id}/services`),
  facilitySlots: (id:string, from:string, to:string, serviceId?:string) => request<any[]>(`/facilities/${id}/slots${queryString({from,to,serviceId})}`),
  bookFacility: (data:{facilityId:string;serviceId:string;slotId:string;patientName:string;patientPhone?:string;patientNote?:string}, key:string) => request('/facilities/bookings',{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(data)}),
  appointments: (page=1,limit=50,status?:string,from?:string,to?:string) => request<{items:any[];pagination?:any}>(`/appointments${queryString({page:String(page),limit:String(limit),status,from,to})}`),
  patientHealthFile: (page=1,limit=20,recordType?:string) => request<{patientUserId:string;items:any[];pagination:{page:number;limit:number;total:number;pages:number}}>(`/medical-records/health-file${queryString({page:String(page),limit:String(limit),recordType})}`),
  medicalAccessHistory: () => request<any[]>('/medical-records/access-history'),
  medicalRecordAttachments: (recordId:string) => request<any[]>(`/medical-records/${encodeURIComponent(recordId)}/attachments`),
  linkMedicalAttachment: (recordId:string,uploadAssetId:string) => request<any>(`/medical-records/${encodeURIComponent(recordId)}/attachments`,{method:'POST',body:JSON.stringify({uploadAssetId})}),
  medicalShareConsents: () => request<any[]>('/medical-records/share-consents'),
  revokeMedicalShare: (id:string) => request<any>(`/medical-records/share-consents/${encodeURIComponent(id)}`,{method:'DELETE'}),
  revokeMedicalSharedRecord: (consentId:string,recordId:string) => request<any>(`/medical-records/share-consents/${encodeURIComponent(consentId)}/records/${encodeURIComponent(recordId)}`,{method:'DELETE'}),
  appointment: (id:string) => request<any>(`/appointments/${id}`),
  bookingMessages: (kind:'doctor'|'facility',id:string) => request<{items:any[];muted?:boolean;canSend?:boolean;unreadCount?:number}>(kind==='doctor'?`/messages/appointments/${id}`:`/messages/facility-bookings/${id}`),
  sendBookingMessage: (kind:'doctor'|'facility',id:string,body:string) => request<any>(kind==='doctor'?`/messages/appointments/${id}`:`/messages/facility-bookings/${id}`,{method:'POST',body:JSON.stringify({body})}),
  muteBookingConversation: (kind:'doctor'|'facility',id:string,muted:boolean) => request<any>(kind==='doctor'?`/messages/appointments/${id}/mute`:`/messages/facility-bookings/${id}/mute`,{method:'PATCH',body:JSON.stringify({muted})}),
  bookingUnreadCount: (kind:'doctor'|'facility',id:string) => request<{unreadCount:number}>(kind==='doctor'?`/messages/appointments/${id}/unread-count`:`/messages/facility-bookings/${id}/unread-count`),
  reportBookingMessage: (id:string,reason:string) => request<any>(`/messages/${id}/report`,{method:'POST',body:JSON.stringify({reason})}),
  ownerMessageReports: () => request<any[]>('/messages/owner/reports'),
  reviewMessageReport: (id:string,status:'reviewed'|'dismissed',ownerNote?:string) => request<any>(`/messages/owner/reports/${id}`,{method:'PATCH',body:JSON.stringify({status,ownerNote})}),
  notifications: (page=1,limit=20,unreadOnly=false) => request<{items:any[];pagination:any;unreadCount:number}>(`/notifications${queryString({page:String(page),limit:String(limit),unreadOnly:unreadOnly?'true':undefined})}`),
  unreadNotifications: () => request<{unreadCount:number}>('/notifications/unread-count'),
  registerPushDevice: (token:string,platform:'android'|'ios'|'web') => request<{registered:boolean;deviceId?:string}>('/notifications/devices',{method:'POST',body:JSON.stringify({token,platform})}),
  removePushDevice: (id:string) => request<any>(`/notifications/devices/${id}`,{method:'DELETE'}),
  markNotificationRead: (id:string) => request<any>(`/notifications/${id}/read`,{method:'PATCH'}),
  markAllNotificationsRead: () => request<{updated:number}>('/notifications/read-all',{method:'PATCH'}),
  myFacilityBookings: () => request<any[]>('/facilities/bookings/mine'),
  cancelAppointment: (id:string) => request<any>(`/appointments/${id}/cancel`, {method:'PATCH'}),
  cancelFacilityBooking: (id:string) => request<any>(`/facilities/bookings/${id}/cancel`, {method:'PATCH'}),
  uploadAsset: (data:{fileName:string;mimeType:string;base64:string;category:'doctor_photo'|'doctor_qualification'|'facility_image'|'facility_document';facilityId?:string}) => request<any>('/uploads',{method:'POST',body:JSON.stringify(data)}),
  myUploadedAssets: () => request<any[]>('/uploads/mine'),
  ownerUploadReviewQueue: () => request<any[]>('/uploads/owner/review-queue'),
  doctorProfile: () => request<any>('/doctors/me/profile'),
  saveDoctorProfile: (data:any) => request<any>('/doctors/me/profile',{method:'POST',body:JSON.stringify(data)}),
  submitDoctorProfile: () => request<any>('/doctors/me/profile/submit',{method:'POST'}),
  pendingDoctors: () => request<any[]>('/doctors/owner/pending'),
  reviewDoctor: (id:string,decision:'approved'|'rejected',reviewNote?:string) => request<any>(`/doctors/owner/${id}/review`,{method:'PATCH',body:JSON.stringify({decision,reviewNote})}),
  pendingFacilities: () => request<any[]>('/facilities/owner/pending'),
  reviewFacility: (id:string,status:'approved'|'rejected') => request<any>(`/facilities/owner/${id}/review`,{method:'PATCH',body:JSON.stringify({status})}),
  addFacilityService: (id:string,data:any) => request<any>(`/facilities/${id}/services`,{method:'POST',body:JSON.stringify(data)}),
  updateFacilityService: (id:string,serviceId:string,data:any) => request<any>(`/facilities/owner/${id}/services/${serviceId}`,{method:'PATCH',body:JSON.stringify(data)}),
  doctorDashboard: () => request<any>('/dashboard/doctor'),
  updateAppointmentStatus: (id:string,status:'completed'|'no_show') => request<any>(`/appointments/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}),
  doctorWeeklySchedule: () => request<any[]>('/doctors/me/weekly-schedule'),
  saveDoctorWeeklySchedule: (rules:any[]) => request<any[]>('/doctors/me/weekly-schedule',{method:'POST',body:JSON.stringify({rules})}),
  doctorExceptions: () => request<any[]>('/doctors/me/schedule-exceptions'),
  createDoctorException: (data:any) => request<any>('/doctors/me/schedule-exceptions',{method:'POST',body:JSON.stringify(data)}),
  restoreDoctorException: (id:string) => request<any>(`/doctors/me/schedule-exceptions/${id}/restore`,{method:'PATCH'}),
  createDoctorSlots: (slots:any[]) => request<any[]>('/doctors/me/availability-slots',{method:'POST',body:JSON.stringify({slots})}),
  doctorOwnSlots: () => request<any[]>('/doctors/me/availability-slots'),
  updateDoctorSlot: (id:string,status:'open'|'closed') => request<any>(`/doctors/me/availability-slots/${id}`,{method:'PATCH',body:JSON.stringify({status})}),
  ownerFacilityServices: (id:string) => request<any[]>(`/facilities/owner/${id}/services`),
  ownerFacilityWeeklySchedule: (id:string,serviceId:string) => request<any[]>(`/facilities/owner/${id}/services/${serviceId}/weekly-schedule`),
  saveFacilityWeeklySchedule: (id:string,serviceId:string,rules:any[]) => request<any[]>(`/facilities/owner/${id}/services/${serviceId}/weekly-schedule`,{method:'POST',body:JSON.stringify({rules})}),
  generateFacilitySlots: (id:string,serviceId:string,from:string,to:string) => request<any>(`/facilities/owner/${id}/services/${serviceId}/generate-slots`,{method:'POST',body:JSON.stringify({from,to})}),
  ownerFacilitySlots: (id:string,serviceId?:string) => request<any[]>(`/facilities/owner/${id}/slots${queryString({serviceId})}`),
  updateOwnerFacilitySlot: (id:string,slotId:string,status:'available'|'closed') => request<any>(`/facilities/owner/${id}/slots/${slotId}/status`,{method:'PATCH',body:JSON.stringify({status})}),
  ownerFacilityExceptions: (id:string) => request<any[]>(`/facilities/owner/${id}/schedule-exceptions`),
  createFacilityException: (id:string,data:any) => request<any>(`/facilities/owner/${id}/schedule-exceptions`,{method:'POST',body:JSON.stringify(data)}),
  restoreFacilityException: (id:string,exceptionId:string) => request<any>(`/facilities/owner/${id}/schedule-exceptions/${exceptionId}/restore`,{method:'PATCH'}),
  ownerFacilities: () => request<any[]>('/facilities/owner/mine'),
  createFacility: (data:{name:string;facilityType:string;city:string;address:string;phone?:string;description?:string}) => request<any>('/facilities',{method:'POST',body:JSON.stringify(data)}),
  updateFacilityProfile: (id:string,data:{name:string;facilityType:string;city:string;address:string;phone?:string|null;description?:string|null}) => request<any>(`/facilities/owner/${id}/profile`,{method:'PATCH',body:JSON.stringify(data)}),
  facilityDashboard: (id:string) => request<any>(`/dashboard/facilities/${id}`),
  ownerFacilityBookings: (id:string,status?:string) => request<any[]>(`/facilities/owner/${id}/bookings${status?`?status=${encodeURIComponent(status)}`:''}`),
  updateFacilityBooking: (id:string,status:'confirmed'|'rejected',reason?:string) => request<any>('/facilities/owner/bookings/'+id+'/status',{method:'PATCH',body:JSON.stringify({status,reason})}),
  requestSubscription: (data:{durationDays:number;amountIqd:number;transferReference?:string;proofUrl?:string;doctorNote?:string}) => request<any>('/doctors/me/subscriptions',{method:'POST',body:JSON.stringify(data)}),
  mySubscriptions: () => request<any[]>('/doctors/me/subscriptions'),
  doctorSubscriptionStatus: () => request<any>('/doctors/me/subscription-status'),
  ownerSummary: () => request<any>('/owner/summary'),
  ownerFinanceReport: (from?:string,to?:string) => request<any>(`/owner/finance/report${from||to?`?${from?`from=${encodeURIComponent(from)}`:''}${from&&to?'&':''}${to?`to=${encodeURIComponent(to)}`:''}`:''}`),
  ownerSubscriptions: (status?:string) => request<any[]>(`/owner/subscriptions${status?`?status=${encodeURIComponent(status)}`:''}`),
  reviewSubscription: (id:string,decision:'approved'|'rejected',durationDays?:number,reviewNote?:string) => request<any>(`/owner/subscriptions/${id}/review`,{method:'PATCH',body:JSON.stringify({decision,durationDays,reviewNote})}),
  confirmRenewalPayment: (id:string,received:boolean,note?:string) => request<any>(`/owner/subscriptions/${id}/renewal-payment`,{method:'PATCH',body:JSON.stringify({received,note})}),
  ownerUsers: (role?:string) => request<any[]>(`/owner/users${role?`?role=${encodeURIComponent(role)}`:''}`),
  ownerUserDetails: (id:string) => request<any>(`/owner/users/${id}/details`),
  setUserActive: (id:string,isActive:boolean) => request<any>(`/owner/users/${id}/status`,{method:'PATCH',body:JSON.stringify({isActive})}),
  ownerAuditLogs: () => request<any[]>('/owner/audit-logs'),
  publicAds: (placement?:string) => request<any[]>(`/ads${placement?`?placement=${encodeURIComponent(placement)}`:''}`),
  publicAdTarget: (type:string,id:string) => request<any>(`/ads/target/${encodeURIComponent(type)}/${id}`),
  recordAdImpression: (id:string) => request<any>(`/ads/${id}/impression`,{method:'POST'}),
  recordAdClick: (id:string) => request<any>(`/ads/${id}/click`,{method:'POST'}),
  ownerAds: () => request<any[]>('/owner/ads'),
  ownerAdTargets: () => request<any>('/owner/ads/targets'),
  ownerAdReport: () => request<any>('/owner/ads/report'),
  createOwnerAd: (data:any) => request<any>('/owner/ads',{method:'POST',body:JSON.stringify(data)}),
  updateOwnerAd: (id:string,data:any) => request<any>(`/owner/ads/${id}`,{method:'PATCH',body:JSON.stringify(data)}),
};
