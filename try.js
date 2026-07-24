// PlanWise – Complete Script (with Sheets integration)
const API_URL = 'https://script.google.com/macros/s/AKfycbw_6S3BsFXdaMHGPOEHC9XTuJb77WV19t5N63O1AA68rxColelsi6uHWybsGxocwYyp/exec';

let currentClientId = null;      // set when loading or creating a new plan
let isNewPlan = true;
let goals = [];

// Risk questions (same as RiskWise)
const riskQuestions = [
  { id:1, text:"Age band", options:["Under 30 (5)","30-40 (4)","41-50 (3)","51-60 (2)","60+ (1)"], weights:[5,4,3,2,1] },
  { id:2, text:"Investment time horizon", options:["10+ years (5)","7-10 (4)","4-6 (3)","1-3 (2)","<1 year (1)"], weights:[5,4,3,2,1] },
  { id:3, text:"Primary financial goal", options:["Wealth growth (5)","Balanced (3)","Capital preservation (1)"], weights:[5,3,1] },
  { id:4, text:"Income stability", options:["Very stable (5)","Stable (4)","Variable (2)","Uncertain (1)"], weights:[5,4,2,1] },
  { id:5, text:"Emergency fund", options:["6+ months (5)","3-6 months (3)","<3 months (1)"], weights:[5,3,1] },
  { id:6, text:"Reaction to 20% drop", options:["Invest more (5)","Hold (3)","Sell some (2)","Sell all (1)"], weights:[5,3,2,1] },
  { id:7, text:"Investment knowledge", options:["Experienced (5)","Some exposure (3)","Little/none (1)"], weights:[5,3,1] },
  { id:8, text:"Dependents", options:["None (5)","1 (3)","2+ (2)","Sole earner (1)"], weights:[5,3,2,1] },
  { id:9, text:"Liquidity needs in 2y", options:["None (5)","Small (3)","Significant (1)"], weights:[5,3,1] },
  { id:10, text:"Volatility comfort", options:["Very comfortable (5)","Somewhat (3)","Prefer stability (1)"], weights:[5,3,1] }
];
let riskAnswers = new Array(10).fill(null);

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
  loadClientList();
  renderRiskQuiz();
  setupTabs();
  setupEventListeners();
});

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + '-panel').classList.add('active');
      if (tab.dataset.tab === 'dashboard') updateDashboard();
    });
  });
}

function setupEventListeners() {
  document.getElementById('new-btn').addEventListener('click', startNewPlan);
  document.getElementById('client-select').addEventListener('change', loadExistingPlan);
  document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
  document.getElementById('save-finances-btn').addEventListener('click', saveFinances);
  document.getElementById('save-risk-btn').addEventListener('click', saveRisk);
  document.getElementById('add-goal-btn').addEventListener('click', addGoal);
  document.getElementById('save-all-btn').addEventListener('click', saveEntirePlan);
  document.getElementById('print-btn').addEventListener('click', () => window.print());
}

// ---- API Calls ----
async function apiCall(params) {
  const res = await fetch(`${API_URL}?${new URLSearchParams(params).toString()}`);
  return await res.json();
}

async function loadClientList() {
  try {
    const clients = await apiCall({ action: 'listClients' });
    const select = document.getElementById('client-select');
    select.innerHTML = '<option value="">📂 Load saved plan…</option>' + clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (e) { console.error(e); }
}

async function loadExistingPlan() {
  const id = document.getElementById('client-select').value;
  if (!id) return;
  const data = await apiCall({ action: 'getClient', id });
  if (!data.client) return alert('Plan not found.');
  populateForm(data.client);
  goals = data.goals || [];
  renderGoalList();
  currentClientId = id;
  isNewPlan = false;
  document.querySelector('.tab[data-tab="dashboard"]').click();
}

function startNewPlan() {
  currentClientId = Date.now().toString();
  isNewPlan = true;
  clearForm();
  goals = [];
  renderGoalList();
  document.getElementById('client-select').value = '';
  document.querySelector('.tab[data-tab="profile"]').click();
}

function clearForm() {
  document.querySelectorAll('input, select').forEach(el => {
    if (el.id !== 'client-select') el.value = '';
  });
  riskAnswers.fill(null);
  document.getElementById('risk-result').style.display = 'none';
  renderRiskQuiz();
}

function populateForm(client) {
  document.getElementById('client-name').value = client.name || '';
  document.getElementById('client-age').value = client.age || '';
  document.getElementById('client-occupation').value = client.occupation || '';
  document.getElementById('client-dependents').value = client.dependents || '';
  document.getElementById('annual-income').value = client.annualIncome || '';
  document.getElementById('monthly-expenses').value = client.monthlyExpenses || '';
  document.getElementById('emergency-fund').value = client.emergencyFund || '';
  document.getElementById('investments').value = client.investments || '';
  document.getElementById('life-insurance').value = client.lifeInsurance || '';
  document.getElementById('home-loan').value = client.homeLoan || '';
  document.getElementById('other-liabilities').value = client.otherLiabilities || '';
  if (client.riskScore) {
    document.getElementById('manual-score').value = client.riskScore;
    document.getElementById('manual-category').value = client.riskCategory;
  }
}

// ---- Save Functions ----
function collectClientData() {
  return {
    id: currentClientId,
    name: document.getElementById('client-name').value.trim(),
    age: document.getElementById('client-age').value,
    occupation: document.getElementById('client-occupation').value.trim(),
    dependents: document.getElementById('client-dependents').value,
    annualIncome: document.getElementById('annual-income').value,
    monthlyExpenses: document.getElementById('monthly-expenses').value,
    emergencyFund: document.getElementById('emergency-fund').value,
    investments: document.getElementById('investments').value,
    lifeInsurance: document.getElementById('life-insurance').value,
    homeLoan: document.getElementById('home-loan').value,
    otherLiabilities: document.getElementById('other-liabilities').value,
    riskScore: document.getElementById('manual-score').value,
    riskCategory: document.getElementById('manual-category').value
  };
}

async function saveProfile() {
  const data = collectClientData();
  if (!data.name) return alert('Please enter your name.');
  await apiCall({ action: 'saveClient', ...data, goals: JSON.stringify(goals) });
  currentClientId = data.id;
  isNewPlan = false;
  alert('Profile saved!');
  loadClientList();
}

async function saveFinances() {
  if (!currentClientId) return alert('Please save your profile first.');
  const data = collectClientData();
  await apiCall({ action: 'saveClient', ...data, goals: JSON.stringify(goals) });
  alert('Financial data saved!');
}

async function saveRisk() {
  if (!currentClientId) return alert('Please save your profile first.');
  const data = collectClientData();
  await apiCall({ action: 'saveClient', ...data, goals: JSON.stringify(goals) });
  alert('Risk profile saved!');
}

async function saveEntirePlan() {
  if (!currentClientId) return alert('Please save your profile first.');
  const data = collectClientData();
  await apiCall({ action: 'saveClient', ...data, goals: JSON.stringify(goals) });
  alert('Entire plan saved successfully!');
}

// ---- Goals ----
function addGoal() {
  const name = document.getElementById('goal-name').value.trim();
  const cost = parseFloat(document.getElementById('goal-cost').value);
  const years = parseInt(document.getElementById('goal-years').value);
  const inflation = parseFloat(document.getElementById('goal-inflation').value)/100;
  const ret = parseFloat(document.getElementById('goal-return').value)/100;
  const existing = parseFloat(document.getElementById('goal-existing').value)||0;
  if (!name || isNaN(cost) || isNaN(years)) return alert('Fill required fields.');
  goals.push({
    goalId: Date.now().toString(),
    goalName: name,
    currentCost: cost,
    years,
    inflation,
    return: ret,
    existingSavings: existing
  });
  renderGoalList();
  document.getElementById('goal-name').value = '';
  document.getElementById('goal-cost').value = '';
  document.getElementById('goal-years').value = '';
  document.getElementById('goal-existing').value = '0';
}

function removeGoal(id) {
  goals = goals.filter(g => g.goalId !== id);
  renderGoalList();
}

function renderGoalList() {
  const container = document.getElementById('goal-list');
  container.innerHTML = goals.map(g => `
    <div class="goal-item">
      <span><strong>${g.goalName}</strong> – ₹${g.currentCost.toLocaleString()} in ${g.years} years</span>
      <button class="remove-goal-btn" onclick="removeGoal('${g.goalId}')">✕</button>
    </div>
  `).join('');
}

// ---- Risk Quiz ----
function renderRiskQuiz() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = riskQuestions.map((q, idx) => `
    <div class="question-card">
      <h4>${q.id}. ${q.text}</h4>
      <div class="options">
        ${q.options.map((opt, i) => `<div class="option ${riskAnswers[idx] === q.weights[i] ? 'selected' : ''}" data-qid="${q.id}" data-weight="${q.weights[i]}">${opt}</div>`).join('')}
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', function() {
      const qid = parseInt(this.dataset.qid);
      const weight = parseInt(this.dataset.weight);
      const card = this.closest('.question-card');
      card.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      riskAnswers[qid-1] = weight;
      if (!riskAnswers.includes(null)) {
        const total = riskAnswers.reduce((a,b)=>a+b,0);
        let cat = '';
        if (total <= 14) cat = 'Conservative';
        else if (total <= 23) cat = 'Moderately Conservative';
        else if (total <= 32) cat = 'Moderate';
        else if (total <= 41) cat = 'Moderately Aggressive';
        else cat = 'Aggressive';
        document.getElementById('risk-score-display').textContent = total;
        document.getElementById('risk-category-display').textContent = cat;
        document.getElementById('risk-result').style.display = 'block';
        document.getElementById('manual-score').value = total;
        document.getElementById('manual-category').value = cat;
      }
    });
  });
  document.getElementById('apply-risk-btn').addEventListener('click', () => {
    // values are already in manual fields
  });
  document.getElementById('retake-quiz-btn').addEventListener('click', () => {
    riskAnswers.fill(null);
    document.getElementById('risk-result').style.display = 'none';
    renderRiskQuiz();
  });
}

// ---- Dashboard ----
let chartRefs = {};

function updateDashboard() {
  const data = collectClientData();
  const income = parseFloat(data.annualIncome) || 0;
  const expenses = parseFloat(data.monthlyExpenses) || 0;
  const emergency = parseFloat(data.emergencyFund) || 0;
  const investments = parseFloat(data.investments) || 0;
  const lifeCover = parseFloat(data.lifeInsurance) || 0;
  const homeLoan = parseFloat(data.homeLoan) || 0;
  const otherLiab = parseFloat(data.otherLiabilities) || 0;
  const riskCategory = data.riskCategory || '—';

  const assets = investments + emergency;
  const liabilities = homeLoan + otherLiab;
  const netWorth = assets - liabilities;
  const monthlySurplus = (income/12) - expenses;
  const healthScore = Math.min(100, 50 + (monthlySurplus > 0 ? 10 : 0) + (assets > 0 ? 5 : 0) + (netWorth > 0 ? 5 : 0) + (riskCategory !== '—' ? 5 : 0));

  // KPIs
  document.getElementById('kpi-container').innerHTML = `
    <div class="kpi-card"><span>Net Worth</span><strong>₹ ${netWorth.toLocaleString()}</strong></div>
    <div class="kpi-card"><span>Monthly Surplus</span><strong>₹ ${monthlySurplus.toLocaleString()}</strong></div>
    <div class="kpi-card"><span>Risk Category</span><strong>${riskCategory}</strong></div>
    <div class="kpi-card"><span>Financial Health</span><strong>${healthScore} / 100</strong></div>
  `;

  // Net worth table
  document.getElementById('networth-table').innerHTML = `
    <table>
      <tr><th>Assets</th><th>₹</th></tr>
      <tr><td>Investments</td><td>${investments.toLocaleString()}</td></tr>
      <tr><td>Emergency Fund</td><td>${emergency.toLocaleString()}</td></tr>
      <tr class="total-row"><td>Total Assets</td><td>${assets.toLocaleString()}</td></tr>
      <tr><th>Liabilities</th><th>₹</th></tr>
      <tr><td>Home Loan</td><td>${homeLoan.toLocaleString()}</td></tr>
      <tr><td>Other</td><td>${otherLiab.toLocaleString()}</td></tr>
      <tr class="total-row"><td>Total Liabilities</td><td>${liabilities.toLocaleString()}</td></tr>
      <tr class="total-row"><td><strong>Net Worth</strong></td><td><strong>${netWorth.toLocaleString()}</strong></td></tr>
    </table>`;

  // Cash flow chart
  if (chartRefs.cashflow) chartRefs.cashflow.destroy();
  const cashCtx = document.getElementById('cashflow-chart').getContext('2d');
  chartRefs.cashflow = new Chart(cashCtx, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expenses', 'Surplus'],
      datasets: [{ data: [income/12, expenses, monthlySurplus], backgroundColor: ['#3B82F6','#64748B','#10B981'] }]
    },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{color:'#94A3B8'}, grid:{color:'rgba(148,163,184,0.1)'}}, x:{ticks:{color:'#94A3B8'}}} }
  });

  // Goal analysis
  const goalRows = goals.map(g => {
    const fc = g.currentCost * Math.pow(1+g.inflation, g.years);
    const fv = g.existingSavings * Math.pow(1+g.return, g.years);
    const shortfall = fc - fv;
    let sip = 0;
    if (shortfall > 0) {
      const r = g.return/12, n = g.years*12;
      sip = r===0 ? shortfall/n : shortfall * r / (Math.pow(1+r,n)-1);
    }
    return { ...g, futureCost: fc, fvExisting: fv, shortfall, requiredSIP: sip };
  });
  document.getElementById('goal-table').innerHTML = goalRows.length ? `
    <table><tr><th>Goal</th><th>Future Cost</th><th>Shortfall</th><th>SIP/m</th></tr>
    ${goalRows.map(g => `<tr><td>${g.goalName}</td><td>₹${Math.round(g.futureCost).toLocaleString()}</td><td>₹${Math.round(Math.max(0,g.shortfall)).toLocaleString()}</td><td>₹${Math.round(g.requiredSIP).toLocaleString()}</td></tr>`).join('')}
    </table>` : '<p>No goals added yet.</p>';

  if (chartRefs.goal) chartRefs.goal.destroy();
  if (goalRows.length) {
    const goalCtx = document.getElementById('goal-chart').getContext('2d');
    chartRefs.goal = new Chart(goalCtx, {
      type: 'bar',
      data: {
        labels: goalRows.map(g => g.goalName),
        datasets: [
          { label: 'Future Cost', data: goalRows.map(g => g.futureCost), backgroundColor: '#3B82F6' },
          { label: 'FV Savings', data: goalRows.map(g => g.fvExisting), backgroundColor: '#10B981' }
        ]
      },
      options: { responsive:true, plugins:{legend:{position:'bottom', labels:{color:'#F8FAFC'}}}, scales:{y:{beginAtZero:true, ticks:{color:'#94A3B8'}, grid:{color:'rgba(148,163,184,0.1)'}}, x:{ticks:{color:'#94A3B8'}}} }
    });
  }

  // Insurance
  const hlv = Math.round(income * 13);
  const gap = hlv - lifeCover;
  if (chartRefs.insurance) chartRefs.insurance.destroy();
  const insCtx = document.getElementById('insurance-chart').getContext('2d');
  chartRefs.insurance = new Chart(insCtx, {
    type: 'bar',
    data: {
      labels: ['HLV', 'Cover', 'Gap'],
      datasets: [{ data: [hlv, lifeCover, Math.max(0,gap)], backgroundColor: ['#3B82F6','#10B981','#DC2626'] }]
    },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{color:'#94A3B8'}, grid:{color:'rgba(148,163,184,0.1)'}}, x:{ticks:{color:'#94A3B8'}}} }
  });

  // Allocation
  const allocMap = {
    'Conservative': [15,65,10,10],
    'Moderately Conservative': [30,55,10,5],
    'Moderate': [50,40,7,3],
    'Moderately Aggressive': [70,25,5,0],
    'Aggressive': [85,10,5,0]
  };
  const alloc = allocMap[riskCategory] || [50,40,7,3];
  if (chartRefs.allocation) chartRefs.allocation.destroy();
  const allocCtx = document.getElementById('allocation-chart').getContext('2d');
  chartRefs.allocation = new Chart(allocCtx, {
    type: 'doughnut',
    data: {
      labels: ['Equity','Debt','Gold','Cash'],
      datasets: [{ data: alloc, backgroundColor: ['#3B82F6','#14B8A6','#F59E0B','#64748B'] }]
    },
    options: { responsive:true, plugins:{legend:{position:'bottom', labels:{color:'#F8FAFC'}}} }
  });

  // Recommendations
  const recs = [];
  if (monthlySurplus < 0) recs.push('Reduce expenses to create a positive cash flow.');
  if (emergency < expenses*6) recs.push('Build emergency fund to at least 6 months of expenses.');
  if (gap > 0) recs.push(`Consider increasing life insurance by ₹${gap.toLocaleString()} to protect your family.`);
  if (goalRows.some(g => g.shortfall > 0)) recs.push('Start SIPs for underfunded goals as shown above.');
  recs.push('Review your plan annually or after major life changes.');
  document.getElementById('recommendations-list').innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}