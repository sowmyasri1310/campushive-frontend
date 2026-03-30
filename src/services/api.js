import axios from 'axios';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : '/api' 
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────
export const login    = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

export const superAdminCreateAdmin  = (data) => api.post('/auth/super-admin/create-admin', data);
export const superAdminListAdmins   = ()     => api.get('/auth/super-admin/admins');
export const superAdminDeleteAdmin  = (id)   => api.delete(`/auth/super-admin/admins/${id}`);

export const adminCreateFaculty = (data) => api.post('/auth/admin/create-faculty', data);
export const adminListFaculty   = ()     => api.get('/auth/admin/faculty');
export const adminListStudents  = ()     => api.get('/auth/admin/students');
export const adminDeleteUser    = (id)   => api.delete(`/auth/admin/users/${id}`);

// ── Rooms ─────────────────────────────────────────────────────
export const getAllRooms         = ()       => api.get('/rooms');
export const getAllRoomsAdmin    = ()       => api.get('/rooms/all');
export const getRoomBookings     = (id)    => api.get(`/bookings/room/${id}`);
export const addRoom             = (data)  => api.post('/rooms', data);
export const updateRoom          = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom          = (id)    => api.delete(`/rooms/${id}`);
export const toggleRoom          = (id)    => api.patch(`/rooms/${id}/toggle`);

// ── Bookings ──────────────────────────────────────────────────
export const createBooking       = (data)     => api.post('/bookings', data);
export const getMyBookings       = ()         => api.get('/bookings/my');
export const getPending          = ()         => api.get('/bookings/pending');
export const getAllBookings       = ()         => api.get('/bookings/all');
export const processBooking      = (id, data) => api.patch(`/bookings/${id}/action`, data);
export const deleteBooking       = (id)       => api.delete(`/bookings/${id}`);
export const adminDeleteBooking  = (id)       => api.delete(`/bookings/${id}/admin`);
export const createCancelRequest = (id, data) => api.patch(`/bookings/${id}/cancel-request`, data);
export const getStudentBookings  = ()         => api.get('/bookings/student');

// ── Notifications ─────────────────────────────────────────────
export const getNotifications = () => api.get('/notifications');
export const getUnreadCount   = () => api.get('/notifications/unread-count');
export const markAllRead      = () => api.post('/notifications/mark-read');

export default api;