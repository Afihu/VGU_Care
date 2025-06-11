import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TrackMood.css';

export default function TrackMood() {
    const navigate = useNavigate();

    const [mood, setMood] = useState('');
    const [note, setNote] = useState('');
    const [saved, setSaved] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaved(true);
        // Here you'll later send mood/note to backend
    };

    return (
        <div>
            <button class="title-box" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                TRACK MOOD LMAO
            </button>
            <div className="mood-form">
                <h1>Mood Tracker</h1>
                <form onSubmit={handleSubmit}>
                    <label style={{textAlign: 'left'}}><b>How are you feeling?</b></label>
                    <select value={mood} onChange={(e) => setMood(e.target.value)} className="mood-select">
                        <option value="">Select a mood...</option>
                        <option value="Happy">Happy</option>
                        <option value="Sad">Sad</option>
                        <option value="Anxious">Anxious</option>
                        <option value="Neutral">Neutral</option>
                    </select>

                    <label><b>Additional notes:</b></label>
                    <input
                        placeholder="Write a note..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="note-input"
                    >
                    </input>

                    <button type="submit" className="save-button">Save Mood</button>
                </form>

                {saved && <p className="success-message">Mood saved successfully</p>}
            </div>
            

            <h2>Previous Entries (test labels)</h2>
            <div className="entry-card">
                <strong>Anxious</strong> - 6/10/2025, 10:03:15 PM
                <p>My big deadline is coming.</p>
            </div>
            <div className="entry-card">
                <strong>Happy</strong> - 6/10/2025, 9:58:38 PM
                <p>Had a great day!</p>
            </div>
            <div className="entry-card">
                <strong>Neutral</strong> - 6/10/2025, 9:58:38 PM
                <p>Just an average day.</p>
            </div>
            <div className="entry-card">
                <strong>Sad</strong> - 6/10/2025, 9:58:38 PM
                <p>Feeling down today.</p>
            </div>
        </div>
    );
}

