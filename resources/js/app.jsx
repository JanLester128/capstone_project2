import React from 'react'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import sessionManager from './utils/sessionManager'
import { SidebarProvider } from './contexts/SidebarContext'
import '../css/app.css';

createInertiaApp({
  resolve: name => {
    // Import all pages with eager loading
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
    
    // Try different path variations
    const possiblePaths = [
      `./Pages/${name}.jsx`,
      `./Pages/${name}/index.jsx`,
      `./Pages/${name.replace(/\./g, '/')}.jsx`,
      // Handle Student vs Students mismatch
      `./Pages/${name.replace('Student/', 'Students/')}.jsx`,
      // Handle other common patterns
      `./Pages/${name.replace(/([A-Z])/g, '/$1').toLowerCase().substring(1)}.jsx`
    ]
    
    // Enable logging for component resolution debugging
    if (name.includes('ReEnroll')) {
      console.log('Resolving component:', name)
      console.log('Available pages:', Object.keys(pages).filter(p => p.includes('ReEnroll')))
    }
    
    let component = null
    let foundPath = null
    
    for (const path of possiblePaths) {
      if (pages[path]) {
        component = pages[path]
        foundPath = path
        break
      }
    }
    
    if (!component) {
      console.error(`Component not found: ${name}`)
      console.error('Tried paths:', possiblePaths)
      console.error('Available components:', Object.keys(pages))
      
      // Return a fallback component
      return {
        default: () => (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Component Not Found</h1>
              <p className="text-gray-600">Could not load: {name}</p>
              <p className="text-sm text-gray-500 mt-2">
                Available: {Object.keys(pages).join(', ')}
              </p>
            </div>
          </div>
        )
      }
    }
    
    // console.log('Found component at:', foundPath)
    return component.default || component
  },
  setup({ el, App, props }) {
    // Initialize session manager with current user data
    if (props.initialPage.props.auth?.user) {
      sessionManager.handleLogin(props.initialPage.props.auth.user);
    }
    sessionManager.init(props.initialPage.props.auth?.user);
    
    createRoot(el).render(
      <SidebarProvider>
        <App {...props} />
      </SidebarProvider>
    )
  },
})