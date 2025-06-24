import React, { useState, useEffect } from 'react';
import '../css/Header.css';
import { useLocation, useNavigate } from 'react-router-dom';
import logo_image from '../assets/images/logo.png';

function Header() {
    const navigateTo = useNavigate();
    const location = useLocation();
    const [userRole, setUserRole] = useState('');
    const hideHeaderforPaths = ['/login']; //add more when needed

    useEffect(() => {
        const userInfo = localStorage.getItem('session-info');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                setUserRole(parsed.user?.role || '');
            } catch (e) {
                console.warn("Invalid JSON in localStorage:", e);
            }
        }
    }, [location]);

    if (hideHeaderforPaths.includes(location.pathname)) {
       return (
        <></>
       )
    }

    return(
        <header className='header' onClick={() => navigateTo('/home')}>
            <img src={logo_image} className = 'logo-image' />
        </header>
    );
}

export default Header;