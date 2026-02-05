import { useContext, useState } from 'react';
import './css/signup.css'
import { Link } from "react-router-dom";
import { AuthContext } from '../contexts/Authcontext';
import toast from 'react-hot-toast';

export default function LogIn() {
  const style = { color: "orange" };

  const [formdata, setFormdata] = useState({ username: "", password: "" });
  
  const handelInput = (e) => {
    return setFormdata({ ...formdata, [e.target.name]: e.target.value });
  }

  const submitHandler = async(e) =>{
    e.preventDefault();
    try{
      const msg = await handleLogin(formdata);
      toast.success(msg);
    }catch(err){
      toast.error(err);
    }
  }
  const {handleLogin} = useContext(AuthContext);

  return (
    <div className="container-fluid vh-100">
      <div className="row my-5 py-5 d-flex align-items-center justify-content-center fade-in">
        <div className="col-lg-8 d-flex align-items-center justify-content-center">

          {/* GLASS FORM */}
          <div className="w-75 glass-form position-relative">

            <h2 className="mb-5 fw-bold text-center" style={style}>
              Log In
            </h2>

            <form onSubmit={submitHandler}>
              <div className="mb-3">
                <label className="form-label" style={style}>Username</label>
                <input
                  name="username"
                  type="text"
                  className="form-control"
                  placeholder="Enter username"
                  value={formdata.username}
                  onChange={handelInput}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={style}>Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={formdata.password}
                  onChange={handelInput}
                  required
                />
              </div>

              <button className="btn btn-primary w-100 my-4">
                Log In
              </button>
            </form>

            {/* ALREADY HAVE ACCOUNT */}
            <div className="existing-account">
              <span>Don't have an account?</span>
              <Link to="/signup" className="mx-3">Sign Up</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
