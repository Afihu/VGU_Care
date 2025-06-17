import React, {useState} from 'react';
import '../css/Home.css';
import { useNavigate } from 'react-router-dom';

import image1 from '../assets/images/shrek.jpg';
import image2 from '../assets/images/ocktor.png';
import Modal from '../components/Modal';

// import header_jpeg from './assets/yes.jpg';

function Home(){
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [children, setChildren] = useState('');

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
                    >Logout</button>

                    <button
                        style={{
                            background: 'linear-gradient(90deg,rgba(81, 92, 94, 1) 0%, rgba(179, 169, 155, 1) 100%)',                            
                            borderRadius: '10px',
                            fontFamily: 'Consolas',
                            fontSize: '1.2em'
                        }}
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

                {/* Just in case
                    <div class='element-flex-container' onClick={() => navigate('/document-upload')}>
                    <button class='update-hdata-label'>Upload Health Data</button>
                    <button class='Button'>
                        <span class='update-hdata-icon'></span>
                    </button>
                </div> */}

                <div class='element-flex-container' onClick={() => navigate('/track-mood')}>
                    <button class='track-mood-label'>Track Mood</button>
                    <button class='Button'>
                        <span class='track-mood-icon'></span>
                    </button>
                </div>
                {/* <p>everything gut</p>  */}

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