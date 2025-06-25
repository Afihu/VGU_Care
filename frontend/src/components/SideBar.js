import { useNavigate } from 'react-router-dom';
import '../css/SideBar.css';

const SideBar = ({ isOpen, toggleSidebar, onMouseEnter, onMouseLeave }) => {
    const navigateTo = useNavigate();

    const handleNavigation = (path) => {
        navigateTo(path);
        toggleSidebar(); 
    };

    const rawUserInfo = localStorage.getItem('session-info');
    const user = rawUserInfo ? JSON.parse(rawUserInfo).user : { name: 'Guest', email: '', role: '' };

    const handleLogout = () => {
        try {
            const parsed = JSON.parse(rawUserInfo);
            if (parsed && parsed.user.email) {
                localStorage.removeItem('session-info');
                navigateTo('/login');
                toggleSidebar();
            }
        } catch (e) {
            console.warn("Invalid JSON in localStorage:", e);
        }
    };
    
    const getInitials = (name) => {
        if (!name) return 'G';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
            <aside 
                className={`sidebar ${isOpen ? 'open' : ''}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className="sidebar-top">
                    <div className="profile-section" onClick={() => handleNavigation('/profile')}>
                        <div className="profile-avatar">
                            {getInitials(user.name)}
                        </div>
                        <div className="profile-info">
                            <span className="profile-name">{user.name}</span>
                            <span className="profile-email">{user.email}</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-main">
                    <ul className="nav-list">
                        {/* --- Common Routes for Student and Medical Staff --- */}
                        {(user.role === 'student' || user.role === 'medical_staff') && (
                            <>
                                <li className="nav-item" onClick={() => handleNavigation('/appointment-view')}>
                                    <span className="nav-icon"></span>
                                    <span className="nav-text">View Appointment</span>
                                </li>
                            </>
                        )}

                        {/* --- Student-only Routes --- */}
                        {user.role === 'student' && (
                            <>
                                <li className="nav-item" onClick={() => handleNavigation('/request-appointment')}>
                                    <span className="nav-icon"></span>
                                    <span className="nav-text">Request Appointment</span>
                                </li>
                                <li className="nav-item" onClick={() => handleNavigation('/track-mood')}>
                                    <span className="nav-icon"></span>
                                    <span className="nav-text">Track Mood</span>
                                </li>
                            </>
                        )}
                        
                        {/* --- Medical Staff-only Routes --- */}
                        {user.role === 'medical_staff' && (
                            <li className="nav-item" onClick={() => handleNavigation('/manage-students')}>
                                <span className="nav-icon"></span>
                                <span className="nav-text">Manage Students</span>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="sidebar-bottom">
                    <ul className="nav-list">
                        <li className="nav-item" onClick={handleLogout}>
                            <span className="nav-icon"></span>
                            <span className="nav-text">Logout</span>
                        </li>
                    </ul>
                </div>
            </aside>
        </>
    );
};

export default SideBar;