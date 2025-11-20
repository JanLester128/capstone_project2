<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Class Grades Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            color: #333;
            margin: 0;
            padding: 15px;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
        }
        .header h1 {
            margin: 0;
            font-size: 16px;
            color: #1a1a1a;
        }
        .header h2 {
            margin: 3px 0;
            font-size: 12px;
            color: #555;
            font-weight: normal;
        }
        .info-section {
            margin: 10px 0;
            padding: 8px;
            background-color: #f8f9fa;
            border-radius: 4px;
            font-size: 9px;
        }
        .info-row {
            display: inline-block;
            margin: 3px 15px 3px 0;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th {
            background-color: #4a5568;
            color: white;
            padding: 6px 4px;
            text-align: center;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        td {
            padding: 5px 4px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 8px;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .grade-cell {
            font-weight: bold;
        }
        .footer {
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #ccc;
            font-size: 8px;
            color: #666;
            text-align: center;
        }
        .summary {
            margin-top: 15px;
            padding: 8px;
            background-color: #e6f7ff;
            border-left: 4px solid #1890ff;
            font-size: 9px;
        }
        .signature-section {
            margin-top: 25px;
            font-size: 9px;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 30px;
            padding-top: 5px;
            display: inline-block;
            min-width: 200px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>OPOL NATIONAL SECONDARY TECHNICAL SCHOOL</h1>
        <h2>CLASS GRADES REPORT</h2>
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
            <span class="info-label">School Year:</span> {{ $school_year ?? 'N/A' }}
        </div>
        <div class="info-row">
            <span class="info-label">Semester:</span> {{ $semester ?? 'N/A' }}
        </div>
        <div class="info-row">
            <span class="info-label">Generated:</span> {{ $generated_at }}
        </div>
    </div>

    @if(count($students) > 0)
        <table>
            <thead>
                <tr>
                    <th style="width: 4%;">#</th>
                    <th style="width: 15%;">LRN</th>
                    <th style="width: 28%;">Student Name</th>
                    <th style="width: 8%;">1st Q</th>
                    <th style="width: 8%;">2nd Q</th>
                    <th style="width: 8%;">3rd Q</th>
                    <th style="width: 8%;">4th Q</th>
                    <th style="width: 10%;">Final</th>
                    <th style="width: 11%;">Remarks</th>
                </tr>
            </thead>
            <tbody>
                @foreach($students as $student)
                    <tr>
                        <td class="text-center">{{ $student['number'] }}</td>
                        <td>{{ $student['lrn'] ?? 'N/A' }}</td>
                        <td><strong>{{ $student['name'] }}</strong></td>
                        <td class="text-center grade-cell">{{ $student['first_quarter'] }}</td>
                        <td class="text-center grade-cell">{{ $student['second_quarter'] }}</td>
                        <td class="text-center grade-cell">{{ $student['third_quarter'] }}</td>
                        <td class="text-center grade-cell">{{ $student['fourth_quarter'] }}</td>
                        <td class="text-center grade-cell">{{ $student['semester_grade'] }}</td>
                        <td class="text-center">{{ $student['remarks'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="summary">
            <strong>Total Students:</strong> {{ $total_students }} | 
            <strong>Report Status:</strong> Official Grades (Approved Only)
        </div>
    @else
        <p style="text-align: center; padding: 20px; color: #999;">No students enrolled in this class.</p>
    @endif

    <div class="signature-section">
        <p><strong>Prepared by:</strong></p>
        <div class="signature-line">
            <strong>{{ $faculty_name }}</strong><br>
            Subject Teacher
        </div>
    </div>

    <div class="footer">
        <p>This is an official document. Contains approved grades only.</p>
        <p>Generated on {{ $generated_at }}</p>
    </div>
</body>
</html>

