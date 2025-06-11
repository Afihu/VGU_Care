const documentService = require('../services/documentService');
const userService = require('../services/userService');

exports.getDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get the student_id from the user_id
    const user = await userService.getUserById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access health documents' });
    }
    
    const documents = await documentService.getDocumentsByUserId(userId);
    
    res.json({ documents });
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentType, symptomsDescription, otherDetails } = req.body;
    
    // Validate document type
    if (!documentType || 
        !['medical_report', 'vaccination_record', 'health_certificate'].includes(documentType)) {
      return res.status(400).json({ error: 'Valid document type is required' });
    }
    
    if (!symptomsDescription) {
      return res.status(400).json({ error: 'Symptoms description is required' });
    }
    
    // Get the student_id from the user_id
    const user = await userService.getUserById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can upload health documents' });
    }
    
    // In a real implementation, you would handle file upload here
    // For now, we'll just create the document record
    const document = await documentService.createDocument(
      user.id, 
      documentType, 
      symptomsDescription, 
      otherDetails
    );
    
    res.status(201).json({ 
      message: 'Document uploaded successfully',
      document 
    });
  } catch (err) {
    console.error('Upload document error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateDocument = async (req, res) => {
  // Similar implementation to updateMoodEntry
};

exports.deleteDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const documentId = req.params.id;
    
    // Get the student_id from the user_id
    const user = await userService.getUserById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can delete health documents' });
    }
    
    // Verify the document belongs to the student
    const document = await documentService.getDocumentById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (document.studentId !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own documents' });
    }
    
    await documentService.deleteDocument(documentId);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: err.message });
  }
};