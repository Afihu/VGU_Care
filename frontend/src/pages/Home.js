import React, {useState} from 'react';
import '../css/Home.css';
import { useNavigate } from 'react-router-dom';

import image1 from '../assets/images/Asian_Doctor_Patient.jpg';
import image2 from '../assets/images/Psychotheraphy.jpg';
import Modal from '../components/Modal';

// import header_jpeg from './assets/yes.jpg';

function Home(){
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [children, setChildren] = useState('');
    const userInfo = localStorage.getItem('session-info');

    const handleLogout = () => {
        const userInfo = localStorage.getItem('session-info');
        try {
            const parsed = JSON.parse(userInfo);
            if (parsed && parsed.user.email) {
                localStorage.removeItem('session-info'); //remove user info still left in the browser storage
                navigate('/login');
            }
        } catch (e) {
            console.warn("Invalid JSON in localStorage:", e);
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
    }

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setChildren(
            <div>
                <div>
                    <p
                        style={{
                            fontFamily: 'Consolas',
                            fontSize: '1em'
                        }}
                    >Do you want to log out?</p>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '20px'
                    }}
                >
                    <button
                        style={{
                            background: 'linear-gradient(90deg,rgba(59, 159, 85, 1) 24%, rgba(3, 107, 46, 1) 72%)',
                            borderRadius: '10px',
                            fontFamily: 'Consolas',
                            fontSize: '1.2em'
                        }}
                        onClick={() => handleLogout()}
                    >Logout</button>

                    <button
                        style={{
                            background: 'linear-gradient(90deg,rgba(227, 104, 16, 1) 24%, rgba(194, 66, 66, 1) 72%)',                            
                            borderRadius: '10px',
                            fontFamily: 'Consolas',
                            fontSize: '1.2em'
                        }}
                        onClick={() => handleCloseModal()}
                    >Cancel</button>
                </div>
            </div>
        )
    }

    const openLogoutModal = () => {
        handleOpenModal();
        setTitle('Logout of your account')
    }

    return(     
        <div>
            <Modal
                isOpen = {isModalOpen}
                onClose = {handleCloseModal}
                title = {title}
                children={children}
            >
            </Modal>
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
                    

            </div>

            <div class='flex-container'>
                <img src = {image1} className = 'cover-image' />
                <img src = {image2} className = 'cover-image' />
            </div>

            <div>
                <button class='logout-button' onClick={() => openLogoutModal()}>Log Out</button>
            </div>
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