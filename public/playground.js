document.addEventListener('DOMContentLoaded', () => {
    const config = window.RENDERKIT_CONFIG || {};
    const SUPABASE_URL = config.SUPABASE_URL;
    const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
    const API_BASE_URL = config.API_BASE_URL || window.location.origin;
    const supabase = window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

    const renderBtn = document.getElementById('render-btn');
    const targetUrlInput = document.getElementById('target-url');
    const previewArea = document.getElementById('preview-area');
    const placeholderText = document.getElementById('placeholder-text');
    const renderStatus = document.getElementById('render-status');
    const errorDisplay = document.getElementById('error-display');
    const debugInfo = document.getElementById('debug-info');
    const debugContent = document.getElementById('debug-content');
    const resultMeta = document.getElementById('result-meta');
    const endpointTabs = document.querySelectorAll('.endpoint-tab');
    const captureOptions = document.getElementById('capture-options');
    const ogOptions = document.getElementById('og-options');
    const loginBtnContainer = document.getElementById('login-btn-container');
    const navDashboard = document.getElementById('nav-dashboard');

    let currentEndpoint = 'capture';
    let userApiKey = null;
    let isAuthenticated = false;

    // Check Auth and get API Key
    async function checkAuth() {
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                isAuthenticated = true;
                const { data } = await supabase.from('profiles').select('api_key').single().catch(() => {});
                if (data) userApiKey = data.api_key;

                renderBtn.textContent = `Render ${capitalize(currentEndpoint)}`;
                renderBtn.disabled = false;

                if (loginBtnContainer) {
                    loginBtnContainer.innerHTML = `<button class="btn btn-nav" style="padding: 0.6rem 1.2rem; font-size: 0.8rem;" onclick="supabase?.auth.signOut(); window.location.href='index.html'">Logout</button>`;
                }
                if (navDashboard) navDashboard.style.display = 'inline-block';
            } else {
                isAuthenticated = false;
                renderBtn.disabled = true;
                renderBtn.textContent = 'Login to Test';
                errorDisplay.textContent = 'You must be logged in to use the playground.';
                errorDisplay.style.display = 'block';
            }
        }
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    checkAuth();

    // Auth state listener
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                checkAuth();
            } else if (event === 'SIGNED_OUT') {
                isAuthenticated = false;
                userApiKey = null;
                renderBtn.disabled = true;
                renderBtn.textContent = 'Login to Test';
                if (loginBtnContainer) {
                    loginBtnContainer.innerHTML = '<a href="auth.html" class="btn btn-nav" style="padding: 0.6rem 1.2rem; font-size: 0.8rem; text-decoration: none;">Login</a>';
                }
                if (navDashboard) navDashboard.style.display = 'none';
            }
        });
    }

    // Endpoint tabs
    endpointTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            endpointTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentEndpoint = tab.dataset.endpoint;

            renderBtn.textContent = `Render ${capitalize(currentEndpoint)}`;
            if (!isAuthenticated) renderBtn.textContent = 'Login to Test';

            if (currentEndpoint === 'og') {
                captureOptions.style.display = 'none';
                ogOptions.style.display = 'block';
            } else {
                captureOptions.style.display = 'block';
                ogOptions.style.display = 'none';
            }
        });
    });

    renderBtn.addEventListener('click', async () => {
        if (!isAuthenticated || !userApiKey) {
            alert('Please login to get your API key.');
            window.location.href = 'auth.html';
            return;
        }

        const url = targetUrlInput.value.trim();
        if (!url && currentEndpoint !== 'og') {
            errorDisplay.textContent = 'Please enter a target URL.';
            errorDisplay.style.display = 'block';
            return;
        }
        if (!url && currentEndpoint === 'og') {
            errorDisplay.textContent = 'Please enter at least a title for the OG card.';
            errorDisplay.style.display = 'block';
            return;
        }

        // Setup UI
        renderBtn.disabled = true;
        renderBtn.textContent = 'Rendering...';
        renderStatus.style.display = 'block';
        placeholderText.style.display = 'none';
        errorDisplay.style.display = 'none';
        debugInfo.style.display = 'none';
        resultMeta.style.display = 'none';
        previewArea.innerHTML = '<div id="placeholder-text" style="display:none;"></div><div id="render-status" class="render-status" style="display:block;"><div class="loader"></div><div style="color: var(--accent); font-weight: 900;">RENDERING...</div></div>';
        previewArea.querySelector('#render-status').style.display = 'block';

        const startTime = Date.now();

        try {
            let endpoint;
            let body;

            if (currentEndpoint === 'capture') {
                endpoint = '/v1/screenshot/capture';
                body = {
                    url: url,
                    clean: document.getElementById('opt-clean')?.checked ?? true,
                    wait: document.getElementById('opt-wait')?.checked ? 'smart' : 'networkidle2',
                    freezeAnimations: document.getElementById('opt-freeze')?.checked ?? true,
                    debug: document.getElementById('opt-debug')?.checked ?? false
                };
            } else if (currentEndpoint === 'pdf') {
                endpoint = '/v1/screenshot/pdf';
                body = {
                    url: url,
                    clean: document.getElementById('opt-clean')?.checked ?? true,
                    wait: document.getElementById('opt-wait')?.checked ? 'smart' : 'networkidle2',
                    freezeAnimations: document.getElementById('opt-freeze')?.checked ?? true
                };
            } else if (currentEndpoint === 'og') {
                endpoint = '/v1/screenshot/og';
                body = {
                    title: document.getElementById('og-title')?.value || 'RenderKit OG',
                    description: document.getElementById('og-description')?.value || '',
                    image_url: document.getElementById('og-image')?.value || '',
                    url: url || undefined
                };
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': userApiKey
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            if (result.success || result.image_base64) {
                const imgData = result.image_base64 || result.image;
                previewArea.innerHTML = `<img src="data:image/png;base64,${imgData}" alt="Render result">`;

                // Show meta
                resultMeta.style.display = 'flex';
                resultMeta.innerHTML = `
                    <div class="meta-item">⚡ <strong>${duration}s</strong></div>
                    <div class="meta-item">📁 <strong>${currentEndpoint.toUpperCase()}</strong></div>
                    <div class="meta-item">📊 <strong>${(imgData.length * 0.75 / 1024).toFixed(0)} KB</strong></div>
                    <div class="meta-item">🔗 <a href="${url || '#'}" target="_blank" style="color: var(--accent);">${url ? new URL(url).hostname : 'N/A'}</a></div>
                `;

                if (result.debug) {
                    debugInfo.style.display = 'block';
                    debugContent.innerHTML = `<pre>${JSON.stringify(result.debug, null, 2)}</pre>`;
                }

                // Log usage to Supabase
                if (supabase) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        supabase.from('usage_logs').insert({
                            user_id: session.user.id,
                            endpoint: endpoint,
                            status_code: response.status,
                            duration_ms: Date.now() - startTime,
                            method: 'POST',
                            ip_address: 'client'
                        }).then().catch(() => {});
                    }
                }
            } else {
                throw new Error(result.message || `${capitalize(currentEndpoint)} rendering failed`);
            }
        } catch (err) {
            console.error('Playground Error:', err);
            errorDisplay.textContent = `Error: ${err.message}`;
            errorDisplay.style.display = 'block';
            previewArea.innerHTML = '<div id="placeholder-text">Render Failed</div>';
        } finally {
            renderBtn.disabled = false;
            renderBtn.textContent = `Render ${capitalize(currentEndpoint)}`;
        }
    });
});