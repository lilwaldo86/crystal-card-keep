import React from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/SiteLayout'
import Home from './pages/Home'
import Inventory from './pages/Inventory'
import About from './pages/About'
import Policies from './pages/Policies'
import Preorders from './pages/Preorders'
import LocationHours from './pages/LocationHours'
import Live from './pages/Live'
import Marketplace from './pages/Marketplace'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/about" element={<About />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/preorders" element={<Preorders />} />
          <Route path="/hours" element={<LocationHours />} />
          <Route path="/live" element={<Live />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
