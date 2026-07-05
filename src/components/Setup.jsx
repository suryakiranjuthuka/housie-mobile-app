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

  // Import saved players choice
  const [availableToImport, setAvailableToImport] = useState([]);

  useEffect(() => {
    // Filter out saved players that are already added
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
    setTickets({ ...tickets, [trimmed]: 1 }); // default 1 ticket
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
    // Build initial game presets
    const totalTickets = Object.values(tickets).reduce((a, b) => a + b, 0);
    const totalPool = totalTickets * ticketPrice;
    
    // Calculate rounded distribution
    const pct = PRESETS[selectedPreset].pct;
    let values = pct.map(p => {
      const raw = (totalPool * p) / 100;
      return Math.round(raw / 5) * 5;
    });
    
    // Adjust sum
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
    <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 my-4">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
          Housy Ledger
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide uppercase">Family Tambola Tracker</p>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          {/* Ticket Price Setting */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-violet-400" />
              Ticket Price (₹)
            </label>
            <input
              type="number"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-lg font-bold text-center text-violet-300 outline-none transition"
            />
          </div>

          {/* Add Players */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              Players in Session
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name..."
                onKeyDown={(e) => e.key === 'Enter' && addPlayer(newPlayerName)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2 text-sm outline-none transition"
              />
              <button
                onClick={() => addPlayer(newPlayerName)}
                className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-4 flex items-center justify-center transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Imported Quick Lists */}
            {availableToImport.length > 0 && (
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-900">
                <p className="text-xxs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Quick Import</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {availableToImport.map((p) => (
                    <div
                      key={p}
                      className="bg-slate-950 border border-slate-850 text-xxs text-slate-300 rounded-lg flex items-center overflow-hidden transition"
                    >
                      <button
                        onClick={() => addPlayer(p)}
                        className="hover:bg-slate-800 px-2 py-1 flex items-center gap-1 border-r border-slate-900/50 transition font-bold"
                      >
                        <UserPlus className="w-3 h-3 text-slate-500" />
                        {p}
                      </button>
                      <button
                        onClick={() => onDeleteSavedPlayer && onDeleteSavedPlayer(p)}
                        className="hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 px-1.5 py-1 transition"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Added Players List */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 min-h-36 max-h-60 overflow-y-auto space-y-2">
              {players.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8">
                  No players added yet. Add at least 2 players.
                </div>
              ) : (
                players.map((p) => (
                  <div key={p} className="flex justify-between items-center bg-slate-900 border border-slate-800/50 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold text-slate-200">{p}</span>
                    <button
                      onClick={() => removePlayer(p)}
                      className="text-rose-400 hover:text-rose-300 transition"
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
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-950/50"
          >
            Configure Tickets & Prizes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ticket Counts Allocation */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              Ticket Counts
            </h2>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 max-h-56 overflow-y-auto space-y-2">
              {players.map((p) => (
                <div key={p} className="flex justify-between items-center bg-slate-900/60 border border-slate-800/30 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-slate-300">{p}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTickets({ ...tickets, [p]: Math.max(0, (tickets[p] || 0) - 1) })}
                      className="w-7 h-7 bg-slate-950 border border-slate-800 text-slate-300 font-bold rounded-lg flex items-center justify-center active:scale-95 transition"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-extrabold text-violet-300">
                      {tickets[p] || 0}
                    </span>
                    <button
                      onClick={() => setTickets({ ...tickets, [p]: (tickets[p] || 0) + 1 })}
                      className="w-7 h-7 bg-slate-950 border border-slate-800 text-slate-300 font-bold rounded-lg flex items-center justify-center active:scale-95 transition"
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
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-400" />
              Prize Preset Distribution
            </h2>
            <div className="space-y-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-0.5 ${
                    selectedPreset === idx
                      ? 'bg-violet-950/30 border-violet-500 shadow-md shadow-violet-950/20'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`text-sm font-bold ${selectedPreset === idx ? 'text-violet-300' : 'text-slate-200'}`}>
                    {preset.name}
                  </span>
                  <span className="text-xxs text-slate-400">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded-xl py-3 font-semibold transition"
            >
              Back
            </button>
            <button
              onClick={handleStartSession}
              className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/50 animate-pulse"
            >
              Start Game #1
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
