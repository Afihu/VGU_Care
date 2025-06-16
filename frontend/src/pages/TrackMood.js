import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TrackMood.css';
import MoodEntryList from '../components/MoodEntryList';


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

    // Sample entries for testing
    const [entries, setEntries] = useState([
        {
            mood: "Happy",
            note: "Got high grade in stats. Yayyyyyyyyyyyyy",
            date: "6/12/2025",
            time: "09:36:16 PM"
        },
        {
            mood: "Anxious",
            note: "My big deadline is coming.",
            date: "6/10/2025",
            time: "10:03:15 PM"
        },
        {
            mood: "Happy",
            note: "Had a great day!",
            date: "6/10/2025",
            time: "9:58:38 PM"
        },
        {
            mood: "Neutral",
            note: "Just an average day.",
            date: "6/10/2025",
            time: "9:58:38 PM"
        },
        {
            mood: "Sad",
            note: "Feeling down today.",
            date: "6/10/2025",
            time: "9:58:38 PM"
        }
    ]);
    
    return (
        <div>
            <div style={{display: 'flex', alignItems: 'flex-start', flexDirection: 'row', padding: '30px' }}>
                <div className="mood-form">
                    <h1>Mood Tracker</h1>
                    <form onSubmit={handleSubmit}>
                        <label style={{textAlign: 'left', marginBottom: '20px'}}><b>How are you feeling?</b></label>
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

                <MoodEntryList entries={entries} />

            </div>
        </div>
    );
}

