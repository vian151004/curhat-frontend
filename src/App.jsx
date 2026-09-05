import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Trash2, Bot, User, Paperclip, X, FileText } from 'lucide-react';
import VoiceInput from './components/VoiceInput';
import MusicPlayer from './components/MusicPlayer';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/chat';

export default function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('curhat_chat_history');
    return saved ? JSON.parse(saved) : [
      { 
        role: 'model', 
        text: 'Halo! Aku SudutTenang. Ada hal yang lagi bikin kepikiran atau mengganjal di hati hari ini? Cerita aja ya...' 
      }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('curhat_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB ya.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      const pureBase64 = base64String.split(',')[1];
      const isImage = file.type.startsWith('image/');

      setAttachedFile({
        name: file.name,
        mime_type: file.type || 'application/octet-stream',
        data: pureBase64,
        previewUrl: isImage ? base64String : null,
        isImage
      });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || loading) return;

    const userText = input.trim();
    const currentFile = attachedFile;

    const userMessageObj = {
      role: 'user',
      text: userText,
      filePreview: currentFile ? {
        name: currentFile.name,
        previewUrl: currentFile.previewUrl,
        isImage: currentFile.isImage
      } : null
    };

    const newMessages = [...messages, userMessageObj];
    setMessages(newMessages);

    setInput('');
    setAttachedFile(null);
    setLoading(true);

    try {
      const historyContext = messages.slice(-6).map((msg) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        text: msg.text,
      }));

      const payload = {
        message: userText || null,
        history: historyContext,
      };

      if (currentFile) {
        payload.file = {
          mime_type: currentFile.mime_type,
          data: currentFile.data
        };
      }

      const res = await axios.post(API_URL, payload, {
        headers: {
          'bypass-tunnel-reminder': 'true',
        },
      });

      if (res.data && res.data.reply) {
        setMessages((prev) => [...prev, { role: 'model', text: res.data.reply }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Maaf, server lagi ada kendala. Pastikan backend Laravel kamu sudah jalan ya.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('Yakin ingin menghapus semua riwayat curhatan?')) {
      const initial = [
        { role: 'model', text: 'Halo! Riwayat obrolan sudah dibersihkan. Mau mulai cerita apa hari ini?' },
      ];
      setMessages(initial);
      localStorage.setItem('curhat_chat_history', JSON.stringify(initial));
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-slate-100 font-sans">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">SudutTenang</h1>
            <p className="text-xs text-emerald-600 font-medium">● Siap mendengarkanmu</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          title="Hapus Obrolan"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={18} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                {msg.filePreview && (
                  <div className="mb-2">
                    {msg.filePreview.isImage ? (
                      <img
                        src={msg.filePreview.previewUrl}
                        alt="Lampiran Curhat"
                        className="max-h-48 rounded-lg object-cover border border-indigo-400/30"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-indigo-700/50 rounded-lg text-xs">
                        <FileText size={16} />
                        <span className="truncate max-w-[180px]">{msg.filePreview.name}</span>
                      </div>
                    )}
                  </div>
                )}
                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic">
              <Bot size={16} />
              <span>TemanDengar sedang membaca & memahami...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto space-y-2">
          {attachedFile && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl w-fit">
              {attachedFile.isImage ? (
                <img
                  src={attachedFile.previewUrl}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-slate-200 text-slate-600 flex items-center justify-center rounded-lg">
                  <FileText size={20} />
                </div>
              )}
              <div className="text-xs pr-2">
                <p className="font-medium text-slate-700 truncate max-w-[160px]">{attachedFile.name}</p>
                <p className="text-slate-400">Siap dikirim</p>
              </div>
              <button
                type="button"
                onClick={removeAttachedFile}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-200 transition"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf,text/plain"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Lampirkan foto atau dokumen"
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-slate-200 transition flex items-center justify-center"
            >
              <Paperclip size={18} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tumpahkan perasaanmu atau kirim gambar..."
              className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
            />

            <VoiceInput
              onTranscript={(newPiece) => {
                setInput((prev) => (prev.trim() ? `${prev.trim()} ${newPiece}` : newPiece));
              }}
              disabled={loading}
              stopTrigger={loading}
            />

            <button
              type="submit"
              disabled={loading || (!input.trim() && !attachedFile)}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </footer>

      {/* Floating Spotify Music Widget */}
      <MusicPlayer />
    </div>
  );
}