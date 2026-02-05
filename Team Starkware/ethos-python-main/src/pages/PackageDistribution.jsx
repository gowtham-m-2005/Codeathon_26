import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Truck, Package, BarChart3, X } from 'lucide-react';
import './PackageDistribution.css';

const PackageDistribution = () => {
    const navigate = useNavigate();
    const [distributions, setDistributions] = useState([]);
    const [stats, setStats] = useState({
        totalReceived: 0,
        assigned: 0,
        ready: 0,
        critical: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryPackages, setCategoryPackages] = useState([]);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [rawResponseText, setRawResponseText] = useState('');
    const [flattenedCount, setFlattenedCount] = useState(0);
    const [aggregatedPreview, setAggregatedPreview] = useState([]);
    const [showDebug, setShowDebug] = useState(false);

    const fetchDistributions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/distribution');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.debug('Raw /api/distribution response:', data);
            try { setRawResponseText(JSON.stringify(data, null, 2)); } catch(e) { setRawResponseText(String(data)); }

            if (!Array.isArray(data)) {
                console.error('Data is not an array:', data);
                setDistributions([]);
                return;
            }

            if (data.length === 0) {
                setDistributions([]);
                return;
            }

            // Build a flat list of package-like objects from whatever the backend returned.
            const flatPackages = [];

            data.forEach(item => {
                // Expand obvious packages arrays
                if (item && Array.isArray(item.packages) && item.packages.length > 0) {
                    flatPackages.push(...item.packages);
                    return;
                }

                // If item looks like a package (has id or assigned driver fields), treat it as package
                if (item && (item.id !== undefined || item.assigned_driver !== undefined || item.assignedDriver !== undefined || item.receiver !== undefined)) {
                    flatPackages.push(item);
                    return;
                }

                // If item is an aggregated driver entry with packageCount but no package details, synthesize placeholders
                if (item && (item.packageCount !== undefined) && !Array.isArray(item.packages)) {
                    const driverName = item.driverName || item.driver || item.name || `Driver ${Object.keys(flatPackages).length}`;
                    for (let i = 0; i < (Number(item.packageCount) || 0); i++) {
                        flatPackages.push({ assigned_driver: driverName, synthetic: true });
                    }
                    return;
                }

                // If none matched, ignore for now
            });

            console.debug('Flattened packages count:', flatPackages.length, flatPackages.slice(0,5));
            setFlattenedCount(flatPackages.length);

            // If we couldn't flatten any packages, maybe data is already aggregated driver objects — detect that
            const looksAggregated = data.some(d => d && (d.packageCount !== undefined || d.driverName !== undefined || d.driver !== undefined) && d.id === undefined);
            if (flatPackages.length === 0 && looksAggregated) {
                // Normalize aggregated items to expected keys and use directly
                const normalized = data.map(d => ({
                    driverName: d.driverName || d.driver || d.name || 'Unknown',
                    // support backend's `assignedPackages` field and several variants
                    packageCount: Number(d.assignedPackages || d.packageCount || d.assigned_packages || d.assigned) || 0,
                    totalCapacity: d.totalCapacity || d.capacity || null,
                    currentlyHeld: d.currentlyHeld || d.currentLoad || null,
                    route: d.route || d.routeName || `Route for ${d.driverName || d.driver || 'Unknown'}`,
                    packages: Array.isArray(d.packages) ? d.packages : []
                }));
                console.debug('Using aggregated payload as-is:', normalized);
                setDistributions(normalized);
                return;
            }

            // Aggregate by driver name (handle assigned properties in various casing)
            const driverMap = {};
            flatPackages.forEach(pkg => {
                const assigned = pkg.assigned_driver || pkg.assignedDriver || pkg.driverName || pkg.driver || pkg.driver_id || pkg.driverId;
                let driverName = 'Unknown';

                if (typeof assigned === 'string') driverName = assigned;
                else if (assigned && typeof assigned === 'object') driverName = assigned.name || assigned.fullName || String(assigned.id) || JSON.stringify(assigned);
                else if (pkg.driverName) driverName = pkg.driverName;

                if (!driverMap[driverName]) {
                    driverMap[driverName] = { driverName, packageCount: 0, route: pkg.route || `Route for ${driverName}`, packages: [] };
                }
                driverMap[driverName].packageCount += 1;
                driverMap[driverName].packages.push(pkg);
            });

            const aggregated = Object.values(driverMap);
            console.debug('Aggregated by driver:', aggregated);
            try { setAggregatedPreview(JSON.parse(JSON.stringify(aggregated.slice(0,10)))); } catch(e) { setAggregatedPreview(aggregated.slice(0,10)); }
            // If aggregation produced nothing but original data had items, fall back to showing original data
            if (aggregated.length === 0 && data.length > 0) {
                console.debug('Aggregation empty — falling back to raw data for visibility');
                const fallback = data.map((d, i) => ({ driverName: d.driverName || d.driver || `Driver ${i+1}`, packageCount: d.packageCount || 0, route: d.route || `Route ${i+1}`, packages: Array.isArray(d.packages) ? d.packages : [] }));
                setDistributions(fallback);
            } else {
                setDistributions(aggregated);
            }
        } catch (err) {
            console.error('Failed to load distributions', err);
            setError('Failed to load package distributions');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/distribution/stats');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setStats(data || {});
        } catch (err) {
            console.error('Failed to load stats', err);
        }
    };

    useEffect(() => {
        fetchDistributions();
        fetchStats();
    }, []);

    const handleLogout = () => {
        navigate('/login');
    };

    const fetchPackagesByCategory = async (category) => {
        setCategoryLoading(true);
        try {
            const res = await fetch(`/api/distribution/packages?status=${encodeURIComponent(category)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setCategoryPackages(Array.isArray(data) ? data : []);
            setSelectedCategory(category);
        } catch (err) {
            console.error('Failed to load packages by category', err);
            setCategoryPackages([]);
        } finally {
            setCategoryLoading(false);
        }
    };

    const closePackageModal = () => {
        setSelectedCategory(null);
        setCategoryPackages([]);
    };

    return (
        <div className="distribution-container">
            {/* Header */}
            <header className="admin-header">
                <div className="header-left">
                    <Home className="logo-icon" size={24} />
                    <h1 className="app-title">ETHOS-DELIVER</h1>
                </div>
                <nav className="header-nav">
                    <a href="/admin" className="nav-link">
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

            <div className="distribution-content">
                <main className="main-section">
                    <div className="page-header">
                        <h2 className="page-title">Package Distribution</h2>
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <div className="distribution-grid">
                        {/* Left: Drivers & Routes Table */}
                        <div className="distribution-table-card">
                            <h3 className="card-subtitle">Drivers & Routes</h3>
                            {loading ? (
                                <div>Loading distributions…</div>
                            ) : distributions.length === 0 ? (
                                <div>No distributions available</div>
                            ) : (
                                <table className="distribution-table">
                                    <thead>
                                        <tr>
                                            <th>Driver</th>
                                            <th>Route</th>
                                            <th>Packages</th>
                                            <th>Capacity</th>
                                            <th>Held</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {distributions.map((dist, idx) => (
                                            <tr key={idx}>
                                                <td>{dist.driverName || dist.driver || `Driver ${idx + 1}`}</td>
                                                <td>{dist.route || `Route ${idx + 1}`}</td>
                                                <td>{dist.packageCount || 0}</td>
                                                <td>{dist.totalCapacity != null ? dist.totalCapacity : '-'}</td>
                                                <td>{dist.currentlyHeld != null ? dist.currentlyHeld : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Right: Stats Cards */}
                        <div className="stats-section">
                            <div className="stat-card total" onClick={() => fetchPackagesByCategory('received')} style={{cursor: 'pointer'}}>
                                <div className="stat-label">Total Packages Received</div>
                                <div className="stat-value">{stats.totalReceived || 0}</div>
                            </div>
                            <div className="stat-card assigned" onClick={() => fetchPackagesByCategory('assigned')} style={{cursor: 'pointer'}}>
                                <div className="stat-label">Assigned</div>
                                <div className="stat-value">{stats.assigned || 0}</div>
                            </div>
                            <div className="stat-card ready" onClick={() => fetchPackagesByCategory('ready')} style={{cursor: 'pointer'}}>
                                <div className="stat-label">Ready</div>
                                <div className="stat-value">{stats.ready || 0}</div>
                            </div>
                            <div className="stat-card critical" onClick={() => fetchPackagesByCategory('critical')} style={{cursor: 'pointer'}}>
                                <div className="stat-label">Critical</div>
                                <div className="stat-value">{stats.critical || 0}</div>
                            </div>
                        </div>
                    </div>
                    {/* Debug panel (temporary) */}
                    <div style={{marginTop: 18}}>
                        <button className="logout-btn" onClick={() => setShowDebug(v => !v)} style={{marginBottom: 8}}>{showDebug ? 'Hide' : 'Show'} Debug</button>
                        {showDebug && (
                            <div className="debug-panel" style={{background: '#0f1724', color: '#e6eef8', padding: 12, borderRadius: 6, fontSize: 12}}>
                                <div style={{marginBottom: 8}}><strong>Raw /api/distribution response:</strong></div>
                                <pre style={{whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto'}}>{rawResponseText || '—'}</pre>
                                <div style={{marginTop: 8}}><strong>Flattened packages count:</strong> {flattenedCount}</div>
                                <div style={{marginTop: 8}}><strong>Aggregated preview (first 10):</strong>
                                    <pre style={{whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto'}}>{JSON.stringify(aggregatedPreview, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Category Packages Modal */}
            {selectedCategory && (
                <div className="modal-overlay" onClick={closePackageModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Packages</h3>
                            <button className="modal-close" onClick={closePackageModal}><X size={20} /></button>
                        </div>
                        {categoryLoading ? (
                            <div>Loading packages…</div>
                        ) : categoryPackages.length === 0 ? (
                            <div>No packages in this category</div>
                        ) : (
                            <div className="packages-list">
                                {categoryPackages.map((pkg) => (
                                    <div key={pkg.id} className="package-item">
                                        <div className="package-row">
                                            <span className="package-id">#{pkg.id}</span>
                                            <span className="package-type">{pkg.deliveryType || pkg.type || '—'}</span>
                                        </div>
                                        <div className="package-row">
                                            <span className="package-location">{pkg.pickupLocation || pkg.pickup || '—'}</span>
                                            <span className="package-destination">{pkg.destination || '—'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

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

export default PackageDistribution;
