import { useState, useMemo } from 'react'
import { Head, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Reports({
  analytics = {},
  enrollmentStats = {},
  enrollmentByStrand = [],
  enrollmentByGrade = [],
  academicStats = {},
  gradeStats = {},
  facultyLoads = { faculty: [], summary: {} },
  schoolYears = [],
  semesters = [],
  strandOptions = [],
  activeSchoolYear = null,
  activeSemester = null,
  filters = {},
}) {
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(filters.school_year_id || activeSchoolYear?.id || '')
  const [selectedSemester, setSelectedSemester] = useState(filters.semester_id || activeSemester?.id || '')
  const [selectedStrand, setSelectedStrand] = useState(filters.strand_id || '')

  // Filter semesters based on selected school year
  const filteredSemesters = useMemo(() => {
    if (!selectedSchoolYear) return semesters
    return semesters.filter(s => s.school_year_id === parseInt(selectedSchoolYear))
  }, [selectedSchoolYear, semesters])

  const selectedStrandLabel = useMemo(() => {
    if (!selectedStrand) return 'All Strands'
    const strandId = parseInt(selectedStrand)
    return strandOptions.find(strand => strand.id === strandId)?.name || 'All Strands'
  }, [selectedStrand, strandOptions])

  const handleFilterChange = () => {
    const params = {}
    if (selectedSchoolYear) params.school_year_id = selectedSchoolYear
    if (selectedSemester) params.semester_id = selectedSemester
    if (selectedStrand) params.strand_id = selectedStrand
    
    router.get('/registrar/reports', params, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  // Gender Distribution Chart Data
  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [analytics.gender_distribution?.male || 0, analytics.gender_distribution?.female || 0],
        backgroundColor: ['#3B82F6', '#EC4899'],
        borderColor: ['#2563EB', '#DB2777'],
        borderWidth: 2,
      },
    ],
  }

  // Strand Enrollment Chart Data
  const strandChartData = {
    labels: enrollmentByStrand.map(item => item.strand) || [],
    datasets: [
      {
        label: 'Students Enrolled',
        data: enrollmentByStrand.map(item => item.count) || [],
        backgroundColor: [
          '#8B5CF6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#06B6D4',
          '#84CC16',
          '#F97316',
          '#6366F1',
        ],
        borderColor: [
          '#7C3AED',
          '#059669',
          '#D97706',
          '#DC2626',
          '#0891B2',
          '#65A30D',
          '#EA580C',
          '#4F46E5',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Grade Level Distribution Chart Data
  const gradeChartData = {
    labels: enrollmentByGrade.map(item => item.grade) || [],
    datasets: [
      {
        label: 'Students',
        data: enrollmentByGrade.map(item => item.count) || [],
        backgroundColor: '#6366F1',
        borderColor: '#4F46E5',
        borderWidth: 2,
      },
    ],
  }

  // Enrollment Status Chart Data
  const enrollmentStatusData = {
    labels: ['Enrolled', 'Pre-Enrolled', 'Recommended', 'Rejected'],
    datasets: [
      {
        data: [
          enrollmentStats.enrolled || 0,
          enrollmentStats.pre_enrolled || 0,
          enrollmentStats.recommended || 0,
          enrollmentStats.rejected || 0,
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
        borderColor: ['#059669', '#2563EB', '#D97706', '#DC2626'],
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col">
        <Head title="Registrar • Reports & Analytics" />

        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive insights and statistics with PDF export</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/registrar/reports/analytics/pdf?school_year_id=${selectedSchoolYear || ''}&semester_id=${selectedSemester || ''}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export All Reports (PDF)
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="school-year" className="block text-sm font-medium text-gray-700 mb-2">
                  School Year
                </label>
                <select
                  id="school-year"
                  value={selectedSchoolYear}
                  onChange={(e) => {
                    setSelectedSchoolYear(e.target.value)
                    setSelectedSemester('') // Reset semester when school year changes
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All School Years</option>
                  {schoolYears.map((sy) => (
                    <option key={sy.id} value={sy.id}>
                      {sy.formatted}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  id="semester"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  disabled={!selectedSchoolYear}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Semesters</option>
                  {filteredSemesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.semester_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="strand" className="block text-sm font-medium text-gray-700 mb-2">
                  Strand
                </label>
                <select
                  id="strand"
                  value={selectedStrand}
                  onChange={(e) => setSelectedStrand(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All Strands</option>
                  {strandOptions.map(strand => (
                    <option key={strand.id} value={strand.id}>
                      {strand.code ? `${strand.code} — ${strand.name}` : strand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFilterChange}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {analytics.total_students || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Faculty</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {academicStats.faculty || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-2.91 0-5.63-.392-8.36-1.245M21 13.255v-2.51A23.93 23.93 0 0012 8c-2.91 0-5.63.392-8.36 1.245m0 0A23.998 23.998 0 003 12c0 2.22.892 4.207 2.34 5.709M3 13.255A23.93 23.93 0 0112 15c2.91 0 5.63-.392 8.36-1.245M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sections</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {academicStats.sections || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Classes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {academicStats.classes || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gender Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gender Distribution</h3>
                <a
                  href={`/registrar/reports/student-population/pdf?school_year_id=${selectedSchoolYear || ''}&semester_id=${selectedSemester || ''}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                  title="Export Student Population Report"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </a>
              </div>
              <div className="h-64">
                <Doughnut data={genderChartData} options={chartOptions} />
              </div>
              <div className="mt-4 flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{analytics.gender_distribution?.male || 0}</p>
                  <p className="text-sm text-gray-600">Male</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-600">{analytics.gender_distribution?.female || 0}</p>
                  <p className="text-sm text-gray-600">Female</p>
                </div>
              </div>
            </div>

            {/* Enrollment Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Status</h3>
              <div className="h-64">
                <Doughnut data={enrollmentStatusData} options={chartOptions} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{enrollmentStats.enrolled || 0}</p>
                  <p className="text-sm text-gray-600">Enrolled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{enrollmentStats.pre_enrolled || 0}</p>
                  <p className="text-sm text-gray-600">Pre-Enrolled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{enrollmentStats.recommended || 0}</p>
                  <p className="text-sm text-gray-600">Recommended</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{enrollmentStats.rejected || 0}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </div>

            {/* Strand Enrollment */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Enrollment by Strand</h3>
                  <p className="text-xs text-gray-500">Currently showing: {selectedStrandLabel}</p>
                </div>
                <a
                  href={`/registrar/reports/strands/pdf?school_year_id=${selectedSchoolYear || ''}&semester_id=${selectedSemester || ''}&strand_id=${selectedStrand || ''}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs font-medium"
                  title="Export Strands Report"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </a>
              </div>
              <div className="h-64">
                {enrollmentByStrand.length > 0 ? (
                  <Bar data={strandChartData} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p>No data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Grade Level Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment by Grade Level</h3>
              <div className="h-64">
                {enrollmentByGrade.length > 0 ? (
                  <Bar data={gradeChartData} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p>No data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Faculty Load Analysis */}
          {facultyLoads.faculty && facultyLoads.faculty.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Faculty Load Analysis</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    1 Load = 1 Section | Maximum: 5 Loads | Optimal Weekly Hours: 20-30 hours
                  </p>
                </div>
                <a
                  href={`/registrar/reports/faculty-loads/pdf?school_year_id=${selectedSchoolYear || ''}&semester_id=${selectedSemester || ''}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </a>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Faculty</p>
                  <p className="text-2xl font-bold text-blue-600">{facultyLoads.summary.total_faculty || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">With Loads</p>
                  <p className="text-2xl font-bold text-green-600">{facultyLoads.summary.faculty_with_loads || 0}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Overloaded (&gt;5)</p>
                  <p className="text-2xl font-bold text-red-600">{facultyLoads.summary.overloaded_faculty || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Underloaded (&lt;20hrs)</p>
                  <p className="text-2xl font-bold text-yellow-600">{facultyLoads.summary.underloaded_faculty || 0}</p>
                </div>
              </div>

              {/* Faculty Load Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loads</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {facultyLoads.faculty.map((faculty) => {
                      const statusColors = {
                        overloaded: 'bg-red-100 text-red-800',
                        underloaded: 'bg-yellow-100 text-yellow-800',
                        optimal: 'bg-green-100 text-green-800',
                        normal: 'bg-gray-100 text-gray-800',
                      }
                      return (
                        <tr key={faculty.faculty_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{faculty.faculty_name}</div>
                              <div className="text-xs text-gray-500">{faculty.faculty_email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              faculty.total_loads > 5 ? 'bg-red-100 text-red-800' : 
                              faculty.total_loads === 5 ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {faculty.total_loads} / 5
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className={`font-semibold ${
                              faculty.total_weekly_hours < 20 ? 'text-yellow-600' :
                              faculty.total_weekly_hours > 30 ? 'text-red-600' :
                              'text-green-600'
                            }`}>
                              {faculty.total_weekly_hours} hrs
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {faculty.sections.map((section, idx) => (
                                <div key={section.section_id} className="mb-1">
                                  <span className="font-medium">{section.section_name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({section.weekly_hours} hrs) - {section.subjects.join(', ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[faculty.status] || statusColors.normal}`}>
                              {faculty.status.charAt(0).toUpperCase() + faculty.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Average Statistics */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Average Loads</p>
                    <p className="text-lg font-semibold text-gray-900">{facultyLoads.summary.average_loads || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Weekly Hours</p>
                    <p className="text-lg font-semibold text-gray-900">{facultyLoads.summary.average_weekly_hours || 0} hrs</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Academic Resources</h3>
                <div className="flex gap-2">
                  <a
                    href={`/registrar/reports/subjects/pdf?school_year_id=${selectedSchoolYear || ''}&semester_id=${selectedSemester || ''}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-xs font-medium"
                    title="Export Subjects Report"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Subjects
                  </a>
                  <a
                    href={`/registrar/reports/sections/pdf?school_year_id=${selectedSchoolYear || ''}&semester_id=${selectedSemester || ''}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs font-medium"
                    title="Export Sections Report"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Sections
                  </a>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subjects</span>
                  <span className="text-xl font-bold text-gray-900">{academicStats.subjects || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Strands</span>
                  <span className="text-xl font-bold text-gray-900">{academicStats.strands || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sections</span>
                  <span className="text-xl font-bold text-gray-900">{academicStats.sections || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Classes</span>
                  <span className="text-xl font-bold text-gray-900">{academicStats.classes || 0}</span>
                </div>
              </div>
            </div>

            {Object.keys(gradeStats).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Grades</span>
                    <span className="text-xl font-bold text-gray-900">{gradeStats.total_grades || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved</span>
                    <span className="text-xl font-bold text-green-600">{gradeStats.approved || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending</span>
                    <span className="text-xl font-bold text-yellow-600">{gradeStats.pending || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Enrollments</span>
                  <span className="text-xl font-bold text-gray-900">{enrollmentStats.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Enrolled</span>
                  <span className="text-xl font-bold text-green-600">{enrollmentStats.enrolled || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Review</span>
                  <span className="text-xl font-bold text-yellow-600">
                    {(enrollmentStats.pre_enrolled || 0) + (enrollmentStats.recommended || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

