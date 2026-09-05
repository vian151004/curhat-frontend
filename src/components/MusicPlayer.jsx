import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Shuffle, Link2, ChevronDown, ChevronUp, Wind, Music2 } from 'lucide-react';

const MOOD_PLAYLIST = [
  {
    id: 'lTRiuFIWV54',
    title: 'Butuh Nangis / Overthinking',
    desc: 'Hujan rintik & piano sendu pereda beban',
    category: '🌧️ Sendu',
  },
  {
    id: 'ZRtHBRQpG4A',
    title: 'Lagi Panik / Sesak',
    desc: 'Frekuensi mangkuk Tibet penstabil denyut',
    category: '🌿 Cemas',
  },
  {
    id: 'CHFif_y2TyM',
    title: 'Pengen Ditemani Santai',
    desc: 'Warm lo-fi beats bernuansa hangat',
    category: '☕ Hangat',
  },
  {
    id: 'V-_O7nl0Ii0',
    title: 'Insomnia / Susah Tidur',
    desc: 'White noise ritme deburan ombak malam',
    category: '🌌 Tidur',
  },
  {
    id: 'Nep1qytq9JM',
    title: 'Api Unggun Tenang',
    desc: 'Kresek kayu & keheningan malam yang aman',
    category: '🔥 Aman',
  },
];

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('music'); // 'music' | 'breath'
  const [playlist, setPlaylist] = useState(MOOD_PLAYLIST);
  const [currentTrack, setCurrentTrack] = useState(MOOD_PLAYLIST[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customInput, setCustomInput] = useState('');
  
  // State Latihan Napas 4-7-8
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState('tarik'); // 'tarik' | 'tahan' | 'hembuskan'
  const [breathCount, setBreathCount] = useState(4);

  const dropdownRef = useRef(null);

  // Tutup panel jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logika Sirkulasi Siklus Napas 4-7-8
  useEffect(() => {
    let timer;
    if (isBreathing) {
      timer = setInterval(() => {
        setBreathCount((prev) => {
          if (prev > 1) return prev - 1;

          // Transisi fase napas
          if (breathPhase === 'tarik') {
            setBreathPhase('tahan');
            return 7;
          } else if (breathPhase === 'tahan') {
            setBreathPhase('hembuskan');
            return 8;
          } else {
            setBreathPhase('tarik');
            return 4;
          }
        });
      }, 1000);
    } else {
      setBreathPhase('tarik');
      setBreathCount(4);
    }
    return () => clearInterval(timer);
  }, [isBreathing, breathPhase]);

  const handleSelectTrack = (track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleRandomize = () => {
    const pool = playlist.filter((t) => t.id !== currentTrack?.id);
    const random = pool[Math.floor(Math.random() * (pool.length || playlist.length))] || playlist[0];
    setCurrentTrack(random);
    setIsPlaying(true);
  };

  const handleCustomTrackSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    let videoId = customInput.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = videoId.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }

    const newTrack = {
      id: videoId,
      title: 'Lagu Pilihanmu',
      desc: 'Tautan YouTube kustom',
      category: '✨ Kustom',
    };

    setPlaylist((prev) => [newTrack, ...prev.filter((t) => t.id !== videoId)]);
    setCurrentTrack(newTrack);
    setIsPlaying(true);
    setCustomInput('');
  };

  return (
    <div ref={dropdownRef} className="fixed top-20 left-4 z-40 flex flex-col items-start font-sans">
      {/* 1. Kapsul Mini di Kiri Atas */}
      <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 p-1.5 pr-3 shadow-lg backdrop-blur-md transition hover:border-slate-600">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow transition ${
            isPlaying ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title={isPlaying ? 'Jeda' : 'Putar'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left focus:outline-none"
        >
          <div className="max-w-[130px] sm:max-w-[160px]">
            <p className="truncate text-xs font-semibold text-slate-200">
              {currentTrack.title}
            </p>
            <p className="text-[10px] text-slate-400">
              {isPlaying ? 'Sedang mengalun...' : 'Atur relaksasi'}
            </p>
          </div>
          {isOpen ? (
            <ChevronUp size={14} className="text-slate-400" />
          ) : (
            <ChevronDown size={14} className="text-slate-400" />
          )}
        </button>
      </div>

      {/* 2. Popover Box (Kiri Bawah Kapsul) */}
      {isOpen && (
        <div className="mt-2 w-72 sm:w-80 rounded-2xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
          {/* Navigasi Tab: Musik vs Latihan Napas */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('music')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-lg transition ${
                activeTab === 'music'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music2 size={13} />
              Suasana Musik
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('breath')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-lg transition ${
                activeTab === 'breath'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind size={13} />
              Tarik Napas
            </button>
          </div>

          {/* TAB 1: DAFTAR MUSIK & INPUT LINK */}
          {activeTab === 'music' && (
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium">Pilih suasana hati:</span>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="p-1 text-slate-400 hover:text-indigo-400 transition"
                  title="Pilih acak"
                >
                  <Shuffle size={13} />
                </button>
              </div>

              {/* Input Link YouTube */}
              <form onSubmit={handleCustomTrackSubmit} className="mt-2.5 flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Tempel link YouTube..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 pl-6 text-[11px] text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <Link2 size={11} className="absolute left-2 top-2 text-slate-500" />
                </div>
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Putar
                </button>
              </form>

              {/* List Pilihan Mood */}
              <div className="mt-2.5 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {playlist.map((track) => {
                  const isCurrent = currentTrack.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`flex items-center justify-between rounded-lg p-2 cursor-pointer border transition ${
                        isCurrent && isPlaying
                          ? 'border-indigo-500/40 bg-indigo-950/50 text-indigo-200'
                          : 'border-transparent bg-slate-800/40 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs shrink-0">
                          {isCurrent && isPlaying ? (
                            <Pause size={13} className="text-indigo-400" />
                          ) : (
                            <Play size={13} className="text-slate-400 ml-0.5" />
                          )}
                        </span>
                        <div className="overflow-hidden">
                          <p className="truncate text-xs font-medium">{track.title}</p>
                          <p className="truncate text-[10px] text-slate-500">{track.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1.5">
                        {track.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN NAPAS 4-7-8 */}
          {activeTab === 'breath' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="relative flex items-center justify-center h-36 w-36">
                {/* Animasi Lingkaran Dinamis */}
                <div
                  className={`absolute rounded-full border-2 border-indigo-400/40 bg-indigo-500/10 transition-all ${
                    isBreathing
                      ? breathPhase === 'tarik'
                        ? 'h-32 w-32 duration-[4000ms] scale-100 bg-indigo-500/30'
                        : breathPhase === 'tahan'
                        ? 'h-32 w-32 duration-[7000ms] scale-105 bg-indigo-500/40 animate-pulse'
                        : 'h-16 w-16 duration-[8000ms] scale-75 bg-indigo-500/10'
                      : 'h-20 w-20'
                  }`}
                />

                {/* Counter & Status */}
                <div className="relative z-10 text-center select-none">
                  <p className="text-lg font-bold text-white font-mono">
                    {isBreathing ? breathCount : '4-7-8'}
                  </p>
                  <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                    {isBreathing
                      ? breathPhase === 'tarik'
                        ? 'Tarik Napas'
                        : breathPhase === 'tahan'
                        ? 'Tahan'
                        : 'Hembuskan'
                      : 'Rileks'}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-400 px-4">
                Tarik lewat hidung (4dtk), tahan perlahan (7dtk), lalu hembuskan pelan (8dtk).
              </p>

              <button
                type="button"
                onClick={() => setIsBreathing(!isBreathing)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  isBreathing
                    ? 'bg-rose-600/80 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                }`}
              >
                {isBreathing ? 'Hentikan Panduan' : 'Mulai Atur Napas'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mesin Audio YouTube Background */}
      {currentTrack && isPlaying && (
        <div className="hidden pointer-events-none">
          <iframe
            width="0"
            height="0"
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.id}?autoplay=1&loop=1&playlist=${currentTrack.id}`}
            title="Audio Background"
            allow="autoplay"
          />
        </div>
      )}
    </div>
  );
}