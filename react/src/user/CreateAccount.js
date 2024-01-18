import React, { useState } from "react";
import './LoginSignup.css';
import email_icon from './Assets/email.png';
import password_icon from './Assets/password.png';
import user_icon from './Assets/person.png';

function CreateAccount({ onSwitch }) {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!email.endsWith('@phri.ca')) {
            setError('Email must end with @phri.ca');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setError('');

        try {
            const response = await fetch('/create-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email: email.toLowerCase(),
                    password,
                }),
            });
    
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'An error occurred');
            }
            console.log('Account created:', data);
            window.location.reload();
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="back">
            <div className="title">Hybrid Office</div>
            <div className="container">
                <div className="header-user">
                    <div className="text">Create Account</div>
                    <div className="underline"></div>
                </div>
                <form className="inputs" onSubmit={handleSubmit}>
                    <div className="input">
                        <img src={user_icon} alt="" />
                        <input type="name" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="input">
                        <img src={email_icon} alt="" />
                        <input type="email" placeholder="PHRI Email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="input">
                        <img src={password_icon} alt="" />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    {error && <div className="error">{error}</div>}
                    <button className="submit">Create Account</button>
                    <button className="submit gray" onClick={() => onSwitch('login')}>Log in</button>
                </form>
            </div>
        </div>
    )
};

export default CreateAccount;