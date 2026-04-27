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


import ProtectedRoute from "./routes/ProtectedRoute.jsx";

import "./App.css";

function App() {
  return (
    <>
      <Toaster position="bottom-center" />

      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/join" element={<JoinPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MeetLayout />}>
            <Route path="/meeting/:roomId" element={<VedioMeet />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
