import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import BookingSearch from '../components/BookingSearch'
import {
  getPending, getAllBookings, processBooking, adminDeleteBooking,
  adminCreateFaculty, adminListFaculty, adminListStudents, adminDeleteUser
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { format, isToday, isYesterday, isTomorrow } from 'date-fns'
import {
  FiCheckCircle, FiXCircle, FiList, FiClock, FiUsers,
  FiUserPlus, FiTrash2, FiAlertTriangle, FiMapPin, FiUser,
  FiSearch, FiFilter, FiX
} from 'react-icons/fi'

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByDate(list) {
  const map = list.reduce((acc, b) => {
    const d   = new Date(b.startTime);
    const key = format(d, 'yyyy-MM-dd');
    const label = isToday(d)     ? `Today — ${format(d, 'MMMM d, yyyy')}`
                : isYesterday(d) ? `Yesterday — ${format(d, 'MMMM d, yyyy')}`
                : isTomorrow(d)  ? `Tomorrow — ${format(d, 'MMMM d, yyyy')}`
                : format(d, 'EEEE, MMMM d, yyyy');
    if (!acc[key]) acc[key] = { label, items:[] };
    acc[key].items.push(b);
    return acc;
  }, {});
  return Object.keys(map).sort((a,b) => b.localeCompare(a)).map(k => map[k]);
}

function DateSep({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'.75rem', margin:'1rem 0 .6rem' }}>
      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
      <span style={{ fontSize:'.78rem', fontWeight:600, color:'#94a3b8', whiteSpace:'nowrap',
        background:'#f8fafc', padding:'.2rem .75rem', borderRadius:'999px', border:'1px solid #e2e8f0' }}>
        {label}
      </span>
      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
    </div>
  );
}

// ── Booking card ──────────────────────────────────────────────────────────────
function AdminBookingCard({ booking, onApprove, onReject, onDelete }) {
  const [showReject, setShowReject] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [note, setNote]             = useState('');
  const statusColors = {
    APPROVED: { bg:'#dcfce7', color:'#166534' },
    PENDING:  { bg:'#fef3c7', color:'#92400e' },
    REJECTED: { bg:'#fee2e2', color:'#991b1b' },
  };
  const sc = statusColors[booking.status] || {};
  const isUpcoming = new Date(booking.endTime) > new Date();

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.7rem 1.1rem', borderBottom:'1px solid #f1f5f9', background:'#fafafa', flexWrap:'wrap', gap:'.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'.72rem', fontWeight:700, padding:'.18rem .6rem', borderRadius:'999px', background:sc.bg, color:sc.color }}>{booking.status}</span>
          {booking.branch && <span style={{ fontSize:'.72rem', fontWeight:600, color:'#0369a1', background:'#e0f2fe', padding:'.15rem .6rem', borderRadius:'999px' }}>{booking.branch}{booking.section?` - ${booking.section}`:''}</span>}
        </div>
        {booking.status === 'APPROVED' && isUpcoming && !showDelete && (
          <button style={s.deleteBtn} onClick={() => setShowDelete(true)}>
            <FiTrash2 size={13}/> Cancel Class
          </button>
        )}
      </div>
      <div style={{ padding:'1rem 1.1rem' }}>
        <h4 style={{ margin:'0 0 .5rem', fontSize:'1rem', fontWeight:700, color:'#1e293b' }}>{booking.title}</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:'.25rem', fontSize:'.82rem', color:'#64748b' }}>
          <span><FiMapPin size={12}/>&nbsp;{booking.room?.name} · {booking.room?.location}</span>
          <span>&nbsp;{format(new Date(booking.startTime), 'MMM d, yyyy  h:mm a')} → {format(new Date(booking.endTime), 'h:mm a')}</span>
          <span><FiUser size={12}/>&nbsp;{booking.faculty?.name}{booking.faculty?.department?` (${booking.faculty.department})`:''}</span>
        </div>
        {booking.purpose && <p style={{ fontSize:'.83rem', color:'#94a3b8', fontStyle:'italic', margin:'.5rem 0 0' }}>📝 {booking.purpose}</p>}
        {booking.adminNote && <div style={{ fontSize:'.82rem', color:'#b45309', background:'#fef3c7', border:'1px solid #fde68a', borderRadius:'6px', padding:'.4rem .7rem', marginTop:'.5rem' }}>📋 Note: {booking.adminNote}</div>}
      </div>
      {booking.status === 'PENDING' && !showReject && !showDelete && (
        <div style={{ padding:'.75rem 1.1rem', borderTop:'1px solid #f1f5f9', display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
          <button className="btn btn-success" onClick={() => onApprove(booking.id)}><FiCheckCircle size={14}/> Approve</button>
          <button className="btn btn-danger"  onClick={() => setShowReject(true)}><FiXCircle size={14}/> Reject</button>
        </div>
      )}
      {showReject && (
        <div style={{ padding:'.85rem 1.1rem', borderTop:'1px solid #f1f5f9', background:'#fef2f2' }}>
          <label style={{ fontSize:'.82rem', fontWeight:600, color:'#991b1b', display:'block', marginBottom:'.4rem' }}>Rejection Reason *</label>
          <input style={{ width:'100%', padding:'.5rem .75rem', border:'1px solid #fca5a5', borderRadius:'7px', fontSize:'.88rem', boxSizing:'border-box', marginBottom:'.6rem' }}
            value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Room unavailable..."/>
          <div style={{ display:'flex', gap:'.5rem' }}>
            <button className="btn btn-danger" onClick={() => { if (!note.trim()) return toast.error('Enter a reason'); onReject(booking.id, note); setShowReject(false); setNote(''); }}>Confirm Reject</button>
            <button className="btn btn-outline" onClick={() => { setShowReject(false); setNote(''); }}>Cancel</button>
          </div>
        </div>
      )}
      {showDelete && (
        <div style={{ padding:'.85rem 1.1rem', borderTop:'1px solid #fde68a', background:'#fef3c7' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginBottom:'.5rem' }}>
            <FiAlertTriangle size={15} color="#d97706"/>
            <span style={{ fontSize:'.88rem', fontWeight:700, color:'#92400e' }}>Cancel "{booking.title}"?</span>
          </div>
          <p style={{ fontSize:'.82rem', color:'#92400e', margin:'0 0 .75rem', lineHeight:1.5 }}>Faculty and all affected students will be notified automatically.</p>
          <div style={{ display:'flex', gap:'.5rem' }}>
            <button className="btn btn-danger" onClick={() => { onDelete(booking.id); setShowDelete(false); }}> Yes, Cancel Class</button>
            <button className="btn btn-outline" onClick={() => setShowDelete(false)}>Keep It</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── People table with search, filter, delete ──────────────────────────────────
function PeopleTable({ people, showSection, emptyMsg, onDelete, role }) {
  const [search, setSearch]       = useState('');
  const [filterSection, setFS]    = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const sections = [...new Set(people.map(p => p.section).filter(Boolean))].sort();

  const filtered = people.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.section?.toLowerCase().includes(q);
    const matchSection = !filterSection || p.section === filterSection;
    return matchSearch && matchSection;
  });

  const hasFilters = search || filterSection;

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await onDelete(id);
      setConfirmId(null);
    } finally { setDeleting(false); }
  };

  if (!people.length) return <div className="empty">{emptyMsg}</div>;

  return (
    <div>
      {/* Search + filter row */}
      <div style={{ display:'flex', gap:'.6rem', marginBottom:'.75rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:'.5rem', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'.4rem .75rem' }}>
          <FiSearch size={14} color="#94a3b8"/>
          <input style={{ border:'none', outline:'none', fontSize:'.85rem', flex:1 }}
            placeholder={`Search ${role === 'FACULTY' ? 'faculty' : 'students'} by name, email...`}
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && <button style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0 }} onClick={() => setSearch('')}><FiX size={13}/></button>}
        </div>

        {showSection && sections.length > 0 && (
          <select style={s.filterSelect} value={filterSection} onChange={e => setFS(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
          </select>
        )}

        {hasFilters && (
          <button style={{ ...s.deleteBtn, borderColor:'#e2e8f0', color:'#64748b', fontSize:'.78rem' }}
            onClick={() => { setSearch(''); setFS(''); }}>
            <FiX size={12}/> Clear
          </button>
        )}
      </div>

      <p style={{ fontSize:'.78rem', color:'#94a3b8', margin:'0 0 .5rem' }}>
        Showing {filtered.length} of {people.length}
        {hasFilters ? ' (filtered)' : ''}
      </p>

      {/* Table */}
      <div style={{ border:'1px solid #e2e8f0', borderRadius:'10px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.88rem' }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
              {['Name','Email','Department', showSection&&'Section','Joined','Action']
                .filter(Boolean).map(h => (
                <th key={h} style={{ padding:'.65rem 1rem', textAlign:'left', fontWeight:600, color:'#475569', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                <td style={{ padding:'.7rem 1rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0,
                      background: showSection?'#dcfce7':'#dbeafe',
                      color: showSection?'#166534':'#1d4ed8',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:700, fontSize:'.85rem' }}>
                      {p.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight:500 }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding:'.7rem 1rem', color:'#64748b' }}>{p.email}</td>
                <td style={{ padding:'.7rem 1rem', color:'#64748b' }}>{p.department||'—'}</td>
                {showSection && (
                  <td style={{ padding:'.7rem 1rem' }}>
                    <span style={{ background:'#dcfce7', color:'#166534', padding:'.15rem .55rem', borderRadius:'999px', fontSize:'.75rem', fontWeight:600 }}>
                      {p.section||'—'}
                    </span>
                  </td>
                )}
                <td style={{ padding:'.7rem 1rem', color:'#94a3b8', fontSize:'.8rem' }}>
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding:'.7rem 1rem' }}>
                  {confirmId === p.id ? (
                    <div style={{ display:'flex', gap:'.35rem', alignItems:'center' }}>
                      <span style={{ fontSize:'.75rem', color:'#dc2626', fontWeight:600 }}>Sure?</span>
                      <button style={{ ...s.deleteBtn, padding:'.2rem .55rem', fontSize:'.75rem' }}
                        onClick={() => handleDelete(p.id)} disabled={deleting}>
                        {deleting ? '...' : 'Yes'}
                      </button>
                      <button style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'5px', padding:'.2rem .55rem', cursor:'pointer', fontSize:'.75rem', color:'#64748b' }}
                        onClick={() => setConfirmId(null)}>No</button>
                    </div>
                  ) : (
                    <button style={{ ...s.deleteBtn, padding:'.28rem .65rem', fontSize:'.78rem' }}
                      onClick={() => setConfirmId(p.id)}>
                      <FiTrash2 size={12}/> Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign:'center', padding:'1.5rem', color:'#94a3b8' }}>
            No {role === 'FACULTY' ? 'faculty' : 'students'} match your search.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('pending');
  const [pending, setPending]   = useState([]);
  const [all, setAll]           = useState([]);
  const [filteredP, setFP]      = useState([]);
  const [filteredA, setFA]      = useState([]);
  const [faculty, setFaculty]   = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newFac, setNewFac]     = useState({ name:'', email:'', password:'', department:'' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadPending(); loadAll(); }, []);
  useEffect(() => { if (tab==='people') { loadFaculty(); loadStudents(); } }, [tab]);

  const loadPending  = () => getPending().then(r => { setPending(r.data); setFP(r.data); }).catch(()=>{});
  const loadAll      = () => getAllBookings().then(r => { setAll(r.data); setFA(r.data); }).catch(()=>{});
  const loadFaculty  = () => adminListFaculty().then(r => setFaculty(r.data)).catch(()=>{});
  const loadStudents = () => adminListStudents().then(r => setStudents(r.data)).catch(()=>{});

  const approve = async (id) => {
    try { await processBooking(id, { status:'APPROVED', adminNote:'' }); toast.success('Approved!'); loadPending(); loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed', { duration:5000 }); }
  };

  const reject = async (id, note) => {
    try { await processBooking(id, { status:'REJECTED', adminNote:note }); toast.success('Rejected.'); loadPending(); loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAdminDelete = async (id) => {
    try { await adminDeleteBooking(id); toast.success('Class cancelled. Faculty & students notified.'); loadAll(); loadPending(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { data } = await adminDeleteUser(userId);
      toast.success(data.message || 'User removed.');
      loadFaculty(); loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove user');
      throw err;
    }
  };

  const handleCreateFaculty = async () => {
    if (!newFac.name || !newFac.email || !newFac.password) return toast.error('Fill all required fields');
    setCreating(true);
    try {
      await adminCreateFaculty(newFac);
      toast.success(`Faculty created for ${user?.branch}!`);
      setNewFac({ name:'', email:'', password:'', department:'' });
      setShowForm(false); loadFaculty();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const stats = { pending:pending.length, approved:all.filter(b=>b.status==='APPROVED').length, total:all.length };

  return (
    <>
      <Navbar/>
      <div className="page">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom:'.25rem' }}> Admin Dashboard</h1>
            <div style={s.branchBadge}>Branch: {user?.branch || 'Unknown'}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom:'1.5rem' }}>
          {[
            { label:'Pending',  val:stats.pending,  bg:'#fef3c7', color:'#92400e' },
            { label:'Approved', val:stats.approved, bg:'#dcfce7', color:'#166534' },
            { label:'Total',    val:stats.total,    bg:'#eff6ff', color:'#1d4ed8' },
          ].map(st => (
            <div key={st.label} style={{ background:st.bg, color:st.color, borderRadius:'10px', padding:'1rem 1.25rem' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:700 }}>{st.val}</div>
              <div style={{ fontSize:'.85rem', fontWeight:500 }}>{st.label} Bookings</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
          <button className={`btn ${tab==='pending'?'btn-primary':'btn-outline'}`} onClick={() => setTab('pending')}><FiClock size={14}/> Pending ({pending.length})</button>
          <button className={`btn ${tab==='all'?'btn-primary':'btn-outline'}`} onClick={() => setTab('all')}><FiList size={14}/> All Bookings ({all.length})</button>
          <button className={`btn ${tab==='people'?'btn-primary':'btn-outline'}`} onClick={() => setTab('people')}><FiUsers size={14}/> Faculty & Students</button>
        </div>

        {/* Pending */}
        {tab === 'pending' && (
          <>
            <BookingSearch bookings={pending} onFiltered={setFP}/>
            {filteredP.length === 0
              ? <div className="empty">{pending.length===0?'🎉 No pending requests!':'🔍 No results.'}</div>
              : <>{groupByDate(filteredP).map(g => (<div key={g.label} style={{ marginBottom:'1.5rem' }}><DateSep label={g.label}/><div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>{g.items.map(b=><AdminBookingCard key={b.id} booking={b} onApprove={approve} onReject={reject} onDelete={handleAdminDelete}/>)}</div></div>))}</>
            }
          </>
        )}

        {/* All */}
        {tab === 'all' && (
          <>
            <BookingSearch bookings={all} onFiltered={setFA}/>
            {filteredA.length === 0
              ? <div className="empty">{all.length===0?'No bookings yet.':'🔍 No results.'}</div>
              : <>{groupByDate(filteredA).map(g => (<div key={g.label} style={{ marginBottom:'1.5rem' }}><DateSep label={g.label}/><div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>{g.items.map(b=><AdminBookingCard key={b.id} booking={b} onApprove={approve} onReject={reject} onDelete={handleAdminDelete}/>)}</div></div>))}</>
            }
          </>
        )}

        {/* People */}
        {tab === 'people' && (
          <div>
            {/* Faculty */}
            <div style={s.section}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'.75rem' }}>
                <h3 style={s.sectionTitle}> Faculty — {user?.branch} ({faculty.length})</h3>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><FiUserPlus size={14}/> Add Faculty</button>
              </div>

              {showForm && (
                <div style={s.inlineForm}>
                  <p style={s.formNote}>🔒 Faculty will be assigned to <strong>{user?.branch}</strong> branch automatically.</p>
                  <div className="grid-2">
                    <div className="form-group"><label>Full Name *</label><input value={newFac.name} onChange={e=>setNewFac({...newFac,name:e.target.value})} placeholder="Dr. Jane Smith"/></div>
                    <div className="form-group"><label>Email *</label><input type="email" value={newFac.email} onChange={e=>setNewFac({...newFac,email:e.target.value})} placeholder="jane@campus.com"/></div>
                    <div className="form-group"><label>Password *</label><input type="password" value={newFac.password} onChange={e=>setNewFac({...newFac,password:e.target.value})} placeholder="Set a password"/></div>
                    <div className="form-group"><label>Department</label><input value={newFac.department} onChange={e=>setNewFac({...newFac,department:e.target.value})} placeholder="e.g. Computer Science"/></div>
                  </div>
                  <div style={{ display:'flex', gap:'.75rem' }}>
                    <button className="btn btn-primary" onClick={handleCreateFaculty} disabled={creating}>{creating?'Creating...':'Create Faculty Account'}</button>
                    <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <PeopleTable people={faculty} emptyMsg="No faculty in this branch yet."
                role="FACULTY" onDelete={handleDeleteUser}/>
            </div>

            {/* Students */}
            <div style={s.section}>
              <h3 style={{ ...s.sectionTitle, color:'#166534', marginBottom:'1rem' }}>
                Students — {user?.branch} ({students.length})
              </h3>
              <PeopleTable people={students} showSection emptyMsg="No students in this branch yet."
                role="STUDENT" onDelete={handleDeleteUser}/>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const s = {
  branchBadge: { display:'inline-block', background:'#ede9fe', color:'#7c3aed', padding:'.25rem .75rem', borderRadius:'999px', fontSize:'.82rem', fontWeight:700 },
  section:     { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1.25rem', marginBottom:'1.25rem' },
  sectionTitle:{ fontSize:'1rem', fontWeight:700, color:'#1d4ed8', margin:0 },
  inlineForm:  { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'1.1rem', marginBottom:'1rem' },
  formNote:    { background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'6px', padding:'.55rem .85rem', fontSize:'.82rem', color:'#1d4ed8', marginBottom:'.85rem' },
  deleteBtn:   { display:'flex', alignItems:'center', gap:'.3rem', background:'#fff', color:'#dc2626', border:'1.5px solid #fca5a5', borderRadius:'7px', padding:'.3rem .75rem', cursor:'pointer', fontSize:'.82rem', fontWeight:600 },
  filterSelect:{ padding:'.42rem .65rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'.85rem', color:'#475569', background:'#fff', cursor:'pointer' },
};