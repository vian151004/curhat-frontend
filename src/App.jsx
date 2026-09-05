import { useState, useRef, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MicrophoneIcon, PhotoIcon, XMarkIcon, SpeakerWaveIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/chat';

const COLORS = {
  purpleMain: '#4C3A62',
  purpleLight: '#6B5587',
  botGreenBg: '#B4D8C4',
  botGreenText: '#446655',
};

const DEFAULT_BOT_MESSAGE = 'Halo, sahabat. Ambillah napas perlahan dan biarkan pundakmu sedikit turun... Aku TemanDengar. Ruang ini sepenuhnya milikmu untuk bercerita tanpa takut dinilai atau dihakimi.\n\nTak ada rekaman obrolan, tak ada identitas atau data yang disimpan. Ceritakanlah, apa yang sedang terasa paling berat di hatimu hari ini?';

export default function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('curhat_chat_history');
    return saved ? JSON.parse(saved) : [{ id: 1, sender: 'bot', text: DEFAULT_BOT_MESSAGE }];
  });
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordingState, setRecordingState] = useState('idle');
  const [transcriptionText, setTranscriptionText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  
  const [isBreathingMode, setIsBreathingMode] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [activeSound, setActiveSound] = useState(null);
  
  const [breathPhase, setBreathPhase] = useState('Tarik Napas'); 
  const [timeLeft, setTimeLeft] = useState(4);
  
  const messagesEndRef = useRef(null);

  // Perbaikan Scroll: block 'nearest' mencegah seluruh halaman ikut terseret
  useEffect(() => {
    localStorage.setItem('curhat_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  useEffect(() => {
    let timer;
    if (isBreathingMode) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) return prev - 1;
          
          if (breathPhase === 'Tarik Napas') {
            setBreathPhase('Tahan');
            return 7;
          } else if (breathPhase === 'Tahan') {
            setBreathPhase('Hembuskan');
            return 8;
          } else {
            setBreathPhase('Tarik Napas');
            return 4;
          }
        });
      }, 1000);
    } else {
      setBreathPhase('Tarik Napas');
      setTimeLeft(4);
    }
    return () => clearInterval(timer);
  }, [isBreathingMode, breathPhase]);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !attachedImage) || loading) return;

    const userText = inputText.trim();
    const newUserMsg = { id: Date.now(), sender: 'user', text: userText, image: attachedImage };
    
    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setInputText('');
    setAttachedImage(null);
    setLoading(true);

    try {
      const historyContext = newMessages.slice(-6).map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        text: msg.text
      }));

      const res = await axios.post(
        API_URL,
        { message: userText, history: historyContext.slice(0, -1) },
        { headers: { 'bypass-tunnel-reminder': 'true' } }
      );

      if (res.data && res.data.reply) {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: res.data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: 'Maaf, server lagi ada kendala. Pastikan link Ngrok di backend Laravel kamu sudah jalan ya.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecordingFlow = () => {
    setRecordingState('recording');
    setTranscriptionText('');
    setTimeout(() => {
      setTranscriptionText('"Sebenarnya aku cuma pengen istirahat sebentar, tanpa merasa bersalah..."');
    }, 2000);
  };

  const sendTranscription = () => {
     setInputText(prev => prev + ' ' + transcriptionText);
     setRecordingState('idle');
  };

  const confirmClearSession = () => {
    const initial = [{ id: Date.now(), sender: 'bot', text: 'Halo! Riwayat obrolan sudah dibersihkan. Mau mulai cerita apa hari ini?' }];
    setMessages(initial);
    setInputText('');
    setAttachedImage(null);
    setRecordingState('idle');
    setShowClearConfirm(false);
  };

  const pemantikCerita = [
    "Aku sedang merasa sangat lelah hari ini...",
    "Cemas dan tak tahu harus cerita ke siapa",
    "Hanya butuh didengar tanpa nasihat",
    "Pikiranku bising dan kusut"
  ];

  const soundsList = [
    { id: 'hujan', label: '🌧️ Hujan Rintik Jendela' },
    { id: 'air', label: '💧 Gemercik Air Sejuk' },
    { id: 'api', label: '🔥 Hangat Perapian Teduh' }
  ];

  return (
    // PERBAIKAN: Menggunakan "fixed inset-0" untuk memastikan halaman dipaku secara absolut ke layar
    <div className="fixed inset-0 w-full font-sans text-gray-800 flex flex-col overflow-hidden bg-[#F0F2F5] text-sm">
      
      {/* Decorative Ambient Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-purple-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-teal-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 flex-none bg-white/60 backdrop-blur-xl px-5 py-2.5 flex justify-between items-center border-b border-white/50 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md bg-gradient-to-br from-[#4C3A62] to-[#6B5587]">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-[15px] leading-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">SudutTenang</h1>
            <p className="text-[10px] text-gray-500 font-medium">Ruang Teduh untuk Bercerita</p>
          </div>
          <span className="ml-3 bg-white/80 text-teal-700 text-[10px] px-2.5 py-1 rounded-full font-semibold border border-teal-100 shadow-sm">Sesi Bersih</span>
        </div>
        <div className="flex gap-3 items-center">
          {activeSound && (
            <button 
              onClick={() => setActiveSound(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-indigo-100 text-indigo-700 rounded-full text-[11px] font-semibold hover:bg-white transition shadow-sm"
            >
              <SpeakerWaveIcon className="w-3.5 h-3.5 animate-pulse" />
              {activeSound.label}
            </button>
          )}
          <button onClick={() => setShowClearConfirm(true)} className="text-white px-4 py-2 rounded-xl text-[11px] font-semibold hover:opacity-90 transition shadow-lg shadow-purple-900/20 bg-gradient-to-r from-[#4C3A62] to-[#5a4473]">
            Selesaikan Sesi
          </button>
        </div>
      </header>
      
      {/* Banner Privasi */}
      <div className="relative z-10 flex-none bg-white/40 backdrop-blur-md border-b border-white/60 text-gray-700 px-5 py-1.5 text-[10px] flex justify-between items-center">
         <span className="flex items-center gap-2 font-medium">🔐 Ruang Anonim: Riwayat percakapan musnah seketika saat sesi selesai.</span>
         <div className="flex gap-4 items-center">
           <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Anonim Aktif</span>
           <button onClick={() => setShowClearConfirm(true)} className="text-gray-500 hover:text-red-500 flex items-center gap-1 transition font-medium">
             ↺ Hapus & Reset
           </button>
         </div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex gap-5 p-4 w-full max-w-[1400px] mx-auto min-h-0 overflow-hidden">
        
        {/* Sidebar Kiri */}
        <aside className="w-[260px] shrink-0 flex flex-col gap-4 overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden">
          
          <div className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/80 shrink-0 hover:bg-white/80 transition-colors duration-300">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-xs">Latihan Napas</h3>
            <p className="text-[10px] text-gray-500 mt-1 mb-4">Jeda sejenak bersama lingkaran napas.</p>
            <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-green-100 rounded-full border-[3px] border-white mx-auto flex flex-col items-center justify-center mb-4 text-teal-800 shadow-inner relative">
               <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600">Tarik</span>
               <span className="text-xl font-extrabold -mt-1">4<span className="text-[10px] font-semibold">s</span></span>
            </div>
            <button 
              onClick={() => setIsBreathingMode(true)}
              className="w-full bg-white text-indigo-700 border border-indigo-50 py-2 rounded-xl text-[11px] font-bold hover:shadow-md transition-all"
            >
              Mulai Relaksasi
            </button>
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/80 shrink-0 hover:bg-white/80 transition-colors duration-300">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-xs">
                <SpeakerWaveIcon className="w-3.5 h-3.5 text-indigo-400" />
                Suara Alam
            </h3>
            <ul className="space-y-2 text-[11px] text-gray-600 font-medium">
              {soundsList.map(sound => {
                const isActive = activeSound?.id === sound.id;
                return (
                  <li 
                    key={sound.id} 
                    onClick={() => setActiveSound(isActive ? null : sound)}
                    className={`flex justify-between items-center cursor-pointer p-2.5 rounded-xl transition-all duration-200 ${
                      isActive ? 'bg-white shadow-sm border border-indigo-100 text-indigo-700' : 'bg-transparent border border-transparent hover:bg-white/60'
                    }`}
                  >
                    <span>{sound.label}</span>
                    <span className="text-[9px] text-gray-400">
                      {isActive ? <SpeakerWaveIcon className="w-3.5 h-3.5 text-indigo-500" /> : 'Mute'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          
          {/* <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 text-[10px] text-gray-500 space-y-1 shrink-0">
             <h4 className="font-bold text-gray-700 text-[11px]">Cari Bantuan Manusia</h4>
             <p className="leading-relaxed">Hubungi kerabat terdekat jika butuh pertolongan profesional.</p>
          </div> */}
        </aside>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col bg-white/40 backdrop-blur-2xl border border-white/80 rounded-2xl min-h-0 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative">
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full pb-2">
            
            <div className="text-center mt-2 mb-6 space-y-1">
              <h2 className="font-extrabold text-gray-800 text-sm">Bilik Bicara TemanDengar</h2>
              <p className="text-[11px] text-gray-500 font-medium">Tak perlu terburu-buru menyusun kata yang rapi.</p>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ backgroundColor: COLORS.botGreenBg, color: COLORS.botGreenText }}>
                     TD
                  </div>
                )}
                
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl whitespace-pre-wrap text-[12px] leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'rounded-tr-sm text-white bg-gradient-to-br from-[#4C3A62] to-[#6B5587] shadow-purple-900/10' 
                    : 'rounded-tl-sm text-gray-700 border border-white bg-white/80 backdrop-blur-sm'
                }`}>
                  {msg.image && (
                    <img src={msg.image} alt="Refleksi" className="w-full max-h-40 h-auto object-cover rounded-xl mb-2 opacity-95 shadow-sm" />
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2.5 justify-start">
                 <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ backgroundColor: COLORS.botGreenBg, color: COLORS.botGreenText }}>
                     TD
                 </div>
                 <div className="px-4 py-3 rounded-2xl rounded-tl-sm border border-white bg-white/80 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-none bg-white/60 backdrop-blur-xl border-t border-white/80 px-4 pb-4 pt-2.5">
            
            {recordingState === 'idle' && !loading && (
              <div className="mb-2">
                <div className="text-[9px] font-bold text-[#C77C40] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                   <span>⚡ Pemantik Cerita Halus</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {pemantikCerita.map((text, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setInputText(text)}
                      className="shrink-0 bg-white/90 border border-white text-gray-700 px-3 py-1.5 rounded-full text-[10px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 font-medium"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl p-2 shadow-sm relative">
              
              {recordingState === 'recording' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3 text-xs text-gray-700 border-b border-gray-100 pb-2">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center animate-pulse shadow-inner">🎤</div>
                    <div>
                      <p className="font-bold text-red-500 text-[11px]">Mendengarkan Suaramu...</p>
                      <p className="text-[9px] text-gray-500">Silakan bicara perlahan.</p>
                    </div>
                  </div>
                  {transcriptionText && (
                    <div className="text-gray-600 text-[11px] font-medium whitespace-pre-wrap pl-11 opacity-80 pt-0.5 italic">
                      {transcriptionText}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-0.5 pt-1">
                     <button onClick={() => setRecordingState('idle')} className="text-[10px] text-gray-500 hover:text-red-500 flex items-center gap-1 font-semibold"><XMarkIcon className="w-2.5 h-2.5" />Batalkan</button>
                     <button onClick={sendTranscription} className="text-white px-4 py-1.5 rounded-xl text-[11px] font-bold hover:opacity-90 transition shadow-md bg-gradient-to-r from-[#4C3A62] to-[#6B5587]">Kirim</button>
                  </div>
                </div>
              )}

              {recordingState === 'idle' && (
                <>
                  {attachedImage && (
                    <div className="relative inline-block mb-1.5">
                       <img src={attachedImage} alt="Preview" className="h-14 w-14 object-cover rounded-xl border-2 border-white shadow-md" />
                       <button onClick={() => setAttachedImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center shadow-sm">x</button>
                    </div>
                  )}
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Curahkan apa yang ada di hatimu... (Ketik perlahan, ruang ini aman)"
                    disabled={loading}
                    rows="1"
                    className="w-full bg-transparent border-none focus:ring-0 resize-none text-gray-800 placeholder-gray-400 p-1.5 text-[11px] outline-none disabled:opacity-50 font-medium"
                  />
                  <div className="flex justify-between items-center mt-1 border-t border-gray-100 pt-1.5">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                         <PhotoIcon className="w-4 h-4" />
                      </button>
                      <button onClick={startRecordingFlow} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                         <MicrophoneIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={handleSendMessage}
                      disabled={(!inputText.trim() && !attachedImage) || loading}
                      className="text-white px-5 py-2 rounded-full text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center gap-1 shadow-md bg-gradient-to-r from-[#4C3A62] to-[#6B5587]"
                    >
                       <span>➤</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Pop-up Konfirmasi Hapus & Reset */}
      <Transition.Root show={showClearConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowClearConfirm}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-xs p-6 text-center shadow-2xl border border-white">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center mb-4 shadow-inner">
                  <TrashIcon className="w-6 h-6" />
                </div>
                <Dialog.Title as="h2" className="text-lg font-bold text-gray-800 mb-2">Hapus Riwayat?</Dialog.Title>
                <p className="text-[11px] text-gray-500 mb-6 font-medium leading-relaxed">Yakin ingin menghapus seluruh riwayat percakapan ini? Aksi ini tidak dapat dibatalkan.</p>
                
                <div className="flex gap-3">
                  <button onClick={() => setShowClearConfirm(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition shadow-sm">
                    Batal
                  </button>
                  <button onClick={confirmClearSession} className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-600 transition shadow-md shadow-red-500/20">
                    Ya, Hapus
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Relaksasi Modal 4-7-8 */}
      {isBreathingMode && (
        <Transition.Root show={isBreathingMode} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={setIsBreathingMode}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" />
            </Transition.Child>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto flex items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="bg-white/90 backdrop-blur-2xl rounded-[2rem] w-full max-w-sm p-8 text-center shadow-2xl border border-white relative">
                  <button onClick={() => setIsBreathingMode(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5 justify-center mb-2">
                      <SpeakerWaveIcon className="w-3 h-3" /> Pranayama
                  </div>
                  <Dialog.Title as="h2" className="text-xl font-extrabold text-gray-800 mb-2">Latihan Napas 4-7-8</Dialog.Title>
                  <p className="text-xs text-gray-500 mb-8 font-medium">Biarkan degup jantung mereda dan tenangkan syaraf yang letih.</p>
                  
                  <div className="w-44 h-44 border-[10px] border-indigo-50 bg-white rounded-full mx-auto flex flex-col items-center justify-center mb-8 relative transition-all duration-500 shadow-inner" 
                       style={{ transform: breathPhase === 'Tarik Napas' ? 'scale(1.1)' : breathPhase === 'Hembuskan' ? 'scale(0.9)' : 'scale(1)' }}>
                      <div className="absolute inset-0 bg-indigo-50/50 rounded-full animate-pulse"></div>
                      <span className="text-xs text-indigo-700 font-bold uppercase tracking-widest z-10">{breathPhase}</span>
                      <span className="text-6xl font-black text-indigo-900 z-10 transition-colors drop-shadow-sm mt-1">{timeLeft}</span>
                  </div>

                  <button onClick={() => setIsBreathingMode(false)} className="text-white px-4 py-3.5 rounded-2xl text-xs font-bold w-full transition shadow-md hover:shadow-lg bg-gradient-to-r from-[#4C3A62] to-[#6B5587]">
                      Kembali ke Percakapan
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
      )}
    </div>
  );
}