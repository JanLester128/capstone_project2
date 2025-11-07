import { Head, Link, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import { registrarNav } from './navConfig'

export default function Dashboard({ stats = {} }) {
  const {
    students = 0,
    faculty = 0,
    sections = 0,
    subjects = 0,
    strands = 0,
    active_school_year = null,
  } = stats

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col">
      <Head title="Registrar • Dashboard" />

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Registrar Dashboard</h1>
          <div />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status & visibility of system state */}
        <div className="mb-6 rounded-md bg-indigo-50 p-4 text-sm text-indigo-900">
          <p>
            Active School Year: <strong>{active_school_year ? `${active_school_year.School_year_start}-${active_school_year.School_year_end}` : 'Not set'}</strong>
          </p>
        </div>

        {/* KPI cards */}
        <section aria-labelledby="kpis" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Students', value: students },
            { label: 'Faculty', value: faculty },
            { label: 'Sections', value: sections },
            { label: 'Subjects', value: subjects },
            { label: 'Strands', value: strands },
          ].map((k) => (
            <div key={k.label} className="rounded-lg bg-white p-5 shadow focus-within:ring-2 focus-within:ring-indigo-500">
              <p className="text-sm text-gray-500">{k.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{k.value}</p>
            </div>
          ))}
        </section>

        {/* Quick actions (flexibility & efficiency) */}
        <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/registrar/users?role=Student', title: 'Add Student', desc: 'Create a new student account' },
            { href: '/registrar/users?role=Faculty', title: 'Add Faculty', desc: 'Create a new faculty account' },
            { href: '/registrar/sections', title: 'Create Section', desc: 'Open sections manager' },
            { href: '/registrar/subjects', title: 'Add Subject', desc: 'Manage subjects list' },
          ].map((a) => (
            <Link key={a.title} href={a.href} className="rounded-lg bg-white p-5 shadow hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{a.desc}</p>
            </Link>
          ))}
        </section>

        {/* Recent activity / errors guidance */}
        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-5 shadow">
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li>• System ready. Use quick actions to begin adding data.</li>
              <li>• Tip: Use search in lists to recognize rather than recall.</li>
            </ul>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <h2 className="text-base font-semibold text-gray-900">Help & Guidance</h2>
            <p className="mt-2 text-sm text-gray-700">
              Keep data consistent with real-world records. If something goes wrong,
              error messages will appear in plain language with steps to resolve.
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
              <li>Use breadcrumb and header links to move around freely.</li>
              <li>Inputs are validated to prevent errors before saving.</li>
              <li>Design follows consistent labels, sizes, and spacing.</li>
            </ul>
          </div>
        </section>
      </main>
      </div>
    </div>
  )
}


