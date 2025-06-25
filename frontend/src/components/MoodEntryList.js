// components/MoodEntryList.js
import React from 'react';
import '../css/TrackMood.css';

export default function MoodEntryList({ entries }) {
    return (
        <div className="entry-table">
            <h2>Previous Entries</h2>
            {entries.length === 0 ? (
                <p>No entries yet.</p>
            ) : (
                entries.map((entry, index) => {
                    console.log('entry.entry_date:', entry.entry_date);   //debug purpose line

                    const date = new Date(entry.entry_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });

                    const time = new Date(entry.entry_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });

                    return (
                        <div className="entry-card" key={index}>
                            <strong>{entry.mood}</strong> - {date}, {time}
                            <p>{entry.notes || '(No notes provided)'}</p>
                        </div>
                    );
                })
            )}
        </div>
    );
}
