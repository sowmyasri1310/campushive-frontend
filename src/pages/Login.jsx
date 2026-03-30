import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name:'', email:'', password:'', department:'', branch:'', section:''
  });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (mode === 'register') {
      if (!form.name.trim())  return toast.error('Please enter your full name');
      if (!form.email.trim()) return toast.error('Please enter your email');
      if (!form.password)     return toast.error('Please enter a password');
      if (!form.branch)       return toast.error('Please select your branch');
      if (!form.section)      return toast.error('Please select your section');
    }
    setLoading(true);
    try {
      const { data } = mode === 'login'
        ? await login({ email: form.email.trim(), password: form.password })
        : await register({ ...form, role: 'STUDENT' });

    loginUser({
  id: data.id, name: data.fullName, email: data.email,
  role: data.role, branch: data.branch, section: data.section
}, data.token);

toast.success(`Welcome, ${data.fullName}!`);
      const dest = {
        SUPER_ADMIN: '/super-admin',
        ADMIN:       '/admin',
        FACULTY:     '/faculty',
        STUDENT:     '/student'
      }[data.role] || '/login';
      navigate(dest);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleKey = e => { if (e.key === 'Enter') submit(); };

  return (
    <div style={styles.page}>

      {/* ── Left Panel ── */}
      <div style={styles.left}>
        {/* Overlay content */}
        <div style={styles.leftContent}>
          
          <h1 style={styles.leftTitle}>CampusHive</h1>
          <p style={styles.leftSub}>
            Smart room booking for a smarter campus.
            Book labs, classrooms and halls — all in one place.
          </p>

          {/* Feature pills */}
          <div style={styles.features}>
            {[
              '✅ Clash-free booking',
              '🔔 Instant notifications',
              '📅 Live schedule',
              '🔐 Role-based access',
            ].map(f => (
              <span key={f} style={styles.featurePill}>{f}</span>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div style={styles.circle1}/>
        <div style={styles.circle2}/>
        <div style={styles.circle3}/>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div style={styles.right}>
        <div style={styles.formWrap}>

          {/* Header */}
          <h2 style={styles.formTitle}>
            {mode === 'login' ? 'Welcome back 👋' : 'Create account '}
          </h2>
          <p style={styles.formSub}>
            {mode === 'login'
              ? 'Sign in to access your dashboard'
              : 'Register as a student to get started'}
          </p>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(mode==='login' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setMode('login')}>
              Sign In
            </button>
            <button
              style={{ ...styles.tab, ...(mode==='register' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setMode('register')}>
              Register
            </button>
          </div>

          

          {/* Fields */}
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name *</label>
              <input style={styles.input} name="name" value={form.name}
                onChange={handle} onKeyDown={handleKey} placeholder="e.g. John Smith"/>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email Address *</label>
            <input style={styles.input} name="email" type="email" value={form.email}
              onChange={handle} onKeyDown={handleKey} placeholder="you@campus.com"/>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password *</label>
            <input style={styles.input} name="password" type="password" value={form.password}
              onChange={handle} onKeyDown={handleKey} placeholder="••••••••"/>
          </div>

          {mode === 'register' && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Department</label>
                <input style={styles.input} name="department" value={form.department}
                  onChange={handle} placeholder="e.g. Computer Science"/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                <div style={styles.field}>
                  <label style={styles.label}>Branch *</label>
                  <select style={styles.input} name="branch" value={form.branch} onChange={handle}>
                    <option value="">Select Branch</option>
                    {['CSE','ECE','MECH','CIVIL','EEE','IT'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Section *</label>
                  <select style={styles.input} name="section" value={form.section} onChange={handle}>
                    <option value="">Select Section</option>
                    {['A','B','C','D','E'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button style={{ ...styles.submitBtn, opacity: loading ? .7 : 1 }}
            onClick={submit} disabled={loading}>
            {loading ? 'Please wait...'
              : mode === 'login' ? 'Sign In →' : 'Create Student Account →'}
          </button>

          {/* Switch mode */}
          <p style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button style={styles.switchLink} onClick={() => setMode(mode==='login'?'register':'login')}>
              {mode === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>

        
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  // ── Left panel ──
  left: {
    width: '45%',
    background: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '3rem',
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    color: '#fff',
    maxWidth: 360,
  },
  leftLogo: {
    fontSize: '3.5rem',
    marginBottom: '.5rem',
    display: 'block',
  },
  leftTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    color: '#fff',
    margin: '0 0 .75rem',
    letterSpacing: '-.02em',
  },
  leftSub: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,.8)',
    lineHeight: 1.7,
    marginBottom: '2rem',
  },
  features: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '.5rem',
  },
  featurePill: {
    background: 'rgba(255,255,255,.15)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,.25)',
    padding: '.35rem .85rem',
    borderRadius: '999px',
    fontSize: '.82rem',
    fontWeight: 500,
  },
  // decorative circles
  circle1: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: '50%', background: 'rgba(255,255,255,.06)',
    top: -80, right: -80, zIndex: 1,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: '50%', background: 'rgba(255,255,255,.08)',
    bottom: 60, left: -60, zIndex: 1,
  },
  circle3: {
    position: 'absolute', width: 120, height: 120,
    borderRadius: '50%', background: 'rgba(255,255,255,.05)',
    bottom: -30, right: 80, zIndex: 1,
  },

  // ── Right panel ──
  right: {
    flex: 1,
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    overflowY: 'auto',
  },
  formWrap: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,.08)',
  },
  formTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 .3rem',
  },
  formSub: {
    fontSize: '.88rem',
    color: '#64748b',
    margin: '0 0 1.5rem',
  },

  // Tabs
  tabs: {
    display: 'flex',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    marginBottom: '1.25rem',
  },
  tab: {
    flex: 1,
    padding: '.6rem 1rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '.9rem',
    fontWeight: 600,
    transition: 'all .15s',
    textAlign: 'center',
  },
  tabActive:  { background: '#2563eb', color: '#fff' },
  tabInactive:{ background: '#f8fafc', color: '#64748b' },

  infoBanner: {
    background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: '8px', padding: '.6rem .9rem',
    fontSize: '.82rem', color: '#1d4ed8',
    marginBottom: '1rem',
  },

  // Form fields
  field:  { marginBottom: '1rem' },
  label:  { display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#374151', marginBottom: '.35rem' },
  input:  {
    width: '100%', padding: '.6rem .85rem',
    border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '.9rem', color: '#1e293b', outline: 'none',
    background: '#fff', boxSizing: 'border-box',
    transition: 'border-color .15s',
  },

  submitBtn: {
    width: '100%',
    padding: '.75rem',
    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '.5rem',
    letterSpacing: '.01em',
  },

  switchText: { textAlign: 'center', fontSize: '.85rem', color: '#64748b', marginTop: '1rem' },
  switchLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#2563eb', fontWeight: 600, fontSize: '.85rem', padding: 0,
  },

  demo: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  demoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '.3rem 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '.82rem',
    flexWrap: 'wrap',
    gap: '.25rem',
  },
};