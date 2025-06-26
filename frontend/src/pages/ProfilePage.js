import React, { useState, useEffect } from "react";
import '../css/ProfilePage.css';
import api from "../services/api";
import helpers from "../utils/helpers";
import LogoutButton from "../components/LogoutButton";

function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const rawUserInfo = localStorage.getItem('session-info');
            const parsed = helpers.JSONparser(rawUserInfo);
            
            // Try to get token from session-info first, then fallback to direct token storage
            let retrievedToken = parsed?.token || localStorage.getItem('token') || "";
            
            if (retrievedToken) {
                try {
                    const data = await api.userProfileRetrieveService(retrievedToken);
                    setProfile(data.user);
                } catch (error) {
                    console.error('Profile fetch error:', error);
                    setError(error.message || 'Failed to load profile');
                } finally {
                    setLoading(false);
                }
            } else {
                console.warn('No authentication token found');
                setError('No authentication token found. Please log in again.');
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, []);

    const getInitials = (name) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    if (loading) {
        return <div className="profile-page"><p>Loading profile...</p></div>;
    }

    if (error) {
        return <div className="profile-page"><p>Error: {error}</p></div>;
    }

    if (!profile) {
        return <div className="profile-page"><p>Could not load profile.</p></div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar-large">{getInitials(profile.name)}</div>
                    <div className="profile-header-info">
                        <h1 className="profile-name">{profile.name}</h1>
                        <p className="profile-email">{profile.email}</p>
                        <span className={`status-badge status-${profile.status}`}>{profile.status}</span>
                    </div>
                </div>

                <div className="profile-details">
                    <h2 className="section-title">Personal Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Age</span>
                            <span className="info-value">{profile.age}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Gender</span>
                            <span className="info-value">{profile.gender}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Member Since</span>
                            <span className="info-value">{new Date(profile.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {profile.role === 'student' && (
                        <>
                            <h2 className="section-title">Academic Information</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Major</span>
                                    <span className="info-value">{profile.major}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Intake Year</span>
                                    <span className="info-value">{profile.intakeYear}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Housing</span>
                                    <span className="info-value">{profile.housingLocation}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Points</span>
                                    <span className="info-value">{profile.points}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {profile.role === 'medical_staff' && (
                         <>
                            <h2 className="section-title">Professional Information</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Staff ID</span>
                                    <span className="info-value">{profile.staffId}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Specialty</span>
                                    <span className="info-value">{profile.specialty}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="profile-footer-note">
                    *If you would like to modify your account information, please contact admin for support.
                </div>
            </div>
            <LogoutButton />
        </div>
    );
}

export default ProfilePage;