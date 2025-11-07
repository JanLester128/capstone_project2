import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import sessionManager from './utils/sessionManager'
import '../css/app.css';

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
    return pages[`./Pages/${name}.jsx`]
  },
  setup({ el, App, props }) {
    // Initialize session manager with current user data
    if (props.initialPage.props.auth?.user) {
      sessionManager.handleLogin(props.initialPage.props.auth.user);
    }
    sessionManager.init(props.initialPage.props.auth?.user);
    
    createRoot(el).render(<App {...props} />)
  },
})