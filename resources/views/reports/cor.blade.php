<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Certificate of Registration</title>
    <style>
        :root {
            --primary: #1b5e20;
            --accent: #e8f5e9;
            --border: #2e7d32;
            --text: #1f2933;
            --muted: #6c757d;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: var(--body-padding, 32px);
            font-family: "Segoe UI", Arial, sans-serif;
            background: var(--body-bg, #f3f4f6);
            color: var(--text);
        }

        .cor-wrapper {
            max-width: var(--cor-max-width, 900px);
            margin: 0 auto;
            background: #fff;
            border: var(--cor-border, 1px solid var(--border));
            box-shadow: var(--cor-shadow, 0 15px 35px rgba(0, 0, 0, 0.08));
            position: relative;
            overflow: hidden;
        }

        .cor-header {
            padding: var(--cor-header-padding, 32px 40px 28px);
            border-bottom: 4px solid var(--border);
        }

        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            background: #f3f4f6;
            color: #1f2933;
            text-transform: uppercase;
            letter-spacing: .08em;
        }

        .status-pill span {
            width: 6px;
            height: 6px;
            border-radius: 9999px;
            background: currentColor;
        }

        .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            opacity: 0.08;
            font-size: 96px;
            font-weight: 900;
            text-transform: uppercase;
            color: #1f2933;
            transform: rotate(-20deg);
            letter-spacing: .2em;
        }

        .header-grid {
            display: grid;
            grid-template-columns: 100px 1fr 100px;
            align-items: center;
            gap: 16px;
        }

        .header-center {
            text-align: center;
        }

        .header-center h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 1px;
        }

        .header-center h2 {
            margin: 4px 0 12px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--muted);
        }

        .header-center p {
            margin: 4px 0;
            font-size: 12px;
        }

        .crest {
            width: 95px;
            height: 95px;
            object-fit: contain;
        }

        .cor-body {
            padding: var(--cor-body-padding, 32px 40px 40px);
        }

        .info-block {
            border: 1px solid #d1d5db;
            padding: var(--info-block-padding, 18px 20px);
            margin-bottom: var(--info-block-margin, 24px);
            background: #f9fafb;
        }

        .info-heading {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 10px;
        }

        .program-title {
            font-size: 18px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 12px;
        }

        .program-subtitle {
            font-size: 14px;
            text-align: center;
            margin-bottom: 8px;
        }

        .program-meta {
            display: flex;
            justify-content: center;
            gap: 40px;
            font-size: 13px;
            color: var(--muted);
            margin-bottom: 16px;
        }

        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px 28px;
            font-size: 13px;
        }

        .details-grid span {
            display: block;
            font-weight: 600;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 11px;
        }

        .details-grid .field {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .field-select,
        .field-input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 13px;
            background: #fff;
        }

        .field-helper {
            margin: 2px 0 0;
            font-size: 12px;
            color: #6b7280;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .print-button {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            background: #2563eb;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .print-button:hover {
            background: #1d4ed8;
        }

        .print-button.full-width {
            width: 100%;
        }

        th, td {
            border: 1px solid #c8e6c9;
            padding: 10px 12px;
            font-size: 13px;
            vertical-align: middle;
            text-align: left;
        }

        #schedule td {
            vertical-align: top;
        }

        th {
            background: var(--accent);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 12px;
            color: var(--primary);
        }

        .schedule-cell {
            min-height: 70px;
        }

        .schedule-entry {
            margin-bottom: 6px;
            padding: 4px 6px;
            border-radius: 4px;
            background: #ffffff;
            line-height: 1.35;
            word-break: break-word;
            hyphens: auto;
        }

        .schedule-entry:last-child {
            margin-bottom: 0;
        }

        .schedule-entry strong {
            display: block;
            font-size: 12px;
        }

        .schedule-entry small {
            display: block;
            color: #4b5563;
            font-size: 11px;
        }

        .event-row td {
            background: var(--accent);
            font-weight: 600;
            color: var(--primary);
        }

        tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        tbody tr:nth-child(odd) {
            background: #ffffff;
        }

        .event-row {
            background: var(--accent) !important;
        }

        .meta-footer {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--muted);
        }

        .signature-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 2px solid var(--border);
        }

        .signature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
            margin-top: 20px;
        }

        .signature-box {
            text-align: center;
        }

        .signature-line {
            width: 100%;
            height: 1px;
            background: #1f2933;
            margin: 60px 0 8px;
            position: relative;
        }

        .signature-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 4px;
        }

        .signature-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--text);
            margin-top: 4px;
            min-height: 18px;
        }

        @media print {
            body {
                background: #fff;
                padding: 0;
            }

            .cor-wrapper {
                box-shadow: none;
                border: none;
            }

            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
@php
    $student = $cor['student'] ?? [];
    $schedule = $cor['schedule'] ?? [];
    $schoolYear = $cor['school_year'] ?? '';
    $semester = $cor['semester'] ?? '';
    $dateEnrolled = $cor['date_enrolled'] ?? null;
    $status = $cor['status'] ?? [];
    $statusLabel = $status['label'] ?? 'For Reference';
    $watermark = $status['watermark'] ?? 'FOR REFERENCE';
    $selectedStrandId = old('assigned_strand_id', $selectedStrandId ?? null);
    $selectedSectionId = old('assigned_section_id', $selectedSectionId ?? null);
    $printButtonFullWidth = !($showEnrollmentForm ?? false);
    $strandCodeMap = ($strands ?? collect())->pluck('Strand_code', 'id')->toArray();
    $corClientConfig = [
        'strandNames' => $strandCodeMap,
        'selectedSectionId' => $selectedSectionId ? (int) $selectedSectionId : null,
        'enrollmentId' => $enrollmentModel->id ?? null,
    ];
@endphp
<body @if(isset($isIframe) && $isIframe)
    style="--body-padding:16px;--body-bg:#fff;"
@endif>
    <div class="cor-wrapper" @if(isset($isIframe) && $isIframe)
        style="--cor-max-width:100%;--cor-border:none;--cor-shadow:none;--cor-header-padding:20px 24px 16px;--cor-body-padding:20px 24px 24px;--info-block-padding:14px 16px;--info-block-margin:16px;"
    @endif data-cor-config='@json($corClientConfig)'>
        <div class="cor-header">
            <div class="header-grid">
                <img src="{{ $logoPath }}" alt="School Logo" class="crest">

                <div class="header-center">
                    <h2>{{ strtoupper($schoolAddress ?? '') }}</h2>
                    <h1>{{ strtoupper($schoolName ?? 'OPOL NATIONAL SECONDARY TECHNICAL SCHOOL') }}</h1>
                    <p class="program-title">CLASS PROGRAM / CERTIFICATE OF REGISTRATION</p>
                    <div class="program-meta">
                        <span>School Year: <strong>{{ $schoolYear ?: '____________' }}</strong></span>
                        <span>Semester: <strong>{{ $semester ?: '____________' }}</strong></span>
                    </div>
                    <div style="margin-top: 12px;">
                        <span class="status-pill">
                            <span></span>
                            {{ $statusLabel }}
                        </span>
                    </div>
                </div>

                <div></div>
            </div>
        </div>

        <div class="cor-body">
            <div class="info-block">
                <div class="program-title">
                    @if($showEnrollmentForm ?? false)
                        GRADE
                        <select
                            id="headerGradeLevelSelect"
                            name="grade_level"
                            form="assignment-form"
                            style="display:inline-block;border:1px solid #d1d5db;border-radius:4px;padding:4px 8px;font-size:16px;font-weight:600;margin:0 4px;vertical-align:middle;"
                            required
                        >
                            <option value="" disabled {{ $selectedGradeLevel ? '' : 'selected' }}>___</option>
                            <option value="11" {{ $selectedGradeLevel == '11' ? 'selected' : '' }}>11</option>
                            <option value="12" {{ $selectedGradeLevel == '12' ? 'selected' : '' }}>12</option>
                        </select>
                        &mdash;
                        <span id="headerSectionDisplay" style="display:inline-block;min-width:120px;">{{ $student['section'] ?? '________' }}</span>
                        &mdash;
                        <span id="headerStrandDisplay" style="display:inline-block;min-width:120px;">{{ $student['strand_code'] ?? $student['strand'] ?? '________' }}</span>
                    @else
                        GRADE {{ $student['grade_level'] ?? '___' }} &mdash;
                        {{ $student['section'] ?? '________' }}
                        &mdash;
                        {{ $student['strand_code'] ?? $student['strand'] ?? '________' }}
                    @endif
                </div>
                <div class="program-subtitle">
                    Class Adviser: <strong id="adviserDisplay">{{ $student['adviser'] ?? '_____________________' }}</strong>
                </div>
            </div>

            <div class="info-block">
                <div class="info-heading">Student Information</div>
                <div class="details-grid" style="display:flex;flex-wrap:wrap;gap:18px 28px;">
                    <div class="field" style="flex:1 1 260px;">
                        <span>Name</span>
                        {{ $student['name'] ?? '________________________' }}
                    </div>
                    <div class="field" style="flex:1 1 160px;">
                        <span>Date Enrolled</span>
                        {{ $dateEnrolled ?? 'Pending' }}
                    </div>
                    <div class="field" style="flex:1 1 180px;">
                        <span>LRN</span>
                        {{ $student['lrn'] ?? '____________' }}
                    </div>
                    <div class="field" style="flex:1 1 160px;">
                        <span>Year Level</span>
                        @if($showEnrollmentForm ?? false)
                            <select
                                id="gradeLevelSelect"
                                name="grade_level"
                                form="assignment-form"
                                class="field-select"
                                required
                            >
                                <option value="" disabled {{ $selectedGradeLevel ? '' : 'selected' }}>Select year level...</option>
                                <option value="11" {{ $selectedGradeLevel == '11' ? 'selected' : '' }}>Grade 11</option>
                                <option value="12" {{ $selectedGradeLevel == '12' ? 'selected' : '' }}>Grade 12</option>
                            </select>
                        @else
                            {{ $student['grade_level'] ? 'Grade ' . $student['grade_level'] : '____________' }}
                        @endif
                    </div>
                    <div class="field" style="flex:1 1 220px;">
                        <span>Strand</span>
                        @if($showEnrollmentForm ?? false)
                            <select
                                id="strandSelect"
                                name="assigned_strand_id"
                                form="assignment-form"
                                class="field-select"
                                required
                            >
                                <option value="" disabled {{ $selectedStrandId ? '' : 'selected' }}>Select a strand...</option>
                                @foreach($strands as $strand)
                                    <option value="{{ $strand->id }}" {{ (int)$selectedStrandId === (int)$strand->id ? 'selected' : '' }}>
                                        {{ $strand->Strand_name }} ({{ $strand->Strand_code }})
                                    </option>
                                @endforeach
                            </select>
                        @else
                            {{ $student['strand_code'] ? ($student['strand_code'] . ' - ') : '' }}{{ $student['strand'] ?? '____________' }}
                        @endif
                    </div>
                    @if($showEnrollmentForm ?? false)
                        <div class="field">
                            <span>Curriculum</span>
                            <select
                                id="curriculumSelect"
                                name="curriculum_id"
                                form="assignment-form"
                                class="field-select"
                                required
                            >
                                <option value="" disabled {{ $selectedCurriculumId ? '' : 'selected' }}>Select a curriculum...</option>
                                @foreach($curriculums as $curriculum)
                                    <option value="{{ $curriculum->id }}" data-strand="{{ $curriculum->strand_id }}" {{ (int)$selectedCurriculumId === (int)$curriculum->id ? 'selected' : '' }}>
                                        {{ $curriculum->name }} ({{ $curriculum->curriculum_code }})
                                    </option>
                                @endforeach
                            </select>
                            <p id="curriculumHelper" class="field-helper">Curriculums filtered by the selected strand.</p>
                        </div>
                    @endif
                    <div class="field">
                        <span>Section</span>
                        @if($showEnrollmentForm ?? false)
                            <select
                                id="sectionSelect"
                                name="assigned_section_id"
                                form="assignment-form"
                                class="field-select"
                                required
                            >
                                <option value="" disabled {{ $selectedSectionId ? '' : 'selected' }}>Select a section...</option>
                                @foreach($sections as $section)
                                    <option
                                        value="{{ $section->id }}"
                                        data-strand="{{ $section->strand_id }}"
                                        data-adviser="{{ $section->adviser ? trim(($section->adviser->FirstName ?? '') . ' ' . ($section->adviser->MiddleName ?? '') . ' ' . ($section->adviser->LastName ?? '')) : '' }}"
                                        {{ (int)$selectedSectionId === (int)$section->id ? 'selected' : '' }}
                                    >
                                        {{ $section->section_name }}
                                    </option>
                                @endforeach
                            </select>
                            <p id="sectionHelper" class="field-helper">Select a strand to filter available sections.</p>
                        @else
                            {{ $student['section'] ?? '____________' }}
                        @endif
                    </div>
                </div>
            </div>

            <table id="schedule">
                <thead>
                    <tr>
                        <th style="width: 15%;">Time</th>
                        <th style="width: 17%;">Monday</th>
                        <th style="width: 17%;">Tuesday</th>
                        <th style="width: 17%;">Wednesday</th>
                        <th style="width: 17%;">Thursday</th>
                        <th style="width: 17%;">Friday</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($schedule as $row)
                        @if($row['is_static'] ?? false)
                            {{-- Static event row (Flag Ceremony, Lunch Break, Flag Lowering) --}}
                            <tr class="event-row">
                                <td>{{ $row['time'] ?? '' }}</td>
                                <td colspan="5" style="text-align: center; font-weight: 600;">
                                    {{ $row['subject'] ?? '' }}
                                </td>
                            </tr>
                        @else
                            {{-- Class row with classes organized by day --}}
                            <tr>
                                <td>{{ $row['time'] ?? '' }}</td>
                                <td class="schedule-cell">
                                    @if(isset($row['monday']) && count($row['monday']) > 0)
                                        @foreach($row['monday'] as $class)
                                            <div class="schedule-entry">
                                                <strong>{{ $class['subject'] ?? '' }}</strong>
                                                <small>{{ $class['faculty'] ?? '' }}</small>
                                                <small>{{ $class['section'] ?? '' }}</small>
                                            </div>
                                        @endforeach
                                    @endif
                                </td>
                                <td class="schedule-cell">
                                    @if(isset($row['tuesday']) && count($row['tuesday']) > 0)
                                        @foreach($row['tuesday'] as $class)
                                            <div class="schedule-entry">
                                                <strong>{{ $class['subject'] ?? '' }}</strong>
                                                <small>{{ $class['faculty'] ?? '' }}</small>
                                                <small>{{ $class['section'] ?? '' }}</small>
                                            </div>
                                        @endforeach
                                    @endif
                                </td>
                                <td class="schedule-cell">
                                    @if(isset($row['wednesday']) && count($row['wednesday']) > 0)
                                        @foreach($row['wednesday'] as $class)
                                            <div class="schedule-entry">
                                                <strong>{{ $class['subject'] ?? '' }}</strong>
                                                <small>{{ $class['faculty'] ?? '' }}</small>
                                                <small>{{ $class['section'] ?? '' }}</small>
                                            </div>
                                        @endforeach
                                    @endif
                                </td>
                                <td class="schedule-cell">
                                    @if(isset($row['thursday']) && count($row['thursday']) > 0)
                                        @foreach($row['thursday'] as $class)
                                            <div class="schedule-entry">
                                                <strong>{{ $class['subject'] ?? '' }}</strong>
                                                <small>{{ $class['faculty'] ?? '' }}</small>
                                                <small>{{ $class['section'] ?? '' }}</small>
                                            </div>
                                        @endforeach
                                    @endif
                                </td>
                                <td class="schedule-cell">
                                    @if(isset($row['friday']) && count($row['friday']) > 0)
                                        @foreach($row['friday'] as $class)
                                            <div class="schedule-entry">
                                                <strong>{{ $class['subject'] ?? '' }}</strong>
                                                <small>{{ $class['faculty'] ?? '' }}</small>
                                                <small>{{ $class['section'] ?? '' }}</small>
                                            </div>
                                        @endforeach
                                    @endif
                                </td>
                            </tr>
                        @endif
                    @empty
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 24px;">
                                No classes have been assigned yet for this enrollment.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            <div class="signature-section">
                <div class="signature-grid">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Principal</div>
                        <div class="signature-name">{{ $principalName ?? '_____________________' }}</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Senior High Coordinator</div>
                        <div class="signature-name">{{ $coordinatorName ?? '_____________________' }}</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Registrar</div>
                        <div class="signature-name">{{ $registrarName ?? '_____________________' }}</div>
                    </div>
                </div>
            </div>

            <div class="meta-footer">
                <span>Generated by {{ $generatedBy ?: '__________' }}</span>
                <span>Generated: {{ \Carbon\Carbon::now()->format('F d, Y h:i A') }}</span>
            </div>
        </div>
        <div class="watermark">{{ $watermark }}</div>
    </div>
    <div class="no-print" style="max-width:900px;margin:18px auto 0;display:flex;justify-content:space-between;gap:12px;">
        @if($showEnrollmentForm ?? false)
            <form method="POST" action="{{ auth()->user()->Role === 'Registrar' ? route('registrar.enrollments.assign', $enrollmentModel->id) : route('faculty.enrollments.assign', $enrollmentModel->id) }}" id="assignment-form" style="flex:1;">
                @csrf
                <button type="submit" style="width:100%;background:#0d9488;color:#fff;border:none;border-radius:6px;padding:12px 16px;font-size:14px;font-weight:600;cursor:pointer;">
                    Enroll Student
                </button>
            </form>
        @endif
        <button onclick="window.print()" class="no-print print-button {{ $printButtonFullWidth ? 'full-width' : '' }}">
            Print / Save as PDF
        </button>
    </div>
    @if($canAssign ?? false)
        @if (session('success'))
            <div class="no-print" style="max-width:900px;margin:12px auto 0;padding:10px 12px;border-radius:6px;background:#ecfdf5;border:1px solid #10b981;color:#065f46;font-size:13px;">
                {{ session('success') }}
            </div>
        @endif
        @if (session('error'))
            <div class="no-print" style="max-width:900px;margin:12px auto 0;padding:10px 12px;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:13px;">
                {{ session('error') }}
            </div>
        @endif
    @endif
    @if($showEnrollmentForm ?? false)
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const strandSelect = document.getElementById('strandSelect');
                const sectionSelect = document.getElementById('sectionSelect');
                const curriculumSelect = document.getElementById('curriculumSelect');
                const gradeLevelSelect = document.getElementById('gradeLevelSelect');
                const headerGradeLevelSelect = document.getElementById('headerGradeLevelSelect');
                const helper = document.getElementById('sectionHelper');
                const curriculumHelper = document.getElementById('curriculumHelper');
                const headerSectionDisplay = document.getElementById('headerSectionDisplay');
                const headerStrandDisplay = document.getElementById('headerStrandDisplay');
                const adviserDisplay = document.getElementById('adviserDisplay');

                if (!strandSelect || !sectionSelect) {
                    return;
                }

                const corWrapper = document.querySelector('.cor-wrapper');
                const config = corWrapper ? JSON.parse(corWrapper.getAttribute('data-cor-config') || '{}') : {};

                const allSectionOptions = Array.from(sectionSelect.options);
                const allCurriculumOptions = curriculumSelect ? Array.from(curriculumSelect.options) : [];

                if (gradeLevelSelect && headerGradeLevelSelect) {
                    const syncGradeLevel = (target, source) => {
                        target.value = source.value;
                    };

                    gradeLevelSelect.addEventListener('change', () => syncGradeLevel(headerGradeLevelSelect, gradeLevelSelect));
                    headerGradeLevelSelect.addEventListener('change', () => syncGradeLevel(gradeLevelSelect, headerGradeLevelSelect));

                    if (gradeLevelSelect.value) {
                        headerGradeLevelSelect.value = gradeLevelSelect.value;
                    }
                }

                const updateHeaderStrand = () => {
                    if (!headerStrandDisplay) {
                        return;
                    }
                    const strandValue = strandSelect.value;
                    headerStrandDisplay.textContent = strandValue ? (config.strandNames[strandValue] || '________') : '________';
                };

                const setHeaderSectionFromCurrent = () => {
                    if (!headerSectionDisplay) {
                        return;
                    }
                    const currentSection = sectionSelect.options[sectionSelect.selectedIndex];
                    headerSectionDisplay.textContent = currentSection && currentSection.value ? currentSection.textContent : '________';
                };

                const filterCurriculums = () => {
                    if (!curriculumSelect) return;
                    const selectedStrand = strandSelect.value;
                    curriculumSelect.innerHTML = '';

                    const placeholder = document.createElement('option');
                    placeholder.value = '';
                    placeholder.disabled = true;
                    placeholder.textContent = 'Select a curriculum...';
                    placeholder.selected = !curriculumSelect.dataset.selected;
                    curriculumSelect.appendChild(placeholder);

                    let hasVisible = false;

                    allCurriculumOptions.forEach((option) => {
                        if (!option.value) {
                            return;
                        }
                        const strandMatch = !option.dataset.strand || option.dataset.strand === selectedStrand;
                        if (strandMatch) {
                            const newOption = option.cloneNode(true);
                            if (curriculumSelect.dataset.selected && curriculumSelect.dataset.selected === option.value) {
                                newOption.selected = true;
                                placeholder.selected = false;
                            }
                            curriculumSelect.appendChild(newOption);
                            hasVisible = true;
                        }
                    });

                    curriculumSelect.disabled = !hasVisible;
                    if (curriculumHelper) {
                        curriculumHelper.textContent = hasVisible
                            ? 'Pick the curriculum aligned with the selected strand.'
                            : 'No curriculums available for the selected strand.';
                    }
                };

                const filterSections = () => {
                    const selectedStrand = strandSelect.value;
                    sectionSelect.innerHTML = '';

                    const placeholder = document.createElement('option');
                    placeholder.value = '';
                    placeholder.disabled = true;
                    placeholder.textContent = 'Select a section...';
                    placeholder.selected = !sectionSelect.dataset.selected;
                    sectionSelect.appendChild(placeholder);

                    let hasVisible = false;

                    allSectionOptions.forEach((option) => {
                        if (!option.value) {
                            return;
                        }
                        if (option.dataset.strand === selectedStrand) {
                            const newOption = option.cloneNode(true);
                            if (sectionSelect.dataset.selected && sectionSelect.dataset.selected === option.value) {
                                newOption.selected = true;
                                placeholder.selected = false;
                                if (adviserDisplay) {
                                    adviserDisplay.textContent = newOption.dataset.adviser || '_____________________';
                                }
                            }
                            sectionSelect.appendChild(newOption);
                            hasVisible = true;
                        }
                    });

                    sectionSelect.disabled = !hasVisible;
                    if (helper) {
                        helper.textContent = hasVisible
                            ? 'Pick the specific section for the chosen strand.'
                            : 'No active sections available for the selected strand.';
                    }

                    updateHeaderStrand();
                };

                sectionSelect.addEventListener('change', () => {
                    const selectedOption = sectionSelect.options[sectionSelect.selectedIndex];
                    if (selectedOption && selectedOption.value) {
                        setHeaderSectionFromCurrent();
                        if (adviserDisplay) {
                            adviserDisplay.textContent = selectedOption.dataset.adviser || '_____________________';
                        }

                        if (window.parent && window.parent !== window) {
                            const postPayload = {
                                type: 'refreshCorIframe',
                                sectionId: selectedOption.value,
                                enrollmentId: config.enrollmentId,
                            };
                            try {
                                window.parent.postMessage(postPayload, '*');
                                return;
                            } catch (err) {
                                /* fall through to iframe reload */
                            }

                            try {
                                const iframe = window.frameElement;
                                if (iframe && iframe.src) {
                                    const url = new URL(iframe.src);
                                    url.searchParams.set('section_id', selectedOption.value);
                                    url.searchParams.set('refresh', Date.now().toString());
                                    iframe.src = url.toString();
                                    return;
                                }
                            } catch (err2) {
                                console.warn('Unable to reload COR iframe', err2);
                            }
                        }

                        const url = new URL(window.location.href);
                        url.searchParams.set('section_id', selectedOption.value);
                        url.searchParams.set('refresh', Date.now().toString());
                        window.location.href = url.toString();
                    } else {
                        setHeaderSectionFromCurrent();
                        if (adviserDisplay) {
                            adviserDisplay.textContent = '_____________________';
                        }
                    }
                });

                if (adviserDisplay) {
                    const initialSection = sectionSelect.options[sectionSelect.selectedIndex];
                    if (initialSection && initialSection.value && initialSection.dataset.adviser) {
                        adviserDisplay.textContent = initialSection.dataset.adviser;
                    }
                }

                sectionSelect.dataset.selected = config.selectedSectionId ? String(config.selectedSectionId) : '';

                strandSelect.addEventListener('change', () => {
                    if (curriculumSelect) {
                        curriculumSelect.dataset.selected = curriculumSelect.value;
                    }
                    sectionSelect.dataset.selected = sectionSelect.value;
                    filterSections();
                    filterCurriculums();
                    setHeaderSectionFromCurrent();
                    updateHeaderStrand();
                });

                setHeaderSectionFromCurrent();
                updateHeaderStrand();

                if (strandSelect.value) {
                    filterSections();
                } else {
                    sectionSelect.disabled = true;
                    if (helper) {
                        helper.textContent = 'Select a strand to filter the available sections.';
                    }
                }
            });
        </script>
    @endif
</body>
</html>

