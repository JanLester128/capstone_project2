Faculty Account Created
========================

Dear {{ $faculty->FirstName }} {{ $faculty->LastName }},

Welcome to our academic management system! Your faculty account has been successfully created by the registrar's office.

Your Login Credentials:
-----------------------
Email: {{ $faculty->email }}
Temporary Password: {{ $temporaryPassword }}

IMPORTANT SECURITY NOTICE:
You must change your password on your first login. This temporary password is only for initial access and cannot be used for regular system access until you create your own secure password.

Next Steps:
-----------
1. Login to the system using the credentials above
2. Change your password when prompted (required for security)
3. Complete your profile if additional information is needed
4. Explore the faculty dashboard and available features

Login URL: {{ url('/login') }}

Need Help?
----------
If you encounter any issues logging in or have questions about using the system, please contact the registrar's office or your system administrator.

---
This email was sent automatically by the Academic Management System.
Please do not reply to this email.
Generated on {{ now()->format('F j, Y \a\t g:i A') }}
