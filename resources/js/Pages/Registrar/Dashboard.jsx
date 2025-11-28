import { Head, Link } from '@inertiajs/react'
import RegistrarLayout from './Layout'
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

export default function Dashboard({ stats = {}, registrar = null, analytics = {} }) {
  const {
    students = 0,
    faculty = 0,
    sections = 0,
    subjects = 0,
    strands = 0,
    active_school_year = null,
  } = stats

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
    labels: analytics.strand_enrollment?.map(item => item.strand) || [],
    datasets: [
      {
        label: 'Students Enrolled',
        data: analytics.strand_enrollment?.map(item => item.count) || [],
        backgroundColor: [
          '#8B5CF6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#06B6D4',
          '#84CC16',
        ],
        borderColor: [
          '#7C3AED',
          '#059669',
          '#D97706',
          '#DC2626',
          '#0891B2',
          '#65A30D',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Grade Distribution Chart Data
  const gradeChartData = {
    labels: analytics.grade_distribution?.map(item => item.grade) || [],
    datasets: [
      {
        label: 'Student Population',
        data: analytics.grade_distribution?.map(item => item.count) || [],
        backgroundColor: '#6366F1',
        borderColor: '#4F46E5',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
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
    <RegistrarLayout>
      <Head title="Registrar • Dashboard" />

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Registrar Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-3 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Status & visibility of system state */}
        <div className="rounded-md bg-indigo-50 p-4 text-sm text-indigo-900">
          <p>
            Active School Year: <strong>{active_school_year ? `${active_school_year.School_year_start}-${active_school_year.School_year_end}` : 'Not set'}</strong>
          </p>
        </div>

        {/* KPI cards */}
        <section aria-labelledby="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {[
            { 
              label: 'Students', 
              value: students, 
              icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
              gradient: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50'
            },
            { 
              label: 'Faculty', 
              value: faculty,
              icon: 'M21 13.255A23.931 23.931 0 0112 15c-2.91 0-5.63-.392-8.36-1.245M21 13.255v-2.51A23.93 23.93 0 0012 8c-2.91 0-5.63.392-8.36 1.245m0 0A23.998 23.998 0 003 12c0 2.22.892 4.207 2.34 5.709M3 13.255A23.93 23.93 0 0112 15c2.91 0 5.63-.392 8.36-1.245M15 10a3 3 0 11-6 0 3 3 0 016 0z',
              gradient: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50'
            },
            { 
              label: 'Sections', 
              value: sections,
              icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
              gradient: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50'
            },
            { 
              label: 'Subjects', 
              value: subjects,
              icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
              gradient: 'from-orange-500 to-orange-600',
              bgColor: 'bg-orange-50'
            },
            { 
              label: 'Strands', 
              value: strands,
              icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              gradient: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50'
            },
          ].map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className={`absolute top-0 right-0 w-20 h-20 ${k.bgColor} rounded-full -mr-10 -mt-10 opacity-20`}></div>
              <div className="relative">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${k.gradient} mb-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={k.icon} />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{k.label}</p>
                <p className="text-3xl font-bold text-gray-900">{k.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Analytics Snippet Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
              <p className="text-sm text-gray-500 mt-1">Quick insights - View detailed reports in Reports & Analytics</p>
            </div>
            <Link
              href="/registrar/reports"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Full Reports
            </Link>
          </div>
          
          {/* Compact Analytics Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Gender Distribution Snippet */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg border border-blue-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Gender Distribution</h3>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="h-48 mb-4">
                  <Doughnut data={genderChartData} options={doughnutOptions} />
                </div>
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Male: {analytics.gender_distribution?.male || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className="text-sm text-gray-600">Female: {analytics.gender_distribution?.female || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strand Enrollment Snippet */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-purple-50 p-6 shadow-lg border border-purple-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200 rounded-full -mr-12 -mt-12 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Strand Enrollment</h3>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="h-48 mb-4">
                  <Doughnut data={strandChartData} options={doughnutOptions} />
                </div>
                <div className="text-center pt-4 border-t border-purple-100">
                  <p className="text-sm font-medium text-gray-600">
                    <span className="text-lg font-bold text-purple-600">{analytics.strand_enrollment?.length || 0}</span> active strands
                  </p>
                </div>
              </div>
            </div>

            {/* Grade Distribution Snippet */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-indigo-50 p-6 shadow-lg border border-indigo-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200 rounded-full -mr-12 -mt-12 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Grade Levels</h3>
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="h-48 mb-4">
                  <Bar data={gradeChartData} options={chartOptions} />
                </div>
                <div className="text-center pt-4 border-t border-indigo-100">
                  <p className="text-sm font-medium text-gray-600">
                    <span className="text-lg font-bold text-indigo-600">{analytics.grade_distribution?.length || 0}</span> grade levels
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </RegistrarLayout>
  )
}


