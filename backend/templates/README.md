# VGU Care Email Template System

This directory contains the email templates for the VGU Care healthcare management system. The templates are organized to provide consistent, professional communication with users.

## Directory Structure

```
backend/templates/email/
├── base.html                          # Base template with VGU Care branding
├── appointment-created.html           # Student appointment request confirmation
├── appointment-approved.html          # Appointment approval notification
├── appointment-rejected.html          # Appointment rejection notification
├── medical-staff-assignment.html      # New appointment assignment for staff
├── symptom-update-notification.html   # Urgent symptom update alert for staff
├── abuse-report-notification.html     # Admin alert for abuse reports
├── maintenance-notification.html      # System maintenance announcement
└── welcome.html                       # New user welcome email
```

## Template System Features

### 1. **Variable Substitution**
Templates use double curly braces for variable substitution:
```html
<p>Dear {{userName}},</p>
<p>Your appointment for {{appointmentDate}} has been {{status}}.</p>
```

### 2. **Conditional Blocks**
Templates support conditional content:
```html
{{#if reason}}
<li><strong>Notes:</strong> {{reason}}</li>
{{/if}}
```

### 3. **CSS Classes**
Pre-defined CSS classes for consistent styling:
- `.success` - Green success messages
- `.alert` - Red alert/warning messages
- `.warning` - Yellow warning messages
- `.info` - Blue informational messages
- `.urgent` - Red urgent medical alerts
- `.actions` - Blue action recommendations
- `.button` - Styled action buttons

### 4. **Base Template**
All emails use the `base.html` template which provides:
- VGU Care branding and header
- Consistent styling and layout
- Professional footer with disclaimers
- Responsive design for mobile devices

## Using Templates in Code

### Basic Usage
```javascript
const emailService = new EmailService();

// Render a template with data
const htmlContent = await emailService.renderTemplate('appointment-approved', {
  studentName: 'John Doe',
  appointmentDate: '2025-06-30',
  appointmentTime: '10:00 AM',
  medicalStaffName: 'Dr. Smith',
  symptoms: 'Headache and fever',
  actionUrl: 'https://vgucare.edu.vn/appointments',
  actionText: 'View Appointment'
}, 'Appointment Approved');

// Send the email
await emailService.sendEmail(
  'student@vgu.edu.vn',
  'Appointment Approved',
  htmlContent
);
```

### Direct Method Usage
```javascript
// Use the convenience methods that handle template rendering automatically
await emailService.sendAppointmentApprovedEmail(
  'student@vgu.edu.vn',
  'John Doe',
  appointmentDetails,
  'Dr. Smith'
);
```

## Template Variables

### Common Variables
All templates have access to these variables:
- `title` - Email title/subject
- `frontendUrl` - Base URL for the frontend application
- `actionButton` - Rendered HTML for action buttons

### Template-Specific Variables

#### Appointment Created
- `studentName` - Student's full name
- `symptoms` - Appointment symptoms
- `priorityLevel` - Priority level (low/medium/high)
- `dateScheduled` - Requested appointment date

#### Appointment Approved
- `studentName` - Student's full name
- `appointmentDate` - Formatted appointment date
- `appointmentTime` - Appointment time
- `medicalStaffName` - Assigned doctor/nurse name
- `symptoms` - Patient symptoms

#### Symptom Update Notification
- `staffName` - Medical staff name
- `studentName` - Patient name
- `studentEmail` - Patient email
- `appointmentId` - Appointment ID
- `status` - Current appointment status
- `priorityLevel` - Priority level
- `appointmentDate` - Scheduled date
- `appointmentTime` - Scheduled time
- `symptoms` - Updated symptoms

#### Welcome Email
- `userName` - New user's name
- `userRole` - User role (student/medical_staff/admin)
- `isStudent` - Boolean for student role
- `isMedicalStaff` - Boolean for medical staff role
- `isAdmin` - Boolean for admin role

## Customizing Templates

### 1. **Editing Existing Templates**
Simply edit the HTML files in the `templates/email/` directory. Changes take effect immediately.

### 2. **Adding New Templates**
1. Create a new `.html` file in the `templates/email/` directory
2. Use the existing templates as examples for structure
3. Add a corresponding method in `EmailService` class
4. Test with the template engine

### 3. **Modifying Styles**
Edit the CSS in `base.html` to change the overall appearance. Consider:
- Color scheme consistency
- Mobile responsiveness
- Accessibility (contrast ratios)
- Email client compatibility

## Best Practices

### 1. **Data Sanitization**
The template engine automatically escapes HTML in user data to prevent XSS attacks.

### 2. **Fallback Handling**
If template rendering fails, the system provides a simple fallback email to ensure notifications are still sent.

### 3. **Testing Templates**
Always test new templates with:
- Different email clients (Gmail, Outlook, Apple Mail)
- Mobile devices
- Various data scenarios (long text, special characters)

### 4. **Error Handling**
Template errors are logged but don't break the email sending process. Monitor logs for template issues.

## Troubleshooting

### Template Not Found
- Check file name spelling and extension
- Ensure file is in the correct directory
- Verify file permissions

### Variables Not Displaying
- Check variable name spelling in template
- Ensure data is passed to template correctly
- Use conditional blocks for optional data

### Styling Issues
- Test in multiple email clients
- Use inline CSS for better compatibility
- Avoid complex CSS features not supported by email clients

## Email Client Compatibility

The templates are designed to work with:
- ✅ Gmail (Web, Mobile, Desktop)
- ✅ Outlook (Web, Desktop)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ Thunderbird
- ⚠️ Older email clients may have limited CSS support

## Security Considerations

- All user input is automatically HTML-escaped
- Templates are stored server-side only
- No JavaScript execution in templates
- Sensitive data should not be included in email content
- Links use HTTPS and validate domains

## Performance

- Templates are loaded on-demand
- Template engine includes basic caching
- Large templates should be optimized for size
- Consider using CDN for images (not included in templates)

---

*For questions about the email template system, contact the VGU Care development team.*
