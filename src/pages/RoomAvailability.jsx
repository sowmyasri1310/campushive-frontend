import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getAllRooms, getRoomBookings } from '../services/api'
import { format, isPast } from 'date-fns'
import { FiChevronDown, FiChevronUp, FiUser, FiClock, FiTag } from 'react-icons/fi'

export default function RoomAvailability() {
  const [rooms, setRooms]       = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [bookings, setBookings] = useState({});
  const [now, setNow]           = useState(new Date());

  useEffect(() => {
    getAllRooms().then(r => setRooms(r.data)).catch(() => {});
    // Refresh "now" every minute so Free/Occupied badge stays live
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  const toggle = async (room) => {
    if (expanded === room.id) { setExpanded(null); return; }
    setExpanded(room.id);
    if (!bookings[room.id]) {
      try {
        const { data } = await getRoomBookings(room.id);
        setBookings(prev => ({ ...prev, [room.id]: data }));
      } catch {}
    }
  };

  // Filter: only show bookings that haven't ended yet
  const activeBookings = (roomId) =>
    (bookings[roomId] || []).filter(b =>
      b.status === 'APPROVED' && new Date(b.endTime) > now
    );

  // All non-expired bookings (any status) for display list
  const visibleBookings = (roomId) =>
    (bookings[roomId] || []).filter(b => new Date(b.endTime) > now);

  const isFreeNow = (roomId) => {
    const active = activeBookings(roomId);
    return !active.some(b =>
      new Date(b.startTime) <= now && new Date(b.endTime) >= now
    );
  };

  const nextFreeAt = (roomId) => {
    const active = activeBookings(roomId);
    const current = active.find(b =>
      new Date(b.startTime) <= now && new Date(b.endTime) >= now
    );
    return current ? format(new Date(current.endTime), 'h:mm a') : null;
  };

  const statusStyle = {
    APPROVED: { bg:'#dcfce7', color:'#166534' },
    PENDING:  { bg:'#fef3c7', color:'#92400e' },
    REJECTED: { bg:'#fee2e2', color:'#991b1b' },
  };

  return (
    <>
      <Navbar/>
      <div className="page">
        <h1 className="page-title">Room Schedule &amp; Availability</h1>
        <p style={{ color:'#64748b', marginBottom:'1.5rem', fontSize:'.9rem' }}>
          Click any room to see upcoming bookings. 
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
          {rooms.map(room => {
            const isOpen   = expanded === room.id;
            const rb       = bookings[room.id];
            const visible  = visibleBookings(room.id);
            const approved = activeBookings(room.id);
            const free     = rb !== undefined ? isFreeNow(room.id) : null;
            const freeAt   = rb !== undefined ? nextFreeAt(room.id) : null;

            return (
              <div key={room.id} style={styles.roomWrap}>
                {/* Room header */}
                <div style={styles.roomHeader} onClick={() => toggle(room)}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                    <div>
                      <p style={{ fontWeight:700, fontSize:'1rem', margin:0 }}>{room.name}</p>
                      <p style={{ fontSize:'.8rem', color:'#64748b', margin:'.15rem 0 0' }}>
                        {room.location} &nbsp;·&nbsp; Cap: {room.capacity}
                        &nbsp;·&nbsp; {room.type?.replace('_',' ')}
                      </p>
                      <p style={{ fontSize:'.78rem', color:'#94a3b8', margin:'.1rem 0 0' }}>
                      {room.amenities}
                      </p>
                    </div>

                    {rb !== undefined && (
                      <span style={{
                        padding:'.25rem .8rem', borderRadius:'999px',
                        fontSize:'.78rem', fontWeight:700,
                        background: free ? '#dcfce7' : '#fee2e2',
                        color:      free ? '#166534' : '#991b1b'
                      }}>
                        {free ? '✅ Free Now' : `🔴 Occupied · Free at ${freeAt}`}
                      </span>
                    )}

                    {approved.length > 0 && (
                      <span style={styles.countBadge}>
                        {approved.length} upcoming class{approved.length > 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                  {isOpen ? <FiChevronUp color="#64748b"/> : <FiChevronDown color="#64748b"/>}
                </div>

                {/* Booking details */}
                {isOpen && (
                  <div style={styles.bookingList}>
                    {visible.length === 0
                      ? <p style={{ color:'#64748b', fontSize:'.88rem', padding:'.5rem 0' }}>
                          No upcoming bookings for this room.
                        </p>
                      : visible.map(b => {
                          const isOngoing = new Date(b.startTime) <= now && new Date(b.endTime) >= now;
                          return (
                            <div key={b.id} style={{
                              ...styles.bookingRow,
                              borderLeft: isOngoing
                                ? '4px solid #16a34a'
                                : b.status === 'APPROVED'
                                ? '4px solid #2563eb'
                                : b.status === 'PENDING'
                                ? '4px solid #d97706'
                                : '4px solid #dc2626'
                            }}>
                              {/* Title + status + ongoing badge */}
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'.4rem' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap' }}>
                                  <span style={{ fontWeight:700, fontSize:'.95rem', color:'#1e293b' }}>
                                    {b.title}
                                  </span>
                                  {isOngoing && (
                                    <span style={{ background:'#dcfce7', color:'#166534',
                                      fontSize:'.7rem', fontWeight:700,
                                      padding:'.1rem .5rem', borderRadius:'999px' }}>
                                      🟢 Ongoing
                                    </span>
                                  )}
                                </div>
                                <span style={{
                                  padding:'.15rem .6rem', borderRadius:'999px',
                                  fontSize:'.72rem', fontWeight:700,
                                  background: statusStyle[b.status]?.bg,
                                  color:      statusStyle[b.status]?.color
                                }}>
                                  {b.status}
                                </span>
                              </div>

                              {/* Detail grid */}
                              <div style={styles.detailGrid}>
                                <span>
                                  <FiUser size={12}/>&nbsp;
                                  <strong>Faculty:</strong>&nbsp;
                                  {b.faculty?.name}
                                  {b.faculty?.department ? ` · ${b.faculty.department}` : ''}
                                </span>
                                <span>
                                  <FiClock size={12}/>&nbsp;
                                  <strong>Date:</strong>&nbsp;
                                  {format(new Date(b.startTime), 'MMM d, yyyy')}
                                </span>
                                <span>
                                  <FiClock size={12}/>&nbsp;
                                  <strong>Time:</strong>&nbsp;
                                  {format(new Date(b.startTime), 'h:mm a')}
                                  &nbsp;→&nbsp;
                                  {format(new Date(b.endTime), 'h:mm a')}
                                </span>
                                {b.branch && (
                                  <span>
                                    <FiTag size={12}/>&nbsp;
                                    <strong>Branch:</strong>&nbsp;{b.branch}
                                    {b.section ? ` — Section ${b.section}` : ''}
                                  </span>
                                )}
                                {b.purpose && (
                                  <span style={{ fontStyle:'italic', color:'#94a3b8' }}>
                                    📝 {b.purpose}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const styles = {
  roomWrap: {
    background:'#fff', border:'1px solid #e2e8f0',
    borderRadius:'12px', overflow:'hidden',
    boxShadow:'0 1px 4px rgba(0,0,0,.05)'
  },
  roomHeader: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'1rem 1.25rem', cursor:'pointer'
  },
  countBadge: {
    fontSize:'.75rem', fontWeight:600, color:'#7c3aed',
    background:'#ede9fe', padding:'.2rem .6rem', borderRadius:'999px'
  },
  bookingList: {
    borderTop:'1px solid #f1f5f9', padding:'1rem 1.25rem',
    background:'#f8fafc', display:'flex', flexDirection:'column', gap:'.75rem'
  },
  bookingRow: {
    background:'#fff', borderRadius:'8px',
    padding:'.85rem 1rem', border:'1px solid #e2e8f0',
    display:'flex', flexDirection:'column', gap:'.5rem'
  },
  detailGrid: {
    display:'flex', flexDirection:'column',
    gap:'.25rem', fontSize:'.82rem', color:'#64748b'
  }
};