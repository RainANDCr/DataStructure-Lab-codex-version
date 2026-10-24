import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

const Router = window.location.hostname.endsWith('github.io') ? HashRouter : BrowserRouter
createRoot(document.getElementById('root')!).render(<React.StrictMode><Router><App /></Router></React.StrictMode>)
