import { usePage } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import HeaderProfileDropdown from '../../components/HeaderProfileDropdown'
import NotificationMenu from '../../components/NotificationMenu'

export default function RegistrarLayout({ children, headerExtras = null, hideTopbar = false }) {
  const { props } = usePage()
  const user = props?.auth?.user
  const notifications = props?.notifications || {}

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col bg-gray-50">
        {!hideTopbar && (
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-end gap-4">
              {headerExtras}
              <NotificationMenu notifications={notifications} />
              <HeaderProfileDropdown
                user={user}
                profileUrl="/registrar/profile"
              />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
