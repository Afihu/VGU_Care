import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdminDashboard.css';
import AdminDataTable from '../components/AdminDataTable';
import Modal from '../components/Modal';
import { getAllStudents, getAllMedicalStaff, getAllAbuseReports, updateUserRole, updateUserStatus, updateUserName } from '../services/adminService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');  
  const [students, setStudents] = useState([]);
  const [medicalStaff, setMedicalStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalChildren, setModalChildren] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // State for abuse reports
  const [abuseReports, setAbuseReports] = useState([]);

  // Compute report counts by student
  const reportCounts = abuseReports.reduce((acc, r) => {
    acc[r.studentId] = (acc[r.studentId] || 0) + 1;
    return acc;
  }, {});

  // Check if user is admin
  useEffect(() => {
    const userInfo = localStorage.getItem('session-info');
    if (!userInfo) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userInfo);
      if (!parsed.user || parsed.user.role !== 'admin') {
        navigate('/home');
        return;
      }
    } catch (e) {
      console.warn("Invalid JSON in localStorage:", e);
      navigate('/login');
      return;
    }

    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [studentsData, medicalStaffData, abuseReportsData] = await Promise.all([
        getAllStudents(),
        getAllMedicalStaff(),
        getAllAbuseReports()
      ]);
      
      setStudents(studentsData.students || []);
      setMedicalStaff(medicalStaffData.medicalStaff || []);
      setAbuseReports(abuseReportsData.reports || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleEditUser = (user) => {
    console.log('Edit user clicked:', user); // Debug log
    setSelectedUser(user);
    setModalTitle(`Edit User: ${user.name}`);
    setModalChildren(
      <div className="edit-user-form">
        <div className="form-group">
          <label>Name:</label>
          <input 
            type="text" 
            className="form-control" 
            defaultValue={user.name}
            id="edit-name"
          />
        </div>
        <div className="form-group">
          <label>Role:</label>
          <select className="form-control" defaultValue={user.role} id="edit-role">
            <option value="student">Student</option>
            <option value="medical_staff">Medical Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label>Status:</label>
          <select className="form-control" defaultValue={user.status} id="edit-status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
        </div>        <div className="form-actions">
          <button className="btn-cancel" onClick={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}>
            Cancel
          </button>          <button className="btn-save" onClick={() => handleSaveUser(user.id, user)}>
            Save Changes
          </button>
        </div>
      </div>
    );
    setIsModalOpen(true);
  };  const handleSaveUser = async (userId, userData = null) => {
    try {
      // Use passed userData or fallback to selectedUser
      const currentUser = userData || selectedUser;
      
      if (!currentUser) {
        console.error('No user data available:', { userId, userData, selectedUser });
        setError('No user selected for editing');
        return;
      }

      console.log('Save operation starting:', { userId, currentUser }); // Debug log

      // Clear any existing messages
      setError('');
      setSuccessMessage('');

      const name = document.getElementById('edit-name').value;
      const role = document.getElementById('edit-role').value;
      const status = document.getElementById('edit-status').value;
      
      // Track what's being updated for success message
      const changedFields = [];
      const updates = [];
      
      if (name !== currentUser.name) {
        updates.push(updateUserName(userId, name));
        changedFields.push('name');
      }
      
      if (role !== currentUser.role) {
        updates.push(updateUserRole(userId, role));
        changedFields.push('role');
      }
      
      if (status !== currentUser.status) {
        updates.push(updateUserStatus(userId, status));
        changedFields.push('status');
      }
      
      if (updates.length > 0) {
        await Promise.all(updates);
        
        // Show success message
        const updatedFieldsText = changedFields.join(', ');
        setSuccessMessage(`Successfully updated ${updatedFieldsText} for ${currentUser.name}`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setSuccessMessage('No changes were made');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
      setIsModalOpen(false);
      setSelectedUser(null); // Clear selected user after successful save
      await loadUsers(); // Reload data
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    }
  };

  const studentColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'major', header: 'Major' },
    { key: 'intakeYear', header: 'Intake Year' },
    { key: 'housingLocation', header: 'Housing' },
    { 
      key: 'status', 
      header: 'Status',
      render: (row) => (
        <span className={`status-badge status-${row.status}`}>
          {row.status}
        </span>
      )
    }
  ];

  const medicalStaffColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'specialty', header: 'Specialty' },
    { key: 'specialtyGroup', header: 'Group' },
    { 
      key: 'status', 
      header: 'Status',
      render: (row) => (
        <span className={`status-badge status-${row.status}`}>
          {row.status}
        </span>
      )
    }
  ];

  // Columns for abuse reports table
  const abuseReportColumns = [
    {
      key: 'studentId',
      header: 'Student ID',
      render: (row) => {
        const count = reportCounts[row.studentId] || 0;
        const style = count >= 3 ? { color: 'red' } : {};
        return <span style={style}>{row.studentId}</span>;
      }
    },
    { key: 'description', header: 'Description' },
    { key: 'reportDate', header: 'Date' },
    { 
      key: 'status', 
      header: 'Status',
      render: (row) => (
        <span className={`status-badge status-${row.status}`}>
          {row.status}
        </span>
      )
    },
    { key: 'reportType', header: 'Type' }
  ];

  return (
    <div className="admin-dashboard">      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        title={modalTitle}
        children={modalChildren}
      />
      
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage users, appointments, and system settings</p>
      </div>      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button className="error-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <span>{successMessage}</span>
          <button className="success-close" onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students ({students.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'medical-staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical-staff')}
        >
          Medical Staff ({medicalStaff.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'abuse-reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('abuse-reports')}
        >
          Abuse Reports ({abuseReports.length})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'students' && (
          <AdminDataTable
            data={students}
            columns={studentColumns}
            title="Student Management"
            loading={loading}
            onEditClick={handleEditUser}
            emptyMessage="No students found"
          />
        )}

        {activeTab === 'medical-staff' && (
          <AdminDataTable
            data={medicalStaff}
            columns={medicalStaffColumns}
            title="Medical Staff Management"
            loading={loading}
            onEditClick={handleEditUser}
            emptyMessage="No medical staff found"
          />
        )}

        {activeTab === 'abuse-reports' && (
          <AdminDataTable
            data={abuseReports}
            columns={abuseReportColumns}
            title="Abuse Reports Management"
            loading={loading}
            emptyMessage="No abuse reports found"
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
