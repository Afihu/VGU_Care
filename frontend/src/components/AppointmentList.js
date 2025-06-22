import React from "react";
import '../css/AppointmentView.css';

function AppointmentList({userAppointments}) {
    return(
        <div className="entry-table">
            <h2>All Appointments</h2>
            {userAppointments.length === 0 ? (
                <p>No appointment has been made</p>
            ) : (
                userAppointments.map((entry, index) => (
                    <div className="appointment-card" key={index}>
                        <strong>{entry.status}</strong> - {entry.dateRequested}, {entry.dateScheduled}
                        {(entry.hasAdvice) ? (<p>Doctor advice available</p>) : null}
                    </div>
                ))
            )}
        </div>
    )
}

export default AppointmentList;