import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TrackMood.css';

export default function AppointmentUserView() {
    const navigate = useNavigate();
    return (
        <div>
            <div 
                style={{
                padding: '18px 36px',
                backgroundColor: '#fcf803', 
                color: 'black',
                fontSize: '20px',
                borderRadius: '15px',
                border: '2px solid #fcf803',
                textAlign: 'center',
                fontWeight: 'bold',
                marginBottom: '30px',
                width: 'fit-content',
                marginLeft: '50px'
                }}
            >
                TYRACK MOOD
            </div>
        </div>
    );
}
