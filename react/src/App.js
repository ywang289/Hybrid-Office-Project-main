import React, { useState } from 'react';
import Login from './user/Login'
import CreateAccount from './user/CreateAccount';

function App() {
    const [currentView, setCurrentView] = useState('login');

    const switchView = (view) => {
        setCurrentView(view);
    };

    return (
        <div>
            {currentView === 'login' ? 
                <Login onSwitch={switchView} /> : 
                <CreateAccount onSwitch={switchView} />
            }
        </div>
    );
}

export default App;