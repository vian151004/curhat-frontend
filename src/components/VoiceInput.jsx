// import React, { useState, useEffect, useRef } from 'react';
// import { Mic } from 'lucide-react';

// export default function VoiceInput({ onTranscript, disabled, stopTrigger }) {
//   const [isListening, setIsListening] = useState(false);
//   const recognitionRef = useRef(null);
//   const shouldListenRef = useRef(false);
//   const silenceTimerRef = useRef(null);

//   const stopListening = () => {
//     shouldListenRef.current = false;
//     if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//     if (recognitionRef.current) {
//       try {
//         recognitionRef.current.stop();
//       } catch (e) {}
//     }
//     setIsListening(false);
//   };

//   const resetSilenceTimer = () => {
//     if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//     silenceTimerRef.current = setTimeout(() => {
//       stopListening();
//     }, 5000);
//   };

//   useEffect(() => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

//     if (SpeechRecognition) {
//       const recognizer = new SpeechRecognition();
//       recognizer.continuous = true;
//       recognizer.interimResults = false; // KUNCI: Matikan teks mentah/prediksi sementara!
//       recognizer.lang = 'id-ID';

//       recognizer.onstart = () => {
//         setIsListening(true);
//         resetSilenceTimer();
//       };

//       recognizer.onresult = (event) => {
//         resetSilenceTimer();

//         // Ambil HANYA potongan kalimat final yang baru saja selesai diucapkan
//         const latestIndex = event.results.length - 1;
//         const newPiece = event.results[latestIndex][0].transcript.trim();

//         if (newPiece) {
//           onTranscript(newPiece);
//         }
//       };

//       recognizer.onerror = (event) => {
//         if (event.error === 'not-allowed') {
//           stopListening();
//         }
//       };

//       recognizer.onend = () => {
//         if (shouldListenRef.current) {
//           try {
//             recognizer.start();
//           } catch (e) {}
//         } else {
//           setIsListening(false);
//         }
//       };

//       recognitionRef.current = recognizer;
//     }

//     return () => {
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//     };
//   }, [onTranscript]);

//   useEffect(() => {
//     if (stopTrigger) {
//       stopListening();
//     }
//   }, [stopTrigger]);

//   const toggleListen = () => {
//     if (!recognitionRef.current) {
//       alert('Browser tidak mendukung Web Speech API. Gunakan Chrome.');
//       return;
//     }

//     if (isListening) {
//       stopListening();
//     } else {
//       shouldListenRef.current = true;
//       try {
//         recognitionRef.current.start();
//       } catch (e) {
//         recognitionRef.current.stop();
//         setTimeout(() => recognitionRef.current.start(), 100);
//       }
//     }
//   };

//   return (
//     <button
//       type="button"
//       onClick={toggleListen}
//       disabled={disabled}
//       title={isListening ? 'Mendengarkan... (mati jika 5 detik hening)' : 'Klik untuk bicara'}
//       className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
//         isListening
//           ? 'bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-300'
//           : 'bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-slate-200'
//       }`}
//     >
//       <Mic size={18} />
//     </button>
//   );
// }

import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

export default function VoiceInput({ onTranscript, disabled, stopTrigger }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef(null);

  const stopListening = () => {
    shouldListenRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  // Timer ini HANYA jalan setelah ada kalimat selesai diucapkan dan user mulai hening
  const startSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      stopListening();
    }, 5000);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = false;
      recognizer.lang = 'id-ID';

      recognizer.onstart = () => {
        setIsListening(true);
        // Jangan pasang timer mati di sini biar user bisa mikir sebelum ngomong awal
        startSilenceTimer();
      };

      // Dipicu saat browser mendeteksi user mulai bersuara
      recognizer.onspeechstart = () => {
        // Hapus timer mati saat user terdeteksi sedang bersuara!
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };

      // Dipicu saat user berhenti bersuara / jeda ngomong
      recognizer.onspeechend = () => {
        // Baru mulai hitung mundur 5 detik saat hening
        startSilenceTimer();
      };

      recognizer.onresult = (event) => {
        startSilenceTimer();

        const latestIndex = event.results.length - 1;
        const newPiece = event.results[latestIndex][0].transcript.trim();

        if (newPiece) {
          onTranscript(newPiece);
        }
      };

      recognizer.onerror = (event) => {
        // no-speech sering muncul di mobile saat jeda, jangan matikan mic
        if (event.error === 'not-allowed') {
          stopListening();
        }
      };

      recognizer.onend = () => {
        // Jika browser mobile disconnect paksa padahal belum timeout 5 detik hening:
        if (shouldListenRef.current) {
          try {
            recognizer.start();
          } catch (e) {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognizer;
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [onTranscript]);

  useEffect(() => {
    if (stopTrigger) {
      stopListening();
    }
  }, [stopTrigger]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Browser tidak mendukung Web Speech API. Gunakan Google Chrome.');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      shouldListenRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 100);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListen}
      disabled={disabled}
      title={isListening ? 'Mendengarkan... (mati otomatis jika hening 5 detik)' : 'Klik untuk bicara'}
      className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
        isListening
          ? 'bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-300'
          : 'bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-slate-200'
      }`}
    >
      <Mic size={18} />
    </button>
  );
}