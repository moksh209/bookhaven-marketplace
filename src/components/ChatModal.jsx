import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Upload, 
  AlertCircle, 
  Truck, 
  Home, 
  MessageSquare, 
  DollarSign, 
  ShieldCheck, 
  ExternalLink,
  Image as ImageIcon,
  Info
} from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUS_STEPS = [
  { key: 'Interested', label: 'Interested' },
  { key: 'Payment Pending', label: 'Payment Pending' },
  { key: 'Payment Submitted', label: 'Proof Submitted' },
  { key: 'Payment Confirmed', label: 'Payment Confirmed' },
  { key: 'Ready for Delivery', label: 'Ready' },
  { key: 'Delivered', label: 'Delivered' }
];

export default function ChatModal({ conversationId, isOpen, onClose, onOrderUpdated }) {
  const { user } = useAuth();
  const toast = useToast();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [order, setOrder] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // Private Payment State
  const [showPaymentBox, setShowPaymentBox] = useState(false);
  const [sellerPaymentInfo, setSellerPaymentInfo] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [refId, setRefId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const messagesEndRef = useRef(null);

  const loadConversationData = async () => {
    if (!conversationId) return;
    try {
      const data = await api.getConversation(conversationId);
      setConversation(data);
      setMessages(data.messages || []);
      setOrder(data.order || null);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && conversationId) {
      setLoading(true);
      loadConversationData();

      // Poll every 3.5 seconds for fresh messages while chat is open
      const interval = setInterval(loadConversationData, 3500);
      return () => clearInterval(interval);
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !conversationId) return null;

  const isBuyer = user?.id === conversation?.buyerId;
  const isSeller = user?.id === conversation?.sellerId;
  const otherPartyName = isBuyer ? conversation?.sellerName : conversation?.buyerName;
  const otherPartyCollege = isBuyer ? conversation?.sellerCollege : conversation?.buyerCollege;

  // Fetch private seller payment QR (Only authorized for buyer or seller)
  const handleOpenPaymentBox = async () => {
    setShowPaymentBox(true);
    if (!sellerPaymentInfo && conversation) {
      setLoadingQr(true);
      try {
        const info = await api.getSellerPaymentInfo(conversation.sellerId);
        setSellerPaymentInfo(info);
      } catch (err) {
        toast.error('Could not load seller payment details: ' + err.message);
      } finally {
        setLoadingQr(false);
      }
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const sent = await api.sendMessage(conversationId, { text: textToSend });
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  // Upload proof file
  const handleProofFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.uploadImage(formData);
      setProofUrl(res.imageUrl);
      toast.success('Screenshot uploaded!');
    } catch (err) {
      toast.error('Screenshot upload failed');
    }
  };

  // Submit payment proof
  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!order) return;
    if (!refId.trim() && !proofUrl) {
      toast.error('Please enter a Transaction Reference ID or upload a payment screenshot.');
      return;
    }

    setSubmittingProof(true);
    try {
      const updatedOrder = await api.submitPaymentProof({
        orderId: order.id,
        paymentReferenceId: refId,
        paymentProofUrl: proofUrl
      });
      setOrder(updatedOrder);
      toast.success('Payment proof submitted to seller!');
      loadConversationData();
      if (onOrderUpdated) onOrderUpdated(updatedOrder);
    } catch (err) {
      toast.error(err.message || 'Failed to submit proof');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Seller manual verification of payment
  const handleConfirmPayment = async () => {
    if (!order) return;
    if (!window.confirm('Have you checked your UPI/bank app and confirmed the funds arrived? Click OK to confirm.')) {
      return;
    }

    setConfirmingPayment(true);
    try {
      const res = await api.confirmOrderPayment(order.id);
      setOrder(res.order);
      toast.success('Payment confirmed! Order is now confirmed.');
      loadConversationData();
      if (onOrderUpdated) onOrderUpdated(res.order);
    } catch (err) {
      toast.error(err.message || 'Failed to confirm payment');
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Seller updates delivery status
  const handleUpdateStatus = async (newStatus) => {
    if (!order) return;
    try {
      const updated = await api.updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      toast.success(`Order status updated to: ${newStatus}`);
      loadConversationData();
      if (onOrderUpdated) onOrderUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const statusIdx = STATUS_STEPS.findIndex(s => s.key.toLowerCase() === (order?.status || '').toLowerCase());
  const currentStep = statusIdx >= 0 ? statusIdx : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full h-[90vh] max-h-[750px] shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header: Book & Participant Info */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            {conversation?.bookImage && (
              <img
                src={conversation.bookImage}
                alt={conversation.bookTitle}
                className="w-11 h-14 object-cover rounded-lg border border-stone-200 shadow-xs flex-shrink-0"
              />
            )}
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-stone-900 text-sm truncate">
                  {conversation?.bookTitle || 'Book Chat'}
                </h3>
                <span className="font-bold text-amber-800 text-xs font-serif flex-shrink-0">
                  {formatCurrency(conversation?.bookPrice)}
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate">
                Private chat with <strong className="text-stone-800">{otherPartyName}</strong> ({otherPartyCollege || 'Campus'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPaymentBox(!showPaymentBox)}
              className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showPaymentBox ? 'Hide Payment' : 'Payment & QR'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Status Stepper Bar */}
        {order && (
          <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between text-xs text-stone-700">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900">Order #{order.orderNumber}:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-[11px]">
                {order.status}
              </span>
            </div>
            <div className="text-[11px] text-stone-500">
              {isBuyer ? 'Buyer View' : 'Seller View'}
            </div>
          </div>
        )}

        {/* Collapsible Private QR & Manual Payment Section */}
        {showPaymentBox && (
          <div className="p-4 bg-stone-100/90 border-b border-stone-200 overflow-y-auto max-h-72 text-xs space-y-3">
            
            {/* Seller View */}
            {isSeller && (
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Seller Payment Verification Center
                  </h4>
                  <span className="text-[11px] text-stone-400">Manual Verification Required</span>
                </div>

                {order?.status === 'Payment Submitted' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <p className="font-semibold text-emerald-900">
                      Buyer has submitted payment proof!
                    </p>
                    <p className="text-stone-700">
                      Reference / UTR ID: <strong className="font-mono">{order.paymentReferenceId || 'N/A'}</strong>
                    </p>
                    {order.paymentProofUrl && (
                      <div>
                        <span className="text-stone-500 block mb-1">Attached Screenshot:</span>
                        <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="inline-block border border-stone-300 rounded-lg overflow-hidden">
                          <img src={order.paymentProofUrl} alt="Payment proof" className="max-h-28 object-contain" />
                        </a>
                      </div>
                    )}
                    <button
                      onClick={handleConfirmPayment}
                      disabled={confirmingPayment}
                      className="mt-2 w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition"
                    >
                      {confirmingPayment ? 'Verifying...' : '✅ Verify & Confirm Payment Received'}
                    </button>
                    <p className="text-[10px] text-stone-500 text-center">
                      Only confirm after verifying that money has arrived in your UPI/bank app.
                    </p>
                  </div>
                ) : order?.status === 'Payment Confirmed' ? (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <p className="text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Payment Verified &amp; Confirmed
                    </p>
                    <p className="text-stone-600">You can now coordinate campus handoff or delivery in the chat below.</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleUpdateStatus('Ready for Delivery')}
                        className="px-3 py-1.5 bg-stone-800 text-white rounded-lg font-semibold text-[11px]"
                      >
                        Mark Ready for Delivery
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('Delivered')}
                        className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-semibold text-[11px]"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <p className="font-semibold text-amber-900">Awaiting payment from buyer.</p>
                    <p className="text-stone-600">
                      The buyer will view your private QR code and submit their transaction reference ID here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Buyer View */}
            {isBuyer && (
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-700" />
                    Secure Seller Payment
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    Strictly Private to You
                  </span>
                </div>

                {loadingQr ? (
                  <p className="text-stone-500 py-3 text-center">Loading seller's private payment QR...</p>
                ) : sellerPaymentInfo?.paymentQrUrl ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col items-center p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
                      <img
                        src={sellerPaymentInfo.paymentQrUrl}
                        alt="Seller Payment QR"
                        className="w-36 h-36 object-contain rounded-xl border border-stone-300 shadow-xs"
                      />
                      <span className="text-[11px] font-bold text-stone-800 mt-2">
                        Scan to Pay: {formatCurrency(conversation.bookPrice)}
                      </span>
                      {sellerPaymentInfo.upiId && (
                        <span className="text-[10px] font-mono text-stone-500">
                          UPI ID: {sellerPaymentInfo.upiId}
                        </span>
                      )}
                    </div>

                    <form onSubmit={handleSubmitProof} className="space-y-2">
                      <p className="text-[11px] text-stone-600 font-medium">
                        After scanning and transferring via your payment app, enter the Transaction Reference ID or attach a screenshot:
                      </p>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase">
                          Transaction ID / UTR
                        </label>
                        <input
                          type="text"
                          value={refId}
                          onChange={(e) => setRefId(e.target.value)}
                          placeholder="e.g. 481920394821"
                          className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase">
                          Payment Screenshot (Optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofFileUpload}
                          className="w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-stone-200"
                        />
                        {proofUrl && <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Screenshot uploaded!</span>}
                      </div>

                      <button
                        type="submit"
                        disabled={submittingProof || order?.status === 'Payment Confirmed'}
                        className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                      >
                        {submittingProof ? 'Submitting...' : 'Submit Payment Proof'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <p className="font-bold text-amber-900">Seller hasn't uploaded a payment QR code yet.</p>
                    <p className="text-stone-600">
                      Please send a message to {conversation.sellerName} in the chat below asking them to upload their payment QR in their Seller Dashboard.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF8F5]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <MessageSquare className="w-8 h-8 mb-2 text-stone-300" />
              <p className="text-xs">No messages yet. Send a message to start negotiating or coordinate campus meeting.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const isSys = msg.messageType === 'system';

              if (isSys) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-stone-200/80 text-stone-700 text-[11px] px-3.5 py-1.5 rounded-full max-w-md text-center leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-stone-400 mb-0.5 px-1">
                    {msg.senderName}
                  </span>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                      isMe
                        ? 'bg-amber-700 text-white rounded-br-xs'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs'
                    }`}
                  >
                    {msg.attachmentUrl && (
                      <div className="mb-2">
                        <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                          <img
                            src={msg.attachmentUrl}
                            alt="Attachment"
                            className="max-h-40 rounded-lg object-contain border border-black/10"
                          />
                        </a>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-stone-400 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message (e.g. Can we meet at the campus library?)"
            className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-600/30 font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
