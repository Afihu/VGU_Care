import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SideBar.css';

const SideBar = ({ isOpen, toggleSidebar }) => {
    const navigateTo = useNavigate();

    const handleNavigation = (path) => {
        navigateTo(path);
        toggleSidebar(); // Close sidebar after navigation
    };

    const handleLogout = () => {
        // Your logout logic here
        console.log("User logged out");
        localStorage.removeItem('session-info');
        navigateTo('/login');
    };

    const rawUserInfo = localStorage.getItem('session-info');
    const user = rawUserInfo ? JSON.parse(rawUserInfo).user : { name: 'Guest', email: ''};
    
    const getInitials = (name) => {
        if (!name) return 'G';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-top">
                    <div className="profile-section" onClick={() => handleNavigation('/profile')}>
                        <div className="profile-avatar">
                            {getInitials(user.name)}
                        </div>
                        <div className="profile-info">
                            <span className="profile-name">{user.name}</span>
                            <span className="profile-email">{user.email}</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-main">
                    <ul className="nav-list">
                        <li className="nav-item active" onClick={() => handleNavigation('/home')}>
                            <span className="nav-icon"></span>
                            <span className="nav-text">Home</span>
                        </li>
                        {/* Add more main navigation buttons here */}
                    </ul>
                </nav>

                <div className="sidebar-bottom">
                    <ul className="nav-list">
                        <li className="nav-item" onClick={handleLogout}>
                            <span className="nav-icon"></span>
                            <span className="nav-text">Logout</span>
                        </li>
                    </ul>
                </div>
            </aside>
        </>
    );
};

export default SideBar;