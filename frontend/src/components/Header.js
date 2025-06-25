import React, { useState, useEffect } from 'react';
import '../css/Header.css';
import { useLocation, useNavigate } from 'react-router-dom';
import logo_image from '../assets/images/logo.png';
import SideBar from './SideBar';
import NotificationBell from './NotificationBell';
import helpers from '../utils/helpers';

function Header() {
    const navigateTo = useNavigate();
    const location = useLocation();
    const hideHeaderforPaths = ['/login']; //add more when needed 
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [closeTimer, setCloseTimer] = useState(null);

    const handleMouseEnter = () => {
        clearTimeout(closeTimer); // Cancel any pending close timer
        setSidebarOpen(true);
    };

    const handleMouseLeave = () => {
        // Set a timer to close the sidebar after a short delay
        const timer = setTimeout(() => {
            setSidebarOpen(false);
        }, 300); // 300ms delay
        setCloseTimer(timer);
    };

    useEffect(() => {
    return () => {
        clearTimeout(closeTimer);
    };
    }, [closeTimer]);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    if (hideHeaderforPaths.includes(location.pathname)) {
       return null;
    }

    return(
        <>
            <div className="sidebar-hover-area" onMouseEnter={handleMouseEnter}></div>
            <SideBar 
                isOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
            />
            <header className='header'>
                {/* Left Section */}
                <div className="header-left">
                    <button className="menu-button" onClick={toggleSidebar}>
                        &#9776; {/* Hamburger Icon */}
                    </button>
                </div>

                {/* Center Section */}
                <div className="header-center">
                    <img src={logo_image} className='logo-image' alt="Logo" onClick={() => navigateTo('/home')} />
                </div>                {/* Right Section (empty for now, but good for future icons) */}
                <div className="header-right">
                    <NotificationBell />
                </div>
            </header>
        </>
    );
}

export default Header;