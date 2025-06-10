import React from 'react';
import '../css/Home.css';
import { useNavigate } from 'react-router-dom';
// import header_jpeg from './assets/yes.jpg';

function Home(){
    const navigate = useNavigate();

    return(    
        <div>
            <div class='flex-container'>
                <div class='element-flex-ontainer' onClick={() => navigate('/request-appointment')}>
                    <button class='req-appoint-label'>Request Appointment</button>
                    <button class='Button'>
                        <span class='request-appointment-icon'></span>
                    </button>
                </div>

                <div class='element-flex-container' onClick={() => navigate('/appointment-user-view')}>
                    <button class='view-appointment-label'>View Appointments</button>
                    <button class='Button'>
                        <span class='view-appointment-icon'></span>
                    </button>
                </div>

                <div class='element-flex-container'>
                    <button class='update-hdata-label'>Update Health Data</button>
                    <button class='Button'>
                        <span class='update-hdata-icon'></span>
                    </button>
                </div>

                <div class='element-flex-container' onClick={() => navigate('/track-mood')}>
                    <button class='track-mood-label'>Track Mood</button>
                    <button class='Button'>
                        <span class='track-mood-icon'></span>
                    </button>
                </div>
                {/* <p>everything gut</p>  */}

            </div>

            <div class='flex-container'>
                <img src = './assets/images/shrek.jpg' className = 'cover-image' />
                <img src = './assets/images/ocktor.png' className = 'cover-image' />
            </div>

            <div>
                <button class='Logout-button'>Log Out</button>
            </div>
        </div>
    );
}
 export default Home;