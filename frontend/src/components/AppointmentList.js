import React from "react";
import '../css/AppointmentView.css';

function AppointmentList({userAppointments, onCardClick}) {
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString("en-US", options);
    }

    const getPriorityClass = (priority) => {
        const level = priority ? priority.toLowerCase() : 'medium';
        if (level === 'high') return 'priority-high';
        if (level === 'low') return 'priority-low';
        return 'priority-medium';
    }

    return(
        <div className="appointment-table">
            {userAppointments.length === 0 ? (
                <div className="no-appointments">
                    <p>No appointments found for this category</p>
                </div>
            ) : (
                userAppointments.map((userAppointment) => (
                    <div className="appointment-card" key={userAppointment.id} onClick={() => onCardClick(userAppointment)}>
                        <div className="appointment-card-left">
                            <div className={`priority-indicator ${getPriorityClass(userAppointment.priorityLevel)}`}></div>
                        </div>
                        <div className="appointment-card-main">
                            <div className="appointment-info">
                                <strong className="symptoms-title">Symptoms</strong>
                                <span className="symptoms-text">{userAppointment.symptoms}</span>
                            </div>
                            <div className="appointment-time">
                                {formatDate(userAppointment.dateScheduled)}
                            </div>
                        </div>
                        <div className="appointment-card-right">
                            <div className={`appointment-status status-${userAppointment.status.toLowerCase()}`}>
                                {userAppointment.status}
                            </div>
                        </div>
                    </div>
                ))    
            )}
        </div>
    )
}

export default AppointmentList;