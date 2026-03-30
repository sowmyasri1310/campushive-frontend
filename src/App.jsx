import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import Login           from './pages/Login'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import AdminDashboard  from './pages/AdminDashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import StudentDashboard from './pages/StudentDashboard'
import RoomAvailability from './pages/RoomAvailability'

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace/>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace/>;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right"/>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/super-admin" element={
          <Protected roles={['SUPER_ADMIN']}><SuperAdminDashboard/></Protected>
        }/>
        <Route path="/admin" element={
          <Protected roles={['ADMIN']}><AdminDashboard/></Protected>
        }/>
        <Route path="/faculty" element={
          <Protected roles={['FACULTY']}><FacultyDashboard/></Protected>
        }/>
        <Route path="/student" element={
          <Protected roles={['STUDENT']}><StudentDashboard/></Protected>
        }/>
        <Route path="/rooms" element={
          <Protected roles={['FACULTY','ADMIN','STUDENT','SUPER_ADMIN']}>
            <RoomAvailability/>
          </Protected>
        }/>
        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>
  );
}