let state = {
    total: 0,
    allowed: 0,
    blocked: 0,
    logs: [],
    autoInterval: null
};

async function callApi() {
    try {

        const response = await fetch('/api/hello');

        const data = await response.json();

        return {
            allowed: response.status === 200,
            status: response.status,
            remaining:
                response.headers.get(
                    'X-RateLimit-Remaining'
                ) || '-',
            data
        };

    } catch (err) {

        return {
            allowed: false,
            status: 'ERR',
            remaining: '-',
            data: err.message
        };
    }
}

async function fireOne() {

    const res = await callApi();

    state.total++;

    if (res.allowed)
        state.allowed++;
    else
        state.blocked++;

    updateMetrics(res.data.remaining);

    state.logs.unshift(
        `${new Date().toLocaleTimeString()}
        -> ${res.status}`
    );

    renderLogs();
}

function fireBurst(n) {

    let i = 0;

    const interval = setInterval(() => {

        fireOne();
        i++;

        if (i >= n)
            clearInterval(interval);

    }, 100);
}

function toggleAuto() {

    const btn =
        document.getElementById('autoBtn');

    if (state.autoInterval) {

        clearInterval(state.autoInterval);
        state.autoInterval = null;
        btn.innerText = 'Auto Fire';

    } else {

        state.autoInterval =
            setInterval(fireOne, 500);

        btn.innerText = 'Stop Auto';
    }
}

function updateMetrics(remaining) {

    console.log(remaining)
    document.getElementById('mTotal')
        .innerText = state.total;

    document.getElementById('mAllowed')
        .innerText = state.allowed;

    document.getElementById('mBlocked')
        .innerText = state.blocked;

    document.getElementById('mRemaining')
        .innerText = remaining;
}

function renderLogs() {

    const log =
        document.getElementById('log');

    log.innerHTML = state.logs
        .slice(0, 50)
        .map(entry => `
            <div class="log-entry">
                ${entry.includes('200')
                    ? '<span class="ok">✓</span>'
                    : '<span class="fail">✗</span>'}
                ${entry}
            </div>
        `)
        .join('');
}

function resetAll() {

    if (state.autoInterval)
        clearInterval(state.autoInterval);

    state = {
        total: 0,
        allowed: 0,
        blocked: 0,
        logs: [],
        autoInterval: null
    };

    updateMetrics('-');
    renderLogs();

    document.getElementById('autoBtn')
        .innerText = 'Auto Fire';
}

async function callApi() {

    const algorithm =
        document.getElementById('algo').value;

    try {

        const response = await fetch(
            `api/test?algorithm=${algorithm}`
        );

        const data = await response.json();

        return {
            allowed: response.status === 200,
            status: response.status,
            remaining:
                response.headers.get(
                    'X-RateLimit-Remaining'
                ) || '-',
            data
        };

    } catch (err) {

        return {
            allowed: false,
            status: 'ERR',
            remaining: '-',
            data: err.message
        };
    }
}