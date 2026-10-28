import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Plus, Sparkles, Compass, Mic, MicOff, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatApi } from '../../services/chatApi';
import StylistCharacter2D from '../../components/character/StylistCharacter2D';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ASSISTANT',
      content: 'Xin chào! Mình là MIA, AI Fashion Stylist của bạn. Bạn có thể trò chuyện bằng tin nhắn hoặc nhấn vào biểu tượng Micro để nói trực tiếp với mình!',
      products: [],
      outfit: null,
      emotion: 'welcome',
      animation: 'greeting',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [characterEmotion, setCharacterEmotion] = useState('welcome');
  const [characterAnimation, setCharacterAnimation] = useState('greeting');
  const [lastResponseText, setLastResponseText] = useState('');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle Speech-to-Text Microphone Input in Vietnamese
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói (Web Speech API). Bạn vui lòng dùng Google Chrome hoặc Microsoft Edge nhé!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0])
          .map((r) => r.transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (ex) {
      console.error('Failed to start speech recognition:', ex);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || loading) return;

    if (!customText) {
      setInputMessage('');
    }

    const userMessageObj = {
      id: Date.now(),
      role: 'USER',
      content: textToSend,
      products: [],
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setLoading(true);

    // Set Character to Thinking state immediately
    setCharacterEmotion('thinking');
    setCharacterAnimation('thinking');

    try {
      const response = await chatApi.sendMessage(textToSend, sessionId);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      const returnedEmotion = response.emotion || 'happy';
      const returnedAnimation = response.animation || 'recommend';

      const assistantMessageObj = {
        id: Date.now() + 1,
        role: 'ASSISTANT',
        content: response.message,
        actionType: response.actionType,
        products: response.products || [],
        outfit: response.outfit || null,
        productDetail: response.productDetail || null,
        emotion: returnedEmotion,
        animation: returnedAnimation,
      };

      setMessages((prev) => [...prev, assistantMessageObj]);

      // Update MIA's state & trigger Vietnamese Text-to-Speech
      setCharacterEmotion(returnedEmotion);
      setCharacterAnimation(returnedAnimation);
      setLastResponseText(response.message);
    } catch (err) {
      const errorMsg = 'Có lỗi xảy ra khi kết nối với AI Service. Vui lòng thử lại sau!';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ASSISTANT',
          content: errorMsg,
          products: [],
          outfit: null,
          emotion: 'sorry',
          animation: 'sorry',
        },
      ]);
      setCharacterEmotion('sorry');
      setCharacterAnimation('sorry');
      setLastResponseText(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    handleSendMessage(promptText);
  };

  const quickPrompts = [
    { label: '👕 Phối đồ Đà Lạt (<1.5M)', text: 'Phối cho mình một set đồ đi Đà Lạt mùa đông dưới 1.5M.' },
    { label: '🛍️ Xem 5 mẫu áo sơ mi', text: 'Cho tôi xem 5 mẫu áo sơ mi mới về.' },
    { label: '📏 Kiểm tra Size XL sơ mi', text: 'Áo sơ mi trắng premium này có size XL không?' },
    { label: '🧵 Hỏi chất liệu áo khoác', text: 'Áo khoác này là chất liệu gì, len mỏng hay len dày?' },
    { label: '👋 Xin chào MIA 2D', text: 'Xin chào MIA, chúc bạn ngày mới tốt lành!' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <span>AI Fashion Stylist 2D Agent</span>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                Voice & Text Integrated (MIA)
              </span>
            </h1>
            <p className="text-xs text-slate-500">Tư vấn bằng tin nhắn & giọng nói song song, phối đồ chuẩn thời tiết & kiểm soát ngân sách</p>
          </div>
        </div>

        <button
          onClick={() => {
            setSessionId(null);
            setCharacterEmotion('welcome');
            setCharacterAnimation('greeting');
            setLastResponseText('');
            setMessages([
              {
                id: 'welcome',
                role: 'ASSISTANT',
                content: 'Xin chào! Mình là MIA, AI Fashion Stylist của bạn. Bạn có thể trò chuyện bằng tin nhắn hoặc nhấn vào biểu tượng Micro để nói trực tiếp với mình!',
                products: [],
                outfit: null,
                emotion: 'welcome',
                animation: 'greeting',
              },
            ]);
          }}
          className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold hover:border-purple-500 hover:text-purple-700 transition flex items-center gap-1.5 text-slate-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Cuộc hội thoại mới
        </button>
      </div>

      {/* Main 2D Agent & Chat Layout (Split 40% Agent / 60% Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: 2D Stylist Character MIA (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="h-[560px] w-full">
            <StylistCharacter2D
              emotion={characterEmotion}
              animation={characterAnimation}
              isThinking={loading}
              lastResponseText={lastResponseText}
              speechEnabled={speechEnabled}
              setSpeechEnabled={setSpeechEnabled}
              isListening={isListening}
            />
          </div>

          {/* Quick Action Preset Prompts */}
          <div className="bg-white/80 border border-purple-100 rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Compass className="w-4 h-4 text-purple-600" />
              <span>Gợi Ý Nhanh Từ MIA:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(qp.text)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold hover:bg-purple-600 hover:text-white transition shadow-sm text-left disabled:opacity-50"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chatbox Conversation (lg:col-span-7) */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-3xl p-6 h-[660px] flex flex-col border border-slate-200 shadow-xl relative overflow-hidden bg-white/90">
            
            {/* Conversation Messages List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ASSISTANT' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-xl space-y-3 ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'USER'
                          ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Phase 6.5 & 2D Agent: Outfit Composition Card */}
                    {msg.outfit && (
                      <div className="bg-gradient-to-br from-purple-50 via-white to-brand-50 border-2 border-purple-200 rounded-2xl p-4 shadow-md space-y-3">
                        <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">✨</span>
                            <h3 className="font-extrabold text-slate-900 text-sm">{msg.outfit.name}</h3>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-purple-600 text-white font-extrabold text-xs shadow-sm">
                            Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(msg.outfit.totalPrice)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 italic bg-white/70 p-2.5 rounded-xl border border-purple-100">
                          "{msg.outfit.reason}"
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {msg.outfit.products && msg.outfit.products.map((p) => (
                            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex gap-2.5 items-center shadow-sm hover:border-purple-300 transition">
                              <img
                                src={p.primaryImageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'}
                                alt={p.name}
                                className="w-12 h-14 object-cover rounded-lg bg-slate-100 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 inline-block mb-0.5">
                                  {p.categoryName || 'Món đồ'}
                                </span>
                                <Link to={`/products/${p.id}`} className="font-bold text-slate-900 text-xs truncate block hover:text-purple-600">
                                  {p.name}
                                </Link>
                                <span className="font-extrabold text-slate-800 text-xs">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Link
                            to="/try-on"
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 text-white font-bold text-xs shadow-md hover:opacity-95 transition flex items-center gap-1.5"
                          >
                            <span>👕 THỬ ĐỒ ẢO VIRTUAL TRY-ON</span>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Standalone Product Search Cards (SEARCH_PRODUCTS) */}
                    {msg.products && msg.products.length > 0 && !msg.outfit && !msg.productDetail && (
                      <div className="bg-gradient-to-br from-slate-50 via-white to-purple-50 border border-purple-100 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            🛍️ Gợi Ý Sản Phẩm Trong Shop ({msg.products.length} item)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.products.map((p) => (
                            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex gap-2.5 items-center shadow-sm hover:border-purple-300 transition">
                              <img
                                src={p.primaryImageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'}
                                alt={p.name}
                                className="w-12 h-14 object-cover rounded-lg bg-slate-100 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 inline-block mb-0.5">
                                  {p.categoryName || 'Sản phẩm'}
                                </span>
                                <Link to={`/products/${p.id}`} className="font-bold text-slate-900 text-xs truncate block hover:text-purple-600">
                                  {p.name}
                                </Link>
                                <span className="font-extrabold text-purple-600 text-xs">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product Detail Info Card (GET_PRODUCT_INFO) */}
                    {msg.productDetail && (
                      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200 rounded-2xl p-4 shadow-md space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">📌</span>
                            <h3 className="font-extrabold text-slate-900 text-sm">{msg.productDetail.productName}</h3>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-sm">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(msg.productDetail.price)}
                          </span>
                        </div>

                        <div className="flex gap-3 items-center bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                          {msg.productDetail.primaryImageUrl && (
                            <img
                              src={msg.productDetail.primaryImageUrl}
                              alt={msg.productDetail.productName}
                              className="w-14 h-16 object-cover rounded-lg bg-slate-100 shrink-0"
                            />
                          )}
                          <div className="space-y-1 text-xs text-slate-700">
                            <p className="font-bold text-slate-900">{msg.productDetail.answerSummary}</p>
                            <p><span className="font-semibold">Danh mục:</span> {msg.productDetail.categoryName} | <span className="font-semibold">Chất liệu:</span> {msg.productDetail.material}</p>
                            {msg.productDetail.availableSizes && msg.productDetail.availableSizes.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="font-semibold">Size sẵn có:</span>
                                {msg.productDetail.availableSizes.map((sz, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                                    {sz}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === 'USER' && (
                    <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start items-center text-purple-700 text-xs">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-200">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <span className="animate-pulse font-semibold">MIA đang tìm kiếm & phối đồ tối ưu từ kho...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form with Microphone (STT) and Send Buttons */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="pt-4 border-t border-slate-200 flex items-center gap-2">
              
              {/* Text Input */}
              <input
                type="text"
                placeholder={isListening ? '🎙️ Đang lắng nghe giọng nói của bạn...' : 'Hỏi Stylist MIA... (ví dụ: Mình đi Sapa outfit streetwear màu tối)'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className={`flex-1 bg-white border text-slate-800 text-sm rounded-full py-3 px-5 focus:outline-none transition-all shadow-sm ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-300 placeholder-rose-500 font-semibold animate-pulse'
                    : 'border-slate-200 focus:border-purple-500'
                }`}
              />

              {/* Microphone Voice Input Button */}
              <button
                type="button"
                onClick={startSpeechRecognition}
                title={isListening ? 'Dừng lắng nghe' : 'Nói trực tiếp qua Micro (Nói tiếng Việt)'}
                className={`p-3 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 ring-4 ring-rose-200 animate-bounce shadow-glow-rose'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-brand-600 text-white text-sm font-semibold shadow-glow-purple hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1.5 shrink-0"
              >
                <span>Gửi</span>
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>

      </div>

    </div>
  );
}
