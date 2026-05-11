document.addEventListener('DOMContentLoaded', () => {
    // --- SUPABASE CONFIGURATION ---
    // User needs to fill these from Supabase Project Settings
    const SUPABASE_URL = 'https://cvsdvxygucjbbtyydgmx.supabase.co';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // User: Fill this in!
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    // --- UI ELEMENTS ---
    const authModal = document.getElementById('auth-modal');
    const authBtn = document.getElementById('auth-btn');
    const closeModal = document.querySelector('.close-modal');
    const authForm = document.getElementById('auth-form');
    const toggleAuth = document.getElementById('toggle-auth');
    const dashboard = document.getElementById('dashboard');
    const landingContent = document.getElementById('landing-content');
    const logoutBtn = document.getElementById('logout-btn');
    const heroSignup = document.getElementById('hero-signup');
    const cursorGlow = document.getElementById('cursor-glow');

    let isLogin = true;

    // --- AUTH LOGIC ---
    const updateUI = async (user) => {
        if (user) {
            authBtn.textContent = 'Dashboard';
            landingContent.style.display = 'none';
            dashboard.style.display = 'block';
            
            // Fetch Profile (API Key)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .single();
            
            if (data) {
                document.getElementById('display-api-key').textContent = data.api_key;
                document.getElementById('user-tier').textContent = data.tier;
            }
        } else {
            authBtn.textContent = 'Login';
            landingContent.style.display = 'block';
            dashboard.style.display = 'none';
        }
    };

    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            updateUI(session?.user);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            updateUI(session?.user);
        });

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const submitBtn = document.getElementById('auth-submit');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) alert(error.message);
                else authModal.style.display = 'none';
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) alert('Check your email for confirmation!');
                else authModal.style.display = 'none';
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = isLogin ? 'Login' : 'Sign Up';
        });

        logoutBtn.addEventListener('click', () => {
            supabase.auth.signOut();
            window.location.reload(); // Refresh to clear state
        });
    }

    // --- MODAL HANDLERS ---
    const openAuth = (mode = 'login') => {
        isLogin = mode === 'login';
        document.getElementById('auth-title').textContent = isLogin ? 'Welcome Back' : 'Create Account';
        document.getElementById('auth-subtitle').textContent = isLogin ? 'Enter your details to access your dashboard.' : 'Get your free API key in seconds.';
        document.getElementById('auth-submit').textContent = isLogin ? 'Login' : 'Sign Up';
        toggleAuth.textContent = isLogin ? 'Sign Up' : 'Login';
        authModal.style.display = 'block';
    };

    if (authBtn) authBtn.addEventListener('click', () => {
        if (dashboard.style.display === 'block') {
            // Already in dashboard
        } else {
            openAuth('login');
        }
    });

    if (heroSignup) heroSignup.addEventListener('click', () => openAuth('signup'));
    if (closeModal) closeModal.addEventListener('click', () => authModal.style.display = 'none');
    if (toggleAuth) toggleAuth.addEventListener('click', () => openAuth(isLogin ? 'signup' : 'login'));

    // Copy Key Handler
    const copyBtn = document.getElementById('copy-key');
    if (copyBtn) copyBtn.addEventListener('click', () => {
        const key = document.getElementById('display-api-key').textContent;
        navigator.clipboard.writeText(key).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        });
    });

    // --- ANIMATIONS & GLOW ---
    if (cursorGlow && !window.matchMedia('(max-width: 768px)').matches) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursorGlow.style.left = `${e.clientX}px`;
                cursorGlow.style.top = `${e.clientY}px`;
                cursorGlow.style.transform = `translate(-50%, -50%)`;
            });
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.pricing-card, .code-window, .hero, .feature-block').forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});
