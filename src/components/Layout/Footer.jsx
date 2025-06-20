import { Link } from "react-router-dom";
import "../../styles/Layout.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="copyright">
          &copy; {currentYear} WebRTC Chat. All rights reserved.
        </span>
        <div className="footer-links">
          <a
            href="https://github.com/rajak-s/my-webrtc-app"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Source Code
          </a>
          <Link to="/privacy" className="footer-link">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
