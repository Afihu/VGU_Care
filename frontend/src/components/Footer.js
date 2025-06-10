import React from 'react';
import '../css/Footer.css';
import {useLocation} from 'react-router-dom';
import logo_image from '../assets/images/yes.jpg';

function Footer() {
    const location = useLocation();
    const hideFooterforPaths = ['/login', '/appointment-user-view']; //add more when needed

    if (hideHeaderforPaths.includes(location.pathname)) {
       return (
        <></>
       )
    }

    return(
        <header className='header'>
            <img src = {logo_image} className = 'logo-image' />
        </header>
    );
}

export default Footer;