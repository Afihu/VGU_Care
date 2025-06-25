import { useState, useEffect } from "react";
import {useNavigate} from 'react-router-dom';
import '../css/ProfilePage.css';
import api from "../services/api";
import helpers from "../utils/helpers";

function ProfilePage() {

    const [userToken, setUserToken] = useState('');

    const handleRetrieveUserToken = () => {
        const rawUserInfo = localStorage.getItem('session-info');
        const parsed = helpers.JSONparser(rawUserInfo);
        const retrievedToken = parsed.token;
        setUserToken(JSON.stringify(retrievedToken));
    }

    const handleProfileRetrieve = () => {
        const response = api.userProfileRetrieveService(userToken);
        if (response.status == 201) {
            alert('success');
            console.log(response);
        } else {
            console.log('oh no', response);
        }
    }

    useEffect(() => {
        const fetchUserProfile = async() => {
            handleRetrieveUserToken();
            handleProfileRetrieve();
        }
        fetchUserProfile();
    }, []);

    useEffect(() => {
        console.log("user:", userToken);
    }, [userToken]);


    return(
        <></>
    )
}

export default ProfilePage;