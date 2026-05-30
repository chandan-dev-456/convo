import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext, useEffect } from "react";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true
});

export const AuthProvider = ({ children }) => {

  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  console.log("PROVIDER CONTEXT:", AuthContext);
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (savedUser && savedUser !== "undefined") {
        const parsed = JSON.parse(savedUser);
        setUserData(parsed);
      }
    } catch (error) {
      console.error("Invalid user in localStorage");
      localStorage.removeItem("user");
    }
  }, []);

  const handleRegister = async (formdata) => {
    try {
      const response = await client.post("/signup", formdata);

      if (response.status === 201) {
        navigate("/login", { replace: true });
        return response.data.message;
      }
    } catch (error) {
      throw error.response?.data?.message || "Signup failed";
    }
  };



  const handleLogin = async (formdata) => {
    try {
      const response = await client.post("/login", formdata);

      if (response.status === 200 || response.status === 201) {
        const user = response.data.user || {
          name: formdata.username
        };

        setUserData(user);
        localStorage.setItem("user", JSON.stringify(user));

        navigate("/join", { replace: true });

        return response.data.message;
      }
    } catch (error) {
      throw error.response?.data?.message || "Login failed";
    }
  };
  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    handleLogout
  };

  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  );
};
