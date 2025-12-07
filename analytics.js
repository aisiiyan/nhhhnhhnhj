/* analytics.js - Khusus untuk halaman Analytics */

/* =========================================
   ANALYTICS FUNCTIONALITY
   ========================================= */
function updateTradeCounts() {
    const grid = document.querySelector('.trade-count-grid');
    if (!grid) return;

    const counts = grid.querySelectorAll('.trade-count-item span');
    if (counts.length < 4) return;

    counts[0].textContent = state.closedTradesHistory.length;

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    const monthlyTrades = state.closedTradesHistory.filter(t => 
        t.closeDate.getMonth() === today.getMonth() && 
        t.closeDate.getFullYear() === today.getFullYear()
    ).length;
    counts[1].textContent = monthlyTrades;

    const firstDayOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    firstDayOfWeek.setDate(diff);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    const weeklyTrades = state.closedTradesHistory.filter(t => 
        t.closeDate >= firstDayOfWeek && t.closeDate <= lastDayOfWeek
    ).length;
    counts[2].textContent = weeklyTrades;

    const dailyTrades = state.closedTradesHistory.filter(trade => {
        return trade.closeDate.toISOString().split('T')[0] === todayDateString;
    }).length;
    counts[3].textContent = dailyTrades;
}

let frequentAssetsCurrentPage = 1;
const assetsPerPage = 5;

function renderFrequentAssets() {
    const listContainer = document.getElementById('frequent-assets-list');
    if (!listContainer) return;

    const tradeCounts = state.closedTradesHistory.reduce((acc, trade) => {
        acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
        return acc;
    }, {});
    const sortedAssets = Object.entries(tradeCounts).sort(([, a], [, b]) => b - a);
    
    listContainer.innerHTML = '';
    
    const header = document.createElement('div');
    header.classList.add('frequent-asset-header');
    header.innerHTML = `<span>Nama Coin</span><span class="count-header">Jumlah Trade</span>`;
    listContainer.appendChild(header);

    const startIndex = (frequentAssetsCurrentPage - 1) * assetsPerPage;
    const paginated = sortedAssets.slice(startIndex, startIndex + assetsPerPage);

    if (paginated.length === 0) {
        listContainer.innerHTML += '<div style="text-align:center; padding:10px; color:#aaa;">Belum ada data</div>';
    }

    paginated.forEach(([symbol, count]) => {
        const item = document.createElement('div');
        item.classList.add('frequent-asset-item');
        item.innerHTML = `
            <div class="asset-info">${getCoinIcon(symbol)}<span>${symbol}</span></div>
            <span class="count">${count} kali</span>
        `;
        listContainer.appendChild(item);
    });
}

function renderProfitLossSummary() {
    const totalProfitEl = document.getElementById('summary-total-profit');
    if (!totalProfitEl) return;
    
    let totalProfit = 0;
    let totalLoss = 0;
    let winCount = 0;
    let lossCount = 0;

    state.closedTradesHistory.forEach(trade => {
        if (trade.isWin) {
            totalProfit += trade.pnl;
            winCount++;
        } else {
            totalLoss += trade.pnl;
            lossCount++;
        }
    });

    totalProfitEl.textContent = formatAmount(totalProfit);
    document.getElementById('summary-total-loss').textContent = formatAmount(totalLoss);
    document.getElementById('summary-win-trades').textContent = winCount;
    document.getElementById('summary-loss-trades').textContent = lossCount;
}

let cumulativePnlChartInstance = null;

function renderCumulativePnlChart(period = 'all') {
    const ctx = document.getElementById('cumulativePnlChart');
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
        console.error("Chart.js library not found!");
        return;
    }

    if (cumulativePnlChartInstance) {
        cumulativePnlChartInstance.destroy();
    }

    let filteredTrades = [...state.closedTradesHistory];
    const now = new Date();

    if (period !== 'all') {
        let startDate = new Date();
        if (period === '7d') startDate.setDate(now.getDate() - 7);
        else if (period === '30d') startDate.setDate(now.getDate() - 30);
        else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        filteredTrades = filteredTrades.filter(trade => trade.closeDate >= startDate);
    }

    const sortedTrades = filteredTrades.sort((a, b) => a.closeDate - b.closeDate);
    let cumulativePnl = 0;
    const labels = ['Start'];
    const pnlData = [0];

    sortedTrades.forEach(trade => {
        cumulativePnl += trade.pnl;
        labels.push(new Date(trade.closeDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        pnlData.push(cumulativePnl);
    });

    cumulativePnlChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'PNL Kumulatif (Rp)',
                data: pnlData,
                borderColor: 'rgb(27, 89, 248)',
                backgroundColor: 'rgba(27, 89, 248, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: { callback: (val) => formatAmount(val) }
                }
            }
        }
    });
}

/* =========================================
   INITIALIZE ANALYTICS
   ========================================= */
function initAnalytics() {
    loadDataFromLocalStorage();
    initializeSidebar();
    
    updateTradeCounts();
    renderFrequentAssets();
    renderProfitLossSummary();
    renderCumulativePnlChart('all');

    // Event listener untuk toggle button chart period
    const toggleButtons = document.querySelectorAll('#pnl-chart-toggle .toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const period = btn.dataset.period;
            renderCumulativePnlChart(period);
        });
    });

    // Event listener untuk reset button (jika ada di analytics page)
    const resetBtn = document.getElementById('reset-button');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Apakah Anda yakin ingin menghapus SEMUA data? Aksi ini tidak bisa dibatalkan.")) {
                resetState();
                location.reload();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('cumulativePnlChart')) {
        initAnalytics();
    }
});