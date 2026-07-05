export function calculateSettlements(ledger) {
  const balances = Object.entries(ledger).map(([player, amount]) => ({
    player,
    amount: parseFloat(amount.toFixed(2))
  }));
  
  const debtors = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
  const creditors = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
  
  const transactions = [];
  let dIdx = 0;
  let cIdx = 0;
  
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    
    const oweAmount = Math.abs(debtor.amount);
    const receiveAmount = creditor.amount;
    
    const settledAmount = Math.min(oweAmount, receiveAmount);
    
    if (settledAmount > 0.01) {
      transactions.push({
        from: debtor.player,
        to: creditor.player,
        amount: parseFloat(settledAmount.toFixed(2))
      });
    }
    
    debtor.amount += settledAmount;
    creditor.amount -= settledAmount;
    
    if (Math.abs(debtor.amount) < 0.01) {
      dIdx++;
    }
    if (creditor.amount < 0.01) {
      cIdx++;
    }
  }
  
  return transactions;
}

export function getRoundedDistribution(pool, percentages) {
  let values = percentages.map(p => {
    const raw = (pool * p) / 100;
    return Math.round(raw / 5) * 5;
  });
  
  let sum = values.reduce((s, v) => s + v, 0);
  let diff = pool - sum;
  
  values[values.length - 1] += diff;
  if (values[values.length - 1] < 0) {
    values[values.length - 1] = 0;
  }
  
  return values;
}
