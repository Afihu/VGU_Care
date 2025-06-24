import React, {useState} from 'react';
import '../css/Home.css';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';

import image1 from '../assets/images/Asian_Doctor_Patient.jpg';
import image2 from '../assets/images/Psychotheraphy.jpg';
import Modal from '../components/Modal';

// import header_jpeg from './assets/yes.jpg';

function Home(){
    const navigate = useNavigate();
    const userInfo = localStorage.getItem('session-info');

    return(     
        <div>
            <div class='flex-container'>
                {/* {console.log( JSON.parse(userInfo).user.role)} Just in case */}
                { 
                    JSON.parse(userInfo).user.role.includes('student') ? (
                        <div class='element-flex-container' onClick={() => navigate('/request-appointment')}>
                        <button class='req-appoint-label'>Request Appointment</button>
                        <button class='Button'>
                            <span class='request-appointment-icon'></span>
                        </button>
                    </div>
                    ) : null
                }
                
                <div class='element-flex-container' onClick={() => navigate('/appointment-view')}>
                    <button class='view-appointment-label'>View Appointments</button>
                    <button class='Button'>
                        <span class='view-appointment-icon'></span>
                    </button>
                </div> 

                {
                    (JSON.parse(userInfo).user.role.includes('student')) ? 
                    (<div class='element-flex-container' onClick={() => navigate('/track-mood')}>
                        <button class='track-mood-label'>Track Mood</button>
                        <button class='Button'>
                            <span class='track-mood-icon'></span>
                        </button>
                    </div> 
                    
                    ) : null
                }

                {
                    (JSON.parse(userInfo).user.role.includes('medical_staff')) ?
                    (
                    <>
                        <div class='element-flex-container' onClick={() => navigate('/manage-student')}>
                            <button class='manage-student-label'>Manage Students</button>
                            <button class='Button'>
                                <span class='manage-student-icon'></span>
                            </button>
                        </div>
                    </>
                    ) : null
                }

                {
                    (JSON.parse(userInfo).user.role.includes('student') || JSON.parse(userInfo).user.role.includes('medical_staff')) ?
                    (
                        <>
                            <div className='element-flex-container'>
                                    <button class='my-account-label'>My Account</button>
                                    <button class='Button'>
                                        <span class='my-account-icon'></span>
                                    </button>
                            </div>
                        </>
                    ) : null
                }
                    

            </div>

            <div class='flex-container'>
                <img src = {image1} className = 'cover-image' />
                <img src = {image2} className = 'cover-image' />
            </div>
            
            <LogoutButton />

        </div>
    );
}
 export default Home;


 {/* Just in case
    <div class='element-flex-container' onClick={() => navigate('/document-upload')}>
    <button class='update-hdata-label'>Upload Health Data</button>
    <button class='Button'>
        <span class='update-hdata-icon'></span>
    </button>k
</div> */}