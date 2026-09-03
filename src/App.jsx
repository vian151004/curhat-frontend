import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Trash2, Bot, User } from 'lucide-react';

// const API_URL = 'http://127.0.0.1:8000/api/chat';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/chat';

export default function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('curhat_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: 'Halo! Aku SudutTenang. Ada hal yang lagi bikin kepikiran atau mengganjal di hati hari ini? Cerita aja ya...' }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('curhat_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const historyContext = newMessages.slice(-6).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        text: msg.text
      }));

      const res = await axios.post(API_URL, {
        message: userText,
        history: historyContext.slice(0, -1)
      });

      if (res.data && res.data.reply) {
        setMessages(prev => [...prev, { role: 'model', text: res.data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Maaf, server lagi ada kendala. Pastikan backend Laravel kamu sudah jalan ya.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('Yakin ingin menghapus semua riwayat curhatan?')) {
      const initial = [{ role: 'model', text: 'Halo! Riwayat obrolan sudah dibersihkan. Mau mulai cerita apa hari ini?' }];
      setMessages(initial);
      localStorage.setItem('curhat_chat_history', JSON.stringify(initial));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
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
                <p className="whitespace-pre-wrap">{msg.text}</p>
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
              <span>TemanDengar sedang mengetik...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tumpahkan apa yang lagi kamu rasakan di sini..."
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}