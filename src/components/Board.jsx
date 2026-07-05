import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Trophy, Play, Award, CheckSquare, X } from 'lucide-react';
import Confetti from './Confetti';

export default function Board({ 
  gameIndex, 
  ticketPrice, 
  activePlayers, 
  tickets, 
  prizes, 
  onClaimPrize, 
  onEndGame 
}) {
  const [calledNumbers, setCalledNumbers] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [mute, setMute] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [claimingPrize, setClaimingPrize] = useState(null);
  const [selectedWinners, setSelectedWinners] = useState([]);
  
  // Interactive tooltips state
  const [activeTooltip, setActiveTooltip] = useState(null);

  const announceNumber = (num) => {
    if (mute) return;
    try {
      window.speechSynthesis.cancel();
      const digits = String(num).split('');
      const digitWords = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
      };
      const words = digits.map(d => digitWords[d]).join(' ');
      const spoken = num < 10 ? `single digit ${num}` : `${words} ${num}`;

      const utterance = new SpeechSynthesisUtterance(spoken);
      const voices = window.speechSynthesis.getVoices();
      const voice = getIndianFemaleVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS failed:", e);
    }
  };

  const announceClaim = (prizeName, winners) => {
    if (mute) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${prizeName} claimed by ${winners}`);
      const voices = window.speechSynthesis.getVoices();
      const voice = getIndianFemaleVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const drawNumber = () => {
    if (calledNumbers.size >= 90) {
      alert("All 90 numbers have been called!");
      return;
    }
    
    let num;
    do {
      num = Math.floor(Math.random() * 90) + 1;
    } while (calledNumbers.has(num));

    const updated = new Set(calledNumbers);
    updated.add(num);
    
    setCalledNumbers(updated);
    setHistory([...history, num]);
    setCurrentNumber(num);
    
    announceNumber(num);
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
      {/* Top HUD Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex justify-between items-center text-zinc-100 shadow-xl">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black text-zinc-500 tracking-wider uppercase">Active Game</span>
          <h2 className="text-xl font-black text-zinc-100">Round #{gameIndex}</h2>
        </div>
        <div className="text-right space-y-0.5">
          <span className="text-[10px] font-black text-zinc-500 tracking-wider uppercase">Prize Pool</span>
          <h2 className="text-xl font-black text-zinc-50">₹{totalPool}</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setMute(!mute)} 
            className={`p-2.5 rounded-xl border transition duration-150 active:scale-95 ${mute ? 'bg-rose-950/20 border-rose-900 text-rose-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            {mute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Board Grid (1-90) */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-3xl p-5 shadow-2xl">
        <div className="grid grid-cols-10 gap-2 justify-center">
          {Array.from({ length: 90 }).map((_, idx) => {
            const num = idx + 1;
            const isCalled = calledNumbers.has(num);
            const numInfo = winningNumbersMap[num];

            let cellClass = "bg-zinc-900/10 text-zinc-650 border border-zinc-900 hover:border-zinc-800 transition-all duration-150 cursor-pointer";
            if (numInfo) {
              cellClass = "bg-gradient-to-tr from-fuchsia-600 to-pink-650 text-white font-black scale-105 shadow-[0_0_15px_rgba(217,70,239,0.4)] border border-fuchsia-400 animate-pulse";
            } else if (isCalled) {
              cellClass = "bg-zinc-100 text-zinc-950 font-black scale-[1.02] border border-zinc-300 shadow-[0_0_15px_rgba(255,255,255,0.15)]";
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
                  className={`aspect-square flex items-center justify-center text-sm md:text-base font-bold rounded-lg transition duration-150 ${cellClass}`}
                >
                  {num}
                </div>

                {/* Popover Tooltip for claims information */}
                {activeTooltip === num && numInfo && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3.5 w-40 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-[10px] text-zinc-300 font-bold shadow-2xl z-50 text-center animate-in fade-in zoom-in-95 duration-100">
                    <p className="text-zinc-50 font-black text-xs mb-1 border-b border-zinc-800 pb-1.5 uppercase tracking-wider">{numInfo.name}</p>
                    <p className="mt-1 text-zinc-500 uppercase tracking-widest text-[8px]">Claimed by</p>
                    <p className="text-zinc-100 font-black truncate text-xxs mt-0.5">{numInfo.winners.join(', ')}</p>
                    <p className="mt-1 text-zinc-400 font-extrabold text-[9px]">Winnings: ₹{numInfo.value}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controller Drawer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Draw Next Panel */}
        <div className="flex gap-5 items-center bg-zinc-950 border border-zinc-850 rounded-2xl p-5">
          <div className="flex-1">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Draws History</span>
            <div className="flex gap-2 mt-1.5 overflow-x-auto py-0.5 max-w-[200px]">
              {history.length === 0 ? (
                <span className="text-xxs text-zinc-600 italic font-medium">No calls yet</span>
              ) : (
                history.slice(-4).reverse().map((num, i) => (
                  <span 
                    key={i} 
                    className={`text-xs px-3 py-1 rounded-md font-bold ${
                      i === 0 ? 'bg-zinc-100 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {num}
                  </span>
                ))
              )}
            </div>
            <div className="text-xxs text-zinc-500 mt-2 font-bold uppercase tracking-widest">
              Total Called: <span className="font-black text-zinc-350">{calledNumbers.size}/90</span>
            </div>
          </div>

          <div className="w-18 h-18 bg-zinc-900 rounded-2xl border border-zinc-850 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Last</span>
            <span className="text-3xl font-black text-zinc-100 mt-1">
              {currentNumber || '—'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={drawNumber}
            className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-150 active:scale-95 shadow-md text-sm uppercase tracking-wider"
          >
            <Play className="w-5 h-5 fill-current text-zinc-950" />
            Draw Number
          </button>
          
          <button
            onClick={onEndGame}
            className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold py-4 px-4 rounded-xl transition duration-150 active:scale-95 text-xs uppercase tracking-wider"
          >
            End Game
          </button>
        </div>
      </div>

      {/* Prize Board */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase flex items-center gap-2">
          <Trophy className="w-4 h-4 text-zinc-500" />
          Prize Distribution Setup
        </h3>
        <div className="space-y-2.5">
          {prizes.map((p) => {
            const hasWinners = p.winners && p.winners.length > 0;
            return (
              <button
                key={p.id}
                onClick={() => openClaimModal(p)}
                className={`w-full text-left p-4 rounded-2xl border transition duration-150 flex items-center justify-between group ${
                  hasWinners 
                    ? 'bg-emerald-950/15 border-emerald-900/60 hover:border-emerald-700/80' 
                    : 'bg-amber-950/10 border-amber-900/60 hover:border-amber-700/80'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm md:text-base font-extrabold ${hasWinners ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {p.name}
                    </span>
                    <span className={`text-[10px] font-black border px-2 py-0.5 rounded ${
                      hasWinners 
                        ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' 
                        : 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                    }`}>
                      ₹{p.value}
                    </span>
                  </div>
                  {hasWinners ? (
                    <span className="text-xxs text-emerald-500/80 font-bold block">
                      Claimed: {p.winners.join(', ')} (on #{p.winningNumber})
                    </span>
                  ) : (
                    <span className="text-xxs text-amber-550 font-semibold block">Tap to configure winners</span>
                  )}
                </div>
                <div className={`p-2 rounded-lg border transition ${
                  hasWinners 
                    ? 'bg-emerald-950 border-emerald-900 text-emerald-400' 
                    : 'bg-amber-950/40 border-amber-900/60 text-amber-400'
                }`}>
                  <Award className="w-4.5 h-4.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Confetti active={celebrate} />

      {/* Smart Bottom-Sheet Claim Modal */}
      {claimingPrize && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-40 flex items-end justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Award Prize</span>
                <h3 className="text-base font-black text-zinc-100">{claimingPrize.name}</h3>
              </div>
              <button 
                onClick={() => setClaimingPrize(null)} 
                className="p-2 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 rounded-lg text-zinc-400 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-xxs text-zinc-500 mb-2 font-medium">
                Select winning players. Uncheck all to clear.
              </p>
              
              <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                {activePlayers.map((player) => {
                  const isChecked = selectedWinners.includes(player);
                  return (
                    <button
                      key={player}
                      onClick={() => toggleWinnerSelection(player)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition ${
                        isChecked 
                          ? 'bg-zinc-900 border-zinc-400 text-zinc-50' 
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                      }`}
                    >
                      <span>{player}</span>
                      <CheckSquare className={`w-4 h-4 transition ${isChecked ? 'text-zinc-50 opacity-100' : 'opacity-10'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={submitClaim}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-black py-4 rounded-xl shadow-md transition duration-150 active:scale-95 text-sm uppercase tracking-wider"
            >
              Confirm Winner Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
