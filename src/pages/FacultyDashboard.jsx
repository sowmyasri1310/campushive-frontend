import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import RoomCard from '../components/RoomCard'
import BookingForm from '../components/BookingForm'
import BookingSearch from '../components/BookingSearch'
import { getAllRooms, getMyBookings, deleteBooking, createCancelRequest } from '../services/api'
import { format, isToday, isYesterday, isTomorrow } from 'date-fns'
import { FiList, FiGrid, FiTrash2, FiAlertTriangle, FiMapPin, FiClock, FiUser, FiXCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function FacultyDashboard() {
  const [tab, setTab]             = useState('rooms');
  const [rooms, setRooms]         = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [cancelReqId, setCancelReqId] = useState(null);
  const [cancelNote, setCancelNote]   = useState('');
  const [deleting, setDeleting]   = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    getAllRooms().then(r => setRooms(r.data)).catch(() => {});
    loadBookings();
  }, []);

  const loadBookings = () =>
    getMyBookings()
      .then(r => { setBookings(r.data); setFiltered(r.data); })
      .catch(() => {});

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteBooking(id);
      toast.success('Booking request deleted.');
      setConfirmId(null);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally { setDeleting(false); }
  };

  const handleCancelRequest = async (id) => {
    if (!cancelNote.trim()) return toast.error('Please provide a reason for cancellation');
    setRequesting(true);
    try {
      await createCancelRequest(id, { reason: cancelNote });
      toast.success('Cancellation request sent to admin!');
      setCancelReqId(null);
      setCancelNote('');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally { setRequesting(false); }
  };

  const groupByDate = (list) => {
    const map = list.reduce((acc, b) => {
      const d   = new Date(b.startTime);
      const key = format(d, 'yyyy-MM-dd');
      const label = isToday(d)     ? `Today — ${format(d, 'MMMM d, yyyy')}`
                  : isYesterday(d) ? `Yesterday — ${format(d, 'MMMM d, yyyy')}`
                  : isTomorrow(d)  ? `Tomorrow — ${format(d, 'MMMM d, yyyy')}`
                  : format(d, 'EEEE, MMMM d, yyyy');
      if (!acc[key]) acc[key] = { label, items: [] };
      acc[key].items.push(b);
      return acc;
    }, {});
    return Object.keys(map).sort((a, b) => b.localeCompare(a)).map(k => map[k]);
  };

  const stats = {
    total:    bookings.length,
    pending:  bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
  };

  const groups = groupByDate(filtered);

  return (
    <>
      <Navbar/>
      <div className="page">
        <h1 className="page-title">Faculty Dashboard</h1>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom:'1.5rem' }}>
          {[
            { label:'Total',    val:stats.total,    bg:'#eff6ff', color:'#1d4ed8' },
            { label:'Pending',  val:stats.pending,  bg:'#fef3c7', color:'#92400e' },
            { label:'Approved', val:stats.approved, bg:'#dcfce7', color:'#166534' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, color:s.color, borderRadius:'10px', padding:'1rem 1.25rem' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:700 }}>{s.val}</div>
              <div style={{ fontSize:'.85rem', fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.25rem' }}>
          <button className={`btn ${tab==='rooms'?'btn-primary':'btn-outline'}`}
            onClick={() => setTab('rooms')}>
            <FiGrid size={14}/> Book a Room
          </button>
          <button className={`btn ${tab==='bookings'?'btn-primary':'btn-outline'}`}
            onClick={() => setTab('bookings')}>
            <FiList size={14}/> My Bookings ({bookings.length})
          </button>
        </div>

        {/* Rooms */}
        {tab === 'rooms' && (
          rooms.length === 0
            ? <div className="empty">No rooms available.</div>
            : <div className="grid-2">
                {rooms.map(r => (
                  <RoomCard key={r.id} room={r} onBook={() => setSelected(r)}/>
                ))}
              </div>
        )}

        {/* My Bookings */}
        {tab === 'bookings' && (
          <>
            <BookingSearch bookings={bookings} onFiltered={setFiltered}/>

            {filtered.length === 0 ? (
              <div className="empty">
                {bookings.length === 0
                  ? 'No bookings yet. Go to Book a Room to get started!'
                  : '🔍 No results match your search.'}
              </div>
            ) : (
              <div>
                <p style={{ fontSize:'.82rem', color:'#94a3b8', margin:'0 0 .5rem' }}>
                  Showing {filtered.length} of {bookings.length} bookings
                </p>

                {groups.map(g => (
                  <div key={g.label} style={{ marginBottom:'1.5rem' }}>
                    {/* Date separator */}
                    <div style={{ display:'flex', alignItems:'center', gap:'.75rem', margin:'1rem 0 .75rem' }}>
                      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
                      <span style={styles.datePill}>{g.label}</span>
                      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                      {g.items.map(b => {
                        const sc = statusColors[b.status] || {};
                        const canDelete    = b.status === 'PENDING' || b.status === 'REJECTED';
                        const canCancel    = b.status === 'APPROVED' && new Date(b.endTime) > new Date();
                        const isConfirming = confirmId === b.id;
                        const isCancelling = cancelReqId === b.id;

                        return (
                          <div key={b.id} style={{
                            background:'#fff', border:'1px solid #e2e8f0',
                            borderRadius:'12px', overflow:'hidden',
                            boxShadow:'0 1px 4px rgba(0,0,0,.05)'
                          }}>
                            {/* Top bar */}
                            <div style={{
                              display:'flex', alignItems:'center', justifyContent:'space-between',
                              padding:'.75rem 1.1rem', borderBottom:'1px solid #f1f5f9',
                              background:'#fafafa', flexWrap:'wrap', gap:'.5rem'
                            }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap' }}>
                                <span style={{ ...styles.statusBadge, background:sc.bg, color:sc.color }}>
                                  {b.status}
                                </span>
                                {b.branch && (
                                  <span style={styles.branchBadge}>
                                    {b.branch}{b.section ? ` - ${b.section}` : ''}
                                  </span>
                                )}
                                {b.cancelRequested && (
                                  <span style={styles.cancelPending}>
                                    ⏳ Cancel Requested
                                  </span>
                                )}
                              </div>

                              <div style={{ display:'flex', gap:'.5rem' }}>
                                {/* Delete for PENDING/REJECTED */}
                                {canDelete && !isConfirming && (
                                  <button style={styles.deleteBtn}
                                    onClick={() => setConfirmId(b.id)}>
                                    <FiTrash2 size={13}/> Delete
                                  </button>
                                )}
                                {/* Request cancel for APPROVED */}
                                {canCancel && !isCancelling && !b.cancelRequested && (
                                  <button style={styles.cancelBtn}
                                    onClick={() => { setCancelReqId(b.id); setCancelNote(''); }}>
                                    <FiXCircle size={13}/> Request Cancel
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Body */}
                            <div style={{ padding:'1rem 1.1rem' }}>
                              <h4 style={{ margin:'0 0 .6rem', fontSize:'1rem', fontWeight:700, color:'#1e293b' }}>
                                {b.title}
                              </h4>
                              <div style={styles.meta}>
                                <span><FiMapPin size={12}/>&nbsp;{b.room?.name} · {b.room?.location}</span>
                                <span><FiClock size={12}/>&nbsp;{format(new Date(b.startTime), 'MMM d, yyyy  h:mm a')} → {format(new Date(b.endTime), 'h:mm a')}</span>
                                <span><FiUser size={12}/>&nbsp;{b.faculty?.name}{b.faculty?.department ? ` (${b.faculty.department})` : ''}</span>
                              </div>
                              {b.purpose && (
                                <p style={{ fontSize:'.83rem', color:'#94a3b8', fontStyle:'italic', margin:'.5rem 0 0' }}>
                                  📝 {b.purpose}
                                </p>
                              )}
                              {b.adminNote && (
                                <div style={styles.adminNote}>📋 Admin: {b.adminNote}</div>
                              )}
                            </div>

                            {/* Delete confirm */}
                            {isConfirming && (
                              <div style={styles.confirmBox}>
                                <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginBottom:'.6rem' }}>
                                  <FiAlertTriangle size={15} color="#d97706"/>
                                  <span style={{ fontSize:'.88rem', fontWeight:700, color:'#92400e' }}>
                                    Delete "{b.title}"?
                                  </span>
                                </div>
                                <p style={{ fontSize:'.82rem', color:'#92400e', margin:'0 0 .75rem' }}>
                                  This permanently removes the booking request.
                                </p>
                                <div style={{ display:'flex', gap:'.5rem' }}>
                                  <button className="btn btn-danger"
                                    onClick={() => handleDelete(b.id)} disabled={deleting}>
                                    {deleting ? 'Deleting...' : '🗑️ Yes, Delete'}
                                  </button>
                                  <button className="btn btn-outline"
                                    onClick={() => setConfirmId(null)}>Cancel</button>
                                </div>
                              </div>
                            )}

                            {/* Cancel request form */}
                            {isCancelling && (
                              <div style={styles.cancelBox}>
                                <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginBottom:'.6rem' }}>
                                  <FiXCircle size={15} color="#7c3aed"/>
                                  <span style={{ fontSize:'.88rem', fontWeight:700, color:'#5b21b6' }}>
                                    Request Cancellation of "{b.title}"
                                  </span>
                                </div>
                                <p style={{ fontSize:'.82rem', color:'#6d28d9', margin:'0 0 .75rem', lineHeight:1.5 }}>
                                  This sends a cancellation request to your admin. The class remains active until admin approves the cancellation.
                                </p>
                                <div className="form-group" style={{ marginBottom:'.75rem' }}>
                                  <label style={{ fontSize:'.82rem', fontWeight:600, color:'#5b21b6', display:'block', marginBottom:'.3rem' }}>
                                    Reason for cancellation *
                                  </label>
                                  <textarea
                                    style={{ width:'100%', padding:'.5rem .75rem', border:'1px solid #c4b5fd', borderRadius:'7px', fontSize:'.88rem', resize:'vertical', minHeight:70, boxSizing:'border-box' }}
                                    value={cancelNote}
                                    onChange={e => setCancelNote(e.target.value)}
                                    placeholder="e.g. Faculty unavailable, exam clash, topic rescheduled..."/>
                                </div>
                                <div style={{ display:'flex', gap:'.5rem' }}>
                                  <button style={styles.sendRequestBtn}
                                    onClick={() => handleCancelRequest(b.id)} disabled={requesting}>
                                    {requesting ? 'Sending...' : ' Send Cancel Request'}
                                  </button>
                                  <button className="btn btn-outline"
                                    onClick={() => { setCancelReqId(null); setCancelNote(''); }}>
                                    Keep Class
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <BookingForm
          room={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { loadBookings(); setTab('bookings'); }}
        />
      )}
    </>
  );
}

const statusColors = {
  APPROVED: { bg:'#dcfce7', color:'#166534' },
  PENDING:  { bg:'#fef3c7', color:'#92400e' },
  REJECTED: { bg:'#fee2e2', color:'#991b1b' },
};

const styles = {
  datePill: {
    fontSize:'.78rem', fontWeight:600, color:'#94a3b8', whiteSpace:'nowrap',
    background:'#f8fafc', padding:'.2rem .75rem', borderRadius:'999px', border:'1px solid #e2e8f0'
  },
  statusBadge: { fontSize:'.72rem', fontWeight:700, padding:'.18rem .6rem', borderRadius:'999px' },
  branchBadge: { fontSize:'.72rem', fontWeight:600, color:'#0369a1', background:'#e0f2fe', padding:'.15rem .6rem', borderRadius:'999px' },
  cancelPending: { fontSize:'.72rem', fontWeight:700, color:'#7c3aed', background:'#ede9fe', padding:'.15rem .6rem', borderRadius:'999px' },
  deleteBtn: { display:'flex', alignItems:'center', gap:'.35rem', background:'#fff', color:'#dc2626', border:'1.5px solid #fca5a5', borderRadius:'7px', padding:'.3rem .75rem', cursor:'pointer', fontSize:'.82rem', fontWeight:600 },
  cancelBtn: { display:'flex', alignItems:'center', gap:'.35rem', background:'#faf5ff', color:'#7c3aed', border:'1.5px solid #c4b5fd', borderRadius:'7px', padding:'.3rem .75rem', cursor:'pointer', fontSize:'.82rem', fontWeight:600 },
  meta: { display:'flex', flexDirection:'column', gap:'.25rem', fontSize:'.82rem', color:'#64748b' },
  adminNote: { fontSize:'.82rem', color:'#b45309', background:'#fef3c7', border:'1px solid #fde68a', borderRadius:'6px', padding:'.4rem .7rem', marginTop:'.5rem' },
  confirmBox: { background:'#fef3c7', borderTop:'1px solid #fde68a', padding:'1rem 1.1rem' },
  cancelBox: { background:'#faf5ff', borderTop:'1px solid #e9d5ff', padding:'1rem 1.1rem' },
  sendRequestBtn: { display:'flex', alignItems:'center', gap:'.35rem', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:'8px', padding:'.45rem 1rem', cursor:'pointer', fontSize:'.88rem', fontWeight:600 }
};