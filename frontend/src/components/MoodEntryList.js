// components/MoodEntryList.js
import React from 'react';
import '../css/TrackMood.css'; // Optional if shared styles are there

export default function MoodEntryList({ entries }) {
    return (
        <div className="entry-table">
            <h2>Previous Entries</h2>
            {entries.length === 0 ? (
                <p>No entries yet.</p>
            ) : (
                entries.map((entry, index) => (
                    <div className="entry-card" key={index}>
                        <strong>{entry.mood}</strong> - {entry.date}, {entry.time}
                        <p>{entry.note}</p>
                    </div>
                ))
            )}
        </div>
    );
}
