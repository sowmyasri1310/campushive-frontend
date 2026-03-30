import { FiClock, FiMapPin, FiUser, FiTag } from 'react-icons/fi'
import { format } from 'date-fns'

export default function BookingCard({ booking, actions }) {
  const statusColors = {
    APPROVED: { bg:'#dcfce7', color:'#166534' },
    PENDING:  { bg:'#fef3c7', color:'#92400e' },
    REJECTED: { bg:'#fee2e2', color:'#991b1b' },
  };
  const sc  = statusColors[booking.status] || {};
  const fmt = dt => format(new Date(dt), 'MMM d, yyyy  h:mm a');

  return (
    <div style={styles.card}>
      <div style={styles.top}>
        <span style={{ ...styles.statusBadge, background:sc.bg, color:sc.color }}>
          {booking.status}
        </span>
        {booking.branch && (
          <span style={styles.branchBadge}>
            {booking.branch}{booking.section ? ` - ${booking.section}` : ''}
          </span>
        )}
        <h4 style={styles.title}>{booking.title}</h4>
      </div>

      <div style={styles.meta}>
        <span><FiMapPin size={13}/> {booking.room?.name} · {booking.room?.location}</span>
        <span><FiClock size={13}/> {fmt(booking.startTime)} → {fmt(booking.endTime)}</span>
        {booking.faculty && (
          <span><FiUser size={13}/> {booking.faculty.name}
            {booking.faculty.department ? ` (${booking.faculty.department})` : ''}
          </span>
        )}
      </div>

      {booking.purpose && (
        <p style={styles.purpose}>{booking.purpose}</p>
      )}
      {booking.adminNote && (
        <p style={styles.note}>Admin note: {booking.adminNote}</p>
      )}
      {actions && <div style={styles.actions}>{actions}</div>}
    </div>
  );
}

const styles = {
  card: {
    background:'#fff', border:'1px solid #e2e8f0',
    borderRadius:'10px', padding:'1.1rem',
    boxShadow:'0 1px 4px rgba(0,0,0,.05)'
  },
  top:         { marginBottom:'.6rem', display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap' },
  statusBadge: { fontSize:'.72rem', fontWeight:700, padding:'.18rem .6rem', borderRadius:'999px' },
  title:       { fontSize:'1rem', fontWeight:600, width:'100%', marginTop:'.2rem', margin:0 },
  branchBadge: {
    fontSize:'.72rem', fontWeight:600, color:'#0369a1',
    background:'#e0f2fe', padding:'.15rem .6rem', borderRadius:'999px'
  },
  meta:    { display:'flex', flexDirection:'column', gap:'.25rem', fontSize:'.82rem', color:'#64748b' },
  purpose: { fontSize:'.84rem', color:'#475569', marginTop:'.5rem', fontStyle:'italic' },
  note:    {
    fontSize:'.82rem', color:'#b45309', marginTop:'.4rem',
    background:'#fef3c7', padding:'.4rem .7rem', borderRadius:'6px'
  },
  actions: { marginTop:'.85rem', display:'flex', gap:'.6rem', flexWrap:'wrap' }
};