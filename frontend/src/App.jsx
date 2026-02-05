import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout";
import MeetLayout from "./layouts/MeetLayout";
import HomePage from "./Homepage/HomePage";
import JoinPage from "./pages/JoinPage";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import GuestPage from "./pages/VedioMeet";
import VedioMeet from "./pages/VedioMeet";

import { AuthProvider } from "./contexts/Authcontext";
// import ProtectedRoute from "./routes/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-center" />

      <Routes>
        {/* Main layout routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/guest" element={<JoinPage />} />
        </Route>

        {/* Meeting layout routes */}
        <Route element={<MeetLayout />}>
          <Route path="/meeting/:url" element={<VedioMeet />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
