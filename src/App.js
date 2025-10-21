// App.js - CORRECTED
// Responsibility: ROUTING ONLY (like your lecturer's pattern)
// All logic is in Dashboard (container)

import Dashboard from "./components/Dashbord";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile/:userId" element={<Dashboard />} />
        <Route path="/group/:groupId" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
