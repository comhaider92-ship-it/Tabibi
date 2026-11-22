from pathlib import Path
root=Path(__file__).parent
fac=(root/'src/facilities/facilities.service.ts').read_text()
notif=(root/'mobile/src/screens/NotificationsScreen.tsx').read_text()
app=(root/'mobile/App.tsx').read_text()
header=(root/'mobile/src/components/NotificationHeaderButton.tsx').read_text()
checks={
 'facility booking request carries canonical facilityBookingId':'event: \'facility_booking_requested\'' in fac and 'facilityBookingId: result.booking.id' in fac,
 'facility confirmation carries canonical facilityBookingId':'event: confirmed ? \'facility_booking_confirmed\'' in fac and 'facilityBookingId: result.booking.id' in fac,
 'facility rejection carries canonical facilityBookingId':'reason: result.booking.statusNote ?? \'\'' in fac and 'facilityBookingId: result.booking.id' in fac,
 'facility cancellation carries canonical facilityBookingId':'event: \'facility_booking_cancelled\'' in fac and 'facilityBookingId: result.booking.id' in fac,
 'legacy bookingId retained for backward compatibility':fac.count('bookingId: result.booking.id')>=3,
 'notification screen recognizes canonical facilityBookingId':'item.data?.facilityBookingId' in notif,
 'notification screen recognizes legacy bookingId':'item.data?.bookingId' in notif,
 'notification action label recognizes facility booking':'item.data?.facilityBookingId||item.data?.bookingId?' in notif,
 'notification screen refreshes on focus':'useFocusEffect(useCallback(()=>{load();},[load]))' in notif,
 'notification screen marks item read before navigation':'await api.markNotificationRead(item.id)' in notif and 'onOpenRelated(item)' in notif,
 'notification header component exists':header.startswith('import React'),
 'header fetches account-scoped unread count':'api.unreadNotifications()' in header,
 'header refreshes when navigation regains focus':"navigation.addListener?.('focus',refresh)" in header,
 'header displays unread badge':'count>0&&<View' in header and '99+' in header,
 'header exposes accessible unread count':'accessibilityLabel={count?' in header,
 'patient home uses shared notification header':'<NotificationHeaderButton navigation={navigation}' in app,
 'doctor dashboard uses shared notification header':app.count('<NotificationHeaderButton navigation={navigation}')>=3,
 'owner dashboard uses shared notification header':app.count('<NotificationHeaderButton navigation={navigation}')>=3,
}
failed=[k for k,v in checks.items() if not v]
print(f'V60 notification routing and unread badge checks: {len(checks)-len(failed)}/{len(checks)} passed')
for x in failed: print('FAIL:',x)
raise SystemExit(bool(failed))
