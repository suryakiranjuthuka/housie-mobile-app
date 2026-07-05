import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Trophy, Play, Award, CheckSquare, X, Mic } from 'lucide-react';
import Confetti from './Confetti';

export default function Board({ 
  gameIndex, 
  ticketPrice, 
  activePlayers, 
  tickets, 
  prizes, 
  calledNumbers,
  setCalledNumbers,
  history,
  setHistory,
  currentNumber,
  setCurrentNumber,
  onClaimPrize, 
  onEndGame 
}) {
  const [mute, setMute] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [claimingPrize, setClaimingPrize] = useState(null);
  const [selectedWinners, setSelectedWinners] = useState([]);
  
  // Interactive tooltips state
  const [activeTooltip, setActiveTooltip] = useState(null);

  const sanitizeForSpeech = (text) => {
    return text
      .replace(/\bSurya\b/gi, "Soorya")
      .replace(/\bAtta\b/gi, "Att-ta")
      .replace(/\bKasi\b/gi, "Kaasee")
      .replace(/\bTanuja\b/gi, "Than-oo-ja");
  };

  const getIndianFemaleVoice = (voices) => {
    let ideal = voices.find(v => 
      v.lang.replace('_', '-').toLowerCase().startsWith('en-in') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('raveena') || 
       v.name.toLowerCase().includes('isha') || 
       v.name.toLowerCase().includes('veena') || 
       v.name.toLowerCase().includes('kanya') || 
       v.name.toLowerCase().includes('tara') || 
       v.name.toLowerCase().includes('heera') || 
       v.name.toLowerCase().includes('priya') || 
       v.name.toLowerCase().includes('neerja') || 
       !v.name.toLowerCase().includes('male'))
    );
    if (!ideal) ideal = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('en-in'));
    if (!ideal) ideal = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('hi-in'));
    if (!ideal) ideal = voices.find(v => v.name.toLowerCase().includes('female') && v.lang.toLowerCase().startsWith('en'));
    return ideal;
  };

  const announceNumber = useCallback((num) => {
    if (mute) return;
    try {
      window.speechSynthesis.cancel();
      const digits = String(num).split('');
      const digitWords = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
      };
      const words = digits.map(d => digitWords[d]).join(' ');
      const spoken = num < 10 ? `single digit, ${num}` : `${words}, ${num}`;

      const utterance = new SpeechSynthesisUtterance(spoken);
      const voices = window.speechSynthesis.getVoices();
      const voice = getIndianFemaleVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9; // Slightly slower for better articulation
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS failed:", e);
    }
  }, [mute]);

  const drawNumber = useCallback(() => {
    if (calledNumbers.size >= 90) {
      alert("All 90 numbers have been called!");
      return;
    }
    
    let num;
    do {
      num = Math.floor(Math.random() * 90) + 1;
    } while (calledNumbers.has(num));

    setCalledNumbers(prev => {
      const updated = new Set(prev);
      updated.add(num);
      return updated;
    });
    
    setHistory(prev => [...prev, num]);
    setCurrentNumber(num);
    
    announceNumber(num);
  }, [calledNumbers, announceNumber, setCalledNumbers, setHistory, setCurrentNumber]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Keyboard support for spacebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !claimingPrize) {
        e.preventDefault();
        drawNumber();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawNumber, claimingPrize]);

  const announceClaim = (prizeName, winners) => {
    if (mute) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${prizeName} claimed by ${sanitizeForSpeech(winners)}`);
      const voices = window.speechSynthesis.getVoices();
      const voice = getIndianFemaleVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  const announceRemainingPrizes = () => {
    if (mute) return;
    const unclaimed = prizes
      .filter(p => !p.winners || p.winners.length === 0)
      .map(p => p.name);
    
    let text = "";
    if (unclaimed.length === 0) {
      text = "All prizes have been claimed!";
    } else {
      text = `Remaining prizes to claim are: ${unclaimed.join(', ')}`;
    }
    
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = getIndianFemaleVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Announcement failed:", e);
    }
  };

  const winningNumbersMap = {};
  prizes.forEach(prize => {
    if (prize.winningNumber !== null && prize.winners && prize.winners.length > 0) {
      winningNumbersMap[prize.winningNumber] = {
        name: prize.name,
        winners: prize.winners,
        value: prize.value
      };
    }
  });

  const openClaimModal = (prize) => {
    setClaimingPrize(prize);
    setSelectedWinners(prize.winners || []);
  };

  const toggleWinnerSelection = (player) => {
    if (selectedWinners.includes(player)) {
      setSelectedWinners(selectedWinners.filter(w => w !== player));
    } else {
      setSelectedWinners([...selectedWinners, player]);
    }
  };

  const submitClaim = () => {
    if (!claimingPrize) return;
    onClaimPrize(claimingPrize.id, selectedWinners, selectedWinners.length > 0 ? currentNumber : null);
    if (selectedWinners.length > 0) {
      announceClaim(claimingPrize.name, selectedWinners.join(' and '));
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 4500);
    }
    setClaimingPrize(null);
  };

  const totalPool = Object.values(tickets).reduce((sum, curr) => sum + (curr * ticketPrice), 0);

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      {/* Top HUD Card - Aurora Glass */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-5 flex justify-between items-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-30px] left-[-30px] w-20 h-20 bg-cyan-500/20 blur-[40px] rounded-full pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-black text-cyan-500 tracking-[0.2em] uppercase drop-shadow-md">Active Game</span>
          <h2 className="text-2xl font-black text-white tracking-wide">Round #{gameIndex}</h2>
        </div>
        <div className="text-right space-y-1 relative z-10">
          <span className="text-[10px] font-black text-yellow-500 tracking-[0.2em] uppercase drop-shadow-md">Prize Pool</span>
          <h2 className="text-2xl font-black text-white tracking-wide">₹{totalPool}</h2>
        </div>
        <div className="flex gap-2 relative z-10">
          <button 
            onClick={announceRemainingPrizes}
            className="p-3 rounded-2xl border transition-all duration-200 active:scale-95 shadow-inner bg-black/40 border-white/5 text-cyan-400 hover:bg-black/60 hover:text-cyan-300 animate-pulse"
            title="Read remaining prizes"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setMute(!mute)} 
            className={`p-3 rounded-2xl border transition-all duration-200 active:scale-95 shadow-inner ${mute ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-black/40 border-white/5 text-slate-300 hover:bg-black/60 hover:text-white'}`}
          >
            {mute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Board Grid (1-90) - Glass Bento Grid */}
      <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-5 shadow-2xl">
        <div className="grid grid-cols-10 gap-2 justify-center">
          {Array.from({ length: 90 }).map((_, idx) => {
            const num = idx + 1;
            const isCalled = calledNumbers.has(num);
            const numInfo = winningNumbersMap[num];

            let cellClass = "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer shadow-inner";
            if (numInfo) {
              cellClass = "bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white font-black scale-110 shadow-[0_0_20px_rgba(217,70,239,0.5)] border border-fuchsia-300 animate-pulse z-10";
            } else if (isCalled) {
              cellClass = "bg-cyan-500 text-white font-black scale-[1.05] border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] z-10";
            }

            return (
              <div
                key={num}
                onClick={() => numInfo && setActiveTooltip(activeTooltip === num ? null : num)}
                onMouseEnter={() => numInfo && setActiveTooltip(num)}
                onMouseLeave={() => setActiveTooltip(null)}
                className="relative"
              >
                <div
                  className={`aspect-square flex items-center justify-center text-[11px] sm:text-xs md:text-sm font-bold rounded-[0.7rem] transition-all duration-200 ${cellClass}`}
                >
                  {num}
                </div>

                {/* Popover Tooltip for claims information */}
                {activeTooltip === num && numInfo && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3.5 w-44 bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 text-center animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-white font-black text-xs mb-2 border-b border-white/10 pb-2 uppercase tracking-widest">{numInfo.name}</p>
                    <p className="text-cyan-400 uppercase tracking-[0.2em] text-[8px] font-black">Claimed by</p>
                    <p className="text-slate-100 font-extrabold truncate text-xs mt-0.5">{numInfo.winners.join(', ')}</p>
                    <p className="mt-2 text-emerald-400 font-black text-[10px] bg-black/40 py-1 rounded-lg">Winnings: ₹{numInfo.value}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controller Drawer - Bento Box Design */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
        {/* Draw Next Panel */}
        <div className="flex gap-4 items-center bg-black/40 border border-white/5 rounded-[2rem] p-5 shadow-inner">
          <div className="flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Draws History</span>
            <div className="flex gap-2 mt-2 overflow-x-auto py-1 max-w-[200px]">
              {history.length === 0 ? (
                <span className="text-xs text-slate-600 italic font-medium">No calls yet</span>
              ) : (
                history.slice(-4).reverse().map((num, i) => (
                  <span 
                    key={i} 
                    className={`text-sm px-3 py-1.5 rounded-xl font-bold transition-all ${
                      i === 0 ? 'bg-cyan-500 text-white font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/5 text-slate-400 border border-white/5'
                    }`}
                  >
                    {num}
                  </span>
                ))
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
              Total Called: <span className="font-black text-cyan-400 px-2 py-0.5 bg-black/50 rounded-md shadow-inner">{calledNumbers.size}/90</span>
            </div>
          </div>

          <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/20 flex flex-col items-center justify-center shadow-[inset_0_2px_20px_rgba(255,255,255,0.05)] relative overflow-hidden">
            <span className="text-[9px] font-black text-cyan-400/80 uppercase tracking-widest leading-none drop-shadow-md">Last</span>
            <span className="text-4xl font-black text-white mt-1 tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {currentNumber || '—'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={drawNumber}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black py-5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.4)] text-sm uppercase tracking-widest group"
          >
            <Play className="w-6 h-6 fill-current text-white group-hover:scale-110 transition-transform duration-200" />
            Draw Number
          </button>
          
          <button
            onClick={onEndGame}
            className="bg-black/40 border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 text-slate-400 font-bold py-5 px-6 rounded-2xl transition-all duration-200 active:scale-95 text-xs uppercase tracking-widest shadow-inner"
          >
            End Game
          </button>
        </div>
      </div>

      {/* Prize Board - Premium Translucent Cards */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5">
        <h3 className="text-xs font-black text-slate-300 tracking-[0.2em] uppercase flex items-center gap-2 border-b border-white/10 pb-4">
          <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
          Prize Distribution Setup
        </h3>
        <div className="space-y-3">
          {prizes.map((p) => {
            const hasWinners = p.winners && p.winners.length > 0;
            return (
              <button
                key={p.id}
                onClick={() => openClaimModal(p)}
                className={`w-full text-left p-5 rounded-[1.5rem] border transition-all duration-200 flex items-center justify-between group shadow-lg ${
                  hasWinners 
                    ? 'bg-emerald-500/10 border-emerald-400/50 hover:border-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'bg-black/40 border-white/5 hover:border-yellow-400/50 shadow-inner'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-extrabold tracking-wide ${hasWinners ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {p.name}
                    </span>
                    <span className={`text-[10px] font-black border px-2.5 py-1 rounded-lg tracking-widest ${
                      hasWinners 
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' 
                        : 'bg-white/5 border-white/10 text-yellow-400'
                    }`}>
                      ₹{p.value}
                    </span>
                  </div>
                  {hasWinners ? (
                    <span className="text-xs text-emerald-300/90 font-bold block bg-black/30 w-fit px-2 py-0.5 rounded-md mt-2">
                      Claimed: {p.winners.join(', ')} (on #{p.winningNumber})
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-semibold block mt-1">Tap to configure winners</span>
                  )}
                </div>
                <div className={`p-3 rounded-xl border transition-all duration-200 ${
                  hasWinners 
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                    : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-yellow-400'
                }`}>
                  <Award className="w-6 h-6" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Confetti active={celebrate} />

      {/* Smart Bottom-Sheet Claim Modal - Frosted Glass */}
      {claimingPrize && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 flex items-end justify-center p-4">
          <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] w-full max-w-md p-6 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] space-y-6 animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Award Prize</span>
                <h3 className="text-xl font-black text-white mt-1 tracking-wide">{claimingPrize.name}</h3>
              </div>
              <button 
                onClick={() => setClaimingPrize(null)} 
                className="p-3 bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 rounded-xl text-slate-400 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2 font-medium px-1">
                Select winning players. Uncheck all to clear.
              </p>
              
              <div className="bg-black/40 border border-white/10 rounded-3xl p-4 max-h-[60vh] overflow-y-auto space-y-2 shadow-inner">
                {activePlayers.map((player) => {
                  const isChecked = selectedWinners.includes(player);
                  return (
                    <button
                      key={player}
                      onClick={() => toggleWinnerSelection(player)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all duration-200 ${
                        isChecked 
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]' 
                          : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <span>{player}</span>
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all duration-200 ${
                        isChecked ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-black/50 border-white/10'
                      }`}>
                        <CheckSquare className={`w-4 h-4 transition-all duration-200 ${isChecked ? 'text-white opacity-100' : 'opacity-0'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={submitClaim}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-200 active:scale-95 text-sm uppercase tracking-widest mt-2"
            >
              Confirm Winner Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
