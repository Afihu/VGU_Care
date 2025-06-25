import { useState, useEffect } from "react";
import {useNavigate} from 'react-router-dom';
// import '../css/ProfilePage.css';
import api from "../services/api";
import helpers from "../utils/helpers";

function ProfilePage() {
    const [userToken, setUserToken] = useState("");
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        // Retrieve token and fetch profile in one async function
        const fetchUserProfile = async () => {
            const rawUserInfo = localStorage.getItem('session-info');
            const parsed = helpers.JSONparser(rawUserInfo);
            const retrievedToken = parsed?.token || "";
            setUserToken(retrievedToken);
            if (retrievedToken) {
                try {
                    const data = await api.userProfileRetrieveService(retrievedToken);
                    setProfile(data);
                    console.log('Profile:', data);
                } catch (error) {
                    console.error('Profile fetch error:', error);
                }
            } else {
                console.warn('No token provided');
            }
        };
        fetchUserProfile();
    }, []);

    useEffect(() => {
        console.log("userToken:", userToken);
    }, [userToken]);

    return (
        <>
            {/* Optionally render profile info here */}
        </>
    );
}

export default ProfilePage;