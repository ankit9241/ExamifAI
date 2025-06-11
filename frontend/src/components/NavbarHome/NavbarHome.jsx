import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import profile from "../../assets/profile.jpg";
import logo from "../../assets/logo.png";
import "./NavbarHome.css";

const NavbarHome = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {
    name: "Name",
    email: "name_24a12resXXX@iitp.ac.in",
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/email/${userInfo.email}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  return (
    <div className="navbar-home">
      <div className="nav-links">
        <img src={logo} alt="Logo" width="20%" className="logo" />
        <Link to="/">Home</Link>
        <Link to="/">Dashboard</Link>
        <Link to="/">My Courses</Link>
      </div>

      <div className="profile-section" onClick={toggleDropdown}>
        <div className="profile-info">
          <img src={profile} alt="Profile" className="profile-image" />
          <div className="user-details">
            <span className="user-name">{userInfo.name}</span>
            <span className="user-email">{userInfo.email}</span>
          </div>
          <i className={`fas fa-chevron-${isDropdownOpen ? "up" : "down"}`}></i>
        </div>

        {isDropdownOpen && (
          <div className="profile-dropdown">
            <div className="dropdown-item">
              <i className="fas fa-user"></i>
              <span>Profile</span>
            </div>
            <div className="dropdown-item">
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </div>
            <div className="dropdown-item" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </div>
            <div className="dropdown-item delete-account" onClick={() => setShowDeleteConfirm(true)}>
              <i className="fas fa-trash-alt"></i>
              <span>Delete Account</span>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="delete-confirm-content">
            <h3>Delete Account</h3>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <div className="delete-confirm-buttons">
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button onClick={handleDeleteAccount} className="delete-button">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarHome;
