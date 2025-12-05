import { Order, Message, TelegramChat } from '../types';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const getTelegramSettings = async () => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      const token = data.telegramBotToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const enabled = data.telegramEnabled !== false;
      
      console.log('Telegram settings from DB:', { 
        hasToken: !!token, 
        enabled,
        tokenLength: token?.length 
      });
      
      return {
        token,
        enabled,
      };
    }
  } catch (error) {
    console.error('Error fetching Telegram settings:', error);
  }
  
  // Fallback to env variables
  const envToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  console.log('Using env token:', { hasToken: !!envToken, tokenLength: envToken?.length });
  
  return {
    token: envToken,
    enabled: true,
  };
};

const getEnabledChats = async (permission?: 'orders' | 'orderStatus' | 'messages' | 'reviews' | 'contact'): Promise<TelegramChat[]> => {
  try {
    const chatsQuery = query(collection(db, 'telegramChats'));
    const chatsSnapshot = await getDocs(chatsQuery);
    const allChats = chatsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TelegramChat[];

    console.log(`Total chats found: ${allChats.length}`);

    // Filter enabled chats
    let enabledChats = allChats.filter((chat) => chat.enabled);
    console.log(`Enabled chats: ${enabledChats.length}`);

    // Filter by permission if specified
    if (permission) {
      enabledChats = enabledChats.filter((chat) => chat.permissions?.[permission] === true);
      console.log(`Chats with permission '${permission}': ${enabledChats.length}`);
    }

    return enabledChats;
  } catch (error) {
    console.error('Error fetching Telegram chats:', error);
    return [];
  }
};

const sendTelegramMessage = async (message: string, chatId: string, token: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Telegram API error:', data);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
};

const sendToAllChats = async (message: string, permission?: 'orders' | 'orderStatus' | 'messages' | 'reviews' | 'contact'): Promise<boolean> => {
  try {
    const settings = await getTelegramSettings();
    
    if (!settings.enabled || !settings.token) {
      console.warn('Telegram notifications disabled or not configured', { enabled: settings.enabled, hasToken: !!settings.token });
      return false;
    }

    const chats = await getEnabledChats(permission);
    
    if (chats.length === 0) {
      console.warn(`No enabled chats found for permission: ${permission}`, { totalChats: chats.length });
      return false;
    }

    console.log(`Sending Telegram notification to ${chats.length} chat(s) with permission: ${permission}`);

    // Send to all eligible chats
    const results = await Promise.all(
      chats.map(async (chat) => {
        const result = await sendTelegramMessage(message, chat.chatId, settings.token!);
        if (!result) {
          console.error(`Failed to send message to chat ${chat.chatId}`);
        }
        return result;
      })
    );

    const success = results.some((result) => result === true);
    if (!success) {
      console.error('Failed to send Telegram notification to any chat');
    }
    return success;
  } catch (error) {
    console.error('Error in sendToAllChats:', error);
    return false;
  }
};

export const notifyNewOrder = async (order: Order): Promise<boolean> => {
  const message = `
🍫 <b>طلب جديد!</b>

📋 رقم الطلب: <code>${order.orderNumber}</code>
👤 العميل: ${order.customerName}
📱 الهاتف: ${order.customerPhone}
📍 العنوان: ${order.customerAddress}

🛍️ <b>المنتجات:</b>
${order.items.map(item => `• ${item.productNameAr} x${item.quantity} - ${item.subtotal} د.ل`).join('\n')}

💰 المجموع الفرعي: ${order.subtotal} د.ل
🚚 رسوم التوصيل: ${order.deliveryFee} د.ل
💸 الخصم: ${order.discount} د.ل
💵 <b>الإجمالي: ${order.total} د.ل</b>
${order.deliveryType === 'pickup' ? '🏪 استلام من المتجر' : '🚚 توصيل إلى العنوان'}

💳 طريقة الدفع: ${order.paymentMethod === 'cash' ? 'كاش' : order.paymentMethod === 'card' ? 'بطاقة' : 'أونلاين'}

${order.notes ? `📝 ملاحظات: ${order.notes}` : ''}
  `.trim();

  return sendToAllChats(message, 'orders');
};

export const notifyOrderStatusChange = async (
  order: Order,
  newStatus: string
): Promise<boolean> => {
  const statusText: Record<string, string> = {
    confirmed: 'تم تأكيد الطلب',
    preparing: 'جاري تحضير الطلب',
    'out-for-delivery': 'الطلب في الطريق للتوصيل',
    delivered: 'تم توصيل الطلب',
    cancelled: 'تم إلغاء الطلب',
  };

  const message = `
📦 <b>تحديث حالة الطلب</b>

📋 رقم الطلب: <code>${order.orderNumber}</code>
👤 العميل: ${order.customerName}
📱 الهاتف: ${order.customerPhone}

✅ الحالة الجديدة: <b>${statusText[newStatus] || newStatus}</b>
  `.trim();

  return sendToAllChats(message, 'orderStatus');
};

export const notifyNewMessage = async (message: Message): Promise<boolean> => {
  const telegramMessage = `
📨 <b>رسالة جديدة!</b>

👤 الاسم: ${message.name}
📧 البريد: ${message.email || 'غير متوفر'}
📱 الهاتف: ${message.phone || 'غير متوفر'}
${message.subject ? `📋 الموضوع: ${message.subject}` : ''}

💬 <b>الرسالة:</b>
${message.message}
  `.trim();

  return sendToAllChats(telegramMessage, 'messages');
};

export const notifyNewReview = async (
  productName: string,
  rating: number,
  comment?: string
): Promise<boolean> => {
  const message = `
⭐ <b>تقييم جديد!</b>

🍫 المنتج: ${productName}
⭐ التقييم: ${rating}/5
${comment ? `💬 التعليق: ${comment}` : ''}
  `.trim();

  return sendToAllChats(message, 'reviews');
};

export const notifyContactMessage = async (
  name: string,
  email: string,
  phone: string,
  message: string
): Promise<boolean> => {
  const telegramMessage = `
📧 <b>رسالة من التواصل معنا</b>

👤 الاسم: ${name}
📧 البريد: ${email}
📱 الهاتف: ${phone}

💬 <b>الرسالة:</b>
${message}
  `.trim();

  return sendToAllChats(telegramMessage, 'contact');
};

export const notifyLowStock = async (
  productName: string,
  productId: string
): Promise<boolean> => {
  const message = `
⚠️ <b>تنبيه: مخزون منخفض!</b>

🍫 المنتج: ${productName}
🆔 ID: <code>${productId}</code>

يرجى إعادة تعبئة المخزون في أقرب وقت.
  `.trim();

  // Low stock notifications go to all chats with orders permission
  return sendToAllChats(message, 'orders');
};
