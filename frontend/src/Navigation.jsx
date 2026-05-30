import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, NavLink } from 'react-router-dom';
import { useContext } from "react";
import { AuthContext } from './contexts/Authcontext';

export default function Navigation() {

  const context = useContext(AuthContext);

  const userData = context?.userData;
  const handleLogout = context?.handleLogout;
  
  return (

    <nav className="container-fluid navbar navbar-expand-lg navbar-shadow px-3 ">
      <img src="wesiteConvologo.png" alt="" className='logo rounded-2' />
      <Link to="/" className="navbar-brand ms-3" style={{ color: "orange" }}>
        <h4>Convo</h4>
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav ms-auto ">

          {userData ? (
            <>
              <li className="nav-item">
                <span className="nav-link">
                  👤 {userData.name}
                </span>
              </li>

              <li className="nav-item">
                <button
                  className="nav-link btn btn-link"
                  onClick={handleLogout}
                  style={{ textDecoration: "none" }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active-link" : ""}`
                  }
                >
                  Register
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active-link" : ""}`
                  }
                >
                  Login
                </NavLink>
              </li>
            </>
          )}

        </ul>
      </div>
    </nav>
  );
}