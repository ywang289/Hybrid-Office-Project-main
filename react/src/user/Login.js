import React, { useState } from "react";
import './LoginSignup.css';
import email_icon from './Assets/email.png';
import password_icon from './Assets/password.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '..//AuthContext';

function Login({ onSwitch }) {
    const { setToken } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email:email.toLowerCase(), password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            console.log('Logged in');
            sessionStorage.setItem('token', data.token);
            setToken(data.token);
            navigate('/home');
            
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="back">
            <div className="title">Hybrid Office</div>
            <div className="container">
                <div className="header-user">
                    <div className="text">Log in</div>
                    <div className="underline"></div>
                </div>
                <form className="inputs" onSubmit={handleSubmit}>
                    <div className="input">
                        <img src={email_icon} alt="" />
                        <input type="email" placeholder="PHRI Email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="input">
                        <img src={password_icon} alt="" />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="submit">Log in</button>
                    <div className="forgot-password">Forgot Password? <span>Click Here</span></div>
                    <button className="submit gray" onClick={() => onSwitch('createAccount')}>Create Account</button>
                </form>
            </div>
        </div>
    )
};

export default Login;