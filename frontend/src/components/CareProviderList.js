// components/CareProviderList.js
import React from 'react';
import '../css/TrackMood.css'; // Reuses entry-card styles

export default function CareProviderList({ providers }) {
    return (
        <div className="entry-table">
            <h2>Available Care Providers</h2>
            {providers.length === 0 ? (
                <p>No care providers available at the moment.</p>
            ) : (
                providers.map((provider, index) => (
                    <div className="entry-card" key={index}>
                        <p><strong>Name:</strong> {provider.name}</p>
                        <p><strong>Position:</strong> {provider.position}</p>
                        <p><strong>Speciality:</strong> {provider.speciality}</p>
                        <p><strong>ID:</strong> {provider.staff_id}</p>
                    </div>
                ))
            )}
        </div>
    );
}
