import RegistrarSidebar from '../Auth/Registrar_sidebar'

export default function RegistrarLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
