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

    const handleCloseModal = () => {
        setIsModalOpen(false);
    }

    const handleOpenModal = () => {
        setIsModalOpen(true);
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