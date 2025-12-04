/**
 * سكريبت لإنشاء مستخدم Admin في Firebase
 * 
 * الاستخدام:
 * 1. تأكد من تثبيت Firebase Admin SDK: npm install firebase-admin
 * 2. احصل على Service Account Key من Firebase Console
 * 3. ضع الملف في مجلد scripts/
 * 4. قم بتشغيل: node scripts/create-admin.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// تهيئة Firebase Admin
// ملاحظة: يجب استبدال serviceAccountKey.json بمفاتيح حساب الخدمة الخاص بك
try {
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ خطأ: لم يتم العثور على serviceAccountKey.json');
  console.error('📝 يرجى اتباع الخطوات التالية:');
  console.error('1. اذهب إلى Firebase Console → Project Settings → Service Accounts');
  console.error('2. اضغط على "Generate New Private Key"');
  console.error('3. احفظ الملف كـ serviceAccountKey.json في مجلد scripts/');
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n🔐 إنشاء مستخدم Admin جديد\n');
    
    // الحصول على بيانات المستخدم
    const email = await question('📧 البريد الإلكتروني: ');
    const password = await question('🔑 كلمة المرور: ');
    const displayName = await question('👤 الاسم (اختياري): ') || 'المدير';
    const role = await question('👑 الدور (super-admin/admin) [admin]: ') || 'admin';
    
    // إنشاء المستخدم في Authentication
    console.log('\n⏳ جاري إنشاء المستخدم...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true,
    });
    
    console.log('✅ تم إنشاء المستخدم في Authentication');
    console.log(`   UID: ${userRecord.uid}`);
    
    // إضافة المستخدم في Firestore
    console.log('\n⏳ جاري إضافة المستخدم في Firestore...');
    await db.collection('admins').doc(userRecord.uid).set({
      email: email,
      displayName: displayName,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ تم إضافة المستخدم في Firestore');
    
    console.log('\n🎉 تم إنشاء مستخدم Admin بنجاح!');
    console.log('\n📋 معلومات المستخدم:');
    console.log(`   البريد: ${email}`);
    console.log(`   الاسم: ${displayName}`);
    console.log(`   الدور: ${role}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log('\n✅ يمكنك الآن تسجيل الدخول باستخدام هذا البريد وكلمة المرور');
    
  } catch (error) {
    console.error('\n❌ حدث خطأ:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.error('⚠️  هذا البريد الإلكتروني مستخدم بالفعل');
      console.error('💡 يمكنك إضافة المستخدم يدوياً في Firestore:');
      console.error('   1. اذهب إلى Firebase Console → Authentication');
      console.error('   2. ابحث عن المستخدم وانسخ UID');
      console.error('   3. اذهب إلى Firestore → collection "admins"');
      console.error('   4. أضف document جديد بـ ID = UID');
      console.error('   5. أضف الحقول: email, displayName, role');
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

createAdmin();

