import React, { useState } from 'react';
import { ArrowLeftRight, Users, Trophy, ChevronRight, Ban, Award, Plus, Sparkles } from 'lucide-react';
import { calculateSettlements } from '../utils/settlement';

export default function Ledger({ 
  players, 
  activePlayers, 
  tickets, 
  ticketPrice, 
  games, 
  cumulativeLedger, 
  onUpdateLineup, 
  onAddPlayerMidSession, 
  onNextRound, 
  onEndSession 
}) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Calculate live settlements based on cumulative balances
  const settlements = calculateSettlements(cumulativeLedger);

  // Toggle players exclusion mid-session
  const togglePlayerExclusion = (player) => {
    let updated;
    if (activePlayers.includes(player)) {
      // Exclude player
      updated = activePlayers.filter(p => p !== player);
    } else {
      // Include player
      updated = [...activePlayers, player];
    }
    
    if (updated.length < 2) {
      alert("You must have at least 2 active players to play a round!");
      return;
    }
    
    onUpdateLineup(updated);
  };

  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    if (players.includes(trimmed)) {
      alert("Player already exists in the session!");
      return;
    }
    onAddPlayerMidSession(trimmed);
    setNewPlayerName('');
    setShowAddPlayer(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-12">
      {/* Session Standings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-xxs font-extrabold text-violet-400 tracking-wider uppercase">Leaderboard</span>
            <h2 className="text-lg font-black">Current Standings</h2>
          </div>
          <span className="text-xxs font-extrabold bg-slate-950 border border-slate-850 px-2 py-1 rounded-lg text-slate-400">
            {games.length} Games Played
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {Object.entries(cumulativeLedger)
            .sort((a, b) => b[1] - a[1])
            .map(([player, net]) => {
              const buyIn = games.reduce((sum, g) => sum + ((g.tickets[player] || 0) * ticketPrice), 0);
              const won = games.reduce((sum, g) => {
                let roundWinnings = 0;
                g.prizes.forEach(p => {
                  if (p.winners.includes(player)) {
                    roundWinnings += p.value / p.winners.length;
                  }
                });
                return sum + roundWinnings;
              }, 0);

              const isActive = activePlayers.includes(player);

              return (
                <div 
                  key={player}
                  className="flex items-center justify-between p-3 bg-slate-950 border border-slate-850/60 rounded-2xl transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-200">{player}</span>
                      {!isActive && (
                        <span className="text-xxs bg-slate-900 border border-slate-850 text-slate-500 font-semibold px-1.5 py-0.2 rounded">
                          Spectator
                        </span>
                      )}
                    </div>
                    <span className="text-xxs text-slate-500 font-medium block">
                      Buy-in: ₹{buyIn} | Won: ₹{won.toFixed(0)}
                    </span>
                  </div>

                  <span className={`text-sm font-black ${
                    net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {net >= 0 ? '+' : ''}₹{net.toFixed(2)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* P2P Settlements Drawer */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-violet-400" />
          Recommended P2P Settlements
        </h3>
        
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3">
          {settlements.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2 font-medium italic">
              All balances match up perfectly. No transactions needed!
            </p>
          ) : (
            settlements.map((t, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between bg-slate-900/60 border border-slate-800/40 p-3 rounded-xl text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-300">{t.from}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                  <span className="font-extrabold text-slate-300">{t.to}</span>
                </div>
                <span className="font-black text-emerald-400">
                  ₹{t.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lineup Management & Mid-Session Adding */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            Manage Player Lineup
          </h3>
          <button 
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="text-xxs font-bold text-violet-400 hover:text-violet-300 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Player
          </button>
        </div>

        {showAddPlayer && (
          <div className="flex gap-2 bg-slate-950 border border-slate-850 rounded-xl p-2.5">
            <input 
              type="text" 
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
            />
            <button 
              onClick={handleAddPlayer}
              className="bg-violet-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition hover:bg-violet-500"
            >
              Add
            </button>
          </div>
        )}

        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4">
          <p className="text-xxs text-slate-500 mb-3 font-semibold uppercase tracking-wider">
            Toggle checked players to EXCLUDE/INCLUDE them for the next round
          </p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {players.map((p) => {
              const isActive = activePlayers.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlayerExclusion(p)}
                  className={`px-3 py-1.5 rounded-xl border text-xxs font-bold transition flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-violet-950/20 border-violet-500 text-violet-300 shadow-sm' 
                      : 'bg-slate-900 border-slate-850 text-slate-500 hover:border-slate-800'
                  }`}
                >
                  <Ban className={`w-3.5 h-3.5 ${isActive ? 'opacity-20' : 'text-rose-500 opacity-100'}`} />
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navigation Actions */}
      <div className="flex gap-3">
        <button
          onClick={onEndSession}
          className="flex-1 bg-slate-950 border border-slate-850 hover:bg-rose-950/20 hover:border-rose-900 hover:text-rose-400 text-slate-400 font-semibold py-3.5 px-4 rounded-2xl transition"
        >
          End Session
        </button>
        <button
          onClick={onNextRound}
          className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition"
        >
          <Sparkles className="w-5 h-5 fill-current animate-spin" style={{ animationDuration: '3s' }} />
          Start Next Round
        </button>
      </div>
    </div>
  );
}
