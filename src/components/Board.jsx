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
      const spoken = num < 10 ? `single digit ${words} ${num}` : `${words} ${num}`;

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
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex justify-between items-center text-zinc-100 shadow-xl">
        <div>
          <span className="text-[10px] font-black text-zinc-500 tracking-wider uppercase">Active Game</span>
          <h2 className="text-base font-black text-zinc-200">Round #{gameIndex}</h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-zinc-500 tracking-wider uppercase">Prize Pool</span>
          <h2 className="text-base font-black text-zinc-50">₹{totalPool}</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setMute(!mute)} 
            className={`p-2 rounded-xl border transition duration-150 ${mute ? 'bg-rose-950/20 border-rose-900 text-rose-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            {mute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Board Grid (1-90) */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-3xl p-4 shadow-2xl">
        <div className="grid grid-cols-10 gap-1.5 justify-center">
          {Array.from({ length: 90 }).map((_, idx) => {
            const num = idx + 1;
            const isCalled = calledNumbers.has(num);
            const isWinnerTrigger = winningNumbersMap[num];

            let cellClass = "bg-zinc-900/10 text-zinc-600 border border-zinc-900 hover:border-zinc-800 transition-all duration-150";
            if (isWinnerTrigger) {
              cellClass = "bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white font-black scale-105 shadow-[0_0_15px_rgba(217,70,239,0.4)] border border-fuchsia-400 animate-pulse";
            } else if (isCalled) {
              cellClass = "bg-zinc-100 text-zinc-950 font-extrabold scale-[1.02] border border-zinc-300 shadow-[0_0_15px_rgba(255,255,255,0.15)]";
            }

            return (
              <div
                key={num}
                className={`aspect-square flex items-center justify-center text-xs rounded-lg transition duration-150 ${cellClass}`}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controller Drawer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        {/* Draw Next Panel */}
        <div className="flex gap-4 items-center bg-zinc-950 border border-zinc-850 rounded-2xl p-4">
          <div className="flex-1">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Draws History</span>
            <div className="flex gap-1.5 mt-1 overflow-x-auto py-0.5 max-w-[180px]">
              {history.length === 0 ? (
                <span className="text-[10px] text-zinc-600 italic font-medium">No calls yet</span>
              ) : (
                history.slice(-4).reverse().map((num, i) => (
                  <span 
                    key={i} 
                    className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold ${
                      i === 0 ? 'bg-zinc-100 text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {num}
                  </span>
                ))
              )}
            </div>
            <div className="text-[10px] text-zinc-500 mt-2 font-bold">
              Numbers Drawn: <span className="font-black text-zinc-300">{calledNumbers.size}/90</span>
            </div>
          </div>

          <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-850 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <span className="text-[10px] font-black text-zinc-500 uppercase leading-none">Last</span>
            <span className="text-2xl font-black text-zinc-100 mt-0.5">
              {currentNumber || '—'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={drawNumber}
            className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 font-black py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-150 active:scale-95 shadow-md shadow-black/30"
          >
            <Play className="w-4 h-4 fill-current text-zinc-950" />
            Draw Number
          </button>
          
          <button
            onClick={onEndGame}
            className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold py-3.5 px-4 rounded-xl transition duration-150 active:scale-95"
          >
            End Game
          </button>
        </div>
      </div>

      {/* Prize Board */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-3">
        <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-zinc-500" />
          Prize Distribution Setup
        </h3>
        <div className="space-y-2">
          {prizes.map((p) => {
            const hasWinners = p.winners && p.winners.length > 0;
            return (
              <button
                key={p.id}
                onClick={() => openClaimModal(p)}
                className={`w-full text-left p-3.5 rounded-2xl border transition duration-150 flex items-center justify-between group ${
                  hasWinners 
                    ? 'bg-zinc-950/20 border-zinc-700/60' 
                    : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-zinc-200">{p.name}</span>
                    <span className="text-[10px] font-black bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                      ₹{p.value}
                    </span>
                  </div>
                  {hasWinners ? (
                    <span className="text-xxs text-zinc-400 font-bold block">
                      Claimed: {p.winners.join(', ')} (on #{p.winningNumber})
                    </span>
                  ) : (
                    <span className="text-xxs text-zinc-500 block">Tap to claim or configure winners</span>
                  )}
                </div>
                <div className={`p-1.5 rounded-lg border transition ${
                  hasWinners ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-zinc-300'
                }`}>
                  <Award className="w-4 h-4" />
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
                className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 rounded-lg text-zinc-400 transition"
              >
                <X className="w-4 h-4" />
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
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-sm font-semibold transition ${
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
              className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-black py-3.5 rounded-xl shadow-md transition duration-150 active:scale-95"
            >
              Confirm Winner Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
