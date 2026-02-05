import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Package, Activity } from 'lucide-react'; // Using Activity as "Ambulance" proxy or generic medical
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Simulate login
        navigate('/submit');
    };

    return (
        <div className="login-container">


            {/* Main Login Card */}
            <div className="login-card">
                <h1 className="login-title">Welcome Back!</h1>
                <p className="login-subtitle">Log in to send or manage your priority deliveries.</p>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="jane.doe@email.com"
                                required
                            />
                            <Mail className="input-icon" size={18} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="input-icon" size={18} />
                        </div>
                    </div>

                    <a href="#" className="forgot-password">Forgot Password?</a>

                    <button type="submit" className="login-btn">Log In</button>
                </form>

                <div className="signup-link">
                    Don't have an account? <a href="#">Sign Up</a>
                </div>
            </div>


        </div>
    );
};

export default Login;
