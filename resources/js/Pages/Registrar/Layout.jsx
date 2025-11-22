import { useSidebar } from '../../contexts/SidebarContext'
import RegistrarSidebar from '../Auth/Registrar_sidebar'

export default function RegistrarLayout({ children }) {
  const { isCollapsed } = useSidebar()
  const desktopMarginClass = isCollapsed ? 'md:ml-16' : 'md:ml-64'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ml-0 ${desktopMarginClass}`}
      >
        {children}
      </div>
    </div>
  )
}

