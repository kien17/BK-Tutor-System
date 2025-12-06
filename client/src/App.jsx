import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar'; 
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import ChangePassword from './pages/ChangePassword';
import UserDetail from './pages/UserDetail';
import AdminEditUser from './pages/AdminEditUser';
import Register from './pages/Register';
import TutorDashboard from './pages/TutorDashboard';
import StudentBooking from './pages/StudentBooking';
import Documents from './pages/Documents';
import Home from './pages/Home';

// Các trang tạm (Placeholder) để test link
const StudentHome = () => <div style={{padding:40}}><h2>Trang Sinh Viên</h2></div>;

function App() {
  return (
    <BrowserRouter>
      {/* Thay thế toàn bộ thẻ <nav> cũ bằng dòng này */}
      <Navbar /> 

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/edit-user/:id" element={<AdminEditUser />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Các trang chính */}
        <Route path="/student" element={<Home />} />
        <Route path="/tutor" element={<TutorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Các trang mới trong menu xổ xuống */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Trang chỉnh sửa profile */}
        <Route path="/edit-profile" element={<EditProfile />} />

        <Route path="/user/:id" element={<UserDetail />} />

        <Route path="/register" element={<Register />} />

        <Route path="/student/booking" element={<StudentBooking />} />

        <Route path="/documents" element={<Documents />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;