import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SubmitPackage from './pages/SubmitPackage';
import AdminDashboard from './pages/AdminDashboard';
import PackageDistribution from './pages/PackageDistribution';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/submit" element={<SubmitPackage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/distribution" element={<PackageDistribution />} />
    </Routes>
  );
}

export default App;
