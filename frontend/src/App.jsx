import React from 'react'
import Navbar from './components/Navbar/Navbar'
import { Routes, Route } from 'react-router-dom'
import Homepage from './components/Home/Homepage'
import LiveDebates from './components/Pages/LiveDebates'
import Topics from './components/Pages/Topics'
import Leaderboard from './components/Pages/Leaderboard'
import AICoach from './components/Pages/AICoach'
import Tournaments from './components/Pages/Tournaments'
import TournamentBracket from './components/Pages/TournamentBracket'
// import Pricing from './components/Pages/Pricing'
import About from './components/Pages/About'
import Login from './components/Pages/Login'
import SignUp from './components/Pages/SignUp'
import ForgotPassword from './components/Pages/ForgotPassword'
import ResetPassword from './components/Pages/ResetPassword'
import DebateRoom from './components/Pages/DebateRoom'
import OAuthSuccess from "./components/Pages/OAuthSuccess";

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/livedebates" element={<LiveDebates />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/ai-coach" element={<AICoach />} />
        <Route path="/ai-coach/sample" element={<AICoach />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id/bracket" element={<TournamentBracket />} />
        <Route path="/tournaments/:id/results" element={<TournamentBracket />} />
        {/* <Route path="/pricing" element={<Pricing />} /> */}
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/debate/:debateId" element={<DebateRoom />} />
        <Route path="/map" element={<Topics />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
      </Routes>
    </>
  )
}

export default App
