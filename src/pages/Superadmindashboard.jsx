import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import {
  superAdminCreateAdmin, superAdminListAdmins, superAdminDeleteAdmin,
  getAllRoomsAdmin, addRoom, updateRoom, deleteRoom, toggleRoom
} from '../services/api'
import toast from 'react-hot-toast'
import { FiUserPlus, FiShield, FiTrash2, FiSearch, FiX, FiEdit2, FiToggleLeft, FiToggleRight, FiPlus } from 'react-icons/fi'

const BRANCHES  = ['CSE','ECE','MECH','CIVIL','EEE','IT'];
const ROOM_TYPES = ['CLASSROOM','LAB','SEMINAR_HALL','AUDITORIUM'];
const BLOCKS    = ['Block A','Block B','Block C','Block D','Block E','Main Block'];
const FLOORS    = ['Ground Floor','Floor 1','Floor 2','Floor 3','Floor 4'];

const emptyRoom = { name:'', roomNumber:'', block:'', floor:'', capacity:'', type:'CLASSROOM', amenities:'' };

export default function SuperAdminDashboard() {
  const [tab, setTab]               = useState('admins');
  // Admins state
  const [admins, setAdmins]         = useState([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm]   = useState({ name:'', email:'', password:'', branch:'', department:'' });
  const [creatingAdmin, setCA]      = useState(false);
  const [confirmAdminId, setCAId]   = useState(null);
  const [deletingAdmin, setDA]      = useState(false);
  const [search, setSearch]         = useState('');
  const [filterBranch, setFB]       = useState('');
  // Rooms state
  const [rooms, setRooms]           = useState([]);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomForm, setRoomForm]     = useState(emptyRoom);
  const [editingRoom, setEditingRoom] = useState(null);
  const [savingRoom, setSR]         = useState(false);
  const [confirmRoomId, setCRId]    = useState(null);
  const [deletingRoom, setDR]       = useState(false);
  const [roomSearch, setRoomSearch] = useState('');

  useEffect(() => { loadAdmins(); loadRooms(); }, []);

  const loadAdmins = () => superAdminListAdmins().then(r => setAdmins(r.data)).catch(()=>{});
  const loadRooms  = () => getAllRoomsAdmin().then(r => setRooms(r.data)).catch(()=>{});

  // ── Admin handlers ──────────────────────────────────────────
  const handleCreateAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password || !adminForm.branch)
      return toast.error('All fields including Branch are required');
    setCA(true);
    try {
      await superAdminCreateAdmin(adminForm);
      toast.success(`Admin created for ${adminForm.branch}!`);
      setAdminForm({ name:'', email:'', password:'', branch:'', department:'' });
      setShowAdminForm(false); loadAdmins();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCA(false); }
  };

  const handleDeleteAdmin = async (id) => {
    setDA(true);
    try {
      const { data } = await superAdminDeleteAdmin(id);
      toast.success(data.message); setCAId(null); loadAdmins();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDA(false); }
  };

  // ── Room handlers ───────────────────────────────────────────
  const handleSaveRoom = async () => {
    if (!roomForm.name || !roomForm.capacity || !roomForm.type)
      return toast.error('Name, capacity and type are required');
    setSR(true);
    try {
      const payload = { ...roomForm, capacity: parseInt(roomForm.capacity) };
      // Auto-build location from block + floor
      if (roomForm.block || roomForm.floor)
        payload.location = [roomForm.block, roomForm.floor].filter(Boolean).join(', ');

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        toast.success('Room updated!');
      } else {
        await addRoom(payload);
        toast.success('Room added!');
      }
      setRoomForm(emptyRoom); setShowRoomForm(false); setEditingRoom(null); loadRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save room'); }
    finally { setSR(false); }
  };

  const handleEditRoom = (room) => {
    setRoomForm({
      name:       room.name       || '',
      roomNumber: room.roomNumber || '',
      block:      room.block      || '',
      floor:      room.floor      || '',
      capacity:   room.capacity   || '',
      type:       room.type       || 'CLASSROOM',
      amenities:  room.amenities  || '',
    });
    setEditingRoom(room);
    setShowRoomForm(true);
  };

  const handleDeleteRoom = async (id) => {
    setDR(true);
    try {
      const { data } = await deleteRoom(id);
      toast.success(data.message); setCRId(null); loadRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDR(false); }
  };

  const handleToggleRoom = async (id) => {
    try {
      const { data } = await toggleRoom(id);
      toast.success(data.message); loadRooms();
    } catch (err) { toast.error('Failed to toggle room'); }
  };

  // ── Filters ─────────────────────────────────────────────────
  const filteredAdmins = admins.filter(a => {
    const q = search.toLowerCase();
    return (!search || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.branch?.toLowerCase().includes(q))
        && (!filterBranch || a.branch === filterBranch);
  });

  const filteredRooms = rooms.filter(r =>
    !roomSearch || r.name?.toLowerCase().includes(roomSearch.toLowerCase()) ||
    r.type?.toLowerCase().includes(roomSearch.toLowerCase()) ||
    r.block?.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const grouped = filteredAdmins.reduce((acc, a) => {
    const b = a.branch || 'Unassigned';
    acc[b] = acc[b] || []; acc[b].push(a); return acc;
  }, {});

  const missingBranches = BRANCHES.filter(b => !admins.find(a => a.branch === b));

  const typeColors = { CLASSROOM:'#dbeafe:#1d4ed8', LAB:'#dcfce7:#166534', SEMINAR_HALL:'#ede9fe:#7c3aed', AUDITORIUM:'#fef3c7:#92400e' };
  const tc = (type) => { const [bg,color] = (typeColors[type]||'#f1f5f9:#475569').split(':'); return {bg,color}; };

  return (
    <>
      <Navbar/>
      <div className="page">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom:'.25rem' }}>Super Admin Dashboard</h1>
            <p style={{ color:'#64748b', fontSize:'.9rem', margin:0 }}>Manage branch admins and campus rooms</p>
          </div>
          <button className="btn btn-primary" onClick={() => { tab==='admins' ? setShowAdminForm(!showAdminForm) : (setShowRoomForm(!showRoomForm), setEditingRoom(null), setRoomForm(emptyRoom)); }}>
            <FiPlus size={14}/> {tab==='admins' ? 'Add Branch Admin' : 'Add Room'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom:'1.5rem' }}>
          <div style={s.stat('#ede9fe','#7c3aed')}><div style={s.statNum}>{admins.length}</div><div>Branch Admins</div></div>
          <div style={s.stat('#dbeafe','#1d4ed8')}><div style={s.statNum}>{rooms.filter(r=>r.isActive).length}</div><div>Active Rooms</div></div>
          <div style={s.stat('#fee2e2','#991b1b')}><div style={s.statNum}>{missingBranches.length}</div><div>Branches Without Admin</div></div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.5rem' }}>
          <button className={`btn ${tab==='admins'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('admins')}>
            <FiShield size={14}/> Branch Admins ({admins.length})
          </button>
          <button className={`btn ${tab==='rooms'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('rooms')}>
             Rooms ({rooms.length})
          </button>
        </div>

        {/* ── ADMINS TAB ── */}
        {tab === 'admins' && (
          <div>
            {showAdminForm && (
              <div style={s.formBox}>
                <h3 style={{ marginBottom:'1rem' }}><FiShield size={16} color="#7c3aed"/> Create Branch Admin</h3>
                <div className="grid-2">
                  <div className="form-group"><label>Full Name *</label><input value={adminForm.name} onChange={e=>setAdminForm({...adminForm,name:e.target.value})} placeholder="Dr. Ravi Kumar"/></div>
                  <div className="form-group"><label>Email *</label><input type="email" value={adminForm.email} onChange={e=>setAdminForm({...adminForm,email:e.target.value})} placeholder="ravi@campus.com"/></div>
                  <div className="form-group"><label>Password *</label><input type="password" value={adminForm.password} onChange={e=>setAdminForm({...adminForm,password:e.target.value})} placeholder="Strong password"/></div>
                  <div className="form-group"><label>Branch *</label>
                    <select value={adminForm.branch} onChange={e=>setAdminForm({...adminForm,branch:e.target.value})}>
                      <option value="">Select Branch</option>
                      {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{gridColumn:'1/-1'}}><label>Department</label><input value={adminForm.department} onChange={e=>setAdminForm({...adminForm,department:e.target.value})} placeholder="e.g. Computer Science"/></div>
                </div>
                <div style={{display:'flex',gap:'.75rem'}}>
                  <button className="btn btn-primary" onClick={handleCreateAdmin} disabled={creatingAdmin}>{creatingAdmin?'Creating...':'Create Admin'}</button>
                  <button className="btn btn-outline" onClick={()=>setShowAdminForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Search + filter */}
            <div style={{ display:'flex', gap:'.6rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
              <div style={s.searchBox}>
                <FiSearch size={14} color="#94a3b8"/>
                <input style={s.searchInput} placeholder="Search admins..." value={search} onChange={e=>setSearch(e.target.value)}/>
                {search && <button style={s.clearX} onClick={()=>setSearch('')}><FiX size={13}/></button>}
              </div>
              <select style={s.filterSelect} value={filterBranch} onChange={e=>setFB(e.target.value)}>
                <option value="">All Branches</option>
                {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              {(search||filterBranch) && <button style={s.clearBtn} onClick={()=>{setSearch('');setFB('');}}><FiX size={12}/> Clear</button>}
            </div>

            {filteredAdmins.length === 0
              ? <div className="empty">{admins.length===0?'No branch admins yet.':'🔍 No results.'}</div>
              : Object.entries(grouped).map(([branch, list]) => (
                  <div key={branch} style={s.branchGroup}>
                    <div style={s.branchHeader}>
                      <span style={s.branchTitle}>{branch}</span>
                      <span style={s.countPill}>{list.length} admin{list.length>1?'s':''}</span>
                    </div>
                    <div style={{overflowX:'auto'}}>
                      <table style={s.table}>
                        <thead><tr style={s.thead}>{['Name','Email','Department','Joined','Action'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {list.map(a=>(
                            <tr key={a.id} style={s.tr}>
                              <td style={s.td}><div style={{display:'flex',alignItems:'center',gap:'.5rem'}}><div style={s.avatar}>{a.name?.charAt(0)?.toUpperCase()}</div><span style={{fontWeight:500}}>{a.name}</span></div></td>
                              <td style={{...s.td,color:'#64748b'}}>{a.email}</td>
                              <td style={{...s.td,color:'#64748b'}}>{a.department||'—'}</td>
                              <td style={{...s.td,color:'#94a3b8',fontSize:'.8rem'}}>{a.createdAt?new Date(a.createdAt).toLocaleDateString():'—'}</td>
                              <td style={s.td}>
                                {confirmAdminId===a.id
                                  ? <div style={{display:'flex',gap:'.35rem',alignItems:'center'}}>
                                      <span style={{fontSize:'.78rem',color:'#dc2626',fontWeight:600}}>Sure?</span>
                                      <button style={s.yesBtn} onClick={()=>handleDeleteAdmin(a.id)} disabled={deletingAdmin}>{deletingAdmin?'...':'Yes'}</button>
                                      <button style={s.noBtn} onClick={()=>setCAId(null)}>No</button>
                                    </div>
                                  : <button style={s.deleteBtn} onClick={()=>setCAId(a.id)}><FiTrash2 size={12}/> Remove</button>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
            }

            {missingBranches.length > 0 && !filterBranch && !search && (
              <div style={{...s.branchGroup,borderColor:'#fde047',marginTop:'1rem'}}>
                <div style={{...s.branchHeader,background:'#fef9c3'}}>
                  <span style={{...s.branchTitle,color:'#713f12'}}>⚠️ No Admin Assigned</span>
                </div>
                <div style={{padding:'1rem',display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                  {missingBranches.map(b=><span key={b} style={{background:'#fef3c7',color:'#92400e',padding:'.3rem .8rem',borderRadius:'999px',fontSize:'.82rem',fontWeight:600}}>{b}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ROOMS TAB ── */}
        {tab === 'rooms' && (
          <div>
            {/* Add/Edit Room Form */}
            {showRoomForm && (
              <div style={s.formBox}>
                <h3 style={{ marginBottom:'1rem' }}>
                   {editingRoom ? 'Edit Room' : 'Add New Room'}
                </h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Room Name *</label>
                    <input value={roomForm.name} onChange={e=>setRoomForm({...roomForm,name:e.target.value})} placeholder="e.g. Room 101"/>
                  </div>
                  <div className="form-group">
                    <label>Room Number</label>
                    <input value={roomForm.roomNumber} onChange={e=>setRoomForm({...roomForm,roomNumber:e.target.value})} placeholder="e.g. 101, A-202"/>
                  </div>
                  <div className="form-group">
                    <label>Block</label>
                    <select value={roomForm.block} onChange={e=>setRoomForm({...roomForm,block:e.target.value})}>
                      <option value="">Select Block</option>
                      {BLOCKS.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Floor</label>
                    <select value={roomForm.floor} onChange={e=>setRoomForm({...roomForm,floor:e.target.value})}>
                      <option value="">Select Floor</option>
                      {FLOORS.map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input type="number" min="1" value={roomForm.capacity} onChange={e=>setRoomForm({...roomForm,capacity:e.target.value})} placeholder="e.g. 60"/>
                  </div>
                  <div className="form-group">
                    <label>Room Type *</label>
                    <select value={roomForm.type} onChange={e=>setRoomForm({...roomForm,type:e.target.value})}>
                      {ROOM_TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{gridColumn:'1/-1'}}>
                    <label>Amenities</label>
                    <input value={roomForm.amenities} onChange={e=>setRoomForm({...roomForm,amenities:e.target.value})} placeholder="e.g. Projector, Whiteboard, AC, Computers"/>
                  </div>
                </div>

                {/* Preview */}
                {(roomForm.block || roomForm.floor) && (
                  <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'7px',padding:'.6rem .9rem',fontSize:'.82rem',color:'#1d4ed8',marginBottom:'.85rem'}}>
                     Location will be: <strong>{[roomForm.block, roomForm.floor].filter(Boolean).join(', ')}</strong>
                  </div>
                )}

                <div style={{display:'flex',gap:'.75rem'}}>
                  <button className="btn btn-primary" onClick={handleSaveRoom} disabled={savingRoom}>
                    {savingRoom ? 'Saving...' : editingRoom ? '💾 Update Room' : '➕ Add Room'}
                  </button>
                  <button className="btn btn-outline" onClick={()=>{setShowRoomForm(false);setEditingRoom(null);setRoomForm(emptyRoom);}}>Cancel</button>
                </div>
              </div>
            )}

            {/* Room search */}
            <div style={{display:'flex',gap:'.6rem',marginBottom:'1rem',alignItems:'center'}}>
              <div style={s.searchBox}>
                <FiSearch size={14} color="#94a3b8"/>
                <input style={s.searchInput} placeholder="Search rooms by name, type, block..." value={roomSearch} onChange={e=>setRoomSearch(e.target.value)}/>
                {roomSearch && <button style={s.clearX} onClick={()=>setRoomSearch('')}><FiX size={13}/></button>}
              </div>
              <span style={{fontSize:'.82rem',color:'#94a3b8'}}>{filteredRooms.length} rooms</span>
            </div>

            {/* Rooms grid */}
            {filteredRooms.length === 0
              ? <div className="empty">{rooms.length===0?'No rooms yet. Add one above.':'🔍 No rooms match your search.'}</div>
              : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1rem'}}>
                  {filteredRooms.map(room => {
                    const {bg,color} = tc(room.type);
                    return (
                      <div key={room.id} style={{...s.roomCard, opacity: room.isActive ? 1 : 0.6}}>
                        {/* Room header */}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.6rem'}}>
                          <div>
                            <h4 style={{margin:'0 0 .2rem',fontSize:'.95rem',fontWeight:700,color:'#1e293b'}}>{room.name}</h4>
                            {room.roomNumber && <span style={{fontSize:'.75rem',color:'#94a3b8'}}>#{room.roomNumber}</span>}
                          </div>
                          <span style={{fontSize:'.7rem',fontWeight:700,padding:'.15rem .5rem',borderRadius:'999px',background:bg,color,whiteSpace:'nowrap'}}>
                            {room.type?.replace('_',' ')}
                          </span>
                        </div>

                        <div style={{fontSize:'.82rem',color:'#64748b',display:'flex',flexDirection:'column',gap:'.2rem',marginBottom:'.75rem'}}>
                          {room.location && <span> {room.location}</span>}
                          {room.block    && <span>🏗️ {room.block}{room.floor ? ` · ${room.floor}` : ''}</span>}
                          <span> Capacity: {room.capacity}</span>
                          {room.amenities && <span> {room.amenities}</span>}
                        </div>

                        {/* Status badge */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'.4rem'}}>
                          <span style={{fontSize:'.72rem',fontWeight:700,padding:'.15rem .55rem',borderRadius:'999px',
                            background:room.isActive?'#dcfce7':'#fee2e2',
                            color:room.isActive?'#166534':'#991b1b'}}>
                            {room.isActive ? '✅ Active' : '🔴 Inactive'}
                          </span>

                          <div style={{display:'flex',gap:'.4rem'}}>
                            {/* Toggle */}
                            <button style={{...s.iconBtn, color: room.isActive?'#d97706':'#16a34a'}}
                              onClick={()=>handleToggleRoom(room.id)}
                              title={room.isActive?'Deactivate':'Activate'}>
                              {room.isActive ? <FiToggleRight size={16}/> : <FiToggleLeft size={16}/>}
                            </button>
                            {/* Edit */}
                            <button style={{...s.iconBtn,color:'#2563eb'}} onClick={()=>handleEditRoom(room)} title="Edit">
                              <FiEdit2 size={14}/>
                            </button>
                            {/* Delete */}
                            {confirmRoomId === room.id
                              ? <div style={{display:'flex',gap:'.3rem',alignItems:'center'}}>
                                  <span style={{fontSize:'.75rem',color:'#dc2626',fontWeight:600}}>Sure?</span>
                                  <button style={s.yesBtn} onClick={()=>handleDeleteRoom(room.id)} disabled={deletingRoom}>{deletingRoom?'...':'Yes'}</button>
                                  <button style={s.noBtn} onClick={()=>setCRId(null)}>No</button>
                                </div>
                              : <button style={{...s.iconBtn,color:'#dc2626'}} onClick={()=>setCRId(room.id)} title="Delete">
                                  <FiTrash2 size={14}/>
                                </button>
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}
      </div>
    </>
  );
}

const s = {
  stat: (bg,color) => ({ background:bg, color, borderRadius:'10px', padding:'1rem 1.25rem', fontWeight:500, fontSize:'.88rem' }),
  statNum: { fontSize:'1.8rem', fontWeight:700, marginBottom:'.1rem' },
  formBox: { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1.5rem', marginBottom:'1.5rem' },
  branchGroup: { border:'1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden', marginBottom:'1rem' },
  branchHeader:{ background:'linear-gradient(90deg,#ede9fe,#dbeafe)', padding:'.75rem 1.25rem', display:'flex', alignItems:'center', gap:'.75rem' },
  branchTitle: { fontWeight:700, fontSize:'1rem', color:'#4c1d95' },
  countPill:   { background:'#7c3aed', color:'#fff', fontSize:'.72rem', fontWeight:700, padding:'.15rem .55rem', borderRadius:'999px' },
  searchBox:   { flex:1, minWidth:200, display:'flex', alignItems:'center', gap:'.5rem', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'.4rem .75rem' },
  searchInput: { border:'none', outline:'none', fontSize:'.85rem', flex:1 },
  clearX:      { background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' },
  filterSelect:{ padding:'.42rem .65rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'.85rem', color:'#475569', background:'#fff', cursor:'pointer' },
  clearBtn:    { display:'flex', alignItems:'center', gap:'.3rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:'7px', padding:'.38rem .75rem', cursor:'pointer', fontSize:'.8rem', fontWeight:500 },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:'.88rem' },
  thead:       { background:'#f8fafc', borderBottom:'1px solid #e2e8f0' },
  th:          { padding:'.65rem 1rem', textAlign:'left', fontWeight:600, color:'#475569', whiteSpace:'nowrap' },
  tr:          { borderBottom:'1px solid #f1f5f9' },
  td:          { padding:'.7rem 1rem' },
  avatar:      { width:30, height:30, borderRadius:'50%', flexShrink:0, background:'#ede9fe', color:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.85rem' },
  deleteBtn:   { display:'flex', alignItems:'center', gap:'.3rem', background:'#fff', color:'#dc2626', border:'1.5px solid #fca5a5', borderRadius:'7px', padding:'.28rem .65rem', cursor:'pointer', fontSize:'.78rem', fontWeight:600 },
  yesBtn:      { background:'#dc2626', color:'#fff', border:'none', borderRadius:'5px', padding:'.2rem .55rem', cursor:'pointer', fontSize:'.75rem', fontWeight:700 },
  noBtn:       { background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'5px', padding:'.2rem .55rem', cursor:'pointer', fontSize:'.75rem', color:'#64748b' },
  roomCard:    { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'1.1rem', boxShadow:'0 1px 4px rgba(0,0,0,.05)' },
  iconBtn:     { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'7px', padding:'.3rem .5rem', cursor:'pointer', display:'flex', alignItems:'center' },
};