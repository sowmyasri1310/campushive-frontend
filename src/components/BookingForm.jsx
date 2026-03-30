import { useState } from 'react'
import { createBooking } from '../services/api'
import toast from 'react-hot-toast'
import { FiX } from 'react-icons/fi'

export default function BookingForm({ room, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title:'', purpose:'', branch:'', section:'', startTime:'', endTime:''
  });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.title || !form.startTime || !form.endTime)
      return toast.error('Please fill all required fields');
    const start = new Date(form.startTime);
    const end   = new Date(form.endTime);

    if (end <= start)
      return toast.error('End time must be after start time');

    // Must be same day
    if (start.toDateString() !== end.toDateString())
      return toast.error(' Start and end must be on the same day');

    // Max 8 hours
    const hours = (end - start) / (1000 * 60 * 60);
    if (hours > 7)
      return toast.error(`Max booking duration is 7 hours (yours is ${hours.toFixed(1)}h)`);

    setLoading(true);
    try {
      await createBooking({
        roomId:    room.id,
        title:     form.title,
        purpose:   form.purpose,
        branch:    form.branch,
        section:   form.section,
        startTime: form.startTime,
        endTime:   form.endTime,
      });
      toast.success('Booking request submitted!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>Book — {room.name}</h3>
          <button style={styles.close} onClick={onClose}><FiX size={18}/></button>
        </div>

        <div className="form-group">
          <label>Class / Event Title *</label>
          <input name="title" value={form.title} onChange={handle}
            placeholder="e.g. Data Structures Lecture"/>
        </div>

        <div className="form-group">
          <label>Purpose / Description</label>
          <textarea name="purpose" value={form.purpose} onChange={handle}
            rows={2} placeholder="Describe the purpose..."/>
        </div>

        {/* Branch & Section */}
        <div className="grid-2">
          <div className="form-group">
            <label>Branch *</label>
            <select name="branch" value={form.branch} onChange={handle}>
              <option value="">Select Branch</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="EEE">EEE</option>
              <option value="IT">IT</option>
              <option value="ALL">All Branches</option>
            </select>
          </div>
          <div className="form-group">
            <label>Section *</label>
            <select name="section" value={form.section} onChange={handle}>
              <option value="">Select Section</option>
              {['A','B','C','D','E'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="ALL">All Sections</option>
            </select>
          </div>
        </div>

        {/* Time */}
        <div className="grid-2">
          <div className="form-group">
            <label>Start Date & Time *</label>
            <input type="datetime-local" name="startTime"
              value={form.startTime} onChange={handle}/>
          </div>
          <div className="form-group">
            <label>End Date & Time *</label>
            <input type="datetime-local" name="endTime"
              value={form.endTime} onChange={handle}/>
          </div>
        </div>

        <div style={{ display:'flex', gap:'.75rem', marginTop:'.5rem' }}>
          <button className="btn btn-primary" onClick={submit}
            disabled={loading} style={{ flex:1 }}>
            {loading ? 'Submitting...' : 'Submit Booking Request'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:300
  },
  modal: {
    background:'#fff', borderRadius:'12px', padding:'1.75rem',
    width:'100%', maxWidth:'540px', boxShadow:'0 20px 60px rgba(0,0,0,.15)',
    maxHeight:'90vh', overflowY:'auto'
  },
  header: {
    display:'flex', justifyContent:'space-between',
    alignItems:'center', marginBottom:'1.25rem'
  },
  close: { background:'none', border:'none', cursor:'pointer', color:'#64748b' }
};