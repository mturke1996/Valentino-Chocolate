# استكشاف أخطاء إشعارات Telegram

## المشكلة: الطلبات لا تصل على Telegram

تم تحسين نظام السجلات (logging) لتحديد سبب المشكلة. اتبع الخطوات التالية:

## خطوات التحقق

### 1. تحقق من Console في المتصفح
افتح Developer Tools (F12) وانتقل إلى Console. عند إنشاء طلب جديد، ستظهر رسائل مفصلة تبدأ بـ `[Telegram]`.

### 2. تحقق من الإعدادات الأساسية

#### أ. Bot Token
- اذهب إلى لوحة التحكم → إدارة Telegram
- تأكد من وجود Bot Token صحيح
- اضغط على "جلب تلقائي" أو أدخل Chat ID يدوياً

#### ب. تفعيل Telegram
- تأكد من تفعيل خيار "تفعيل الإشعارات" في إعدادات البوت

### 3. تحقق من Chat IDs

#### أ. وجود Chat IDs
- تأكد من وجود Chat IDs في قاعدة البيانات
- يجب أن يكون Chat ID مفعلاً (enabled = true)

#### ب. الصلاحيات
- تأكد من أن Chat ID لديه صلاحية "الطلبات" (orders permission)
- في صفحة إدارة Telegram، تحقق من أن كل Chat ID لديه ✅ بجانب "الطلبات"

### 4. اختبار الإرسال
- استخدم زر "إرسال رسالة تجريبية" في صفحة إدارة Telegram
- اختر نوع الرسالة "طلب جديد"
- إذا نجح الاختبار، فالمشكلة في مكان آخر
- إذا فشل، تحقق من رسائل الخطأ في Console

## الأخطاء الشائعة وحلولها

### خطأ: "Telegram notifications disabled or not configured"
**السبب:** Telegram غير مفعل أو Bot Token مفقود
**الحل:**
1. اذهب إلى إدارة Telegram
2. أدخل Bot Token
3. فعّل خيار "تفعيل الإشعارات"
4. احفظ الإعدادات

### خطأ: "No enabled chats found for permission: orders"
**السبب:** لا توجد Chat IDs مفعلة مع صلاحية الطلبات
**الحل:**
1. أضف Chat ID جديد
2. تأكد من تفعيله (enabled = true)
3. تأكد من تفعيل صلاحية "الطلبات" (orders = true)

### خطأ: "Failed to send message to chat"
**السبب:** مشكلة في Chat ID أو البوت
**الحل:**
- **خطأ 400:** Chat ID غير صحيح - تحقق من صحة Chat ID
- **خطأ 401:** Bot Token غير صحيح - تحقق من Bot Token
- **خطأ 403:** البوت محظور - أرسل رسالة للبوت أولاً
- **خطأ 404:** Chat ID غير موجود - تحقق من Chat ID

### خطأ: "Chat not found"
**السبب:** Chat ID غير صحيح أو البوت لم يضاف إلى المجموعة/القناة
**الحل:**
1. أضف البوت إلى المجموعة/القناة
2. أرسل رسالة للبوت
3. احصل على Chat ID الصحيح باستخدام "جلب تلقائي"

## كيفية الحصول على Chat ID

### للمحادثات الشخصية:
1. ابحث عن @userinfobot في Telegram
2. أرسل له رسالة
3. سيرسل لك Chat ID الخاص بك

### للمجموعات/القنوات:
1. أضف البوت إلى المجموعة/القناة
2. اذهب إلى صفحة إدارة Telegram
3. اضغط على "جلب تلقائي"
4. أرسل رسالة في المجموعة/القناة
5. سيتم جلب Chat ID تلقائياً

## التحقق من السجلات

بعد التحسينات، ستجد في Console معلومات مفصلة مثل:

```
[Telegram] Starting sendToAllChats with permission: orders
[Telegram] Settings check: { enabled: true, hasToken: true, tokenLength: 46 }
[Telegram] Total chats found in database: 1
[Telegram] Enabled chats (before permission filter): 1
[Telegram] Chats with permission 'orders': 1
[Telegram] Sending notification to 1 chat(s) with permission: orders
[Telegram] Attempting to send to chat 123456789 (Admin Chat)
[Telegram] Message sent successfully to chat 123456789
[Telegram] Notification sent successfully to 1 out of 1 chat(s)
```

## نصائح إضافية

1. **تحقق من Firestore Rules:** تأكد من أن القواعد تسمح بقراءة `telegramChats` و `settings`
2. **تحقق من Network:** في Developer Tools → Network، تحقق من طلبات API إلى Telegram
3. **اختبر البوت مباشرة:** استخدم زر "اختبار" في صفحة إدارة Telegram
4. **تحقق من Environment Variables:** إذا كنت تستخدم `VITE_TELEGRAM_BOT_TOKEN`، تأكد من تعيينه

## الدعم

إذا استمرت المشكلة بعد اتباع هذه الخطوات:
1. افتح Console في المتصفح
2. أنشئ طلب تجريبي
3. انسخ جميع الرسائل التي تبدأ بـ `[Telegram]`
4. شاركها مع فريق الدعم

