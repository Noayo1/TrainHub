import Dashbord from "./components/Dashbord";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashbord />} />
      </Routes>
    </Router>
  );
}
