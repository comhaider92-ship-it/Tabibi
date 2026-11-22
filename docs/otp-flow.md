# توثيق الحساب واستعادة كلمة المرور — V11

## طلب رمز
`POST /api/v1/auth/otp/request`
```json
{"identifier":"user@example.com","purpose":"verify_account"}
```
الغرض: `verify_account` أو `reset_password`.

## تأكيد الرمز
`POST /api/v1/auth/otp/confirm`
```json
{"identifier":"user@example.com","purpose":"verify_account","code":"123456"}
```
استعادة كلمة المرور:
```json
{"identifier":"user@example.com","purpose":"reset_password","code":"123456","newPassword":"a-long-password"}
```

الرمز صالح 5 دقائق، وإعادة الإرسال بعد 60 ثانية، ومحاولات التحقق 5 كحد أقصى. يُخزن hash فقط. في التطوير يظهر الرمز في سجل الخادم؛ لا يظهر في استجابة API. في production يتوقف التسليم إلى أن يتم ربط مزود SMS/Email فعلي.

## قبل الإطلاق
يلزم مزود إرسال فعلي، وتحديد قناة التوثيق إذا كان للحساب بريد وهاتف، ومعدل طلبات حسب IP والحساب، وإبطال الجلسات بعد تغيير كلمة المرور، وتنظيف OTP المنتهي، واختبارات أمنية وتكاملية. لم يتم تشغيل NestJS أو PostgreSQL أو تثبيت dependencies في هذا الإصدار.
