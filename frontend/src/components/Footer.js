import React from 'react';
import '../css/Footer.css';
import {useLocation} from 'react-router-dom';

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
            <img src = './assets/images/yes.jpg' className = 'logo-image' />
        </header>
    );
}

export default Footer;