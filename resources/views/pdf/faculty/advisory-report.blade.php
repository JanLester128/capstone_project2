<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Class Advisory Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
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
        .section-title {
            margin-top: 20px;
            margin-bottom: 10px;
            padding: 8px;
            background-color: #4a5568;
            color: white;
            font-weight: bold;
            font-size: 11px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background-color: #718096;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        td {
            padding: 7px 8px;
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
            margin-top: 15px;
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
            width: 30%;
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
        <h2>CLASS ADVISORY REPORT</h2>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Class Adviser:</span> {{ $adviser_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Section:</span> {{ $section_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Strand:</span> {{ $strand ?? 'N/A' }}
        </div>
        <div class="info-row">
            <span class="info-label">Grade Level:</span> Grade {{ $grade_level ?? 'N/A' }}
        </div>
        <div class="info-row">
            <span class="info-label">School Year:</span> {{ $school_year ?? 'N/A' }} - {{ $semester ?? 'N/A' }}
        </div>
        <div class="info-row">
            <span class="info-label">Generated:</span> {{ $generated_at }}
        </div>
    </div>

    <div class="section-title">STUDENT ROSTER</div>
    @if(count($students) > 0)
        <table>
            <thead>
                <tr>
                    <th style="width: 8%;">#</th>
                    <th style="width: 25%;">LRN</th>
                    <th style="width: 50%;">Student Name</th>
                    <th style="width: 17%;">Grade Level</th>
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
        <p style="text-align: center; padding: 20px; color: #999;">No students enrolled in this section.</p>
    @endif

    <div class="section-title">SUBJECTS ASSIGNED</div>
    @if(count($subjects) > 0)
        <table>
            <thead>
                <tr>
                    <th style="width: 15%;">Subject Code</th>
                    <th style="width: 35%;">Subject Name</th>
                    <th style="width: 30%;">Faculty</th>
                    <th style="width: 20%;">Schedule</th>
                </tr>
            </thead>
            <tbody>
                @foreach($subjects as $subject)
                    <tr>
                        <td>{{ $subject['code'] ?? 'N/A' }}</td>
                        <td><strong>{{ $subject['name'] }}</strong></td>
                        <td>{{ $subject['faculty'] }}</td>
                        <td>{{ $subject['schedule'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="summary">
            <strong>Total Subjects:</strong> {{ $total_subjects }}
        </div>
    @else
        <p style="text-align: center; padding: 20px; color: #999;">No subjects assigned to this section.</p>
    @endif

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">
                <strong>{{ $adviser_name }}</strong><br>
                Class Adviser
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                Program Coordinator
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                Principal
            </div>
        </div>
    </div>

    <div class="footer">
        <p>This is an official document. Signature required for official use.</p>
        <p>Generated on {{ $generated_at }}</p>
    </div>
</body>
</html>

