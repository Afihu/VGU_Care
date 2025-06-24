import '../css/ManageStudent.css';
import Modal from '../components/Modal';
import { useState, useEffect } from 'react';
import api from '../services/api';
import helpers from '../utils/helpers';
import LogoutButton from '../components/LogoutButton.js'

function ManageStudent() {

    //essential session info
    const rawUserInfo = localStorage.getItem('session-info');
    const parsed = helpers.JSONparser(rawUserInfo);
    const userToken = parsed.token;
    
    //states
    const [studentData, setStudentData] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // functions
    const handleStudentRetrieve = async(token) => {
        const response = await api.studentRetrieveService(token);
        const data =  await response.json();
        return data;
    }

    const handleReportRetrieve = async(token) => {
        const response = await api.reportRetrieveService(token);
        const data =  await response.json();
        return data;
    }

    useEffect(() => {
        const fetchStudents = async() => {
          try {
            let data = await handleStudentRetrieve(userToken); //returns an array of students
            let reportData = await handleStudentRetrieve(userToken);
            if(data && data.students){
                setStudentData(data.students);
                setFilteredStudents(data.students);
            }

            if(reportData) {
                setReportData(reportData);
            }


          } catch (error) {
            console.error("Failed to fetch student list: ", error);
          }
        }
        fetchStudents();

    }, [userToken]);


    useEffect(() => {
        console.log(reportData);
        const results = studentData.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredStudents(results);
    }, [searchTerm, studentData]);

    // useEffect(() => {
    //     console.log('here', studentData);
    //     console.log("data: ", filteredStudents);        
    // }, []);

    const openModal = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
    };

    const getInitials = (name) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }


    return(
        <div className="manage-student-page">
            <div className="page-header">
                <h1>Students</h1>
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search students"
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="student-grid">
                {filteredStudents.map(student => (
                    <div className="student-card" key={student.id} onClick={() => openModal(student)}>
                        <div className={`student-avatar avatar-bg-${student.name.length % 4}`}>
                            {getInitials(student.name)}
                        </div>
                        <div className="student-info">
                            <p className="student-name">{student.name}</p>
                            <p className="student-email">{student.email}</p>
                            <p className="student-major">{student.major}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Student Details">
                {selectedStudent && (
                    <div className="student-details-modal">
                        <p><strong>Name:</strong> {selectedStudent.name}</p>
                        <p><strong>Email:</strong> {selectedStudent.email}</p>
                        <p><strong>Major:</strong> {selectedStudent.major}</p>
                        <p><strong>Intake Year:</strong> {selectedStudent.intakeYear}</p>
                        <p><strong>Age:</strong> {selectedStudent.age}</p>
                        <p><strong>Gender:</strong> {selectedStudent.gender}</p>
                        <p><strong>Status:</strong> <span className={`status-${selectedStudent.status.toLowerCase()}`}>{selectedStudent.status}</span></p>
                        <p><strong>Housing Location:</strong> {selectedStudent.housingLocation}</p>
                        <p><strong>Points:</strong> {selectedStudent.points}</p>
                        
                        <div className="modal-actions">
                            <button className="modal-button deactivate">Report Account</button>
                            <button className="modal-button" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>
            <LogoutButton/>
        </div>
    )
}

export default ManageStudent;