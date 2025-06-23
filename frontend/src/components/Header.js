import React from 'react';
import '../css/Header.css';
import {useLocation} from 'react-router-dom';
import logo_image from '../assets/images/logo.png';

function Header() {
    const location = useLocation();
    const hideHeaderforPaths = ['/login']; //add more when needed

    if (hideHeaderforPaths.includes(location.pathname)) {
       return (
        <></>
       )
    }

    return(
        <header className='header'>
            <img src={logo_image} className = 'logo-image' />
        </header>
    );
}

export default Header;