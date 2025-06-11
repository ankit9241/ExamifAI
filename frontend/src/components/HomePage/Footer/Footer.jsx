import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h3>About Us</h3>
          <p>
            IIT Patna is a premier institute established in 2008, offering
            quality education and research in various fields.
          </p>
        </div>
        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="/dashboard">Student Dashboard</a>
            </li>
            <li>
              <a href="/courses">Courses</a>
            </li>
            <li>
              <a href="/schedule">Class Schedule</a>
            </li>
            <li>
              <a href="/resources">Learning Resources</a>
            </li>
            <li>
              <a href="/faq">FAQs</a>
            </li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>Support</h3>
          <ul>
            <li>
              <a href="/contact">Contact Us</a>
            </li>
            <li>
              <a href="/technical-support">Technical Support</a>
            </li>
            <li>
              <a href="/privacy-policy">Privacy Policy</a>
            </li>
            <li>
              <a href="/terms-of-use">Terms of Use</a>
            </li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>Connect with Us</h3>
          <ul className="social-media">
            <li>
              <a
                href="https://www.facebook.com/iitpatnacepqip/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-facebook-f"></i>
                <span className="tooltip">Facebook</span>
              </a>
            </li>
            <li>
              <a
                href="https://x.com/iitpat"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-twitter"></i>
                <span className="tooltip">Twitter</span>
              </a>
            </li>
            <li>
              <a
                href="https://in.linkedin.com/school/indian-institute-of-technology-patna/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-linkedin-in"></i>
                <span className="tooltip">LinkedIn</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/iit_patna_official"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-instagram"></i>
                <span className="tooltip">Instagram</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          &copy; <span id="year">{new Date().getFullYear()}</span> IIT Patna.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
