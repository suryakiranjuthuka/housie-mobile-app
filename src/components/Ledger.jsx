import React, { useState } from 'react';
import { ArrowLeftRight, Users, ChevronRight, Ban, Plus, Sparkles } from 'lucide-react';
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

  const settlements = calculateSettlements(cumulativeLedger);

  const togglePlayerExclusion = (player) => {
    let updated;
    if (activePlayers.includes(player)) {
      updated = activePlayers.filter(p => p !== player);
    } else {
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 text-zinc-100">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-black text-zinc-500 tracking-wider uppercase">Leaderboard</span>
            <h2 className="text-base font-black">Current Standings</h2>
          </div>
          <span className="text-[10px] font-black bg-zinc-950 border border-zinc-850 px-2 py-1 rounded-lg text-zinc-400">
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
                  className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-850/60 rounded-2xl transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-zinc-200">{player}</span>
                      {!isActive && (
                        <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                          Spectating
                        </span>
                      )}
                    </div>
                    <span className="text-xxs text-zinc-500 font-medium block">
                      Buy-in: ₹{buyIn} | Won: ₹{won.toFixed(0)}
                    </span>
                  </div>

                  <span className={`text-sm font-black ${
                    net >= 0 ? 'text-zinc-100' : 'text-zinc-500'
                  }`}>
                    {net >= 0 ? '+' : ''}₹{net.toFixed(2)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* P2P Settlements Drawer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase flex items-center gap-2">
          <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-500" />
          Recommended P2P Settlements
        </h3>
        
        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 space-y-2">
          {settlements.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-2 font-medium italic">
              No transactions needed. All net payouts equal zero.
            </p>
          ) : (
            settlements.map((t, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800/40 p-3 rounded-xl text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-200">{t.from}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                  <span className="font-bold text-zinc-200">{t.to}</span>
                </div>
                <span className="font-black text-zinc-50">
                  ₹{t.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lineup Management & Mid-Session Adding */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            Manage Player Lineup
          </h3>
          <button 
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="text-[10px] font-black text-zinc-400 hover:text-zinc-200 transition duration-150 flex items-center gap-1 uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Player
          </button>
        </div>

        {showAddPlayer && (
          <div className="flex gap-2 bg-zinc-950 border border-zinc-850 rounded-xl p-2.5">
            <input 
              type="text" 
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Name..."
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
            />
            <button 
              onClick={handleAddPlayer}
              className="bg-zinc-100 text-zinc-950 rounded-lg px-3 py-1.5 text-xs font-bold transition hover:bg-white"
            >
              Add
            </button>
          </div>
        )}

        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">
            Exclusions (Check/Uncheck players for the next round)
          </p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {players.map((p) => {
              const isActive = activePlayers.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlayerExclusion(p)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-zinc-900 border-zinc-500 text-zinc-100 shadow-sm' 
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:border-zinc-800'
                  }`}
                >
                  <Ban className={`w-3 h-3 ${isActive ? 'opacity-20' : 'text-rose-500 opacity-100'}`} />
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
          className="flex-1 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold py-3.5 px-4 rounded-2xl transition duration-150 active:scale-95"
        >
          End Session
        </button>
        <button
          onClick={onNextRound}
          className="flex-[2] bg-zinc-100 hover:bg-white text-zinc-950 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition duration-150 active:scale-95 shadow-md"
        >
          <Sparkles className="w-4 h-4 fill-current text-zinc-950 animate-spin" style={{ animationDuration: '3s' }} />
          Start Next Round
        </button>
      </div>
    </div>
  );
}
