import React from 'react';
import '../css/Header.css';
import {useLocation} from 'react-router-dom';
import logo_image from '../assets/images/logo.png';
import {useNavigate} from 'react-router-dom';
import { useState } from 'react';
import SideBar from './SideBar';
import NotificationBell from './NotificationBell';

function Header() {
    const navigateTo = useNavigate();
    const location = useLocation();
    const hideHeaderforPaths = ['/login']; //add more when needed
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    if (hideHeaderforPaths.includes(location.pathname)) {
       return null;
    }

    return(
        <>
            <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
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