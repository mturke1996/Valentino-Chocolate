import { Order, Message } from '../types';

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export const sendTelegramMessage = async (message: string): Promise<boolean> => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
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
${order.items.map(item => `• ${item.productNameAr} x${item.quantity} - ${item.subtotal} جنيه`).join('\n')}

💰 المجموع الفرعي: ${order.subtotal} جنيه
🚚 رسوم التوصيل: ${order.deliveryFee} جنيه
💸 الخصم: ${order.discount} جنيه
💵 <b>الإجمالي: ${order.total} جنيه</b>

💳 طريقة الدفع: ${order.paymentMethod === 'cash' ? 'كاش' : order.paymentMethod === 'card' ? 'بطاقة' : 'أونلاين'}

${order.notes ? `📝 ملاحظات: ${order.notes}` : ''}
  `.trim();

  return sendTelegramMessage(message);
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

  return sendTelegramMessage(message);
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

  return sendTelegramMessage(telegramMessage);
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

  return sendTelegramMessage(message);
};

