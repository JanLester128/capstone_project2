<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Class Students List</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
            color: #1a1a1a;
        }
        .header h2 {
            margin: 5px 0;
            font-size: 14px;
            color: #555;
            font-weight: normal;
        }
        .info-section {
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        .info-row {
            margin: 5px 0;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th {
            background-color: #4a5568;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            font-size: 9px;
            color: #666;
            text-align: center;
        }
        .summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #e6f7ff;
            border-left: 4px solid #1890ff;
        }
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>OPOL NATIONAL SECONDARY TECHNICAL SCHOOL</h1>
        <h2>CLASS STUDENTS LIST</h2>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Faculty:</span> {{ $faculty_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Subject:</span> {{ $subject }} ({{ $subject_code }})
        </div>
        <div class="info-row">
            <span class="info-label">Section:</span> {{ $section }} - {{ $strand }}
        </div>
        <div class="info-row">
            <span class="info-label">School Year:</span> {{ $school_year ?? 'N/A' }} - {{ $semester ?? 'N/A' }}
        </div>
        <div class="info-row">
            <span class="info-label">Generated:</span> {{ $generated_at }}
        </div>
    </div>

    @if(count($students) > 0)
        <table>
            <thead>
                <tr>
                    <th style="width: 8%;">#</th>
                    <th style="width: 22%;">LRN</th>
                    <th style="width: 50%;">Student Name</th>
                    <th style="width: 20%;">Grade Level</th>
                </tr>
            </thead>
            <tbody>
                @foreach($students as $student)
                    <tr>
                        <td style="text-align: center;">{{ $student['number'] }}</td>
                        <td>{{ $student['lrn'] ?? 'N/A' }}</td>
                        <td><strong>{{ $student['name'] }}</strong></td>
                        <td style="text-align: center;">Grade {{ $student['grade_level'] ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="summary">
            <strong>Total Students:</strong> {{ $total_students }}
        </div>
    @else
        <p style="text-align: center; padding: 20px; color: #999;">No students enrolled in this class.</p>
    @endif

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">
                <strong>{{ $faculty_name }}</strong><br>
                Subject Teacher
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                Date
            </div>
        </div>
    </div>

    <div class="footer">
        <p>This is a computer-generated document. Signature required for official use.</p>
        <p>Generated on {{ $generated_at }}</p>
    </div>
</body>
</html>

