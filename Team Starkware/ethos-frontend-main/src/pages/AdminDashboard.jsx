import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Truck, Package, BarChart3, Settings, Users, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('urgent');

    const priorityPackages = [
        {
            id: '#1023',
            type: 'Medication',
            priority: 'LIFE-CRITICAL',
            pickup: 'City Pharmacy',
            destination: 'City Hospital',
            priorityClass: 'life-critical'
        },
        {
            id: '#0957',
            type: 'Blood-Bag',
            priority: 'URGENT',
            pickup: 'Central Blood Bank',
            destination: "St. John's Clinic",
            priorityClass: 'urgent'
        },
        {
            id: '#1029',
            type: 'Essential Goods',
            priority: 'IMPORTANT',
            pickup: 'Fresiv Mart',
            destination: 'Lakooda Acotments',
            priorityClass: 'important'
        }
    ];

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <div className="admin-container">
            {/* Header */}
            <header className="admin-header">
                <div className="header-left">
                    <Home className="logo-icon" size={24} />
                    <h1 className="app-title">ETHOS-DELIVER</h1>
                </div>
                <nav className="header-nav">
                    <a href="#" className="nav-link active">
                        <BarChart3 size={18} />
                        Dashboard
                    </a>
                    <a href="#" className="nav-link">
                        <Truck size={18} />
                        Shipments
                    </a>
                    <a href="#" className="nav-link">
                        <Package size={18} />
                        Vehicles
                    </a>
                    <a href="#" className="nav-link">
                        <BarChart3 size={18} />
                        Reports
                    </a>
                </nav>
                <div className="header-right">
                    <span className="welcome-text">Welcome, Jane Doe</span>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="admin-content">
                {/* Main Content */}
                <main className="main-section">
                    <div className="dashboard-header">
                        <div>
                            <h2 className="dashboard-title">Admin Dashboard</h2>
                            <p className="dashboard-subtitle">Monitor and manage all priority package deliveries below.</p>
                        </div>
                    </div>

                    {/* Priority Packages Table */}
                    <div className="packages-card">
                        <div className="card-header">
                            <h3 className="card-title">Priority Packages</h3>
                            <button className="refresh-btn">
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>
                        <div className="table-container">
                            <table className="packages-table">
                                <thead>
                                    <tr>
                                        <th># Package ID</th>
                                        <th>Delivery Type</th>
                                        <th>Priority</th>
                                        <th>Pickup Location</th>
                                        <th>Destination</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priorityPackages.map((pkg) => (
                                        <tr key={pkg.id}>
                                            <td>
                                                <div className="package-id">
                                                    <Package size={16} className="package-icon" />
                                                    <span className="id-badge">{pkg.id}</span>
                                                </div>
                                            </td>
                                            <td>{pkg.type}</td>
                                            <td>
                                                <span className={`priority-badge ${pkg.priorityClass}`}>
                                                    {pkg.priority}
                                                </span>
                                            </td>
                                            <td>{pkg.pickup}</td>
                                            <td>{pkg.destination}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div className="action-cards">
                        <div className="action-card">
                            <div className="card-icon-wrapper blue">
                                <div className="icon-illustration">
                                    <Truck size={48} className="main-icon" />
                                    <BarChart3 size={32} className="accent-icon" />
                                </div>
                            </div>
                            <div className="card-content">
                                <h4 className="card-heading">Route Optimization</h4>
                                <p className="card-description">
                                    Optimize delivery routes using AI to ensure fastest and most efficient paths.
                                </p>
                                <button className="action-btn blue">Optimize Routes</button>
                            </div>
                        </div>

                        <div className="action-card">
                            <div className="card-icon-wrapper orange">
                                <div className="icon-illustration">
                                    <Package size={48} className="main-icon" />
                                    <Truck size={32} className="accent-icon" />
                                </div>
                            </div>
                            <div className="card-content">
                                <h4 className="card-heading">Package Distribution</h4>
                                <p className="card-description">
                                    Distribute packages efficiently across available vehicles and drivers.
                                </p>
                                <button className="action-btn orange">Distribute Packages</button>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Sidebar */}
                <aside className="admin-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-header">
                            <Settings className="sidebar-icon" size={20} />
                            <h3 className="sidebar-title">Admin Tools</h3>
                        </div>

                        <div className="tool-item urgent">
                            <AlertCircle size={18} />
                            <div className="tool-content">
                                <span className="tool-label">Urgent Validation</span>
                                <span className="tool-badge">2</span>
                            </div>
                        </div>

                        <div className="tool-item">
                            <FileText size={18} />
                            <span className="tool-label">Priority Log</span>
                        </div>

                        <div className="tool-item">
                            <Users size={18} />
                            <span className="tool-label">Manage Users</span>
                        </div>
                    </div>

                    <div className="privileges-card">
                        <div className="admin-avatar">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%233b82f6'/%3E%3Cpath d='M 20 80 Q 20 60 50 60 Q 80 60 80 80 Z' fill='%233b82f6'/%3E%3C/svg%3E" alt="Admin" className="avatar-img" />
                        </div>
                        <h4 className="privileges-title">Admin Privileges</h4>
                        <ul className="privileges-list">
                            <li>Review and validate urgent packages</li>
                            <li>Adjust priorities as needed</li>
                            <li>Manage and oversee user roles</li>
                        </ul>
                        <button className="priority-log-btn">Go to Priority Log</button>
                    </div>
                </aside>
            </div>

            {/* Footer */}
            <footer className="admin-footer">
                <a href="#" className="footer-link">Privacy Policy</a>
                <span className="footer-separator">|</span>
                <a href="#" className="footer-link">Terms of Service</a>
                <span className="footer-separator">|</span>
                <a href="#" className="footer-link">Contact Us</a>
            </footer>
        </div>
    );
};

export default AdminDashboard;
