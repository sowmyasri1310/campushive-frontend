import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { getUnreadCount, markAllRead, getNotifications } from '../services/api'
import { FiBell, FiLogOut, FiHome, FiX, FiAlertTriangle } from 'react-icons/fi'
import { format } from 'date-fns'

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread]         = useState(0);
  const [showPanel, setPanel]       = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [notes, setNotes]           = useState([]);
  const [loading, setLoading]       = useState(false);

  const homeLink =
    user?.role === 'SUPER_ADMIN' ? '/super-admin' :
    user?.role === 'ADMIN'       ? '/admin'        :
    user?.role === 'FACULTY'     ? '/faculty'      : '/student';

  const roleBadgeColor =
    user?.role === 'SUPER_ADMIN' ? '#4c1d95' :
    user?.role === 'ADMIN'       ? '#7c3aed' :
    user?.role === 'FACULTY'     ? '#0369a1' : '#15803d';

  useEffect(() => {
    if (!user || user.role === 'SUPER_ADMIN') return;
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, [user]);

  const fetchUnread = async () => {
    try { const r = await getUnreadCount(); setUnread(r.data.count ?? 0); } catch {}
  };

  const openPanel = async () => {
    setPanel(true); setLoading(true);
    try {
      const r = await getNotifications();
      setNotes(r.data || []);
      if (unread > 0) { await markAllRead(); setUnread(0); }
    } catch {} finally { setLoading(false); }
  };

  const confirmLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <>
      <nav style={styles.nav}>
        {/* Left */}
        <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
          <Link to={homeLink} style={styles.brand}> CampusHive</Link>
          <Link to={homeLink} style={styles.homeLink}><FiHome size={15}/> Home</Link>
          {user?.role !== 'SUPER_ADMIN' && (
            <Link to="/rooms" style={styles.navLink}>Room Schedule</Link>
          )}
        </div>

        {/* Right */}
        <div style={styles.right}>
          {user?.role !== 'SUPER_ADMIN' && (
            <button style={styles.bell} onClick={openPanel} title="Notifications">
              <FiBell size={20}/>
              {unread > 0 && <span style={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
            </button>
          )}

          <div style={styles.userBox}>
            <div style={{ ...styles.avatar, background: roleBadgeColor }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span style={styles.userName}>{user?.name}</span>
            <span style={{ ...styles.rolePill, background: roleBadgeColor }}>
              {user?.role?.replace('_', ' ')}
            </span>
            {user?.branch && (
              <span style={styles.branchPill}>
                {user.branch}{user.section ? `-${user.section}` : ''}
              </span>
            )}
          </div>

          {/* Logout button — opens confirm modal */}
          <button style={styles.logoutBtn} onClick={() => setShowLogout(true)}>
            <FiLogOut size={14}/> Logout
          </button>
        </div>
      </nav>

      {/* ── Logout Confirm Modal ── */}
      {showLogout && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.75rem' }}>
              <FiAlertTriangle size={20} color="#d97706"/>
              <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, color:'#1e293b' }}>
                Confirm Logout
              </h3>
            </div>
            <p style={{ fontSize:'.9rem', color:'#64748b', margin:'0 0 1.25rem', lineHeight:1.6 }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
              <button className="btn btn-outline"
                onClick={() => setShowLogout(false)}>
                Stay Logged In
              </button>
              <button style={styles.confirmLogoutBtn} onClick={confirmLogout}>
                <FiLogOut size={14}/> Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification Panel ── */}
      {showPanel && (
        <div style={styles.overlay} onClick={() => setPanel(false)}>
          <div style={styles.panel} onClick={e => e.stopPropagation()}>
            <div style={styles.panelHeader}>
              <div>
                <h3 style={{ margin:0, fontSize:'1.05rem' }}>🔔 Notifications</h3>
                <p style={{ margin:'.2rem 0 0', fontSize:'.78rem', color:'#94a3b8' }}>
                  Booking updates & announcements
                </p>
              </div>
              <button onClick={() => setPanel(false)} style={styles.closeBtn}>
                <FiX size={18}/>
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>Loading...</div>
            ) : notes.length === 0 ? (
              <div style={{ textAlign:'center', padding:'3rem' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>🔕</div>
                <p style={{ color:'#94a3b8', fontSize:'.9rem' }}>No notifications yet.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                {notes.map(n => {
                  const isApproved = n.message?.includes('APPROVED') || n.message?.includes('✅');
                  const isRejected = n.message?.includes('REJECTED') || n.message?.includes('❌');
                  const isCancelled = n.message?.includes('CANCELLED') || n.message?.includes('🚫');
                  const isCancel = n.message?.includes('⚠️') && n.message?.includes('Cancellation');
                  const borderColor = isApproved ? '#16a34a'
                                    : isRejected || isCancelled ? '#dc2626'
                                    : isCancel ? '#d97706' : '#2563eb';
                  const bgColor = n.isRead ? '#f8fafc'
                                : isApproved ? '#f0fdf4'
                                : isRejected || isCancelled ? '#fef2f2'
                                : isCancel ? '#fef3c7' : '#eff6ff';
                  return (
                    <div key={n.id} style={{
                      background: bgColor, border:'1px solid #e2e8f0',
                      borderLeft:`4px solid ${borderColor}`, borderRadius:'8px', padding:'.85rem 1rem'
                    }}>
                      <p style={{ fontSize:'.87rem', lineHeight:1.6, margin:0, color:'#1e293b' }}>
                        {n.message}
                      </p>
                      <small style={{ color:'#94a3b8', fontSize:'.75rem', marginTop:'.3rem', display:'block' }}>
                        {n.createdAt ? format(new Date(n.createdAt), 'MMM d, yyyy  h:mm a') : ''}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.75rem 2rem', background:'#fff', borderBottom:'1px solid #e2e8f0', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,.06)' },
  brand:   { fontWeight:700, fontSize:'1.1rem', textDecoration:'none', color:'#1e293b' },
  homeLink:{ display:'flex', alignItems:'center', gap:'.3rem', fontSize:'.85rem', color:'#2563eb', textDecoration:'none', fontWeight:600, padding:'.28rem .65rem', borderRadius:'7px', background:'#eff6ff' },
  navLink: { fontSize:'.88rem', color:'#475569', textDecoration:'none', fontWeight:500 },
  right:   { display:'flex', alignItems:'center', gap:'.85rem' },
  bell:    { position:'relative', background:'none', border:'none', cursor:'pointer', color:'#475569', padding:'.3rem', borderRadius:'8px' },
  badge:   { position:'absolute', top:-5, right:-5, background:'#dc2626', color:'#fff', borderRadius:'999px', fontSize:'.62rem', fontWeight:700, padding:'1px 5px', minWidth:17, textAlign:'center', lineHeight:'15px' },
  userBox: { display:'flex', alignItems:'center', gap:'.45rem' },
  avatar:  { width:32, height:32, borderRadius:'50%', color:'#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.9rem' },
  userName:{ fontSize:'.88rem', fontWeight:600, color:'#1e293b' },
  rolePill:{ fontSize:'.68rem', fontWeight:700, color:'#fff', padding:'.1rem .45rem', borderRadius:'999px' },
  branchPill:{ fontSize:'.68rem', fontWeight:600, color:'#0369a1', background:'#e0f2fe', padding:'.1rem .45rem', borderRadius:'999px' },
  logoutBtn: { display:'flex', alignItems:'center', gap:'.3rem', background:'#fee2e2', color:'#dc2626', border:'none', padding:'.35rem .8rem', borderRadius:'7px', cursor:'pointer', fontSize:'.82rem', fontWeight:500 },
  // Logout modal
  modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' },
  modalBox: { background:'#fff', borderRadius:'14px', padding:'1.75rem', width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,.2)' },
  confirmLogoutBtn: { display:'flex', alignItems:'center', gap:'.35rem', background:'#dc2626', color:'#fff', border:'none', borderRadius:'8px', padding:'.5rem 1.1rem', cursor:'pointer', fontSize:'.9rem', fontWeight:600 },
  // Notification panel
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.35)', zIndex:200, display:'flex', justifyContent:'flex-end' },
  panel:   { width:400, height:'100vh', background:'#fff', padding:'1.5rem', overflowY:'auto', boxShadow:'-4px 0 24px rgba(0,0,0,.12)' },
  panelHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem', paddingBottom:'1rem', borderBottom:'1px solid #e2e8f0' },
  closeBtn:{ background:'#f1f5f9', border:'none', cursor:'pointer', borderRadius:'8px', padding:'.4rem', color:'#64748b', display:'flex', alignItems:'center' }
};