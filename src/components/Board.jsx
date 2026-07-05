import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, RefreshCw, Trophy, AlertTriangle, ArrowRight, Play, Award, CheckSquare, X } from 'lucide-react';
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
  
  // Audio state
  const [mute, setMute] = useState(false);
  
  // Confetti triggering state
  const [celebrate, setCelebrate] = useState(false);

  // Smart claim overlay
  const [claimingPrize, setClaimingPrize] = useState(null); // holds the prize object being claimed
  const [selectedWinners, setSelectedWinners] = useState([]);

  // Setup standard voice announcements
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
      const spoken = num < 10 ? `only ${words} ${num}` : `${words} ${num}`;

      const utterance = new SpeechSynthesisUtterance(spoken);
      // Try to find an Indian English or natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const idealVoice = voices.find(v => v.lang.includes('IN') || v.name.includes('Tara') || v.name.includes('Raveena'));
      if (idealVoice) utterance.voice = idealVoice;
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
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  // Pre-load voices
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

  // Mapping of winning numbers to highlight them on the grid
  const winningNumbersMap = {};
  prizes.forEach(prize => {
    if (prize.winningNumber !== null && prize.winners && prize.winners.length > 0) {
      winningNumbersMap[prize.winningNumber] = prize.name;
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
    <div className="max-w-md mx-auto space-y-4 pb-12">
      {/* Top HUD Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex justify-between items-center text-slate-100 shadow-xl">
        <div>
          <span className="text-xxs font-extrabold text-violet-400 tracking-wider uppercase">Active Game</span>
          <h2 className="text-lg font-black text-slate-200">Round #{gameIndex}</h2>
        </div>
        <div className="text-right">
          <span className="text-xxs font-extrabold text-slate-400 tracking-wider uppercase">Prize Pool</span>
          <h2 className="text-lg font-black text-emerald-400">₹{totalPool}</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setMute(!mute)} 
            className={`p-2 rounded-xl border transition ${mute ? 'bg-rose-950/20 border-rose-900 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
          >
            {mute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Board Grid (1-90) */}
      <div className="bg-slate-950 border border-slate-850 rounded-3xl p-4 shadow-2xl">
        <div className="grid grid-cols-10 gap-1.5 justify-center">
          {Array.from({ length: 90 }).map((_, idx) => {
            const num = idx + 1;
            const isCalled = calledNumbers.has(num);
            const isWinnerTrigger = winningNumbersMap[num];

            let cellClass = "bg-slate-900/40 text-slate-500 hover:text-slate-400 border border-slate-900/60";
            if (isWinnerTrigger) {
              cellClass = "bg-fuchsia-600 text-white font-black scale-105 shadow-lg shadow-fuchsia-950/40 border border-fuchsia-400 animate-pulse";
            } else if (isCalled) {
              cellClass = "bg-emerald-600/90 text-white font-bold border border-emerald-500 shadow-md shadow-emerald-950/20";
            }

            return (
              <div
                key={num}
                className={`aspect-square flex items-center justify-center text-xs rounded-lg transition duration-200 ${cellClass}`}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controller Drawer */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        {/* Draw Next Panel */}
        <div className="flex gap-4 items-center bg-slate-950 border border-slate-850 rounded-2xl p-4">
          <div className="flex-1">
            <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Draws History</span>
            <div className="flex gap-1.5 mt-1 overflow-x-auto py-0.5 max-w-[180px]">
              {history.length === 0 ? (
                <span className="text-xxs text-slate-600 italic">No calls yet</span>
              ) : (
                history.slice(-4).reverse().map((num, i) => (
                  <span 
                    key={i} 
                    className={`text-xxs px-2 py-0.5 rounded-md font-bold ${
                      i === 0 ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {num}
                  </span>
                ))
              )}
            </div>
            <div className="text-xxs text-slate-500 mt-2 font-medium">
              Numbers Drawn: <span className="font-extrabold text-slate-300">{calledNumbers.size}/90</span>
            </div>
          </div>

          <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-850 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 to-transparent pointer-events-none" />
            <span className="text-xxs font-black text-slate-500 uppercase leading-none">Last</span>
            <span className="text-2xl font-black text-violet-300 mt-0.5">
              {currentNumber || '—'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={drawNumber}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-950/60 transition"
          >
            <Play className="w-5 h-5 fill-current" />
            Draw Next Number
          </button>
          
          <button
            onClick={onEndGame}
            className="bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 text-slate-400 font-semibold py-3.5 px-4 rounded-xl transition flex items-center justify-center"
          >
            End Game
          </button>
        </div>
      </div>

      {/* Prize Board */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
        <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase flex items-center gap-2">
          <Trophy className="w-4 h-4 text-violet-400" />
          Prize Distribution Setup
        </h3>
        <div className="space-y-2">
          {prizes.map((p) => {
            const hasWinners = p.winners && p.winners.length > 0;
            return (
              <button
                key={p.id}
                onClick={() => openClaimModal(p)}
                className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between group ${
                  hasWinners 
                    ? 'bg-emerald-950/10 border-emerald-900/50 hover:border-emerald-700/60' 
                    : 'bg-slate-950 border-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-slate-200">{p.name}</span>
                    <span className="text-xxs font-black bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                      ₹{p.value}
                    </span>
                  </div>
                  {hasWinners ? (
                    <span className="text-xxs text-emerald-400 font-bold block">
                      Claimed: {p.winners.join(', ')} (on #{p.winningNumber})
                    </span>
                  ) : (
                    <span className="text-xxs text-slate-500 block">Tap to claim or set winners</span>
                  )}
                </div>
                <div className={`p-1.5 rounded-lg border transition ${
                  hasWinners ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-slate-200'
                }`}>
                  <Award className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confetti Animation Trigger */}
      <Confetti active={celebrate} />

      {/* Smart Bottom-Sheet Claim Modal */}
      {claimingPrize && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-end justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Award Prize</span>
                <h3 className="text-lg font-black text-slate-100">{claimingPrize.name}</h3>
              </div>
              <button 
                onClick={() => setClaimingPrize(null)} 
                className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-xxs text-slate-400 mb-2 font-medium">
                Select one or more winning players. Uncheck all to mark as unclaimed.
              </p>
              
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                {activePlayers.map((player) => {
                  const isChecked = selectedWinners.includes(player);
                  return (
                    <button
                      key={player}
                      onClick={() => toggleWinnerSelection(player)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-sm font-semibold transition ${
                        isChecked 
                          ? 'bg-violet-950/20 border-violet-500/50 text-violet-300' 
                          : 'bg-slate-900 border-slate-850/40 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{player}</span>
                      <CheckSquare className={`w-4 h-4 transition ${isChecked ? 'text-violet-400 opacity-100' : 'opacity-20'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={submitClaim}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-950/40 transition"
            >
              Confirm Award Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
