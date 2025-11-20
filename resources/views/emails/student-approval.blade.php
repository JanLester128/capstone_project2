<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Approved</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: white;
            padding: 0;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .email-content {
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
            font-size: 28px;
        }
        .content {
            margin-bottom: 30px;
        }
        .highlight {
            background-color: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
        }
        .login-info {
            background-color: #f0fdf4;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #22c55e;
            margin: 20px 0;
        }
        .login-info h3 {
            color: #15803d;
            margin-top: 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #dc2626 0%, #9333ea 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #7e22ce 100%);
            color: #ffffff !important;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 Account Approved!</h1>
        </div>
        
        <div class="email-content">
        <div class="content">
            <p>Dear <strong>{{ $studentName }}</strong>,</p>
            
            <div class="highlight">
                <p><strong>Great news!</strong> Your student account has been approved by the Registrar and you can now access the system.</p>
            </div>
            
            <p>You can now login to your student portal using either your email address or your LRN (Learner Reference Number).</p>
            
            <div class="login-info">
                <h3>Login Information:</h3>
                <p><strong>Email:</strong> {{ $email }}</p>
                <p><strong>LRN:</strong> Your 12-digit LRN that you provided during registration</p>
                <p><strong>Password:</strong> The password you created during registration</p>
            </div>
            
            <p>Once you login, you'll be able to:</p>
            <ul>
                <li>Complete your enrollment form with personal details</li>
                <li>View your class schedule</li>
                <li>Access your grades</li>
                <li>Update your profile information</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="{{ url('/login') }}" class="button">Login Now</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact the Registrar's office.</p>
            
            <p>Welcome to our school system!</p>
            
            <p>Best regards,<br>
            <strong>The Registrar's Office</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
        </div>
    </div>
</body>
</html>
