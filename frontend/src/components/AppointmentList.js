import React from "react";
import '../css/AppointmentView.css';

function AppointmentList({userAppointments}) {
    return(
        <div className="appointment-table">
            {userAppointments.length === 0 ? (
                <p>No appointment has been made</p>
            ) : (
                userAppointments.map((userAppointment, index) => (
                    <div className="appointment-card" key={index}>
                        <strong>{userAppointment.status}</strong> - {userAppointment.dateRequested}, {userAppointment.dateScheduled}
                        {(userAppointment.hasAdvice) ? (<p>Doctor advice available</p>) : null}
                    </div>
                ))
            )}
        </div>
    )
}

export default AppointmentList;