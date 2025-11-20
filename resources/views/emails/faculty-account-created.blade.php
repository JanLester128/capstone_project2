<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Account Created</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            padding: 0;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .container-content {
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 30px 20px;
            background: linear-gradient(135deg, #dc2626 0%, #9333ea 100%);
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
        }
        .welcome-section {
            margin-bottom: 25px;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credentials-box h3 {
            color: #495057;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .credential-item {
            margin: 10px 0;
            padding: 8px 0;
        }
        .credential-label {
            font-weight: bold;
            color: #6c757d;
        }
        .credential-value {
            font-family: 'Courier New', monospace;
            background-color: #e9ecef;
            padding: 5px 8px;
            border-radius: 4px;
            display: inline-block;
            margin-left: 10px;
        }
        .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .warning-box .warning-icon {
            color: #856404;
            font-weight: bold;
        }
        .steps-section {
            margin: 25px 0;
        }
        .steps-section ol {
            padding-left: 20px;
        }
        .steps-section li {
            margin: 8px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #9333ea 100%);
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 15px 0;
            font-weight: bold;
            text-align: center;
        }
        .button:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #7e22ce 100%);
            color: #ffffff !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Faculty Account Created</h1>
        </div>

        <div class="container-content">
        <div class="welcome-section">
            <p>Dear <strong>{{ $faculty->FirstName }} {{ $faculty->LastName }}</strong>,</p>
            
            <p>Welcome to our academic management system! Your faculty account has been successfully created by the registrar's office.</p>
        </div>

        <div class="credentials-box">
            <h3>🔐 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">{{ $faculty->email }}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Temporary Password:</span>
                <span class="credential-value">{{ $temporaryPassword }}</span>
            </div>
        </div>

        <div class="warning-box">
            <p><span class="warning-icon">⚠️ Important Security Notice:</span></p>
            <p><strong>You must change your password on your first login.</strong> This temporary password is only for initial access and cannot be used for regular system access until you create your own secure password.</p>
        </div>

        <div class="steps-section">
            <h3>📋 Next Steps:</h3>
            <ol>
                <li><strong>Login to the system</strong> using the credentials above</li>
                <li><strong>Change your password</strong> when prompted (required for security)</li>
                <li><strong>Complete your profile</strong> if additional information is needed</li>
                <li><strong>Explore the faculty dashboard</strong> and available features</li>
            </ol>
        </div>

        <div style="text-align: center;">
            <a href="{{ url('/login') }}" class="button">🚀 Login to Your Account</a>
        </div>

        <div class="steps-section">
            <h3>💡 Need Help?</h3>
            <p>If you encounter any issues logging in or have questions about using the system, please contact the registrar's office or your system administrator.</p>
        </div>

        <div class="footer">
            <p>This email was sent automatically by the Academic Management System.</p>
            <p><strong>Please do not reply to this email.</strong></p>
            <p>Generated on {{ now()->format('F j, Y \a\t g:i A') }}</p>
        </div>
        </div>
    </div>
</body>
</html>
