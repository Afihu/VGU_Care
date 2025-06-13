import React from 'react';
import '../css/Header.css';
import {useLocation} from 'react-router-dom';
import logo_image from '../assets/images/logo.jpg';

function Header() {
    const location = useLocation();
    const hideHeaderforPaths = ['/login', '/password-retrieve']; //add more when needed

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