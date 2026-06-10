document.addEventListener('DOMContentLoaded', () => {
    const config = window.RENDERKIT_CONFIG || {};
    const SUPABASE_URL = config.SUPABASE_URL;
    const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
    const supabase = window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
          })
        : null;

    // --- UI ELEMENTS ---
    const authBtn = document.getElementById('auth-btn');
    const authForm = document.getElementById('auth-form');
    const dashboard = document.getElementById('dashboard');
    const landingContent = document.getElementById('landing-content');
    const logoutBtn = document.getElementById('logout-btn');
    const heroSignup = document.getElementById('hero-signup');
    const cursorGlow = document.getElementById('cursor-glow');

    let isLogin = true;
    let currentUser = null;

    // --- AUTH LOGIC ---
    const updateUI = async (user) => {
        if (user) {
            if (authBtn) {
                authBtn.textContent = 'Dashboard';
                authBtn.onclick = () => { window.location.href = 'dashboard.html'; };
            }
            if (landingContent && dashboard) {
                landingContent.style.display = 'none';
                dashboard.style.display = 'block';
            }

            // Load profile data
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Profile load error:', error);
                }

                if (data) {
                    const displayApiKey = document.getElementById('display-api-key');
                    const userTier = document.getElementById('user-tier');
                    if (displayApiKey) displayApiKey.textContent = data.api_key || 'Pending';
                    if (userTier) userTier.textContent = data.tier || 'Free';
                } else {
                    const displayApiKey = document.getElementById('display-api-key');
                    const userTier = document.getElementById('user-tier');
                    if (displayApiKey) displayApiKey.textContent = 'Provisioning...';
                    if (userTier) userTier.textContent = 'Free';
                }
            } catch (err) {
                console.error('Profile Load Error:', err);
            }
        } else {
            if (authBtn) {
                authBtn.textContent = 'Login';
                authBtn.onclick = () => { window.location.href = 'auth.html'; };
            }
            if (landingContent && dashboard) {
                landingContent.style.display = 'block';
                dashboard.style.display = 'none';
            }
        }
    };

    // --- AUTH FORM LOGIC (On auth.html) ---
    if (authForm && window.location.pathname.includes('auth.html')) {
        // If already logged in, redirect to dashboard
        if (supabase) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    window.location.href = 'dashboard.html';
                }
            });
        }

        const authError = document.getElementById('auth-error');
        const authSuccess = document.getElementById('auth-success');
        const submitBtn = document.getElementById('auth-submit');
        const passwordInput = document.getElementById('auth-password');
        const strengthBar = document.getElementById('password-strength');

        // Password strength indicator (only for signup)
        if (passwordInput && strengthBar) {
            passwordInput.addEventListener('input', () => {
                if (!isLogin) {
                    strengthBar.style.display = 'block';
                    const len = passwordInput.value.length;
                    const fill = strengthBar.querySelector('.fill');
                    fill.className = 'fill';
                    if (len >= 10) fill.classList.add('strong');
                    else if (len >= 7) fill.classList.add('medium');
                    else if (len >= 3) fill.classList.add('weak');
                } else {
                    strengthBar.style.display = 'none';
                }
            });
        }

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim();
            const password = document.getElementById('auth-password').value;

            // Validation
            if (!email) {
                showAuthError('Please enter your email address.');
                return;
            }
            if (password.length < 6) {
                showAuthError('Password must be at least 6 characters.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
            hideAuthMessages();

            try {
                if (isLogin) {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });
                    if (error) throw error;
                    if (data?.user) {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            emailRedirectTo: window.location.origin + '/dashboard.html'
                        }
                    });
                    if (error) throw error;

                    if (data?.session) {
                        // Auto-signed in
                        window.location.href = 'dashboard.html';
                    } else {
                        // Email confirmation required
                        showAuthSuccess('Account created! Check your email for confirmation. You may need to verify your email before signing in.');
                        isLogin = true;
                        document.getElementById('auth-title').textContent = 'Sign In';
                        document.getElementById('auth-subtitle').textContent = 'Access your RenderKit dashboard and API keys.';
                        document.getElementById('auth-submit').textContent = 'Sign In';
                        document.getElementById('toggle-text').textContent = 'New to RenderKit?';
                        document.getElementById('toggle-auth').textContent = 'Create Account';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Sign In';
                        return;
                    }
                }
            } catch (err) {
                console.error('Auth error:', err);
                let msg = err.message;
                if (msg.includes('Invalid login credentials')) {
                    msg = 'Invalid email or password. Please try again.';
                } else if (msg.includes('Email not confirmed')) {
                    msg = 'Please confirm your email address. Check your inbox for the confirmation link.';
                } else if (msg.includes('User already registered')) {
                    msg = 'An account with this email already exists. Please sign in instead.';
                } else if (msg.includes('rate_limit')) {
                    msg = 'Too many attempts. Please wait a moment and try again.';
                }
                showAuthError(msg);
                submitBtn.disabled = false;
                submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
            }
        });

        function showAuthError(msg) {
            if (authError) {
                authError.textContent = msg;
                authError.style.display = 'block';
            } else {
                alert(msg);
            }
        }

        function showAuthSuccess(msg) {
            if (authSuccess) {
                authSuccess.textContent = msg;
                authSuccess.style.display = 'block';
            }
        }

        function hideAuthMessages() {
            if (authError) authError.style.display = 'none';
            if (authSuccess) authSuccess.style.display = 'none';
        }

        // Toggle login/signup
        const toggleAuthBtn = document.getElementById('toggle-auth');
        if (toggleAuthBtn) {
            toggleAuthBtn.addEventListener('click', () => {
                isLogin = !isLogin;
                document.getElementById('auth-title').textContent = isLogin ? 'Sign In' : 'Create Account';
                document.getElementById('auth-subtitle').textContent = isLogin
                    ? 'Access your RenderKit dashboard and API keys.'
                    : 'Create your free RenderKit account.';
                document.getElementById('toggle-text').textContent = isLogin ? 'New to RenderKit?' : 'Already have an account?';
                toggleAuthBtn.textContent = isLogin ? 'Create Account' : 'Sign In';
                document.getElementById('auth-submit').textContent = isLogin ? 'Sign In' : 'Create Account';

                // Reset messages
                hideAuthMessages();
                if (strengthBar) {
                    strengthBar.style.display = 'none';
                    const fill = strengthBar.querySelector('.fill');
                    if (fill) fill.className = 'fill';
                }

                // Update password field
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.minLength = isLogin ? '1' : '6';
                }
            });
        }
    }

    // --- SESSION MANAGEMENT (On all pages) ---
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            currentUser = session?.user ?? null;
            updateUI(currentUser);

            // If on dashboard.html but no session, redirect
            if (window.location.pathname.includes('dashboard.html') && !currentUser) {
                window.location.href = 'auth.html';
            }
        });

        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);
            currentUser = session?.user ?? null;
            updateUI(currentUser);

            if (event === 'SIGNED_OUT') {
                if (window.location.pathname.includes('dashboard.html')) {
                    window.location.href = 'index.html';
                }
            }
        });

        // Logout handler
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await supabase.auth.signOut();
                currentUser = null;
                window.location.href = 'index.html';
            });
        }
    } else {
        if (authBtn) authBtn.textContent = 'Login';
        console.warn('Supabase not configured');
    }

    // --- INTEGRATION TABS ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Copy Key Handler
    const copyBtn = document.getElementById('copy-key');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const key = document.getElementById('display-api-key')?.textContent;
            if (key && key !== 'Pending' && key !== 'Provisioning...') {
                navigator.clipboard.writeText(key).then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = originalText, 2000);
                });
            }
        });
    }

    // --- CURSOR GLOW ---
    if (cursorGlow && !window.matchMedia('(max-width: 768px)').matches) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursorGlow.style.left = `${e.clientX}px`;
                cursorGlow.style.top = `${e.clientY}px`;
                cursorGlow.style.transform = `translate(-50%, -50%)`;
            });
        });
    }
});