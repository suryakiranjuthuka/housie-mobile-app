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
    if (Object.keys(initialTickets).length > 0) return initialTickets;
    const t = {};
    initialPlayers.forEach(p => { t[p] = 1; });
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
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl text-zinc-100 my-4">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black tracking-tight text-zinc-50 uppercase tracking-widest">
          Housy Ledger
        </h1>
        <p className="text-xxs text-zinc-500 mt-1 font-bold tracking-widest uppercase">Session Setup Panel</p>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          {/* Ticket Price Setting */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5 text-zinc-500" />
              Ticket Price (₹)
            </label>
            <input
              type="number"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-850 focus:border-zinc-500 rounded-xl px-4 py-3 text-lg font-black text-center text-zinc-100 outline-none transition duration-150"
            />
          </div>

          {/* Add Players */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              Players in Session
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Name..."
                onKeyDown={(e) => e.key === 'Enter' && addPlayer(newPlayerName)}
                className="flex-1 bg-zinc-950 border border-zinc-850 focus:border-zinc-500 rounded-xl px-4 py-2.5 text-sm outline-none transition duration-150 text-zinc-200"
              />
              <button
                onClick={() => addPlayer(newPlayerName)}
                className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl px-4 flex items-center justify-center transition duration-150 active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Imported Quick Lists */}
            {availableToImport.length > 0 && (
              <div className="bg-zinc-950/40 rounded-xl p-3 border border-zinc-850/60">
                <p className="text-[10px] text-zinc-500 font-bold mb-2 uppercase tracking-widest">Quick Import</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {availableToImport.map((p) => (
                    <div
                      key={p}
                      className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 rounded-lg flex items-center overflow-hidden transition"
                    >
                      <button
                        onClick={() => addPlayer(p)}
                        className="hover:bg-zinc-800 hover:text-zinc-200 px-2.5 py-1.5 flex items-center gap-1 border-r border-zinc-800/80 font-bold transition duration-150"
                      >
                        <UserPlus className="w-3 h-3 text-zinc-500" />
                        {p}
                      </button>
                      <button
                        onClick={() => onDeleteSavedPlayer && onDeleteSavedPlayer(p)}
                        className="hover:bg-rose-950/30 text-zinc-500 hover:text-rose-400 px-2 py-1.5 transition duration-150"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Added Players List */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-855 min-h-36 max-h-60 overflow-y-auto space-y-1.5">
              {players.length === 0 ? (
                <div className="text-center text-zinc-500 text-xs py-8 italic font-medium">
                  No players added yet.
                </div>
              ) : (
                players.map((p) => (
                  <div key={p} className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800/40 rounded-lg px-3 py-2 text-sm">
                    <span className="font-bold text-zinc-200">{p}</span>
                    <button
                      onClick={() => removePlayer(p)}
                      className="text-zinc-500 hover:text-rose-400 transition duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleNextStep}
            disabled={players.length < 2}
            className="w-full bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition duration-150 active:scale-95 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:transform-none"
          >
            Configure Tickets & Prizes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ticket Counts Allocation */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              Allocated Tickets
            </h2>
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-850 max-h-56 overflow-y-auto space-y-2">
              {players.map((p) => (
                <div key={p} className="flex justify-between items-center bg-zinc-900/40 border border-zinc-800/20 rounded-lg px-3 py-2">
                  <span className="text-sm font-bold text-zinc-300">{p}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTickets({ ...tickets, [p]: Math.max(0, (tickets[p] || 0) - 1) })}
                      className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-lg flex items-center justify-center active:scale-95 transition duration-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-black text-zinc-100">
                      {tickets[p] || 0}
                    </span>
                    <button
                      onClick={() => setTickets({ ...tickets, [p]: (tickets[p] || 0) + 1 })}
                      className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-lg flex items-center justify-center active:scale-95 transition duration-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prize Presets */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-zinc-500" />
              Prize Preset Distribution
            </h2>
            <div className="space-y-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-0.5 ${
                    selectedPreset === idx
                      ? 'bg-zinc-900 border-zinc-400'
                      : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <span className={`text-xs font-black ${selectedPreset === idx ? 'text-zinc-50' : 'text-zinc-300'}`}>
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-zinc-500">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 rounded-xl py-3 text-xs font-bold transition duration-150"
            >
              Back
            </button>
            <button
              onClick={handleStartSession}
              className="flex-[2] bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 transition duration-150 active:scale-95"
            >
              Start Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
