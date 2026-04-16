import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true
});

export const AuthProvider = ({ children }) => {

  const [userData, setUserData] = useState(null);

  const navigate = useNavigate();

  const handleRegister = async (formdata) => {
    try {
      const response = await client.post("/signup", formdata);

      if (response.status === 201) {
        navigate("/login",{ replace: true });
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
        navigate("/join",{ replace: true });
        // console.log(response.data.token);
        return response.data.message;
      }
    } catch (error) {
      throw error.response?.data?.message || "Login failed";
    }
  };


  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin
  };

  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  );
};
