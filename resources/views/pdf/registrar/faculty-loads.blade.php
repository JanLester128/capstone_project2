<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Faculty Loads Report</title>
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
            border-bottom: 3px solid #000825;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            color: #000825;
            font-weight: bold;
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
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 15px 0;
        }
        .summary-card {
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 4px;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 5px 0;
            font-size: 11px;
            color: #666;
        }
        .summary-card p {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #000825;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th {
            background-color: #000825;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9px;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .status-overloaded {
            background-color: #fee2e2;
            color: #991b1b;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
        }
        .status-underloaded {
            background-color: #fef3c7;
            color: #92400e;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
        }
        .status-optimal {
            background-color: #d1fae5;
            color: #065f46;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            font-size: 9px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>WESMG SYSTEM</h1>
        <h2>FACULTY LOADS REPORT</h2>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">School Year:</span> {{ $school_year }}
        </div>
        <div class="info-row">
            <span class="info-label">Semester:</span> {{ $semester }}
        </div>
        <div class="info-row">
            <span class="info-label">Generated:</span> {{ $generated_at }}
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>Total Faculty</h3>
            <p>{{ $facultyLoads['summary']['total_faculty'] ?? 0 }}</p>
        </div>
        <div class="summary-card">
            <h3>With Loads</h3>
            <p>{{ $facultyLoads['summary']['faculty_with_loads'] ?? 0 }}</p>
        </div>
        <div class="summary-card">
            <h3>Overloaded (&gt;5)</h3>
            <p>{{ $facultyLoads['summary']['overloaded_faculty'] ?? 0 }}</p>
        </div>
        <div class="summary-card">
            <h3>Underloaded (&lt;20hrs)</h3>
            <p>{{ $facultyLoads['summary']['underloaded_faculty'] ?? 0 }}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Faculty Name</th>
                <th>Email</th>
                <th>Loads</th>
                <th>Weekly Hours</th>
                <th>Sections</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($facultyLoads['faculty'] ?? [] as $faculty)
            <tr>
                <td>{{ $faculty['faculty_name'] }}</td>
                <td>{{ $faculty['faculty_email'] }}</td>
                <td>{{ $faculty['total_loads'] }} / 5</td>
                <td>{{ $faculty['total_weekly_hours'] }} hrs</td>
                <td>
                    @foreach($faculty['sections'] as $section)
                        {{ $section['section_name'] }} ({{ $section['weekly_hours'] }}hrs){{ !$loop->last ? ', ' : '' }}
                    @endforeach
                </td>
                <td>
                    @if($faculty['status'] === 'overloaded')
                        <span class="status-overloaded">Overloaded</span>
                    @elseif($faculty['status'] === 'underloaded')
                        <span class="status-underloaded">Underloaded</span>
                    @elseif($faculty['status'] === 'optimal')
                        <span class="status-optimal">Optimal</span>
                    @else
                        <span>Normal</span>
                    @endif
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">No faculty loads data available</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <p>Average Loads: {{ $facultyLoads['summary']['average_loads'] ?? 0 }} | Average Weekly Hours: {{ $facultyLoads['summary']['average_weekly_hours'] ?? 0 }} hrs</p>
        <p>Generated by WESMG System on {{ $generated_at }}</p>
    </div>
</body>
</html>

