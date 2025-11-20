import { useSidebar } from '../../contexts/SidebarContext'
import RegistrarSidebar from '../Auth/Registrar_sidebar'

export default function RegistrarLayout({ children }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{
          marginLeft: isCollapsed ? '0' : '0',
        }}
      >
        {children}
      </div>
    </div>
  )
}

