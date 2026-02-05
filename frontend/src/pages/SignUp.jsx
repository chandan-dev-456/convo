import { useContext, useState } from 'react';
import './css/signup.css'
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from '../contexts/Authcontext';
import toast from 'react-hot-toast';

export default function SignIn() {
  const navigate = useNavigate();
  const style = { color: "orange" };
  const [formdata, setFormdata] = useState({ name: "", username: "", password: "" });

  const handelInput = (e) => {
    return setFormdata({ ...formdata, [e.target.name]: e.target.value });
  }

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const msg = await handleRegister(formdata);
      toast.success(msg);
      setFormdata({ name: "", username: "", password: "" });
    } catch (err) {
      toast.error(err);
    }
  }

  const { handleRegister } = useContext(AuthContext);

  return (
    <div className="container-fluid vh-100">
      <div className="row my-4 py-5 d-flex align-items-center justify-content-center fade-in">
        <div className="col-lg-8 d-flex align-items-center justify-content-center">

          {/* GLASS FORM */}
          <div className="w-75 glass-form position-relative">

            <h2 className="mb-5 fw-bold text-center" style={style}>
              Sign Up
            </h2>

            <form onSubmit={submitHandler}>
              <div className="mb-3">
                {formdata.fullName}
                <label className="form-label " style={style}>Full name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter Name"
                  value={formdata.fullName}
                  onChange={handelInput}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={style}>Username</label>
                <input
                  type="text"
                  name="username"
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
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={formdata.password}
                  onChange={handelInput}
                  required
                />
              </div>

              <button className="btn btn-primary w-100 my-4">
                Sign In
              </button>
            </form>

            {/* ALREADY HAVE ACCOUNT */}
            <div className="existing-account">
              <span>Already have an account?</span>
              <Link to="/login" className="mx-3">Log In</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
