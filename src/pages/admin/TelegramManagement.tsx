import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { SiteSettings, TelegramChat } from "../../types";
import toast from "react-hot-toast";
import MaterialRipple from "../../components/MaterialRipple";

export default function TelegramManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
  const [fetchingChatId, setFetchingChatId] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [editingChat, setEditingChat] = useState<TelegramChat | null>(null);
  const [botStatus, setBotStatus] = useState<{
    connected: boolean;
    message?: string;
  } | null>(null);
  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    telegramBotToken: "",
    telegramEnabled: false,
  });
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [newChatForm, setNewChatForm] = useState({
    chatId: "",
    name: "",
    enabled: true,
    permissions: {
      orders: true,
      orderStatus: true,
      messages: true,
      reviews: true,
      contact: true,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (settings.telegramBotToken) {
      checkBotStatus();
    } else {
      setBotStatus(null);
    }
  }, [settings.telegramBotToken]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Settings
      const settingsDoc = await getDoc(doc(db, "settings", "general"));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings({
          telegramBotToken: data.telegramBotToken || "",
          telegramEnabled:
            data.telegramEnabled !== undefined ? data.telegramEnabled : false,
        });
      } else {
        setSettings({
          telegramBotToken: "",
          telegramEnabled: false,
        });
      }

      // Fetch Chats
      const chatsQuery = query(collection(db, "telegramChats"));
      const chatsSnapshot = await getDocs(chatsQuery);
      const chatsData = chatsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId: data.chatId || "",
          name: data.name || "",
          enabled: data.enabled !== undefined ? data.enabled : true,
          permissions: data.permissions || {
            orders: true,
            orderStatus: true,
            messages: true,
            reviews: true,
            contact: true,
          },
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }) as TelegramChat[];
      setChats(chatsData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      const errorMessage = error?.message || "حدث خطأ أثناء تحميل البيانات";
      toast.error(errorMessage);
      setChats([]);
      setSettings({
        telegramBotToken: "",
        telegramEnabled: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          telegramBotToken: settings.telegramBotToken,
          telegramEnabled: settings.telegramEnabled,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error?.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const checkBotStatus = async () => {
    if (!settings.telegramBotToken) return;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${settings.telegramBotToken}/getMe`
      );
      const data = await response.json();

      if (data.ok) {
        setBotStatus({
          connected: true,
          message: `${data.result.first_name} (@${data.result.username})`,
        });
      } else {
        setBotStatus({
          connected: false,
          message: data.description || "فشل الاتصال بالبوت",
        });
      }
    } catch (error) {
      setBotStatus({
        connected: false,
        message: "حدث خطأ أثناء التحقق من حالة البوت",
      });
    }
  };

  const fetchChatId = async () => {
    if (!settings.telegramBotToken) {
      toast.error("يرجى إدخال Bot Token أولاً");
      return;
    }

    setFetchingChatId(true);
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${settings.telegramBotToken}/getUpdates`
      );
      const data = await response.json();

      if (data.ok && data.result.length > 0) {
        const lastUpdate = data.result[data.result.length - 1];
        const chatId =
          lastUpdate.message?.chat?.id || lastUpdate.channel_post?.chat?.id;

        if (chatId) {
          setNewChatForm((prev) => ({
            ...prev,
            chatId: String(chatId),
          }));
          setShowChatModal(true);
          toast.success(`تم العثور على Chat ID: ${chatId}`);
        } else {
          toast.error(
            "لم يتم العثور على Chat ID. يرجى إرسال رسالة للبوت أولاً"
          );
        }
      } else {
        toast.error("لم يتم العثور على رسائل. يرجى إرسال رسالة للبوت أولاً");
      }
    } catch (error) {
      console.error("Error fetching chat ID:", error);
      toast.error("حدث خطأ أثناء جلب Chat ID");
    } finally {
      setFetchingChatId(false);
    }
  };

  const handleAddChat = async () => {
    if (!newChatForm.chatId.trim()) {
      toast.error("يرجى إدخال Chat ID");
      return;
    }

    // Check for duplicate Chat ID
    if (!editingChat) {
      const existingChat = chats.find(
        (chat) => chat.chatId === newChatForm.chatId.trim()
      );
      if (existingChat) {
        toast.error("هذا Chat ID موجود بالفعل");
        return;
      }
    } else {
      const existingChat = chats.find(
        (chat) =>
          chat.chatId === newChatForm.chatId.trim() &&
          chat.id !== editingChat.id
      );
      if (existingChat) {
        toast.error("هذا Chat ID مستخدم في Chat ID آخر");
        return;
      }
    }

    try {
      const latestChatsSnapshot = await getDocs(
        query(collection(db, "telegramChats"))
      );
      const latestChatsCount = latestChatsSnapshot.size;

      const chatData = {
        chatId: newChatForm.chatId.trim(),
        name: newChatForm.name.trim() || `Chat ${latestChatsCount + 1}`,
        enabled: newChatForm.enabled,
        permissions: newChatForm.permissions,
        updatedAt: serverTimestamp(),
      };

      if (editingChat) {
        await updateDoc(doc(db, "telegramChats", editingChat.id), chatData);
        toast.success("تم تحديث Chat ID بنجاح");
      } else {
        await addDoc(collection(db, "telegramChats"), {
          ...chatData,
          createdAt: serverTimestamp(),
        });
        toast.success("تم إضافة Chat ID بنجاح");
      }

      resetChatForm();
      await fetchData();
    } catch (error: any) {
      console.error("Error saving chat:", error);
      toast.error(error?.message || "حدث خطأ أثناء حفظ Chat ID");
    }
  };

  const handleEditChat = (chat: TelegramChat) => {
    setEditingChat(chat);
    setNewChatForm({
      chatId: chat.chatId,
      name: chat.name || "",
      enabled: chat.enabled,
      permissions: chat.permissions,
    });
    setShowChatModal(true);
  };

  const handleDeleteChat = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا Chat ID؟")) return;

    try {
      await deleteDoc(doc(db, "telegramChats", id));
      toast.success("تم حذف Chat ID بنجاح");
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || "حدث خطأ أثناء حذف Chat ID");
    }
  };

  const testTelegramBot = async (chatId?: string) => {
    const targetChatId = chatId || chats.find((c) => c.enabled)?.chatId;

    if (!settings.telegramBotToken || !targetChatId) {
      toast.error("يرجى إدخال Bot Token وإضافة Chat ID مفعل أولاً");
      return;
    }

    setTestingBot(true);
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: "🧪 <b>اختبار البوت</b>\n\nهذه رسالة اختبار من لوحة التحكم! ✅",
            parse_mode: "HTML",
          }),
        }
      );

      if (response.ok) {
        toast.success("✅ تم إرسال رسالة الاختبار بنجاح!");
      } else {
        const data = await response.json();
        toast.error(data.description || "فشل إرسال الرسالة");
      }
    } catch (error) {
      console.error("Error testing bot:", error);
      toast.error("حدث خطأ أثناء اختبار البوت");
    } finally {
      setTestingBot(false);
    }
  };

  const toggleChatEnabled = async (chat: TelegramChat) => {
    try {
      await updateDoc(doc(db, "telegramChats", chat.id), {
        enabled: !chat.enabled,
        updatedAt: serverTimestamp(),
      });
      toast.success(`تم ${chat.enabled ? "تعطيل" : "تفعيل"} Chat ID بنجاح`);
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || "حدث خطأ أثناء التحديث");
    }
  };

  const resetChatForm = () => {
    setNewChatForm({
      chatId: "",
      name: "",
      enabled: true,
      permissions: {
        orders: true,
        orderStatus: true,
        messages: true,
        reviews: true,
        contact: true,
      },
    });
    setEditingChat(null);
    setShowChatModal(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-background">
            إدارة Telegram
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            إدارة البوت و Chat IDs والصلاحيات
          </p>
        </div>
        <MaterialRipple>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              borderRadius: "var(--md-sys-shape-corner-extra-large)",
              boxShadow: saving ? "none" : "var(--md-sys-elevation-1)",
            }}
          >
            <span className="material-symbols-rounded text-lg">save</span>
            <span>{saving ? "جاري الحفظ..." : "حفظ"}</span>
          </button>
        </MaterialRipple>
      </div>

      {/* Bot Configuration Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-outline-variant rounded-2xl p-4 sm:p-6 space-y-4"
        style={{ borderRadius: "var(--md-sys-shape-corner-large)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-variant text-on-surface">
            <span className="material-symbols-rounded text-2xl">settings</span>
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-on-surface">
              إعدادات البوت
            </h3>
            <p className="text-xs text-on-surface-variant">
              قم بإعداد Bot Token وتمكين الإشعارات
            </p>
          </div>
        </div>

        {/* Bot Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-on-surface">
              Bot Token
            </label>
            <MaterialRipple>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-on-surface hover:bg-surface-variant/20 transition-colors"
                style={{
                  borderRadius: "var(--md-sys-shape-corner-extra-large)",
                }}
              >
                <span className="material-symbols-rounded text-base">
                  open_in_new
                </span>
                <span>@BotFather</span>
              </a>
            </MaterialRipple>
          </div>
          <div className="relative">
            <input
              type="text"
              name="telegramBotToken"
              value={settings.telegramBotToken || ""}
              onChange={handleChange}
              onBlur={checkBotStatus}
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-3 py-2.5 pr-10 bg-surface border border-outline-variant rounded-full focus:outline-none focus:border-outline-variant focus:border-2 font-mono text-xs sm:text-sm transition-all"
              style={{ borderRadius: "var(--md-sys-shape-corner-extra-large)" }}
            />
            {settings.telegramBotToken && (
              <MaterialRipple>
                <button
                  onClick={() =>
                    copyToClipboard(
                      settings.telegramBotToken || "",
                      "Bot Token"
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-surface-variant transition-colors"
                  style={{
                    borderRadius: "var(--md-sys-shape-corner-extra-large)",
                  }}
                  title="نسخ"
                >
                  <span className="material-symbols-rounded text-base text-on-surface-variant">
                    content_copy
                  </span>
                </button>
              </MaterialRipple>
            )}
          </div>
        </div>

        {/* Enable Toggle */}
        <div
          className="flex items-center justify-between p-3 bg-surface-variant rounded-xl"
          style={{ borderRadius: "var(--md-sys-shape-corner-medium)" }}
        >
          <div>
            <p className="text-sm font-medium text-on-surface">
              تفعيل الإشعارات
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {settings.telegramEnabled ? "الإشعارات مفعلة" : "الإشعارات معطلة"}
            </p>
          </div>
          <MaterialRipple>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="telegramEnabled"
                checked={settings.telegramEnabled || false}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 rounded-full peer peer-focus:outline-none transition-colors"
                style={{
                  backgroundColor: settings.telegramEnabled
                    ? "var(--md-sys-color-surface-variant)"
                    : "var(--md-sys-color-surface-variant)",
                }}
              >
                <div
                  className="w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform"
                  style={{
                    transform: settings.telegramEnabled
                      ? "translateX(22px)"
                      : "translateX(3px)",
                  }}
                />
              </div>
            </label>
          </MaterialRipple>
        </div>

        {/* Bot Status */}
        {botStatus && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 ${
              botStatus.connected
                ? "bg-surface-variant border border-outline-variant"
                : "bg-surface-variant border border-outline-variant"
            }`}
            style={{ borderRadius: "var(--md-sys-shape-corner-medium)" }}
          >
            <span className="material-symbols-rounded text-xl flex-shrink-0 text-on-surface">
              {botStatus.connected ? "check_circle" : "cancel"}
            </span>
            <p className="text-sm font-medium flex-1 text-on-surface">
              {botStatus.message}
            </p>
          </div>
        )}
      </motion.div>

      {/* Chat IDs Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-outline-variant rounded-2xl p-4 sm:p-6 space-y-4"
        style={{ borderRadius: "var(--md-sys-shape-corner-large)" }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-variant text-on-surface">
              <span className="material-symbols-rounded text-2xl">chat</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-on-surface">
                Chat IDs
              </h3>
              <p className="text-xs text-on-surface-variant">
                {chats.length} Chat ID
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <MaterialRipple>
              <button
                onClick={fetchChatId}
                disabled={fetchingChatId || !settings.telegramBotToken}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all disabled:opacity-50 text-on-surface border border-outline"
                style={{
                  borderRadius: "var(--md-sys-shape-corner-extra-large)",
                }}
              >
                <span className="material-symbols-rounded text-base">
                  {fetchingChatId ? "sync" : "auto_fix_high"}
                </span>
                <span>{fetchingChatId ? "جاري..." : "جلب تلقائي"}</span>
              </button>
            </MaterialRipple>
            <MaterialRipple>
              <button
                onClick={() => setShowChatModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all bg-surface-variant text-on-surface shadow-sm"
                style={{
                  borderRadius: "var(--md-sys-shape-corner-extra-large)",
                }}
              >
                <span className="material-symbols-rounded text-base">add</span>
                <span>إضافة</span>
              </button>
            </MaterialRipple>
          </div>
        </div>

        {/* Chats List */}
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-rounded text-5xl text-on-surface-variant mb-3">
              chat_bubble_outline
            </span>
            <p className="text-sm text-on-surface-variant mb-1">
              لا توجد Chat IDs
            </p>
            <p className="text-xs text-on-surface-variant">
              أضف Chat ID للبدء في تلقي الإشعارات
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface-variant border border-outline-variant/50 rounded-xl p-4 space-y-3 group"
                style={{ borderRadius: "var(--md-sys-shape-corner-medium)" }}
              >
                {/* Chat Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        chat.enabled
                          ? "bg-surface-variant text-on-surface"
                          : "bg-surface text-on-surface-variant opacity-50"
                      }`}
                    >
                      <span className="material-symbols-rounded text-lg">
                        {chat.enabled ? "chat" : "chat_bubble_outline"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-on-surface truncate">
                        {chat.name || `Chat ${index + 1}`}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-mono truncate">
                        {chat.chatId}
                      </p>
                    </div>
                  </div>
                  {!chat.enabled && (
                    <span className="px-1.5 py-0.5 bg-surface rounded-full text-xs text-on-surface-variant flex-shrink-0">
                      معطل
                    </span>
                  )}
                </div>

                {/* Permissions - Compact */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-on-surface-variant">
                    الصلاحيات:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(chat.permissions).map(([key, value]) => (
                      <div
                        key={key}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          value
                            ? "bg-surface-variant text-on-surface"
                            : "bg-surface text-on-surface-variant opacity-50"
                        }`}
                        style={{
                          borderRadius:
                            "var(--md-sys-shape-corner-extra-large)",
                        }}
                      >
                        {key === "orders" && "الطلبات"}
                        {key === "orderStatus" && "حالة الطلب"}
                        {key === "messages" && "الرسائل"}
                        {key === "reviews" && "التقييمات"}
                        {key === "contact" && "التواصل"}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-outline-variant/50">
                  <MaterialRipple>
                    <button
                      onClick={() => toggleChatEnabled(chat)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        chat.enabled
                          ? "bg-surface-variant text-on-surface"
                          : "bg-surface text-on-surface-variant"
                      }`}
                      style={{
                        borderRadius: "var(--md-sys-shape-corner-small)",
                      }}
                    >
                      <span className="material-symbols-rounded text-base">
                        {chat.enabled ? "toggle_on" : "toggle_off"}
                      </span>
                      <span>{chat.enabled ? "مفعل" : "معطل"}</span>
                    </button>
                  </MaterialRipple>
                  <MaterialRipple>
                    <button
                      onClick={() => testTelegramBot(chat.chatId)}
                      disabled={testingBot || !chat.enabled}
                      className="p-1.5 rounded-lg transition-colors hover:bg-surface disabled:opacity-50"
                      style={{
                        borderRadius: "var(--md-sys-shape-corner-small)",
                      }}
                      title="اختبار"
                    >
                      <span className="material-symbols-rounded text-base text-on-surface">
                        send
                      </span>
                    </button>
                  </MaterialRipple>
                  <MaterialRipple>
                    <button
                      onClick={() => handleEditChat(chat)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-surface"
                      style={{
                        borderRadius: "var(--md-sys-shape-corner-small)",
                      }}
                      title="تعديل"
                    >
                      <span className="material-symbols-rounded text-base text-on-surface-variant">
                        edit
                      </span>
                    </button>
                  </MaterialRipple>
                  <MaterialRipple>
                    <button
                      onClick={() => handleDeleteChat(chat.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-surface-variant"
                      style={{
                        borderRadius: "var(--md-sys-shape-corner-small)",
                      }}
                      title="حذف"
                    >
                      <span className="material-symbols-rounded text-base text-on-surface-variant">
                        delete
                      </span>
                    </button>
                  </MaterialRipple>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Chat Modal */}
      <AnimatePresence>
        {showChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetChatForm}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6"
              style={{ borderRadius: "var(--md-sys-shape-corner-large)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-on-surface">
                  {editingChat ? "تعديل Chat ID" : "إضافة Chat ID"}
                </h3>
                <MaterialRipple>
                  <button
                    onClick={resetChatForm}
                    className="p-2 rounded-full hover:bg-surface-variant transition-colors"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  >
                    <span className="material-symbols-rounded text-on-surface text-lg">
                      close
                    </span>
                  </button>
                </MaterialRipple>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddChat();
                }}
                className="space-y-4"
              >
                {/* Chat ID */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-on-surface">
                    Chat ID *
                  </label>
                  <input
                    type="text"
                    value={newChatForm.chatId}
                    onChange={(e) =>
                      setNewChatForm({ ...newChatForm, chatId: e.target.value })
                    }
                    placeholder="123456789"
                    className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-full focus:outline-none focus:border-blue-500 focus:border-2 font-mono text-sm transition-all"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                    required
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-on-surface">
                    الاسم (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newChatForm.name}
                    onChange={(e) =>
                      setNewChatForm({ ...newChatForm, name: e.target.value })
                    }
                    placeholder="مثال: إدارة الطلبات"
                    className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-full focus:outline-none focus:border-blue-500 focus:border-2 text-sm transition-all"
                    style={{
                      borderRadius: "var(--md-sys-shape-corner-extra-large)",
                    }}
                  />
                </div>

                {/* Enabled */}
                <div
                  className="flex items-center justify-between p-3 bg-surface-variant rounded-xl"
                  style={{ borderRadius: "var(--md-sys-shape-corner-medium)" }}
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      تفعيل Chat ID
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      سيتم إرسال الإشعارات
                    </p>
                  </div>
                  <MaterialRipple>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newChatForm.enabled}
                        onChange={(e) =>
                          setNewChatForm({
                            ...newChatForm,
                            enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 rounded-full peer peer-focus:outline-none transition-colors"
                        style={{
                          backgroundColor: newChatForm.enabled
                            ? "#3b82f6"
                            : "var(--md-sys-color-surface-variant)",
                        }}
                      >
                        <div
                          className="w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform"
                          style={{
                            transform: newChatForm.enabled
                              ? "translateX(22px)"
                              : "translateX(3px)",
                          }}
                        />
                      </div>
                    </label>
                  </MaterialRipple>
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-on-surface">
                    الصلاحيات
                  </p>
                  <div className="space-y-2">
                    {Object.entries(newChatForm.permissions).map(
                      ([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 p-2.5 bg-surface-variant rounded-lg cursor-pointer hover:bg-surface transition-colors"
                          style={{
                            borderRadius: "var(--md-sys-shape-corner-small)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setNewChatForm({
                                ...newChatForm,
                                permissions: {
                                  ...newChatForm.permissions,
                                  [key]: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded border-outline text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-on-surface flex-1">
                            {key === "orders" && "استلام إشعارات الطلبات"}
                            {key === "orderStatus" &&
                              "استلام تحديثات حالة الطلب"}
                            {key === "messages" && "استلام الرسائل"}
                            {key === "reviews" && "استلام التقييمات"}
                            {key === "contact" && "استلام رسائل التواصل"}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                  <MaterialRipple>
                    <button
                      type="button"
                      onClick={resetChatForm}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        borderRadius: "var(--md-sys-shape-corner-extra-large)",
                        color: "#3b82f6",
                      }}
                    >
                      إلغاء
                    </button>
                  </MaterialRipple>
                  <MaterialRipple>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "#ffffff",
                        borderRadius: "var(--md-sys-shape-corner-extra-large)",
                        boxShadow: "var(--md-sys-elevation-1)",
                      }}
                    >
                      {editingChat ? "تحديث" : "إضافة"}
                    </button>
                  </MaterialRipple>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
