import { FiUsers, FiMapPin, FiTag, FiCheckCircle } from 'react-icons/fi'

export default function RoomCard({ room, onBook, showBookButton = true }) {
  const typeColors = {
    CLASSROOM:    '#dbeafe',
    LAB:          '#dcfce7',
    SEMINAR_HALL: '#fef3c7',
    AUDITORIUM:   '#f3e8ff',
  };

  return (
    <div style={styles.card}>
      <div style={{ ...styles.typePill, background: typeColors[room.type] || '#f1f5f9' }}>
        {room.type.replace('_', ' ')}
      </div>

      <h3 style={styles.name}>{room.name}</h3>

      <div style={styles.info}>
        <span><FiMapPin size={13}/> {room.location}</span>
        <span><FiUsers size={13}/> Capacity: {room.capacity}</span>
        <span><FiTag size={13}/> {room.amenities}</span>
      </div>

      {showBookButton && onBook && (
        <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}
          onClick={() => onBook(room)}>
          <FiCheckCircle size={14}/> Book This Room
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: '10px', padding: '1.2rem',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    display: 'flex', flexDirection: 'column'
  },
  typePill: {
    display: 'inline-block', padding: '.2rem .7rem',
    borderRadius: '999px', fontSize: '.72rem', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.04em',
    marginBottom: '.6rem', alignSelf: 'flex-start'
  },
  name: { fontSize: '1.05rem', fontWeight: 700, marginBottom: '.6rem' },
  info: {
    display: 'flex', flexDirection: 'column', gap: '.3rem',
    fontSize: '.83rem', color: '#64748b'
  }
};