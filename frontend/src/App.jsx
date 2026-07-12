import React from 'react'
import Navbar from './components/Navbar/Navbar'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from './components/Home/Homepage'
import LiveDebates from './components/Pages/LiveDebates'
import Topics from './components/Pages/Topics'
import Leaderboard from './components/Pages/Leaderboard'
import AICoach from './components/Pages/AICoach'
import Tournaments from './components/Pages/Tournaments'
import Pricing from './components/Pages/Pricing'
import About from './components/Pages/About'
import Login from './components/Pages/Login'
import SignUp from './components/Pages/SignUp'
import DebateRoom from './components/Pages/DebateRoom'

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/livedebates" element={<LiveDebates />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/ai-coach" element={<AICoach />} />
        <Route path="/ai-coach/sample" element={<AICoach />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/debate/:debateId" element={<DebateRoom />} />
        <Route path="/map" element={<Topics />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App