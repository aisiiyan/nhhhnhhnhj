/* dashboard.js - Khusus untuk halaman Dashboard */

/* =========================================
   UI FUNCTIONS (Khusus Dashboard)
   ========================================= */
let currentDate = new Date();

function updateOpenAssetsDatalist() {
    const datalist = document.getElementById('open-assets-list');
    if (!datalist) return;
    datalist.innerHTML = '';
    for (const symbol in state.currentAssets) {
        const option = document.createElement('option');
        option.value = symbol;
        datalist.appendChild(option);
    }
}

function renderAssetsTable() {
    const currentAssetsTableBody = document.getElementById('current-assets-body');
    if (!currentAssetsTableBody) return;
    currentAssetsTableBody.innerHTML = '';

    const keys = Object.keys(state.currentAssets);
    if (keys.length === 0) {
        currentAssetsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ccc; padding:20px;">Belum ada aset aktif</td></tr>';
        return;
    }

    for (const symbol in state.currentAssets) {
        const asset = state.currentAssets[symbol];
        
        const quantity = asset.quantity !== undefined 
            ? asset.quantity 
            : (asset.nominalInvested / asset.lastBuyPrice);

        const displayPrice = asset.avgPrice !== undefined 
            ? asset.avgPrice 
            : asset.lastBuyPrice;

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>
                <div class="asset-info">
                    ${getCoinIcon(symbol)}
                    <div>
                        <span style="display:block; line-height:1.2; font-weight:600;">${symbol}</span>
                        <span style="font-size: 11px; color: var(--text-gray); font-weight: 400;">
                            ${quantity.toFixed(4)} unit
                        </span>
                    </div>
                </div>
            </td>
            <td class="asset-value">
                Rp ${formatCurrency(displayPrice)}
                <div style="font-size: 10px; color: var(--text-gray); font-weight: 400;">(Avg Price)</div>
            </td>
            <td class="asset-nominal">Rp ${formatCurrency(asset.nominalInvested)}</td>
        `;
        currentAssetsTableBody.appendChild(newRow);
    }
    updateOpenAssetsDatalist();
}

function renderCalendar(resetDate = true) {
    const calGrid = document.querySelector('.calendar-card .cal-grid');
    const calHeader = document.querySelector('.calendar-card .cal-header span');
    
    if (!calGrid || !calHeader) return;

    if (resetDate) currentDate = new Date();

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    calHeader.textContent = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentDate);
    calGrid.innerHTML = '';

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let dayOfWeek = firstDayOfMonth.getDay();
    const startDayOffset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;

    let totalProfit = 0;
    let totalLoss = 0;

    for (let i = 0; i < startDayOffset; i++) {
        const emptyBox = document.createElement('div');
        emptyBox.classList.add('day-empty');
        calGrid.appendChild(emptyBox);
    }

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        const dayData = state.dailyPNL[dateString];

        const dayBox = document.createElement('div');
        dayBox.classList.add('day-box');

        let boxContent = `<span style="position: absolute; top: 4px; left: 6px; font-size: 10px; font-weight: 500; color: var(--text-dark);">${dayNumber}</span>`;

        if (dayData && dayData.pnl !== 0) {
            const pnl = Number(dayData.pnl);
            const absPnl = Math.abs(pnl);

            let pnlClass = '';
            if (pnl > 0) {
                pnlClass = 'day-win';
                totalProfit += pnl;
            } else {
                pnlClass = 'day-loss';
                totalLoss += pnl;
            }
            dayBox.classList.add(pnlClass);

            let formattedPnl;
            if (absPnl >= 1000000) {
                formattedPnl = (absPnl / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
            } else if (absPnl >= 1000) {
                formattedPnl = (absPnl / 1000).toFixed(0) + 'k';
            } else {
                formattedPnl = absPnl.toFixed(0);
            }

            boxContent += `<div style="margin-top: 10px; font-size: 11px; font-weight: 600;">${pnl > 0 ? '+' : '-'}${formattedPnl}</div>`;
        }

        dayBox.innerHTML = boxContent;

        const now = new Date();
        if (dayNumber === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
            dayBox.style.border = '2px solid var(--primary-blue)';
        }

        calGrid.appendChild(dayBox);
    }

    const footerProfit = document.getElementById('cal-profit-value');
    const footerLoss = document.getElementById('cal-loss-value');
    const footerNet = document.getElementById('cal-pnl-value');

    if (footerProfit) footerProfit.textContent = formatAmount(totalProfit).replace('+', '');
    if (footerLoss) footerLoss.textContent = formatAmount(totalLoss);
    if (footerNet) {
        const net = totalProfit + totalLoss;
        footerNet.textContent = formatAmount(net);
        footerNet.className = '';
        footerNet.classList.add(net >= 0 ? 'text-green' : 'text-red');
    }
}

function navigateCalendar(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar(false);
}

function updateKeyStats() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dateStringToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dateStringYesterday = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    const todayData = state.dailyPNL[dateStringToday] || { pnl: 0, wins: 0, losses: 0 };
    const yesterdayPnl = state.dailyPNL[dateStringYesterday]?.pnl || 0;

    const pnlTodayEl = document.getElementById('pnl-today-value');
    if (pnlTodayEl) {
        let pnlTrend = 0;
        if (yesterdayPnl !== 0) {
            pnlTrend = ((todayData.pnl - yesterdayPnl) / Math.abs(yesterdayPnl)) * 100;
        } else if (todayData.pnl > 0) {
            pnlTrend = 100;
        }
        const trendClass = todayData.pnl >= 0 ? 'trend-up' : 'trend-down';
        pnlTodayEl.innerHTML = `${formatAmount(todayData.pnl)} <span class="trend-badge ${trendClass}">${pnlTrend >= 0 ? '+' : ''}${pnlTrend.toFixed(1)}%</span>`;
    }

    const totalTrades = state.closedTradesHistory.length;
    const totalWins = state.closedTradesHistory.filter(t => t.isWin).length;
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

    const winRateEl = document.getElementById('win-rate-value');
    if (winRateEl) {
        winRateEl.innerHTML = `${formatPercentage(winRate)}`;
    }

    let totalProfit = 0;
    let totalLoss = 0;
    state.closedTradesHistory.forEach(trade => {
        const pnl = Number(trade.pnl);
        if (pnl > 0) totalProfit += pnl;
        if (pnl < 0) totalLoss += pnl;
    });

    const totalProfitEl = document.getElementById('total-profit-value');
    const totalLossEl = document.getElementById('total-loss-value');

    if (totalProfitEl) totalProfitEl.textContent = '+' + formatCurrency(totalProfit);
    if (totalLossEl) totalLossEl.textContent = formatCurrency(totalLoss);
}

function updateMainBalanceDisplay() {
    const mainBalanceValueEl = document.getElementById('main-balance-value');
    if (!mainBalanceValueEl) return;
    
    const totalAssetValue = Object.values(state.currentAssets).reduce((sum, asset) => 
        sum + Number(asset.nominalInvested), 0
    );
    const netWorth = Number(state.currentCashBalance) + totalAssetValue;

    let htmlContent = `Rp ${formatCurrency(state.currentCashBalance)}`;

    if (state.initialBalance > 0) {
        const growth = ((netWorth - state.initialBalance) / state.initialBalance) * 100;
        const badgeClass = growth >= 0 ? 'trend-up' : 'trend-down';
        htmlContent += ` <span class="trend-badge ${badgeClass}">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%</span>`;
    }

    mainBalanceValueEl.innerHTML = htmlContent;
}

function updateNetValueDisplay(period = 'monthly') {
    const netValueEl = document.getElementById('net-value-pnl');
    if (!netValueEl) return;

    const now = new Date();
    let filteredTrades = [];

    if (period === 'monthly') {
        filteredTrades = state.closedTradesHistory.filter(trade => trade.closeDate.getMonth() === now.getMonth() && trade.closeDate.getFullYear() === now.getFullYear());
    } else if (period === 'weekly') {
        const firstDayOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        filteredTrades = state.closedTradesHistory.filter(trade => trade.closeDate >= firstDayOfWeek && trade.closeDate <= lastDayOfWeek);
    } else {
        filteredTrades = state.closedTradesHistory;
    }

    const totalPNL = filteredTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0);
    netValueEl.textContent = formatAmount(totalPNL);
    netValueEl.style.color = totalPNL >= 0 ? 'var(--success)' : 'var(--danger)';
}

function renderPnlChart(period = 'monthly') {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    let dataPoints = [];
    let labels = [];
    const now = new Date();

    if (period === 'monthly') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        dataPoints = Array(12).fill(0);

        state.closedTradesHistory.forEach(trade => {
            if (trade.closeDate.getFullYear() === now.getFullYear()) {
                const month = trade.closeDate.getMonth();
                dataPoints[month] += Number(trade.pnl);
            }
        });

    } else if (period === 'weekly') {
        labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        dataPoints = Array(7).fill(0);

        const firstDayOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        state.closedTradesHistory.forEach(trade => {
            if (trade.closeDate >= firstDayOfWeek && trade.closeDate <= lastDayOfWeek) {
                let dayIndex = trade.closeDate.getDay() - 1;
                if (dayIndex === -1) dayIndex = 6;
                dataPoints[dayIndex] += Number(trade.pnl);
            }
        });
    }

    const maxAbsPnl = Math.max(...dataPoints.map(pnl => Math.abs(pnl)), 1);

    labels.forEach((label, index) => {
        const pnl = dataPoints[index];
        const height = pnl !== 0 ? (Math.abs(pnl) / maxAbsPnl) * 100 : 0;

        const barGroup = document.createElement('div');
        barGroup.classList.add('bar-group');

        const bar = document.createElement('div');
        bar.classList.add('bar');

        if (pnl !== 0) {
            bar.classList.add('active');
        }
        if (pnl < 0) {
            bar.classList.add('loss');
        }

        setTimeout(() => { 
            bar.style.height = `${Math.max(height, 0)}%`;
        }, 10);

        if (pnl !== 0) {
            const pnlValueText = document.createElement('span');
            pnlValueText.classList.add('pnl-value-in-bar');
            pnlValueText.textContent = formatPnlCompact(pnl);
            bar.appendChild(pnlValueText);
        }

        const barLabel = document.createElement('span');
        barLabel.classList.add('bar-label');
        barLabel.textContent = label;

        barGroup.appendChild(bar);
        barGroup.appendChild(barLabel);
        chartContainer.appendChild(barGroup);
    });
}

/* =========================================
   DASHBOARD FUNCTIONALITY
   ========================================= */
function initDashboard() {
    loadDataFromLocalStorage();
    initializeSidebar();
    
    renderAssetsTable();
    updateKeyStats();
    updateMainBalanceDisplay();
    renderCalendar();
    
    renderPnlChart('monthly');
    updateNetValueDisplay('monthly');

    const submitBalanceBtn = document.getElementById('submit-balance-btn');
    const balanceInput = document.getElementById('balance-input');
    
    if (submitBalanceBtn && balanceInput) {
        if (state.initialBalance > 0) {
            balanceInput.value = state.initialBalance;
        }

        submitBalanceBtn.addEventListener('click', () => {
            const val = parseFloat(balanceInput.value);
            if (!isNaN(val) && val > 0) {
                setInitialBalance(val);
                updateMainBalanceDisplay();
                updateKeyStats();
                showToast('Saldo awal berhasil diatur!', 'success');
            } else {
                showToast('Masukkan jumlah saldo yang valid.', 'error');
            }
        });
    }

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

    const timeToggleButtons = document.querySelectorAll('.time-toggle .toggle-btn');
    timeToggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            timeToggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const period = btn.textContent.toLowerCase();
            renderPnlChart(period);
            updateNetValueDisplay(period);
        });
    });

    const prevCalBtn = document.querySelector('.cal-header .fa-caret-left');
    const nextCalBtn = document.querySelector('.cal-header .fa-caret-right');
    if (prevCalBtn && nextCalBtn) {
        prevCalBtn.addEventListener('click', () => navigateCalendar(-1));
        nextCalBtn.addEventListener('click', () => navigateCalendar(1));
    }

    const tradeForm = document.querySelector('.trade-input-form');
    const tradeSymbolInput = document.getElementById('trade-symbol');
    const searchResultsContainer = document.querySelector('.coin-search-results');
    
    if (tradeSymbolInput && searchResultsContainer) {
        tradeSymbolInput.addEventListener('input', function() {
            const query = this.value.toUpperCase();
            searchResultsContainer.innerHTML = '';
            
            if (query.length < 1) {
                searchResultsContainer.style.display = 'none';
                return;
            }

            const ownedAssets = Object.keys(state.currentAssets);
            const staticCoinSymbols = coinList.map(c => c.symbol);
            const allCoins = [...new Set([...staticCoinSymbols, ...ownedAssets])];
            
            const matches = allCoins.filter(coin => coin.includes(query));

            if (matches.length > 0) {
                searchResultsContainer.style.display = 'block';
                matches.slice(0, 5).forEach(coin => {
                    const item = document.createElement('a');
                    item.className = 'coin-search-item';
                    item.innerHTML = `
                        ${getCoinIcon(coin)}
                        <strong>${coin}</strong>
                    `;
                    item.addEventListener('click', () => {
                        tradeSymbolInput.value = coin;
                        searchResultsContainer.style.display = 'none';
                    });
                    searchResultsContainer.appendChild(item);
                });
            } else {
                searchResultsContainer.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!tradeSymbolInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
                searchResultsContainer.style.display = 'none';
            }
        });
    }

    if (tradeForm) {
        const tradeStatusSelect = document.getElementById('trade-status');
        const recentTradesTableBody = document.getElementById('recent-trades-body');

        tradeForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const symbol = tradeSymbolInput.value.toUpperCase().trim();
            const price = parseFloat(document.getElementById('trade-price').value);
            const amount = parseFloat(document.getElementById('trade-amount').value);
            const type = tradeStatusSelect.value;
            const now = new Date();

            if (!symbol || isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) {
                showToast('Harap isi semua kolom dengan benar.', 'error');
                return;
            }

            const tradeQty = amount / price;

            if (type === 'jual') {
                if (!state.currentAssets[symbol]) {
                    showToast(`Anda tidak memiliki aset ${symbol} untuk dijual.`, 'error');
                    return;
                }

                const currentAsset = state.currentAssets[symbol];
                const currentQty = currentAsset.quantity !== undefined ? currentAsset.quantity : (currentAsset.nominalInvested / currentAsset.lastBuyPrice);

                if (tradeQty > (currentQty + 0.000001)) {
                    showToast(`Saldo tidak cukup! Anda punya ${currentQty.toFixed(4)} ${symbol}.`, 'error');
                    return;
                }
            }

            let isWin = false;
            let status = 'OPEN';
            let statusClass = 'status-open';
            let pnlChange = 0;

            if (type === 'jual') {
                const assetData = state.currentAssets[symbol];
                const avgBuyPrice = assetData.avgPrice || assetData.lastBuyPrice; 
                const costBasis = avgBuyPrice * tradeQty;

                pnlChange = amount - costBasis;
                isWin = pnlChange > 0;
                status = pnlChange > 100 ? 'PROFIT' : (pnlChange < -100 ? 'LOSS' : 'BEP');
                statusClass = pnlChange > 100 ? 'status-win' : (pnlChange < -100 ? 'status-loss' : 'status-open');

                state.closedTradesHistory.push({
                    id: `trade-${Date.now()}`,
                    symbol: symbol,
                    closeDate: new Date(now),
                    pnl: pnlChange,
                    isWin: isWin,
                    openPrice: avgBuyPrice,
                    openNominal: costBasis,
                    closePrice: price,
                    closeAmount: amount
                });

                updateDailyPNL(pnlChange, isWin, now);
            }

            updateCashBalance(amount, type);
            updateCurrentAssets(symbol, price, amount, type);
            
            saveDataToLocalStorage();
            renderAssetsTable();
            updateKeyStats();
            updateMainBalanceDisplay();
            
            const activePeriodButton = document.querySelector('.time-toggle .toggle-btn.active');
            if (activePeriodButton) {
                const period = activePeriodButton.textContent.toLowerCase();
                updateNetValueDisplay(period);
                renderPnlChart(period);
                renderCalendar(false);
            }

            if (recentTradesTableBody) {
                const newRow = document.createElement('tr');
                const timeString = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                
                let priceDisplay = type === 'jual' 
                    ? `<span style="font-size:11px; color:#888;">Avg: ${formatCurrency(state.closedTradesHistory[state.closedTradesHistory.length-1].openPrice)}</span><br>${formatCurrency(price)}`
                    : formatCurrency(price);

                let nominalDisplay = type === 'jual'
                    ? `<strong style="color: ${pnlChange >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatAmount(pnlChange)}</strong>`
                    : `Rp ${formatCurrency(amount)}`;

                newRow.innerHTML = `
                    <td><div class="asset-info">${getCoinIcon(symbol)}<span>${symbol}</span></div></td>
                    <td style="color: var(${type === 'beli' ? '--success' : '--danger'}); font-weight:600; text-transform: capitalize;">${type}</td>
                    <td style="font-size:12px; color:var(--text-gray);">${timeString}</td>
                    <td>${priceDisplay}</td>
                    <td>${nominalDisplay}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                `;
                recentTradesTableBody.prepend(newRow);
            }

            showToast(`Transaksi ${type.toUpperCase()} ${symbol} berhasil!`, 'success');
            tradeForm.reset();
        });
    }
}

/* =========================================
   INITIALIZE DASHBOARD
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('main-balance-value')) {
        initDashboard();
    }
});