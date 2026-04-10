import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RegionPage from './pages/RegionPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/region/:regionName" element={<RegionPage />} />
    </Routes>
  )
}
