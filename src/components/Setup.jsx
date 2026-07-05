import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, UserPlus, Users, Banknote, Award } from 'lucide-react';

const PRESETS = [
  { name: 'Balanced', description: 'Jaldi 5 (15%), 3 Lines (15% each), Full Housie (40%)', pct: [15, 15, 15, 15, 40] },
  { name: 'Full Housie Heavy', description: 'Jaldi 5 (10%), 3 Lines (15% each), Full Housie (45%)', pct: [10, 15, 15, 15, 45] },
  { name: 'Line Heavy', description: 'Jaldi 5 (20%), 3 Lines (18% each), Full Housie (26%)', pct: [20, 18, 18, 18, 26] },
  { name: 'Even Split', description: 'Balanced 20% across all 5 prizes', pct: [20, 20, 20, 20, 20] }
];

export default function Setup({ 
  onComplete, 
  savedPlayers = [], 
  onDeleteSavedPlayer,
  initialPlayers = [],
  initialTicketPrice = 50,
  initialStep = 1,
  initialTickets = {}
}) {
  const [ticketPrice, setTicketPrice] = useState(initialTicketPrice);
  const [players, setPlayers] = useState(initialPlayers.length > 0 ? initialPlayers : []);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [tickets, setTickets] = useState(() => {
    const t = {};
    const playerList = initialPlayers.length > 0 ? initialPlayers : [];
    playerList.forEach(p => {
      t[p] = initialTickets[p] !== undefined ? initialTickets[p] : 1;
    });
    return t;
  });
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [step, setStep] = useState(initialStep); // 1: Players & Price, 2: Tickets & Prizes
  const [availableToImport, setAvailableToImport] = useState([]);

  useEffect(() => {
    const filtered = savedPlayers.filter(p => !players.includes(p));
    setAvailableToImport(filtered);
  }, [players, savedPlayers]);

  const addPlayer = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.includes(trimmed)) {
      alert('Player already added!');
      return;
    }
    setPlayers([...players, trimmed]);
    setTickets({ ...tickets, [trimmed]: 1 });
    setNewPlayerName('');
  };

  const removePlayer = (name) => {
    setPlayers(players.filter(p => p !== name));
    const newTickets = { ...tickets };
    delete newTickets[name];
    setTickets(newTickets);
  };

  const handleNextStep = () => {
    const parsedPrice = parseFloat(ticketPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid ticket price greater than 0!');
      return;
    }
    if (players.length < 2) {
      alert('Please add at least 2 players to start a session!');
      return;
    }
    setStep(2);
  };

  const handleStartSession = () => {
    const totalTickets = Object.values(tickets).reduce((a, b) => a + b, 0);
    const totalPool = totalTickets * ticketPrice;
    const pct = PRESETS[selectedPreset].pct;
    
    let values = pct.map(p => {
      const raw = (totalPool * p) / 100;
      return Math.round(raw / 5) * 5;
    });
    
    let sum = values.reduce((s, v) => s + v, 0);
    let diff = totalPool - sum;
    values[values.length - 1] += diff;
    if (values[values.length - 1] < 0) values[values.length - 1] = 0;

    const initialPrizes = [
      { id: 'jaldi5', name: 'Jaldi 5 (Early 5)', pct: pct[0], value: values[0], winners: [], winningNumber: null },
      { id: 'line1', name: '1st Line (Top)', pct: pct[1], value: values[1], winners: [], winningNumber: null },
      { id: 'line2', name: '2nd Line (Middle)', pct: pct[2], value: values[2], winners: [], winningNumber: null },
      { id: 'line3', name: '3rd Line (Bottom)', pct: pct[3], value: values[3], winners: [], winningNumber: null },
      { id: 'fullhousie', name: 'Full Housie', pct: pct[4], value: values[4], winners: [], winningNumber: null }
    ];

    onComplete({
      ticketPrice,
      players,
      tickets,
      prizes: initialPrizes,
      presetPct: pct,
      totalPool,
      totalTickets
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-slate-100 my-4 relative overflow-hidden">
      {/* Decorative Glow inside card */}
      <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none" />
      
      {/* Title */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-3xl font-black tracking-widest text-white uppercase drop-shadow-md">
          Housy Ledger
        </h1>
        <p className="text-[10px] text-cyan-400 mt-2 font-black tracking-[0.3em] uppercase shadow-cyan-400/20">Session Setup Panel</p>
      </div>

      {step === 1 ? (
        <div className="space-y-6 relative z-10">
          {/* Ticket Price Setting (Bento Box 1) */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-5 shadow-inner space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Banknote className="w-4 h-4 text-cyan-400" />
              Ticket Price (₹)
            </label>
            <input
              type="number"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-2xl px-5 py-4 text-2xl font-black text-center text-white outline-none transition-all duration-200"
            />
          </div>

          {/* Add Players (Bento Box 2) */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-5 shadow-inner space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Players in Session
            </label>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Name..."
                onKeyDown={(e) => e.key === 'Enter' && addPlayer(newPlayerName)}
                className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-2xl px-4 py-3.5 text-sm outline-none transition-all duration-200 text-white placeholder-slate-500"
              />
              <button
                onClick={() => addPlayer(newPlayerName)}
                className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-2xl px-5 flex items-center justify-center transition-all duration-200 active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Imported Quick Lists */}
            {availableToImport.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] text-cyan-500/80 font-black mb-3 uppercase tracking-widest">Quick Import</p>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                  {availableToImport.map((p) => (
                    <div
                      key={p}
                      className="bg-black/50 border border-white/10 text-xs text-slate-300 rounded-xl flex items-center overflow-hidden transition"
                    >
                      <button
                        onClick={() => addPlayer(p)}
                        className="hover:bg-white/10 hover:text-white px-3 py-2 flex items-center gap-1.5 border-r border-white/10 font-bold transition duration-150"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-cyan-500/80" />
                        {p}
                      </button>
                      <button
                        onClick={() => onDeleteSavedPlayer && onDeleteSavedPlayer(p)}
                        className="hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 px-2.5 py-2 transition duration-150"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Added Players List */}
            <div className="bg-black/50 rounded-2xl p-4 border border-white/5 min-h-[140px] max-h-60 overflow-y-auto space-y-2">
              {players.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-10 italic font-medium">
                  No players added yet.
                </div>
              ) : (
                players.map((p) => (
                  <div key={p} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm hover:bg-white/10 transition-colors">
                    <span className="font-extrabold text-white tracking-wide">{p}</span>
                    <button
                      onClick={() => removePlayer(p)}
                      className="text-slate-500 hover:text-rose-400 bg-rose-500/0 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all duration-150"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleNextStep}
            disabled={players.length < 2}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black rounded-2xl py-4 text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:shadow-none"
          >
            Configure Tickets & Prizes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          {/* Ticket Counts Allocation (Bento Box 1) */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-5 shadow-inner space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Allocated Tickets
            </h2>
            <div className="bg-black/50 rounded-2xl p-4 border border-white/5 max-h-56 overflow-y-auto space-y-2">
              {players.map((p) => (
                <div key={p} className="flex justify-between items-center bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-4 py-2.5 transition-colors">
                  <span className="text-sm font-extrabold text-white">{p}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTickets({ ...tickets, [p]: Math.max(0, (tickets[p] || 0) - 1) })}
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black rounded-xl flex items-center justify-center active:scale-95 transition-all duration-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-lg font-black text-white drop-shadow-md">
                      {tickets[p] || 0}
                    </span>
                    <button
                      onClick={() => setTickets({ ...tickets, [p]: (tickets[p] || 0) + 1 })}
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black rounded-xl flex items-center justify-center active:scale-95 transition-all duration-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prize Presets (Bento Box 2) */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-5 shadow-inner space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              Prize Preset Distribution
            </h2>
            <div className="space-y-3">
              {PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
                    selectedPreset === idx
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-black tracking-wide ${selectedPreset === idx ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {preset.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedPreset === idx ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-slate-400'}`}>
                      {preset.pct[4]}% Housie
                    </span>
                  </div>
                  
                  {/* Visual Distribution Bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden flex opacity-90">
                    <div style={{ width: `${preset.pct[0]}%` }} className="bg-amber-400" title={`Jaldi 5: ${preset.pct[0]}%`} />
                    <div style={{ width: `${preset.pct[1]}%` }} className="bg-emerald-400" title={`Line 1: ${preset.pct[1]}%`} />
                    <div style={{ width: `${preset.pct[2]}%` }} className="bg-emerald-500" title={`Line 2: ${preset.pct[2]}%`} />
                    <div style={{ width: `${preset.pct[3]}%` }} className="bg-emerald-600" title={`Line 3: ${preset.pct[3]}%`} />
                    <div style={{ width: `${preset.pct[4]}%` }} className="bg-fuchsia-500" title={`Full Housie: ${preset.pct[4]}%`} />
                  </div>
                  
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    <span className="text-amber-400/80">Jaldi</span>
                    <span className="text-emerald-400/80">Lines</span>
                    <span className="text-fuchsia-400/80">Housie</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 rounded-2xl py-4 text-sm font-bold transition-all duration-200 active:scale-95"
            >
              Back
            </button>
            <button
              onClick={handleStartSession}
              className="flex-[2] bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-2xl py-4 text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Start Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
