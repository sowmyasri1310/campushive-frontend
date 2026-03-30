import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { getStudentBookings, getNotifications, markAllRead, getUnreadCount } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiBook, FiBell, FiMapPin, FiClock, FiUser, FiSearch, FiX, FiFilter, FiRefreshCw } from 'react-icons/fi'
import { format, isToday, isTomorrow, differenceInMinutes, addDays } from 'date-fns'

export default function StudentDashboard() {
  const [tab, setTab]             = useState('schedule');
  const [bookings, setBookings]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [notes, setNotes]         = useState([]);
  const [unread, setUnread]       = useState(0);
  const [notesLoading, setNL]     = useState(false);
  const [now, setNow]             = useState(new Date());
  const { user } = useAuth();

  // Search state
  const [search, setSearch]       = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getStudentBookings().then(r => { setBookings(r.data); setFiltered(r.data); }).catch(()=>{});
    fetchUnreadCount();
    const tick = setInterval(() => { setNow(new Date()); fetchUnreadCount(); }, 60000);
    return () => clearInterval(tick);
  }, []);

  const fetchUnreadCount = () =>
    getUnreadCount().then(r => setUnread(r.data.count ?? 0)).catch(()=>{});

  // Load notifications when switching to notifications tab
  const loadNotifications = useCallback(async () => {
    setNL(true);
    try {
      const r = await getNotifications();
      setNotes(r.data || []);
      // Mark as read AFTER loading
      await markAllRead();
      setUnread(0);
    } catch (e) {
      console.error('Notifications load error:', e);
    } finally { setNL(false); }
  }, []);

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'notifications') loadNotifications();
  };

  // Apply filters
  const applyFilters = (s, df, dt, list) => {
    let result = [...list];
    if (s.trim()) {
      const q = s.toLowerCase();
      result = result.filter(b =>
        b.title?.toLowerCase().includes(q)         ||
        b.purpose?.toLowerCase().includes(q)       ||
        b.room?.name?.toLowerCase().includes(q)    ||
        b.faculty?.name?.toLowerCase().includes(q) ||
        b.branch?.toLowerCase().includes(q)
      );
    }
    if (df) { const from = new Date(df); from.setHours(0,0,0,0); result = result.filter(b => new Date(b.startTime) >= from); }
    if (dt) { const to = new Date(dt); to.setHours(23,59,59,999); result = result.filter(b => new Date(b.startTime) <= to); }
    setFiltered(result);
  };

  const handleSearch = (v) => { setSearch(v);   applyFilters(v, dateFrom, dateTo, bookings); };
  const handleFrom   = (v) => { setDateFrom(v); applyFilters(search, v, dateTo, bookings); };
  const handleTo     = (v) => { setDateTo(v);   applyFilters(search, dateFrom, v, bookings); };
  const clearAll = () => { setSearch(''); setDateFrom(''); setDateTo(''); setFiltered(bookings); };

  const hasFilters  = search || dateFrom || dateTo;
  const activeCount = [search, dateFrom, dateTo].filter(Boolean).length;

  // Frontend time filter
  const visible = filtered.filter(b => {
    const end = new Date(b.endTime), start = new Date(b.startTime);
    if (dateFrom || dateTo) return end > now;
    return end > now && start < addDays(now, 7);
  });

  // Group by date
  const grouped = visible.reduce((acc, b) => {
    const d = new Date(b.startTime);
    const label = isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEEE, MMMM d yyyy');
    acc[label] = acc[label] || [];
    acc[label].push(b);
    return acc;
  }, {});

  const getStatus = (b) => {
    const s = new Date(b.startTime), e = new Date(b.endTime);
    return (now >= s && now <= e) ? 'ongoing' : 'upcoming';
  };

  const weekEnd = format(addDays(now, 7), 'MMM d');

  return (
    <>
      <Navbar/>
      <div className="page">
        <h1 className="page-title">Student Dashboard</h1>

        {user?.branch ? (
          <div style={styles.infoBanner}>
            📋 Showing classes for <strong>{user.branch}</strong>
            {user.section ? ` — Section ${user.section}` : ''}
            {!hasFilters && <span style={styles.windowBadge}>Next 7 days · until {weekEnd}</span>}
          </div>
        ) : (
          <div style={{ ...styles.infoBanner, background:'#fef9c3', borderColor:'#fde047', color:'#713f12' }}>
            ⚠️ No branch/section set — showing all classes.
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.25rem' }}>
          <button className={`btn ${tab==='schedule'?'btn-primary':'btn-outline'}`}
            onClick={() => handleTabChange('schedule')}>
            <FiBook size={14}/> My Schedule ({visible.length})
          </button>
          <button className={`btn ${tab==='notifications'?'btn-primary':'btn-outline'}`}
            onClick={() => handleTabChange('notifications')}>
            <FiBell size={14}/> Notifications
            {unread > 0 && <span style={styles.tabBadge}>{unread}</span>}
          </button>
        </div>

        {/* ── Schedule ── */}
        {tab === 'schedule' && (
          <>
            <div style={{ marginBottom:'1rem' }}>
              <div style={styles.searchRow}>
                <div style={styles.searchBox}>
                  <FiSearch size={15} color="#94a3b8"/>
                  <input style={styles.searchInput}
                    placeholder="Search by class, room, faculty..."
                    value={search} onChange={e => handleSearch(e.target.value)}/>
                  {search && <button style={styles.clearBtn} onClick={() => handleSearch('')}><FiX size={13}/></button>}
                </div>
                <button style={{ ...styles.filterBtn, background:showFilters?'#ede9fe':'#f8fafc', color:showFilters?'#7c3aed':'#475569' }}
                  onClick={() => setShowFilters(!showFilters)}>
                  <FiFilter size={14}/> Filters
                  {activeCount > 0 && <span style={styles.filterBadge}>{activeCount}</span>}
                </button>
                {hasFilters && <button style={styles.clearAllBtn} onClick={clearAll}><FiX size={13}/> Clear</button>}
              </div>
              {showFilters && (
                <div style={styles.filterPanel}>
                  <div style={styles.filterGrid}>
                    <div>
                      <label style={styles.label}>From Date</label>
                      <input type="date" style={styles.dateInput} value={dateFrom} onChange={e => handleFrom(e.target.value)}/>
                    </div>
                    <div>
                      <label style={styles.label}>To Date</label>
                      <input type="date" style={styles.dateInput} value={dateTo} onChange={e => handleTo(e.target.value)}/>
                    </div>
                  </div>
                </div>
              )}
              {hasFilters && (
                <div style={styles.chips}>
                  {search   && <span style={styles.chip}>🔍 "{search}" <button style={styles.chipX} onClick={()=>handleSearch('')}>×</button></span>}
                  {dateFrom && <span style={styles.chip}>From: {dateFrom} <button style={styles.chipX} onClick={()=>handleFrom('')}>×</button></span>}
                  {dateTo   && <span style={styles.chip}>To: {dateTo} <button style={styles.chipX} onClick={()=>handleTo('')}>×</button></span>}
                </div>
              )}
            </div>

            {Object.keys(grouped).length === 0
              ? <div className="empty">{hasFilters ? '🔍 No classes match your search.' : ' No upcoming classes in the next 7 days.'}</div>
              : Object.entries(grouped).map(([day, items]) => (
                  <div key={day} style={{ marginBottom:'1.5rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'.75rem' }}>
                      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
                      <span style={{
                        fontSize:'.78rem', fontWeight:600, whiteSpace:'nowrap',
                        background:'#f8fafc', padding:'.2rem .75rem', borderRadius:'999px',
                        border:`1px solid ${day==='Today'?'#bbf7d0':day==='Tomorrow'?'#fde68a':'#e2e8f0'}`,
                        color: day==='Today'?'#166534':day==='Tomorrow'?'#92400e':'#94a3b8'
                      }}>📅 {day}</span>
                      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
                      {items.map(b => {
                        const status = getStatus(b);
                        const minsLeft = differenceInMinutes(new Date(b.startTime), now);
                        const endsIn   = differenceInMinutes(new Date(b.endTime), now);
                        return (
                          <div key={b.id} style={{
                            ...styles.classCard,
                            borderLeft: status==='ongoing'?'4px solid #16a34a':minsLeft<=30?'4px solid #d97706':'4px solid #bfdbfe'
                          }}>
                            <div style={styles.classTop}>
                              <span style={styles.classTitle}>{b.title}</span>
                              {status==='ongoing' && <span style={styles.pill('#dcfce7','#166534')}>🟢 Ongoing</span>}
                              {status==='upcoming' && minsLeft<=30 && minsLeft>0 && <span style={styles.pill('#fef3c7','#92400e')}>⏰ In {minsLeft}m</span>}
                              {status==='upcoming' && minsLeft>30 && <span style={styles.pill('#eff6ff','#1d4ed8')}>📌 Upcoming</span>}
                              {b.branch && <span style={styles.branchBadge}>{b.branch}{b.section?` - ${b.section}`:''}</span>}
                            </div>
                            <div style={styles.classMeta}>
                              <span><FiMapPin size={12}/>&nbsp;{b.room?.name} — {b.room?.location}</span>
                              <span><FiClock size={12}/>&nbsp;{format(new Date(b.startTime),'h:mm a')} → {format(new Date(b.endTime),'h:mm a')}
                                {status==='ongoing' && <span style={{color:'#16a34a',fontWeight:600,marginLeft:'.5rem'}}>(ends in {endsIn}m)</span>}
                              </span>
                              <span><FiUser size={12}/>&nbsp;{b.faculty?.name}{b.faculty?.department?` (${b.faculty.department})`:''}</span>
                              {b.purpose && <span style={{fontStyle:'italic',color:'#94a3b8'}}>📝 {b.purpose}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
            }
          </>
        )}

        {/* ── Notifications ── */}
        {tab === 'notifications' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h3 style={{ margin:0, fontSize:'1rem', fontWeight:600 }}>🔔 Your Notifications</h3>
              <button style={styles.refreshBtn} onClick={loadNotifications} disabled={notesLoading}>
                <FiRefreshCw size={13} style={{ animation: notesLoading?'spin 1s linear infinite':'' }}/> Refresh
              </button>
            </div>

            {notesLoading ? (
              <div className="empty">Loading notifications...</div>
            ) : notes.length === 0 ? (
              <div className="empty">
                <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>🔕</div>
                No notifications yet. You'll be notified when a class is scheduled for your branch.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
                {notes.map(n => {
                  const ok  = n.message?.includes('APPROVED') || n.message?.includes('✅') || n.message?.includes('📚');
                  const bad = n.message?.includes('REJECTED') || n.message?.includes('❌');
                  return (
                    <div key={n.id} style={{
                      background: n.isRead ? '#f8fafc' : ok ? '#f0fdf4' : bad ? '#fef2f2' : '#eff6ff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${ok?'#16a34a':bad?'#dc2626':'#2563eb'}`,
                      borderRadius:'10px', padding:'1rem'
                    }}>
                      <p style={{ fontSize:'.88rem', lineHeight:1.6, margin:0 }}>{n.message}</p>
                      <small style={{ color:'#94a3b8', fontSize:'.75rem', marginTop:'.3rem', display:'block' }}>
                        {n.createdAt ? format(new Date(n.createdAt), 'MMM d, yyyy  h:mm a') : ''}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  infoBanner: { background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'.75rem 1rem', fontSize:'.88rem', color:'#1d4ed8', marginBottom:'1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'.5rem' },
  windowBadge: { background:'#2563eb', color:'#fff', fontSize:'.75rem', fontWeight:600, padding:'.2rem .65rem', borderRadius:'999px' },
  tabBadge: { background:'#dc2626', color:'#fff', borderRadius:'999px', fontSize:'.65rem', fontWeight:700, padding:'1px 6px', marginLeft:'.4rem' },
  searchRow: { display:'flex', gap:'.6rem', alignItems:'center', flexWrap:'wrap' },
  searchBox: { flex:1, minWidth:220, display:'flex', alignItems:'center', gap:'.5rem', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'.45rem .75rem' },
  searchInput: { flex:1, border:'none', outline:'none', fontSize:'.88rem', background:'transparent' },
  clearBtn: { background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' },
  filterBtn: { display:'flex', alignItems:'center', gap:'.4rem', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'.45rem .85rem', cursor:'pointer', fontSize:'.85rem', fontWeight:500 },
  filterBadge: { background:'#7c3aed', color:'#fff', borderRadius:'999px', fontSize:'.65rem', fontWeight:700, padding:'1px 6px', marginLeft:'.15rem' },
  clearAllBtn: { display:'flex', alignItems:'center', gap:'.3rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:'8px', padding:'.45rem .85rem', cursor:'pointer', fontSize:'.82rem', fontWeight:500 },
  filterPanel: { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'1rem', marginTop:'.6rem' },
  filterGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:'1rem' },
  label: { display:'block', fontSize:'.78rem', fontWeight:600, color:'#64748b', marginBottom:'.3rem' },
  dateInput: { width:'100%', padding:'.4rem .6rem', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'.85rem', color:'#1e293b', background:'#fff', boxSizing:'border-box' },
  chips: { display:'flex', flexWrap:'wrap', gap:'.4rem', marginTop:'.5rem' },
  chip: { display:'flex', alignItems:'center', gap:'.3rem', background:'#ede9fe', color:'#5b21b6', fontSize:'.78rem', fontWeight:500, padding:'.2rem .6rem', borderRadius:'999px' },
  chipX: { background:'none', border:'none', cursor:'pointer', color:'#7c3aed', fontWeight:700, fontSize:'.9rem', padding:0, lineHeight:1 },
  refreshBtn: { display:'flex', alignItems:'center', gap:'.3rem', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:'7px', padding:'.3rem .75rem', cursor:'pointer', fontSize:'.82rem', fontWeight:500 },
  classCard: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'1rem 1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,.04)' },
  classTop: { display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.5rem', flexWrap:'wrap' },
  classTitle: { fontWeight:700, fontSize:'1rem', color:'#1e293b' },
  pill: (bg, color) => ({ fontSize:'.72rem', fontWeight:700, color, background:bg, padding:'.15rem .55rem', borderRadius:'999px' }),
  branchBadge: { fontSize:'.72rem', fontWeight:600, color:'#0369a1', background:'#e0f2fe', padding:'.15rem .6rem', borderRadius:'999px' },
  classMeta: { display:'flex', flexDirection:'column', gap:'.3rem', fontSize:'.82rem', color:'#64748b' }
};