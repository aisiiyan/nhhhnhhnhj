/* history.js - Khusus untuk halaman History */

/* =========================================
   HISTORY FUNCTIONALITY
   ========================================= */
function initHistory() {
    loadDataFromLocalStorage();
    initializeSidebar();

    const historyTable = document.getElementById('history-table');
    const searchInput = document.getElementById('history-search-input');
    const paginationContainer = document.getElementById('pagination-container');

    let currentPage = 1;
    const tradesPerPage = 10;

    function renderHistoryPage(filterText = '') {
        if (!historyTable) return;
        const historyBody = historyTable.querySelector('tbody');
        historyBody.innerHTML = '';

        const lowerCaseFilter = filterText.toLowerCase().trim();
        const filteredTrades = state.closedTradesHistory.filter(trade => 
            trade.symbol.toLowerCase().includes(lowerCaseFilter)
        );

        if (filteredTrades.length === 0) {
            historyBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Belum ada riwayat transaksi.</td></tr>';
            return;
        }

        const sortedTrades = filteredTrades.sort((a, b) => new Date(b.closeDate) - new Date(a.closeDate));
        
        const startIndex = (currentPage - 1) * tradesPerPage;
        const paginatedTrades = sortedTrades.slice(startIndex, startIndex + tradesPerPage);

        paginatedTrades.forEach(trade => {
            const mainRow = document.createElement('tr');
            mainRow.dataset.tradeId = trade.id;
            
            const timeString = new Date(trade.closeDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit' });
            const statusClass = trade.isWin ? 'status-win' : 'status-loss';
            const statusText = trade.isWin ? 'PROFIT' : 'LOSS';

            mainRow.innerHTML = `
                <td><i class="fas fa-chevron-down history-arrow" style="cursor:pointer; color: var(--text-gray);"></i></td>
                <td><div class="asset-info">${getCoinIcon(trade.symbol)}<span>${trade.symbol}</span></div></td>
                <td style="font-size:12px; color:var(--text-gray);">${timeString}</td>
                <td>
                    <div style="font-size:12px;">
                        <span style="color:#aaa;">Beli:</span> ${formatCurrency(trade.openPrice)}<br>
                        <span style="color:#aaa;">Jual:</span> ${formatCurrency(trade.closePrice)}
                    </div>
                </td>
                <td><strong style="color: ${trade.pnl >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatAmount(trade.pnl)}</strong></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;

            const detailRow = document.createElement('tr');
            detailRow.classList.add('trade-detail-row', 'hidden');
            detailRow.dataset.detailFor = trade.id;
            detailRow.innerHTML = `
                <td colspan="6" class="trade-detail-cell" style="background:#fcfdff; padding: 15px;">
                    <div style="display:flex; justify-content:space-around;">
                        <div>
                            <h4>ENTRY</h4>
                            <p>Modal: ${formatCurrency(trade.openNominal)}</p>
                        </div>
                        <div>
                            <h4>RESULT</h4>
                            <p>PnL: ${formatCurrency(trade.pnl)}</p>
                        </div>
                        <div>
                            <h4>EXIT</h4>
                            <p>Total: ${formatCurrency(trade.closeAmount)}</p>
                        </div>
                    </div>
                </td>
            `;

            historyBody.appendChild(mainRow);
            historyBody.appendChild(detailRow);
        });
        
        renderPagination(sortedTrades.length);
    }

    function renderPagination(totalItems) {
        if(!paginationContainer) return;
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / tradesPerPage);
        
        if (totalPages <= 1) return;

        const info = document.createElement('span');
        info.textContent = `Page ${currentPage} of ${totalPages}`;
        info.style.marginRight = '10px';
        
        const prev = document.createElement('button');
        prev.innerText = 'Prev';
        prev.disabled = currentPage === 1;
        prev.onclick = () => { currentPage--; renderHistoryPage(searchInput.value); };

        const next = document.createElement('button');
        next.innerText = 'Next';
        next.disabled = currentPage === totalPages;
        next.onclick = () => { currentPage++; renderHistoryPage(searchInput.value); };

        paginationContainer.append(info, prev, next);
    }

    if (historyTable) {
        historyTable.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-arrow')) {
                const tr = e.target.closest('tr');
                const detailRow = historyTable.querySelector(`.trade-detail-row[data-detail-for="${tr.dataset.tradeId}"]`);
                if (detailRow) {
                    const isHidden = detailRow.style.display === 'none' || detailRow.classList.contains('hidden');
                    if(isHidden) {
                        detailRow.classList.remove('hidden');
                        detailRow.style.display = 'table-row';
                        e.target.classList.replace('fa-chevron-down', 'fa-chevron-up');
                    } else {
                        detailRow.classList.add('hidden');
                        detailRow.style.display = 'none';
                        e.target.classList.replace('fa-chevron-up', 'fa-chevron-down');
                    }
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentPage = 1;
            renderHistoryPage(e.target.value);
        });
    }

    renderHistoryPage();
}

/* =========================================
   INITIALIZE HISTORY
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('history-table')) {
        initHistory();
    }
});