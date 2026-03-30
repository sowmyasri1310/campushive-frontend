import { useState } from 'react'
import { FiSearch, FiX, FiFilter } from 'react-icons/fi'

export default function BookingSearch({ bookings, onFiltered }) {
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [status, setStatus]     = useState('');
  const [open, setOpen]         = useState(false);

  const apply = (s, df, dt, st) => {
    let result = [...bookings];

    // Search by title / subject / room / faculty
    if (s.trim()) {
      const q = s.toLowerCase();
      result = result.filter(b =>
        b.title?.toLowerCase().includes(q)          ||
        b.purpose?.toLowerCase().includes(q)        ||
        b.room?.name?.toLowerCase().includes(q)     ||
        b.faculty?.name?.toLowerCase().includes(q)  ||
        b.branch?.toLowerCase().includes(q)
      );
    }

    // Date from
    if (df) {
      const from = new Date(df);
      from.setHours(0,0,0,0);
      result = result.filter(b => new Date(b.startTime) >= from);
    }

    // Date to
    if (dt) {
      const to = new Date(dt);
      to.setHours(23,59,59,999);
      result = result.filter(b => new Date(b.startTime) <= to);
    }

    // Status
    if (st) result = result.filter(b => b.status === st);

    onFiltered(result);
  };

  const handleSearch = (val) => { setSearch(val);  apply(val, dateFrom, dateTo, status); };
  const handleFrom   = (val) => { setDateFrom(val); apply(search, val,  dateTo, status); };
  const handleTo     = (val) => { setDateTo(val);   apply(search, dateFrom, val, status); };
  const handleStatus = (val) => { setStatus(val);   apply(search, dateFrom, dateTo, val); };

  const clearAll = () => {
    setSearch(''); setDateFrom(''); setDateTo(''); setStatus('');
    onFiltered(bookings);
  };

  const hasFilters = search || dateFrom || dateTo || status;
  const activeCount = [search,dateFrom,dateTo,status].filter(Boolean).length;

  return (
    <div style={styles.wrap}>
      {/* Search bar row */}
      <div style={styles.row}>
        <div style={styles.searchBox}>
          <FiSearch size={15} color="#94a3b8"/>
          <input
            style={styles.input}
            placeholder="Search by title, room, faculty, branch..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button style={styles.clearBtn} onClick={() => handleSearch('')}>
              <FiX size={13}/>
            </button>
          )}
        </div>

        <button
          style={{ ...styles.filterBtn, background: open ? '#ede9fe' : '#f8fafc', color: open ? '#7c3aed' : '#475569' }}
          onClick={() => setOpen(!open)}>
          <FiFilter size={14}/>
          Filters
          {activeCount > 0 && (
            <span style={styles.filterBadge}>{activeCount}</span>
          )}
        </button>

        {hasFilters && (
          <button style={styles.clearAllBtn} onClick={clearAll}>
            <FiX size={13}/> Clear all
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {open && (
        <div style={styles.filterPanel}>
          <div style={styles.filterGrid}>
            <div>
              <label style={styles.label}>From Date</label>
              <input
                type="date"
                style={styles.dateInput}
                value={dateFrom}
                onChange={e => handleFrom(e.target.value)}
              />
            </div>
            <div>
              <label style={styles.label}>To Date</label>
              <input
                type="date"
                style={styles.dateInput}
                value={dateTo}
                onChange={e => handleTo(e.target.value)}
              />
            </div>
            <div>
              <label style={styles.label}>Status</label>
              <select
                style={styles.dateInput}
                value={status}
                onChange={e => handleStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasFilters && (
        <div style={styles.chips}>
          {search && (
            <span style={styles.chip}>
              🔍 "{search}"
              <button style={styles.chipX} onClick={() => handleSearch('')}>×</button>
            </span>
          )}
          {dateFrom && (
            <span style={styles.chip}>
              From: {dateFrom}
              <button style={styles.chipX} onClick={() => handleFrom('')}>×</button>
            </span>
          )}
          {dateTo && (
            <span style={styles.chip}>
              To: {dateTo}
              <button style={styles.chipX} onClick={() => handleTo('')}>×</button>
            </span>
          )}
          {status && (
            <span style={styles.chip}>
              Status: {status}
              <button style={styles.chipX} onClick={() => handleStatus('')}>×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { marginBottom:'1rem' },
  row:  { display:'flex', gap:'.6rem', alignItems:'center', flexWrap:'wrap' },
  searchBox: {
    flex:1, minWidth:220,
    display:'flex', alignItems:'center', gap:'.5rem',
    background:'#fff', border:'1px solid #e2e8f0',
    borderRadius:'8px', padding:'.45rem .75rem'
  },
  input: {
    flex:1, border:'none', outline:'none',
    fontSize:'.88rem', background:'transparent', color:'#1e293b'
  },
  clearBtn: {
    background:'none', border:'none', cursor:'pointer',
    color:'#94a3b8', padding:0, display:'flex'
  },
  filterBtn: {
    display:'flex', alignItems:'center', gap:'.4rem',
    border:'1px solid #e2e8f0', borderRadius:'8px',
    padding:'.45rem .85rem', cursor:'pointer',
    fontSize:'.85rem', fontWeight:500
  },
  filterBadge: {
    background:'#7c3aed', color:'#fff',
    borderRadius:'999px', fontSize:'.65rem',
    fontWeight:700, padding:'1px 6px', marginLeft:'.15rem'
  },
  clearAllBtn: {
    display:'flex', alignItems:'center', gap:'.3rem',
    background:'#fee2e2', color:'#dc2626',
    border:'none', borderRadius:'8px',
    padding:'.45rem .85rem', cursor:'pointer',
    fontSize:'.82rem', fontWeight:500
  },
  filterPanel: {
    background:'#f8fafc', border:'1px solid #e2e8f0',
    borderRadius:'8px', padding:'1rem', marginTop:'.6rem'
  },
  filterGrid: {
    display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',
    gap:'1rem'
  },
  label:     { display:'block', fontSize:'.78rem', fontWeight:600, color:'#64748b', marginBottom:'.3rem' },
  dateInput: {
    width:'100%', padding:'.4rem .6rem',
    border:'1px solid #e2e8f0', borderRadius:'6px',
    fontSize:'.85rem', color:'#1e293b', background:'#fff',
    boxSizing:'border-box'
  },
  chips: { display:'flex', flexWrap:'wrap', gap:'.4rem', marginTop:'.5rem' },
  chip:  {
    display:'flex', alignItems:'center', gap:'.3rem',
    background:'#ede9fe', color:'#5b21b6',
    fontSize:'.78rem', fontWeight:500,
    padding:'.2rem .6rem', borderRadius:'999px'
  },
  chipX: {
    background:'none', border:'none', cursor:'pointer',
    color:'#7c3aed', fontWeight:700, fontSize:'.9rem',
    padding:0, lineHeight:1
  }
};