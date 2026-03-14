const state = {
    balance: 10000, usedMargin: 0, availableMargin: 10000, leverage: 10,
    currentSymbol: 'BTCUSDT', currentPrice: 43250.50, markPrice: 43250.50,
    orderType: 'limit', panelTab: 'positions', positions: [], openOrders: [], orderHistory: [],
    markets: [
        { symbol: 'BTCUSDT', price: 43250.50, change: 2.34 },
        { symbol: 'ETHUSDT', price: 2280.40, change: -1.2 },
        { symbol: 'SOLUSDT', price: 98.56, change: 5.67 },
        { symbol: 'XRPUSDT', price: 0.6234, change: -0.45 },
        { symbol: 'DOGEUSDT', price: 0.0892, change: 8.23 },
        { symbol: 'ADAUSDT', price: 0.5843, change: 1.23 },
        { symbol: 'AVAXUSDT', price: 35.42, change: 4.56 },
        { symbol: 'DOTUSDT', price: 7.23, change: -2.1 },
        { symbol: 'MATICUSDT', price: 0.8934, change: 3.45 },
        { symbol: 'LINKUSDT', price: 14.82, change: -1.8 }
    ]
};

let chart, candlestickSeries, markPriceLine;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    renderMarkets();
    updateOrderBook();
    startPriceSimulation();
    updatePanel();
    updateMaxQty();
    document.getElementById('limit-price').value = state.currentPrice.toFixed(2);
});

function initChart() {
    const chartContainer = document.getElementById('chart-container');
    chart = LightweightCharts.createChart(chartContainer, {
        layout: { background: { color: '#0b0e11' }, textColor: '#848e9c' },
        grid: { vertLines: { color: '#1f232f' }, horzLines: { color: '#1f232f' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#2d3748', scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: '#2d3748', timeVisible: true, secondsVisible: false },
        handleScroll: { vertTouchDrag: false }
    });
    candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00b897', downColor: '#ff6b6b', borderVisible: false,
        wickUpColor: '#00b897', wickDownColor: '#ff6b6b'
    });
    markPriceLine = candlestickSeries.createPriceLine({
        price: state.markPrice, color: '#ffa500', lineWidth: 1,
        lineStyle: LightweightCharts.LineStyle.Dashed, title: 'Mark'
    });
    candlestickSeries.setData(generateCandleData(100));
    chart.timeScale().fitContent();
}

function generateCandleData(count) {
    const data = [];
    let time = new Date(Date.now() - count * 3600000);
    let price = state.currentPrice * 0.98;
    for (let i = 0; i < count; i++) {
        const open = price + (Math.random() - 0.5) * price * 0.02;
        const close = open + (Math.random() - 0.5) * price * 0.02;
        data.push({
            time: time.toISOString().slice(0, 16),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(Math.max(open, close) + Math.random() * 100),
            low: parseFloat(Math.min(open, close) - Math.random() * 100),
            close: parseFloat(close.toFixed(2))
        });
        price = close;
        time = new Date(time.getTime() + 3600000);
    }
    return data;
}

function renderMarkets() {
    document.getElementById('market-list').innerHTML = state.markets.map(m => `
        <div onclick="selectSymbol('${m.symbol}')" class="grid grid-cols-3 px-3 py-2.5 hover:bg-[#1f232f] cursor-pointer border-b border-[#2d3748] ${m.symbol === state.currentSymbol ? 'bg-[#1f232f] border-l-2 border-l-orange-500' : ''}">
            <div><div class="font-medium text-white">${m.symbol.replace('USDT', '')}</div><div class="text-xs text-[#848e9c]">Perp</div></div>
            <div class="text-right font-mono ${m.change >= 0 ? 'text-[#00b897]' : 'text-[#ff6b6b]'}">${m.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: m.price < 1 ? 4 : 2})}</div>
            <div class="text-right ${m.change >= 0 ? 'text-[#00b897]' : 'text-[#ff6b6b]'}">${m.change > 0 ? '+' : ''}${m.change}%</div>
        </div>
    `).join('');
}

function selectSymbol(symbol) {
    state.currentSymbol = symbol;
    const market = state.markets.find(m => m.symbol === symbol);
    state.currentPrice = market.price;
    document.getElementById('current-symbol').textContent = symbol;
    document.getElementById('mark-price').textContent = market.price.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('mark-price').className = `font-mono text-lg font-bold ${market.change >= 0 ? 'text-[#00b897]' : 'text-[#ff6b6b]'}`;
    document.getElementById('price-change').textContent = `${market.change > 0 ? '+' : ''}${market.change}%`;
    document.getElementById('price-change').className = `text-xs ${market.change >= 0 ? 'text-[#00b897]' : 'text-[#ff6b6b]'}`;
    document.getElementById('limit-price').value = market.price.toFixed(2);
    renderMarkets();
    candlestickSeries.setData(generateCandleData(100));
    markPriceLine.applyOptions({ price: market.price });
    updateMaxQty();
}

function startPriceSimulation() {
    setInterval(() => {
        const market = state.markets.find(m => m.symbol === state.currentSymbol);
        const change = (Math.random() - 0.5) * market.price * 0.002;
        market.price *= (1 + change);
        state.currentPrice = market.price;
        state.markPrice = market.price;
        document.getElementById('mark-price').textContent = market.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const lastCandle = candlestickSeries.data()[candlestickSeries.data().length - 1];
        if (lastCandle) {
            candlestickSeries.update({
                ...lastCandle, close: market.price,
                high: Math.max(lastCandle.high, market.price),
                low: Math.min(lastCandle.low, market.price)
            });
        }
        markPriceLine.applyOptions({ price: market.price });
        updateOrderBook();
        updatePositions();
        updateOrderValue();
    }, 1500);
    setInterval(() => {
        state.nextFunding = (state.nextFunding || 19412) - 1;
        if (state.nextFunding <= 0) state.nextFunding = 28800;
        const hours = Math.floor(state.nextFunding / 3600);
        const mins = Math.floor((state.nextFunding % 3600) / 60);
        const secs = state.nextFunding % 60;
        const el = document.querySelector('.animate-pulse');
        if (el) el.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
    setInterval(() => {
        const container = document.getElementById('recent-trades');
        const isBuy = Math.random() > 0.5;
        const price = state.currentPrice * (1 + (Math.random() - 0.5) * 0.0005);
        const size = (Math.random() * 0.5).toFixed(4);
        const time = new Date().toTimeString().split(' ')[0].slice(0, 8);
        const div = document.createElement('div');
        div.className = 'flex justify-between text-xs font-mono';
        div.innerHTML = `<span class="${isBuy ? 'text-[#00b897]' : 'text-[#ff6b6b]'}">${price.toFixed(2)}</span><span class="text-white">${size}</span><span class="text-[#848e9c]">${time}</span>`;
        container.insertBefore(div, container.firstChild);
        if (container.children.length > 50) container.removeChild(container.lastChild);
    }, 800);
}

function updateOrderBook() {
    const spread = state.currentPrice * 0.0002;
    const basePrice = state.currentPrice;
    let asksHtml = '';
    for (let i = 8; i > 0; i--) {
        const price = basePrice + (spread * i) + (Math.random() * spread * 0.5);
        const size = (Math.random() * 2 + 0.01).toFixed(4);
        const total = (price * parseFloat(size)).toFixed(2);
        const width = Math.min(100, parseFloat(size) * 40);
        asksHtml += `<div class="grid grid-cols-3 px-2 py-1 relative hover:bg-[#2d3748] cursor-pointer"><div class="absolute right-0 top-0 bottom-0 opacity-15 bg-[#ff6b6b]" style="width: ${width}%"></div><span class="relative text-[#ff6b6b]">${price.toFixed(2)}</span><span class="relative text-right text-white">${size}</span><span class="relative text-right text-[#848e9c]">${total}</span></div>`;
    }
    let bidsHtml = '';
    for (let i = 1; i <= 8; i++) {
        const price = basePrice - (spread * i) - (Math.random() * spread * 0.5);
        const size = (Math.random() * 2 + 0.01).toFixed(4);
        const total = (price * parseFloat(size)).toFixed(2);
        const width = Math.min(100, parseFloat(size) * 40);
        bidsHtml += `<div class="grid grid-cols-3 px-2 py-1 relative hover:bg-[#2d3748] cursor-pointer"><div class="absolute right-0 top-0 bottom-0 opacity-15 bg-[#00b897]" style="width: ${width}%"></div><span class="relative text-[#00b897]">${price.toFixed(2)}</span><span class="relative text-right text-white">${size}</span><span class="relative text-right text-[#848e9c]">${total}</span></div>`;
    }
    document.getElementById('order-book-asks').innerHTML = asksHtml;
    document.getElementById('order-book-bids').innerHTML = bidsHtml;
    document.getElementById('spread-price').textContent = basePrice.toFixed(2);
}

function updateLeverage(value) {
    state.leverage = parseInt(value);
    document.getElementById('leverage-display').textContent = value + 'x';
    updateMaxQty();
}

function setOrderType(type) {
    state.orderType = type;
    ['limit', 'market', 'conditional'].forEach(t => {
        const tab = document.getElementById(`tab-${t}`);
        if (t === type) {
            tab.className = 'flex-1 py-1.5 text-xs rounded font-medium bg-[#1f232f] text-white transition';
        } else {
            tab.className = 'flex-1 py-1.5 text-xs rounded font-medium text-[#848e9c] hover:text-white transition';
        }
    });
    document.getElementById('limit-price-group').classList.toggle('hidden', type === 'market');
    document.getElementById('trigger-price-group').classList.toggle('hidden', type !== 'conditional');
    if (type === 'market') document.getElementById('limit-price').value = state.currentPrice.toFixed(2);
}

function updateOrderValue() {
    const qty = parseFloat(document.getElementById('order-qty').value) || 0;
    const price = state.orderType === 'market' ? state.currentPrice : (parseFloat(document.getElementById('limit-price').value) || state.currentPrice);
    const cost = qty * price / state.leverage;
    document.getElementById('order-cost').textContent = cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' USD';
}

function updateMaxQty() {
    const max = (state.availableMargin * state.leverage) / state.currentPrice;
    document.getElementById('max-qty').textContent = max.toFixed(4) + ' BTC';
}

function setQtyPercent(percent) {
    const max = (state.availableMargin * state.leverage) / state.currentPrice;
    const qty = max * (percent / 100);
    document.getElementById('order-qty').value = qty.toFixed(4);
    updateOrderValue();
}

function placeOrder(side) {
    const qty = parseFloat(document.getElementById('order-qty').value);
    if (!qty || qty <= 0) { showToast('Error', 'Please enter quantity', 'error'); return; }
    const price = state.orderType === 'market' ? state.currentPrice : parseFloat(document.getElementById('limit-price').value);
    if (state.orderType !== 'market' && !price) { showToast('Error', 'Please enter price', 'error'); return; }
    const notional = qty * price;
    const margin = notional / state.leverage;
    if (margin > state.availableMargin) { showToast('Error', 'Insufficient margin', 'error'); return; }
    if (state.orderType === 'market') {
        executeTrade(side, qty, price, state.leverage);
    } else {
        state.openOrders.push({ id: Date.now(), side, qty, price, leverage: state.leverage, type: state.orderType, symbol: state.currentSymbol, time: new Date().toLocaleString(), filled: 0 });
        showToast('Order Placed', `${side.toUpperCase()} ${qty} BTC at $${price}`, 'success');
    }
    updatePanel();
    document.getElementById('order-qty').value = '';
    updateOrderValue();
}

function executeTrade(side, qty, price, leverage) {
    const notional = qty * price;
    const margin = notional / leverage;
    const existingPos = state.positions.find(p => p.symbol === state.currentSymbol && p.side === side);
    if (existingPos) {
        const totalQty = existingPos.qty + qty;
        const avgEntry = ((existingPos.entry * existingPos.qty) + (price * qty)) / totalQty;
        existingPos.qty = totalQty;
        existingPos.entry = avgEntry;
        existingPos.notional = totalQty * avgEntry;
        existingPos.margin = existingPos.notional / existingPos.leverage;
    } else {
        const oppositePos = state.positions.find(p => p.symbol === state.currentSymbol && p.side !== side);
        if (oppositePos) {
            if (oppositePos.qty > qty) {
                const pnl = (side === 'buy' ? oppositePos.entry - price : price - oppositePos.entry) * qty;
                state.balance += pnl;
                oppositePos.qty -= qty;
                oppositePos.notional = oppositePos.qty * oppositePos.entry;
                oppositePos.margin = oppositePos.notional / oppositePos.leverage;
                showToast('Position Reduced', `Realized P&L: $${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'error');
            } else {
                const remaining = qty - oppositePos.qty;
                const pnl = (side === 'buy' ? oppositePos.entry - price : price - oppositePos.entry) * oppositePos.qty;
                state.balance += pnl;
                state.positions = state.positions.filter(p => p !== oppositePos);
                if (remaining > 0) {
                    state.positions.push({ symbol: state.currentSymbol, side, qty: remaining, entry: price, notional: remaining * price, margin: (remaining * price) / leverage, leverage, liqPrice: side === 'buy' ? price * (1 - 0.9 / leverage) : price * (1 + 0.9 / leverage) });
                }
            }
        } else {
            state.positions.push({ symbol: state.currentSymbol, side, qty, entry: price, notional, margin, leverage, liqPrice: side === 'buy' ? price * (1 - 0.9 / leverage) : price * (1 + 0.9 / leverage) });
        }
    }
    state.usedMargin += margin;
    state.availableMargin -= margin;
    state.orderHistory.unshift({ symbol: state.currentSymbol, side, qty, price, leverage, time: new Date().toLocaleString(), type: 'Market' });
    updateUI();
    showToast('Position Opened', `${side.toUpperCase()} ${qty} BTC at $${price} (${leverage}x)`, 'success');
}

function setPanelTab(tab) {
    state.panelTab = tab;
    ['positions', 'open-orders', 'order-history', 'assets'].forEach(t => {
        const el = document.getElementById(`panel-tab-${t}`);
        if (t === tab) {
            el.classList.add('active');
            el.style.color = '#fff';
            el.style.position = 'relative';
            el.innerHTML = el.innerHTML.split('(')[0] + (t === 'positions' ? `(${state.positions.length})` : t === 'open-orders' ? `(${state.openOrders.length})` : '');
        } else {
            el.classList.remove('active');
            el.style.color = '#848e9c';
            el.style.position = 'static';
        }
    });
    updatePanel();
}

function updatePanel() {
    const container = document.getElementById('panel-content');
    if (state.panelTab === 'positions') {
        if (state.positions.length === 0) {
            container.innerHTML = '<div class="text-center text-[#848e9c] py-8">No positions</div>';
        } else {
            container.innerHTML = state.positions.map(pos => {
                const pnl = (state.currentPrice - pos.entry) * pos.qty * (pos.side === 'buy' ? 1 : -1);
                const pnlPercent = (pnl / pos.margin) * 100;
                const isLiqWarning = Math.abs(pnl) > pos.margin * 0.8;
                return `<div class="bg-[#0b0e11] border ${isLiqWarning ? 'border-l-4 border-l-[#ff6b6b]' : 'border-[#2d3748]'} rounded-lg p-3 mb-3"><div class="flex justify-between items-start mb-2"><div><span class="font-bold text-white">${pos.symbol}</span><span class="text-xs ${pos.side === 'buy' ? 'text-[#00b897]' : 'text-[#ff6b6b]'} ml-2 px-1.5 py-0.5 rounded bg-[#1f232f]">${pos.side === 'buy' ? 'Long' : 'Short'} ${pos.leverage}x</span></div><button onclick="closePosition('${pos.symbol}', '${pos.side}')" class="text-xs text-[#ff6b6b] hover:underline">Close</button></div><div class="grid grid-cols-2 gap-2 text-xs mb-3"><div><div class="text-[#848e9c]">Size</div><div class="font-mono text-white">${pos.qty.toFixed(4)} BTC</div></div><div><div class="text-[#848e9c]">Entry/Mark</div><div class="font-mono text-white">${pos.entry.toFixed(2)} / ${state.currentPrice.toFixed(2)}</div></div><div><div class="text-[#848e9c]">Margin</div><div class="font-mono text-white">$${pos.margin.toFixed(2)}</div></div><div><div class="text-[#848e9c]">Liq. Price</div><div class="font-mono ${isLiqWarning ? 'text-[#ff6b6b] font-bold' : 'text-[#848e9c]'}">${pos.liqPrice.toFixed(2)}</div></div></div><div class="flex justify-between items-center pt-2 border-t border-[#2d3748]"><span class="text-xs text-[#848e9c]">Unrealized P&L</span><span class="font-mono font-bold ${pnl >= 0 ? 'text-[#00b897]' : 'text-[#ff6b6b]'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)</span></div></div>`;
            }).join('');
        }
        updatePositionPanel();
    } else if (state.panelTab === 'open-orders') {
        container.innerHTML = state.openOrders.length === 0 ? '<div class="text-center text-[#848e9c] py-8">No open orders</div>' : state.openOrders.map(order => `<div class="bg-[#0b0e11] border border-[#2d3748] rounded-lg p-3 mb-2"><div class="flex justify-between items-start mb-2"><div><span class="font-medium text-white">${order.symbol}</span><span class="text-xs ${order.side === 'buy' ? 'text-[#00b897]' : 'text-[#ff6b6b]'} ml-2">${order.side.toUpperCase()}</span><span class="text-xs text-[#848e9c] ml-1">${order.type}</span></div><button onclick="cancelOrder(${order.id})" class="text-[#848e9c] hover:text-white">×</button></div><div class="grid grid-cols-3 gap-2 text-xs text-[#848e9c]"><div>Qty: <span class="text-white font-mono">${order.qty}</span></div><div>Price: <span class="text-white font-mono">${order.price.toFixed(2)}</span></div><div>Leverage: <span class="text-white font-mono">${order.leverage}x</span></div></div><div class="text-xs text-[#848e9c] mt-1">${order.time}</div></div>`).join('');
    } else if (state.panelTab === 'order-history') {
        container.innerHTML = state.orderHistory.slice(0, 20).map(h => `<div class="flex justify-between items-center py-2 border-b border-[#2d3748] text-xs"><div><span class="${h.side === 'buy' ? 'text-[#00b897]' : 'text-[#ff6b6b]'} font-medium">${h.side.toUpperCase()}</span><span class="text-white ml-1">${h.symbol}</span><span class="text-[#848e9c] ml-1">${h.type}</span></div><div class="text-right"><div class="font-mono text-white">${h.qty} @ $${h.price.toFixed(2)}</div><div class="text-[#848e9c]">${h.time.split(',')[1] || h.time}</div></div></div>`).join('');
    } else if (state.panelTab === 'assets') {
        const total = state.balance + state.positions.reduce((sum, p) => sum + p.margin + ((state.currentPrice - p.entry) * p.qty * (p.side === 'buy' ? 1 : -1)), 0);
        container.innerHTML = `<div class="space-y-4"><div class="bg-[#0b0e11] border border-[#2d3748] rounded-lg p-4"><div class="text-xs text-[#848e9c] mb-1">Total Equity</div><div class="text-2xl font-bold font-mono text-white">$${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></div><div class="grid grid-cols-2 gap-3"><div class="bg-[#0b0e11] border border-[#2d3748] rounded-lg p-3"><div class="text-xs text-[#848e9c] mb-1">Available Margin</div><div class="text-lg font-bold font-mono text-[#00b897]">$${state.availableMargin.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></div><div class="bg-[#0b0e11] border border-[#2d3748] rounded-lg p-3"><div class="text-xs text-[#848e9c] mb-1">Used Margin</div><div class="text-lg font-bold font-mono text-orange-500">$${state.usedMargin.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></div></div><div class="bg-[#0b0e11] border border-[#2d3748] rounded-lg p-4"><div class="text-xs font-medium text-white mb-3">Margin Ratio</div><div class="h-2 bg-[#1f232f] rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-green-500 to-red-500" style="width: ${Math.min(100, (state.usedMargin / (state.availableMargin + state.usedMargin)) * 100)}%"></div></div><div class="flex justify-between text-xs mt-2"><span class="text-[#848e9c]">Safe</span><span class="text-white font-medium">${((state.usedMargin / (state.availableMargin + state.usedMargin)) * 100).toFixed(1)}% used</span><span class="text-[#ff6b6b]">Liquidation</span></div></div></div>`;
    }
    setPanelTab(state.panelTab);
}

function updatePositionPanel() {
    const panel = document.getElementById('position-panel');
    if (state.positions.length === 0) { panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');
    const pos = state.positions[0];
    const pnl = (state.currentPrice - pos.entry) * pos.qty * (pos.side === 'buy' ? 1 : -1);
    document.getElementById('pos-size').textContent = pos.qty.toFixed(4) + ' BTC';
    document.getElementById('pos-entry').textContent = pos.entry.toFixed(2);
    document.getElementById('pos-mark').textContent = state.currentPrice.toFixed(2);
    document.getElementById('pos-liq').textContent = pos.liqPrice.toFixed(2);
    document.getElementById('pos-margin').textContent = '$' + pos.margin.toFixed(2);
    const pnlEl = document.getElementById('pos-pnl');
    pnlEl.textContent = (pnl >= 0 ? '+' : '') + '$' + pnl.toFixed(2);
    pnlEl.className = 'font-mono font-bold text-base ' + (pnl >= 0 ? 'text-[#00b897]' : 'text-[#ff6b6b]');
}

function updatePositions() {
    state.positions.forEach(pos => {
        if ((pos.side === 'buy' && state.currentPrice <= pos.liqPrice) || (pos.side === 'sell' && state.currentPrice >= pos.liqPrice)) {
            liquidatePosition(pos);
        }
    });
    updatePanel();
}

function liquidatePosition(pos) {
    state.positions = state.positions.filter(p => p !== pos);
    state.usedMargin -= pos.margin;
    state.availableMargin += pos.margin;
    showToast('LIQUIDATED', `${pos.symbol} position liquidated at $${state.currentPrice.toFixed(2)}`, 'error');
}

function closePosition(symbol, side) {
    const pos = state.positions.find(p => p.symbol === symbol && p.side === side);
    if (!pos) return;
    const pnl = (state.currentPrice - pos.entry) * pos.qty * (pos.side === 'buy' ? 1 : -1);
    state.balance += pnl;
    state.usedMargin -= pos.margin;
    state.availableMargin += pos.margin + pnl;
    state.positions = state.positions.filter(p => p !== pos);
    state.orderHistory.unshift({ symbol, side: side === 'buy' ? 'sell' : 'buy', qty: pos.qty, price: state.currentPrice, leverage: pos.leverage, time: new Date().toLocaleString(), type: 'Close' });
    showToast('Position Closed', `Realized P&L: $${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'error');
    updateUI();
    updatePanel();
}

function closeAllPositions() { [...state.positions].forEach(pos => closePosition(pos.symbol, pos.side)); }

function cancelOrder(id) { state.openOrders = state.openOrders.filter(o => o.id !== id); updatePanel(); showToast('Cancelled', 'Order cancelled', 'info'); }

function cancelAllOrders() { state.openOrders = []; updatePanel(); showToast('Cancelled', 'All orders cancelled', 'info'); }

function addMargin() {
    const amount = prompt('Enter additional margin (USD):');
    if (!amount || isNaN(amount)) return;
    const amt = parseFloat(amount);
    if (amt > state.availableMargin) { showToast('Error', 'Insufficient available margin', 'error'); return; }
    if (state.positions.length > 0) {
        const pos = state.positions[0];
        pos.margin += amt;
        pos.liqPrice = pos.side === 'buy' ? pos.entry * (1 - (pos.margin * pos.leverage / (pos.qty * pos.entry)) * 0.9) : pos.entry * (1 + (pos.margin * pos.leverage / (pos.qty * pos.entry)) * 0.9);
        state.availableMargin -= amt;
        state.usedMargin += amt;
        updateUI();
        updatePanel();
        showToast('Success', 'Margin added', 'success');
    }
}

function setTPSL() {
    const tp = prompt('Take Profit Price (0 to skip):');
    const sl = prompt('Stop Loss Price (0 to skip):');
    showToast('TP/SL Set', `TP: ${tp || 'None'}, SL: ${sl || 'None'}`, 'info');
}

function updateUI() {
    const totalEquity = state.balance + state.positions.reduce((sum, p) => sum + p.margin, 0) + state.positions.reduce((sum, p) => sum + (state.currentPrice - p.entry) * p.qty * (p.side === 'buy' ? 1 : -1), 0);
    document.getElementById('total-equity').textContent = '$' + totalEquity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('available-margin').textContent = '$' + state.availableMargin.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function resetAccount() {
    if (!confirm('Reset your demo account? All positions and history will be cleared.')) return;
    state.balance = 10000; state.availableMargin = 10000; state.usedMargin = 0; state.positions = []; state.openOrders = []; state.orderHistory = [];
    updateUI(); updatePanel(); showToast('Reset', 'Account reset to $10,000', 'success');
}

function showToast(title, message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const colors = { success: 'border-l-4 border-l-[#00b897] bg-[#151921]', error: 'border-l-4 border-l-[#ff6b6b] bg-[#151921]', info: 'border-l-4 border-l-orange-500 bg-[#151921]' };
    const icons = { success: '<span class="text-[#00b897] text-lg">✓</span>', error: '<span class="text-[#ff6b6b] text-lg">✕</span>', info: '<span class="text-orange-500 text-lg">ℹ</span>' };
    toast.className = `p-4 rounded shadow-2xl flex items-center gap-3 min-w-[300px] ${colors[type]}`;
    toast.style.animation = 'slideIn 0.3s ease-out';
    toast.innerHTML = `${icons[type]}<div><div class="font-semibold text-sm text-white">${title}</div><div class="text-xs text-[#848e9c]">${message}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

window.addEventListener('resize', () => {
    if (chart) chart.applyOptions({ width: document.getElementById('chart-container').clientWidth, height: document.getElementById('chart-container').clientHeight });
});
