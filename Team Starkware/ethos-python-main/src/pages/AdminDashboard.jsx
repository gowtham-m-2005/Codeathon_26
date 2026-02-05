import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Truck, Package, BarChart3, Settings, Users, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('urgent');
    const [packages, setPackages] = useState([]);
    const [rawPackages, setRawPackages] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalPkg, setModalPkg] = useState(null);
    const [modalExplanation, setModalExplanation] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Map backend priority string to CSS class used in the table
    const getPriorityClass = (priority) => {
        if (!priority) return 'important';
        const p = priority.toString().toLowerCase();
        if (p.includes('life')) return 'life-critical';
        if (p.includes('urgent')) return 'urgent';
        if (p.includes('important')) return 'important';
        return 'important';
    };

    const getDisplayPriority = (priority, deliveryType) => {
        if (priority) return priority;
        if (deliveryType) {
            const d = deliveryType.toString().toLowerCase();
            if (d.includes('medical') || d.includes('medicine')) return 'LIFE-CRITICAL';
            if (d.includes('blood')) return 'URGENT';
            if (d.includes('food') || d.includes('essential')) return 'IMPORTANT';
        }
        return 'IMPORTANT';
    };

    const fetchPackages = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/packages');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.debug('Raw packages from backend:', data);
            setRawPackages(data);
            // Normalize backend shapes to the fields this component expects
            const normalized = (Array.isArray(data) ? data : []).map((p) => {
                const receiver = p.receiver || p.receiverInfo || null;
                const destFromReceiver = receiver && (receiver.name || receiver.address || receiver.destination || receiver.location);
                return {
                    id: (p.id || p.packageId || p.package_id || p.idString || '') + '',
                    deliveryType: p.deliveryType || p.type || p.delivery_type || p.delivery || '',
                    priority: p.priority || p.priorityLevel || p.priority_type || p.priorityCode || '',
                    pickupLocation: p.pickupLocation || p.pickup || p.pickup_location || p.origin || '',
                    destination: p.destination || p.destinationAddress || p.destination_address || p.receiverName || p.receiver_name || p.to || destFromReceiver || '',
                };
            });
            console.debug('Normalized packages:', normalized);
            // Expecting an array of package objects from the backend
            setPackages(normalized);
        } catch (err) {
            console.error('Failed to load packages', err);
            setError('Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    // Show the backend URL used by the Vite proxy (helpful in dev)
    const devBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

    const isDev = import.meta.env.DEV;
    const [showRaw, setShowRaw] = useState(false);

    const handleLogout = () => {
        navigate('/login');
    };

    const fetchExplanation = async (pkg) => {
        if (!pkg || !pkg.id) return;
        setModalPkg(pkg);
        setModalExplanation('');
        setModalError(null);
        setModalLoading(true);
        setModalOpen(true);
        try {
            const res = await fetch(`/api/packages/${encodeURIComponent(pkg.id)}/explanation`);
            if (res.status === 404) {
                setModalError('Explanation not found for this package.');
            } else if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            } else {
                const json = await res.json();
                setModalExplanation(json.explanation || json.message || 'No explanation returned');
            }
        } catch (err) {
            console.error('Failed to fetch explanation', err);
            setModalError('Failed to load explanation.');
        } finally {
            setModalLoading(false);
        }
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
                        {/* <div className="dev-backend-info">
                            <small>Dev backend: {devBackendUrl}</small>
                        </div> */}
                    </div>

                    {/* Priority Packages Table */}
                    <div className="packages-card">
                        <div className="card-header">
                            <h3 className="card-title">Priority Packages</h3>
                                <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                                    {isDev && (
                                        <button className="refresh-btn" onClick={() => setShowRaw(v => !v)} style={{background: '#fff', color: '#475569'}}>
                                            {showRaw ? 'Hide JSON' : 'Show Raw JSON'}
                                        </button>
                                    )}
                                    <button className="refresh-btn" onClick={fetchPackages} disabled={loading}>
                                        <RefreshCw size={16} />
                                        {loading ? ' Loading...' : ' Refresh'}
                                    </button>
                                </div>
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
                                    {error && (
                                        <tr>
                                            <td colSpan={5} className="table-error">{error}</td>
                                        </tr>
                                    )}
                                    {!error && packages.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="table-empty">No priority packages found.</td>
                                        </tr>
                                    )}
                                    {packages.map((pkg) => {
                                        const displayPriority = getDisplayPriority(pkg.priority, pkg.deliveryType);
                                        return (
                                            <tr key={pkg.id}>
                                                <td>
                                                    <div className="package-id">
                                                        <Package size={16} className="package-icon" />
                                                        <span className="id-badge">{`#${pkg.id}`}</span>
                                                    </div>
                                                </td>
                                                <td>{pkg.deliveryType || pkg.type || ''}</td>
                                                <td>
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => fetchExplanation(pkg)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') fetchExplanation(pkg); }}
                                                        className={`priority-badge ${getPriorityClass(displayPriority)}`}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {displayPriority}
                                                    </span>
                                                </td>
                                                <td>{pkg.pickupLocation || pkg.pickup || ''}</td>
                                                <td className="destination">{pkg.destination || ''}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {isDev && showRaw && (
                        <div style={{margin: '1rem 0', padding: '1rem', background: '#0f172a', color: '#e6eef8', borderRadius: 8, overflowX: 'auto'}}>
                            <h4 style={{margin: 0, marginBottom: 8}}>Raw backend response</h4>
                            <pre style={{whiteSpace: 'pre-wrap', fontSize: 12}}>{JSON.stringify(rawPackages, null, 2)}</pre>
                        </div>
                    )}

                    {modalOpen && (
                        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <h3 style={{margin: 0}}>Priority Explanation {modalPkg ? `— #${modalPkg.id}` : ''}</h3>
                                    <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
                                </div>
                                <div style={{marginTop: 12}}>
                                    {modalLoading && <div>Loading explanation…</div>}
                                    {modalError && <div style={{color: 'var(--danger)'}}>{modalError}</div>}
                                    {!modalLoading && !modalError && (
                                        <div className="explanation-text">{modalExplanation}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
