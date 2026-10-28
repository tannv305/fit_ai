import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, Settings, X, Play, Shirt, Heart, Mic, Radio } from 'lucide-react';
import { chatApi } from '../../services/chatApi';

export default function StylistCharacter2D({
  emotion = 'welcome',
  animation = 'greeting',
  isThinking = false,
  lastResponseText = '',
  speechEnabled = true,
  setSpeechEnabled,
  isListening = false
}) {
  const [blinking, setBlinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentAudioRef = useRef(null);

  // Settings State with LocalStorage Persistence
  const [showSettings, setShowSettings] = useState(false);
  const [fptVoice, setFptVoice] = useState(() => {
    return localStorage.getItem('fitai_fpt_voice') || 'banmai';
  });
  const [fptSpeed, setFptSpeed] = useState(() => {
    return parseInt(localStorage.getItem('fitai_fpt_speed') || '0', 10);
  });
  const [useFptAi, setUseFptAi] = useState(true);

  // FPT.AI Voice Catalog
  const fptVoicesList = [
    { id: 'banmai', name: 'Ban Mai (Nữ Miền Bắc)', region: 'Bắc' },
    { id: 'lannhi', name: 'Lân Nhi (Nữ Miền Nam)', region: 'Nam' },
    { id: 'leminh', name: 'Lê Minh (Nam Miền Nam)', region: 'Nam' },
    { id: 'giaminh', name: 'Gia Minh (Nam Miền Bắc)', region: 'Bắc' },
    { id: 'thuha', name: 'Thu Hà (Nữ Miền Bắc)', region: 'Bắc' },
    { id: 'myan', name: 'Mỹ An (Nữ Miền Trung)', region: 'Trung' },
  ];

  // Save Settings to LocalStorage
  const handleSaveSettings = () => {
    localStorage.setItem('fitai_fpt_voice', fptVoice);
    localStorage.setItem('fitai_fpt_speed', fptSpeed.toString());
    setShowSettings(false);
  };

  // Stop & Clean up current playing audio (Anti-spam / No overlap)
  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Play Speech Audio via FPT.AI API with Web Speech API Fallback
  const speakMIA = async (textToSpeak) => {
    if (!textToSpeak || !speechEnabled) return;

    stopCurrentAudio();

    const cleanText = textToSpeak
      .replace(/[*#_~`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) return;

    if (useFptAi) {
      try {
        const ttsResult = await chatApi.generateSpeech(cleanText, fptVoice, fptSpeed);

        if (ttsResult && ttsResult.status === 'SUCCESS' && ttsResult.audioUrl) {
          const audio = new Audio(ttsResult.audioUrl);
          currentAudioRef.current = audio;

          audio.onplay = () => {
            setIsSpeaking(true);
          };

          audio.onended = () => {
            setIsSpeaking(false);
            currentAudioRef.current = null;
          };

          audio.onerror = (e) => {
            console.warn('FPT.AI TTS Audio error, falling back to Web Speech API:', e);
            fallbackWebSpeech(cleanText);
          };

          await audio.play().catch(err => {
            console.warn('Audio play autoplay policy blocked:', err);
            fallbackWebSpeech(cleanText);
          });
          return;
        }
      } catch (err) {
        console.error('FPT.AI TTS call failed, executing fallback:', err);
      }
    }

    // Fallback Web Speech API
    fallbackWebSpeech(cleanText);
  };

  // Web Speech API Fallback Method
  const fallbackWebSpeech = (cleanText) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    utterance.rate = fptSpeed === 1 ? 1.2 : fptSpeed === -1 ? 0.85 : 1.05;
    utterance.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Trigger MIA Speech on lastResponseText change
  useEffect(() => {
    if (lastResponseText) {
      speakMIA(lastResponseText);
    }
    return () => stopCurrentAudio();
  }, [lastResponseText, speechEnabled]);

  // Test voice sample button
  const handleTestVoice = () => {
    const sample = 'Xin chào! Mình là MIA, AI Fashion Stylist tư vấn bằng giọng nói FPT.AI!';
    speakMIA(sample);
  };

  // Random eye blink timer for natural idle behavior
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Determine current active state
  const activeEmotion = isThinking ? 'thinking' : emotion;
  const activeAnimation = isThinking ? 'thinking' : (isSpeaking ? 'talking' : animation);

  // Emotion status details
  const getStatusText = () => {
    if (isListening) return '🎙️ MIA đang lắng nghe giọng nói của bạn...';
    if (isThinking) return '💭 MIA đang suy nghĩ & phối đồ...';
    if (isSpeaking) return `🔊 MIA đang cất giọng FPT.AI (${fptVoicesList.find(v=>v.id===fptVoice)?.name || 'Ban Mai'})...`;
    switch (activeEmotion) {
      case 'welcome':
        return 'MIA: "Xin chào! Bạn muốn trò chuyện bằng giọng nói hay chat tin nhắn?"';
      case 'excited':
        return 'MIA: "Tuyệt vời! Đã tìm được Outfit chuẩn phom cho bạn!"';
      case 'happy':
      case 'recommend':
        return 'MIA: "Gợi ý outfit phong cách dành riêng cho bạn đây!"';
      case 'sorry':
        return 'MIA: "Rất tiếc, shop chưa có sản phẩm khớp 100%"';
      case 'talking':
        return 'MIA đang tư vấn outfit cho bạn...';
      default:
        return 'MIA: Stylist cá nhân luôn sẵn sàng!';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-purple-900/10 via-slate-900/40 to-slate-950 rounded-3xl border border-purple-500/20 shadow-2xl backdrop-blur-xl overflow-hidden group">
      
      {/* Background Animated Glow */}
      <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
        isListening ? 'bg-rose-500/30 animate-ping' : 'bg-purple-600/20 animate-pulse'
      }`} />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      {/* Header Info Bar with FPT.AI Voice Settings ⚙️ */}
      <div className="w-full flex items-center justify-between z-10 bg-slate-900/60 p-3 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full absolute inset-0 ${isListening ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-ping'}`} />
            <div className={`w-3 h-3 rounded-full relative ${isListening ? 'bg-rose-600 shadow-glow-rose' : 'bg-emerald-500 shadow-glow-emerald'}`} />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <span>MIA</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                FPT.AI Voice
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Giọng: {fptVoicesList.find(v=>v.id===fptVoice)?.name.split(' ')[0] || 'Ban Mai'}</p>
          </div>
        </div>

        {/* Action Controls: Voice Toggle & FPT Settings Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSpeechEnabled && setSpeechEnabled(!speechEnabled)}
            title={speechEnabled ? 'Tắt giọng nói MIA' : 'Bật giọng nói MIA'}
            className={`p-2 rounded-xl border transition-all ${
              speechEnabled
                ? 'bg-purple-600 text-white border-purple-400 shadow-glow-purple'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            title="Cài đặt giọng FPT.AI & Vùng miền"
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:text-white hover:border-purple-500 transition shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FPT.AI Voice Settings Overlay Drawer Modal ⚙️ */}
      {showSettings && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col justify-between animate-fade-in border border-purple-500/40 rounded-3xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                <h4 className="font-extrabold text-white text-sm">Cài Đặt Giọng FPT.AI ⚙️</h4>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FPT.AI Voice Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Chọn Giọng Đọc FPT.AI (Vùng Miền):</label>
              <select
                value={fptVoice}
                onChange={(e) => setFptVoice(e.target.value)}
                className="w-full bg-slate-900 border border-purple-500/40 text-purple-200 font-bold text-xs rounded-xl p-2.5 focus:border-purple-400 focus:outline-none"
              >
                {fptVoicesList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (Miền {v.region})
                  </option>
                ))}
              </select>
            </div>

            {/* FPT.AI Speed Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Tốc Độ Đọc (Speed):</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { value: -1, label: 'Chậm' },
                  { value: 0, label: 'Chuẩn' },
                  { value: 1, label: 'Nhanh' },
                  { value: 2, label: 'Rất Nhanh' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setFptSpeed(s.value)}
                    className={`py-1.5 rounded-lg border text-[11px] font-extrabold transition ${
                      fptSpeed === s.value
                        ? 'bg-purple-600 text-white border-purple-400 shadow-glow-purple'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FPT Engine Toggle */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Engine FPT.AI Cloud TTS:</span>
              <button
                type="button"
                onClick={() => setUseFptAi(!useFptAi)}
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold border transition ${
                  useFptAi
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {useFptAi ? 'Kích hoạt FPT.AI' : 'Browser WebSpeech'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={handleTestVoice}
              className="flex-1 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-purple-400" /> Nghe Thử FPT
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white font-bold text-xs shadow-glow-purple hover:opacity-95 transition"
            >
              Lưu Cài Đặt
            </button>
          </div>
        </div>
      )}

      {/* Speech Bubble Above Character */}
      <div className="z-10 w-full mt-3">
        <div className={`relative text-slate-100 p-3.5 rounded-2xl border shadow-lg text-xs leading-relaxed font-medium flex items-start gap-2.5 transition-all duration-300 ${
          isListening
            ? 'bg-gradient-to-r from-rose-950/90 to-purple-950/90 border-rose-500/40 shadow-rose-950/50'
            : 'bg-gradient-to-r from-purple-900/80 to-slate-900/90 border-purple-400/30'
        }`}>
          <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isListening ? 'text-rose-400 animate-bounce' : 'text-amber-400 animate-spin-slow'}`} />
          <span>{getStatusText()}</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-b border-r border-purple-400/30 rotate-45" />
        </div>
      </div>

      {/* 2D Stylist Avatar Character Render */}
      <div className="relative my-auto py-4 flex items-center justify-center scale-100 transition-all duration-500">
        
        {/* Floating Mic Waves when listening */}
        {isListening && (
          <div className="absolute -top-10 flex items-center gap-1.5 bg-rose-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Đang nghe giọng nói...</span>
          </div>
        )}

        {/* Floating Thinking / Celebration Particles */}
        {isThinking && !isListening && (
          <div className="absolute -top-6 flex gap-2 animate-bounce">
            <span className="text-xl animate-pulse">💭</span>
            <span className="text-lg animate-pulse" style={{ animationDelay: '0.2s' }}>✨</span>
            <span className="text-xl animate-pulse" style={{ animationDelay: '0.4s' }}>👕</span>
          </div>
        )}

        {activeEmotion === 'excited' && !isListening && (
          <div className="absolute -top-8 flex gap-3 animate-pulse">
            <span className="text-2xl animate-spin-slow">✨</span>
            <span className="text-2xl animate-bounce">🌟</span>
            <span className="text-2xl animate-spin-slow">✨</span>
          </div>
        )}

        {/* Character Base Body (SVG Stylist MIA) */}
        <div className={`relative w-48 h-64 transition-transform duration-700 ${
          isSpeaking ? 'animate-pulse' :
          activeAnimation === 'thinking' ? 'animate-tilt' :
          activeAnimation === 'celebrate' ? 'animate-bounce' :
          'animate-float'
        }`}>
          <svg viewBox="0 0 200 260" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
              <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#fed7aa" />
              </linearGradient>
            </defs>

            {/* Background Aura Circle */}
            <circle cx="100" cy="120" r="75" fill="none" stroke={isListening ? "rgba(244, 63, 94, 0.4)" : "rgba(168, 85, 247, 0.2)"} strokeWidth="3" strokeDasharray="6 6" className="animate-spin-slow" />

            {/* Hair Back */}
            <path d="M 60 70 Q 50 140 65 170 Q 100 180 135 170 Q 150 140 140 70 Z" fill="url(#hairGrad)" />

            {/* Shoulders & Jacket */}
            <path d="M 40 210 Q 100 175 160 210 L 170 260 L 30 260 Z" fill="url(#jacketGrad)" stroke={isListening ? "#f43f5e" : "#a855f7"} strokeWidth="1.5" />
            <path d="M 80 190 L 100 230 L 120 190 Z" fill="#ffffff" />
            <path d="M 90 205 L 100 230 L 110 205 Z" fill="#ec4899" />

            {/* Neck */}
            <rect x="88" y="145" width="24" height="30" rx="8" fill="url(#skinGrad)" />

            {/* Head / Face */}
            <ellipse cx="100" cy="110" rx="42" ry="48" fill="url(#skinGrad)" stroke="#fbd5a5" strokeWidth="1.5" />

            {/* Bangs Hair Front */}
            <path d="M 58 90 Q 90 60 100 85 Q 110 60 142 90 Q 130 50 100 48 Q 70 50 58 90 Z" fill="url(#hairGrad)" />

            {/* Stylish Glasses */}
            <rect x="68" y="98" width="26" height="18" rx="5" fill="none" stroke="#d946ef" strokeWidth="2.5" />
            <rect x="106" y="98" width="26" height="18" rx="5" fill="none" stroke="#d946ef" strokeWidth="2.5" />
            <line x1="94" y1="107" x2="106" y2="107" stroke="#d946ef" strokeWidth="2.5" />

            {/* Eyes (Blinking Logic) */}
            {blinking || activeEmotion === 'excited' ? (
              <>
                <path d="M 73 107 Q 81 99 89 107" fill="none" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
                <path d="M 111 107 Q 119 99 127 107" fill="none" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : activeEmotion === 'sorry' ? (
              <>
                <path d="M 73 109 Q 81 114 89 109" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 111 109 Q 119 114 127 109" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="81" cy="107" r="4.5" fill="#1e1b4b" />
                <circle cx="82.5" cy="105.5" r="1.5" fill="#ffffff" />
                <circle cx="119" cy="107" r="4.5" fill="#1e1b4b" />
                <circle cx="120.5" cy="105.5" r="1.5" fill="#ffffff" />
              </>
            )}

            {/* Cheeks Blush */}
            <ellipse cx="70" cy="122" rx="7" ry="4" fill="#f43f5e" opacity="0.35" />
            <ellipse cx="130" cy="122" rx="7" ry="4" fill="#f43f5e" opacity="0.35" />

            {/* Dynamic Lip-sync Mouth (Speaking / Expression) */}
            {isSpeaking ? (
              /* Animated Speaking Mouth */
              <ellipse cx="100" cy="134" rx="8" ry="6" fill="#e11d48" className="animate-ping" style={{ animationDuration: '300ms' }} />
            ) : activeEmotion === 'excited' || activeEmotion === 'happy' || activeEmotion === 'welcome' ? (
              /* Big Smile */
              <path d="M 88 132 Q 100 148 112 132 Z" fill="#e11d48" />
            ) : activeEmotion === 'sorry' ? (
              /* Small O / Sad Mouth */
              <path d="M 93 138 Q 100 133 107 138" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
            ) : isThinking ? (
              /* Thinking Pout */
              <ellipse cx="100" cy="136" rx="4" ry="4" fill="#e11d48" />
            ) : (
              /* Gentle Smile */
              <path d="M 90 133 Q 100 142 110 133" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
            )}

            {/* Headset & Microphone */}
            <path d="M 50 100 Q 100 40 150 100" fill="none" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="50" cy="105" r="7" fill={isListening ? "#f43f5e" : "#8b5cf6"} />
            <circle cx="150" cy="105" r="7" fill={isListening ? "#f43f5e" : "#8b5cf6"} />
            <path d="M 50 105 Q 60 140 85 138" fill="none" stroke={isListening ? "#f43f5e" : "#8b5cf6"} strokeWidth="2.5" />
            <circle cx="85" cy="138" r="3" fill="#e11d48" />
          </svg>

          {/* Hand Greeting / Pointing Animation Overlay */}
          {(activeAnimation === 'greeting' || activeAnimation === 'recommend') && !isSpeaking && (
            <div className="absolute bottom-4 right-0 text-3xl animate-bounce">
              👋
            </div>
          )}
        </div>
      </div>

      {/* Stylist Badges / Feature Tags */}
      <div className="w-full z-10 pt-2 flex flex-wrap justify-center gap-1.5">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
          <Shirt className="w-3 h-3 text-purple-400" /> FPT.AI TTS Integrated
        </span>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
          <Heart className="w-3 h-3 text-pink-400" /> Multi-regional Voices
        </span>
      </div>

    </div>
  );
}
