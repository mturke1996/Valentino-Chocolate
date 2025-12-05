import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Message } from "../../types";
import { formatDateTime } from "../../utils/formatters";
import { Search, Mail, Trash2, Reply, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function MessagesManagement() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const fetchMessages = async () => {
    try {
      let messagesQuery;
      if (statusFilter === "all") {
        messagesQuery = query(
          collection(db, "messages"),
          orderBy("createdAt", "desc")
        );
      } else {
        messagesQuery = query(
          collection(db, "messages"),
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        );
      }

      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(messagesData);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("حدث خطأ أثناء تحميل الرسائل");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, "messages", messageId), {
        status: "read",
      });
      toast.success("تم تحديد الرسالة كمقروءة");
      fetchMessages();
    } catch (error) {
      toast.error("حدث خطأ أثناء التحديث");
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) {
      toast.error("يرجى إدخال رد");
      return;
    }

    try {
      await updateDoc(doc(db, "messages", messageId), {
        status: "replied",
        reply: replyText,
        repliedAt: new Date(),
      });
      toast.success("تم إرسال الرد بنجاح");
      setSelectedMessage(null);
      setReplyText("");
      fetchMessages();
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الرد");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;

    try {
      await deleteDoc(doc(db, "messages", id));
      toast.success("تم حذف الرسالة بنجاح");
      fetchMessages();
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الرسالة");
    }
  };

  const filteredMessages = messages.filter(
    (message) =>
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.email &&
        message.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-outline-variant border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="md-typescale-headline-large text-on-background">
            إدارة الرسائل
          </h2>
          <p className="md-typescale-body-medium text-on-surface-variant">
            {messages.length} رسالة
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="ابحث عن رسالة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-surface border border-outline rounded-m3 md-typescale-body-medium text-on-surface focus:outline-none focus:border-outline-variant focus:border-2"
          />
        </div>
        <div className="flex gap-2">
          {["all", "new", "read", "replied"].map((status) => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-m3 md-typescale-label-medium ${
                statusFilter === status
                  ? "bg-surface-variant text-on-surface font-medium"
                  : "bg-surface-variant text-on-surface-variant"
              }`}
            >
              {status === "all"
                ? "الكل"
                : status === "new"
                ? "جديدة"
                : status === "read"
                ? "مقروءة"
                : "مردود عليها"}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-16 w-16 text-outline mx-auto mb-4" />
            <p className="md-typescale-body-large text-on-surface-variant">
              لا توجد رسائل
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`md-elevated-card p-6 ${
                message.status === "new"
                  ? "border-r-4 border-outline-variant"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-variant rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-on-surface" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="md-typescale-title-medium text-on-surface">
                          {message.name}
                        </h3>
                        {message.status === "new" && (
                          <span className="px-2 py-1 bg-surface-variant text-on-surface rounded-m3-sm md-typescale-label-small">
                            جديد
                          </span>
                        )}
                        {message.status === "replied" && (
                          <CheckCircle className="h-5 w-5 text-on-surface" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        {message.email && (
                          <a
                            href={`mailto:${message.email}`}
                            className="md-typescale-body-small text-on-surface"
                          >
                            {message.email}
                          </a>
                        )}
                        {message.phone && (
                          <a
                            href={`tel:${message.phone}`}
                            className="md-typescale-body-small text-on-surface"
                          >
                            {message.phone}
                          </a>
                        )}
                        <span className="md-typescale-body-small text-on-surface-variant">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {message.subject && (
                    <div>
                      <span className="md-typescale-label-medium text-on-surface-variant">
                        الموضوع:
                      </span>
                      <span className="md-typescale-body-medium text-on-surface mr-2">
                        {message.subject}
                      </span>
                    </div>
                  )}

                  <p className="md-typescale-body-medium text-on-surface bg-surface-variant p-4 rounded-m3">
                    {message.message}
                  </p>

                  {message.reply && (
                    <div className="mt-4 p-4 bg-surface-variant rounded-m3">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="h-4 w-4 text-on-surface" />
                        <span className="md-typescale-label-medium text-on-surface">
                          رد الموقع:
                        </span>
                      </div>
                      <p className="md-typescale-body-medium text-on-surface">
                        {message.reply}
                      </p>
                      {message.repliedAt && (
                        <p className="md-typescale-body-small text-on-surface mt-2">
                          {formatDateTime(message.repliedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {message.status === "new" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => markAsRead(message.id)}
                      className="p-2 rounded-m3 bg-surface-variant text-on-surface-variant hover:bg-outline-variant transition-colors"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </motion.button>
                  )}
                  {!message.reply && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMessage(message)}
                      className="p-2 rounded-m3 bg-surface-variant text-on-surface hover:opacity-90 transition-opacity"
                    >
                      <Reply className="h-5 w-5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(message.id)}
                    className="p-2 rounded-m3 bg-surface-variant text-on-surface hover:bg-outline-variant transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {selectedMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-m3-lg shadow-m3-5 w-full max-w-2xl p-6"
          >
            <h3 className="md-typescale-headline-small text-on-surface mb-4">
              رد على رسالة من {selectedMessage.name}
            </h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 bg-surface border border-outline rounded-m3 focus:outline-none focus:border-blue-500 focus:border-2 mb-4"
              placeholder="اكتب ردك هنا..."
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setReplyText("");
                }}
                className="md-outlined-button"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleReply(selectedMessage.id)}
                className="md-filled-button"
              >
                إرسال الرد
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
