import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/TrackMood.css';
import MoodEntryList from '../components/MoodEntryList';
import { getMoodEntries } from '../services/moodService';

export default function TrackMood() {
    const navigate = useNavigate();

    const [mood, setMood] = useState('');
    const [note, setNote] = useState('');
    const [saved, setSaved] = useState(false);
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        const fetchMoodEntries = async () => {
            try {
                const data = await getMoodEntries();
                setEntries(data);
            } catch (error) {
                console.error('Failed to load mood entries:', error);
            }
        };

        fetchMoodEntries();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaved(true);
        // implement something here later
    };

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
