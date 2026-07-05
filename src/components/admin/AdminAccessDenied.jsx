import { Link } from 'react-router-dom';

export default function AdminAccessDenied() {
  return (
    <div className="admin-access-denied">
      <div className="denied-card">
        <i className="fa-solid fa-shield-halved denied-icon" />
        <h2 className="denied-title">Access Denied!</h2>
        <p className="denied-text">
          Waan ka xunnahay, boggan waxaa geli kara oo kaliya maamulaha (Admin-ka). Fadlan gal
          koontada admin-ka si aad u gasho dashboard-ka.
        </p>
        <Link to="/" className="denied-btn">
          <i className="fa-solid fa-arrow-left me-2" /> Ku laabo Bogga Hore
        </Link>
      </div>
    </div>
  );
}
