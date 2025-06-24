import Modal from "./Modal";
import '../css/LogoutButton.css';
import {useNavigate} from 'react-router-dom';
import { useState } from "react";


function LogoutButton() {
    const [title, setTitle] = useState('');
    const [children, setChildren] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const navigate = useNavigate();

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

            <div>
                <button class='logout-button' onClick={() => openLogoutModal()}>Log Out</button>
            </div>
        </div>
        
    )

}

export default LogoutButton;