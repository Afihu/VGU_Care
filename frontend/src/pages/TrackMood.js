import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TrackMood.css';

export default function TrackMood() {
    const navigate = useNavigate();
    
    return (
        <div>
            <h1>welcome to the page</h1>
            <button class="title-box" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                TYRACK MOOD
            </button>
        </div>
    );
    
}
