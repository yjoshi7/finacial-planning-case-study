// ---- Static Data for Rajesh & Priya Sharma ----
const income = 1800000, expenses = 75000, surplus = income/12 - expenses;
const assets = 650000, liabilities = 3000000, netWorth = assets - liabilities;

const goals = [
  { name: "Child Education – Child 1", futureCost: 7675000, shortfall: 7675000, sip: 24500 },
  { name: "Child Education – Child 2", futureCost: 9100000, shortfall: 9100000, sip: 26800 },
  { name: "Retirement", futureCost: 87400000, fvExisting: 10800000, shortfall: 76600000, sip: 42000 }
];

const hlv = 25000000, lifeCover = 2500000, gap = hlv - lifeCover;
const allocation = [70, 25, 5, 0]; // Equity, Debt, Gold, Cash

// ---- Charts ----
const cashCtx = document.getElementById('cashflow-chart').getContext('2d');
new Chart(cashCtx, {
  type: 'bar',
  data: {
    labels: ['Income', 'Expenses', 'Surplus'],
    datasets: [{ data: [income/12, expenses, surplus], backgroundColor: ['#3B82F6','#64748B','#10B981'] }]
  },
  options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{color:'#94A3B8'}, grid:{color:'rgba(148,163,184,0.1)'}}, x:{ticks:{color:'#94A3B8'}}} }
});

const goalCtx = document.getElementById('goal-chart').getContext('2d');
new Chart(goalCtx, {
  type: 'bar',
  data: {
    labels: goals.map(g => g.name),
    datasets: [
      { label: 'Future Cost', data: goals.map(g => g.futureCost), backgroundColor: '#3B82F6' },
      { label: 'FV Savings', data: goals.map(g => g.fvExisting || 0), backgroundColor: '#10B981' }
    ]
  },
  options: { responsive:true, plugins:{legend:{position:'bottom', labels:{color:'#F8FAFC'}}}, scales:{y:{beginAtZero:true, ticks:{color:'#94A3B8', callback: v => '₹'+(v/100000).toFixed(1)+'L'}, grid:{color:'rgba(148,163,184,0.1)'}}, x:{ticks:{color:'#94A3B8'}}} }
});

const insCtx = document.getElementById('insurance-chart').getContext('2d');
new Chart(insCtx, {
  type: 'bar',
  data: {
    labels: ['HLV', 'Cover', 'Gap'],
    datasets: [{ data: [hlv, lifeCover, Math.max(0,gap)], backgroundColor: ['#3B82F6','#10B981','#DC2626'] }]
  },
  options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{color:'#94A3B8', callback: v => '₹'+(v/10000000).toFixed(2)+'Cr'}, grid:{color:'rgba(148,163,184,0.1)'}}, x:{ticks:{color:'#94A3B8'}}} }
});

const allocCtx = document.getElementById('allocation-chart').getContext('2d');
new Chart(allocCtx, {
  type: 'doughnut',
  data: {
    labels: ['Equity','Debt','Gold','Cash'],
    datasets: [{ data: allocation, backgroundColor: ['#3B82F6','#14B8A6','#F59E0B','#64748B'] }]
  },
  options: { responsive:true, plugins:{legend:{position:'bottom', labels:{color:'#F8FAFC'}}} }
});