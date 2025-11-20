<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Faculty Schedule</title>
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
    </style>
</head>
<body>
    <div class="header">
        <h1>OPOL NATIONAL SECONDARY TECHNICAL SCHOOL</h1>
        <h2>FACULTY CLASS SCHEDULE</h2>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Faculty Name:</span> {{ $faculty_name }}
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

    @if(count($classes) > 0)
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 25%;">Subject</th>
                    <th style="width: 15%;">Section</th>
                    <th style="width: 15%;">Strand</th>
                    <th style="width: 12%;">Day</th>
                    <th style="width: 15%;">Time</th>
                    <th style="width: 13%;">Semester</th>
                </tr>
            </thead>
            <tbody>
                @foreach($classes as $index => $class)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>
                            <strong>{{ $class['subject'] }}</strong>
                            @if($class['subject_code'])
                                <br><small style="color: #666;">{{ $class['subject_code'] }}</small>
                            @endif
                        </td>
                        <td>{{ $class['section'] ?? '—' }}</td>
                        <td>{{ $class['strand'] ?? '—' }}</td>
                        <td>{{ $class['day_of_week'] ?? '—' }}</td>
                        <td>{{ $class['start_time'] }} - {{ $class['end_time'] }}</td>
                        <td>{{ $class['semester'] ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="summary">
            <strong>Total Classes:</strong> {{ count($classes) }}
        </div>
    @else
        <p style="text-align: center; padding: 20px; color: #999;">No classes assigned for this term.</p>
    @endif

    <div class="footer">
        <p>This is a computer-generated document. No signature required.</p>
        <p>Generated on {{ $generated_at }}</p>
    </div>
</body>
</html>

