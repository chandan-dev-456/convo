import 'bootstrap/dist/css/bootstrap.min.css';
import { Link , NavLink } from 'react-router-dom';
export default function HomeNav() {
  return (
    <nav className="container-fluid navbar navbar-expand-lg navbar-shadow px-3 ">
      <img src="wesiteConvologo.png" alt="" className='logo rounded-2' />
      <Link to="/" className="navbar-brand ms-3" style={{ color: "orange" }}><h4>Convo</h4></Link>

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
          <li className="nav-item">
            <NavLink
              to="/guest"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active-link" : ""}`
              }
            >
              Join as Guest
            </NavLink>
          </li>
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
        </ul>
      </div>
    </nav>
  );
}
