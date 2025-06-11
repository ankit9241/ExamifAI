import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/api";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isSignupActive, setIsSignupActive] = useState(false);
  const [showPassword, setShowPassword] = useState({
    loginPassword: false,
    signupPassword: false,
    confirmPassword: false,
  });
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatchError, setPasswordsMatchError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupErrors, setSignupErrors] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const extractRollNumber = (email) => {
    if (!email) return null;
    // Extract roll number from email format: name_rollno@iitp.ac.in
    const match = email.match(/^[^_]+_([^@]+)@iitp\.ac\.in$/);
    return match ? match[1] : null;
  };

  const validateIITPEmail = (email) => {
    if (!email) return false;
    return /^[^_]+_[^@]+@iitp\.ac\.in$/.test(email);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    let errors = { email: "", name: "", password: "", confirmPassword: "" };
    let hasError = false;

    if (!signupName.trim()) {
      errors.name = "Please enter your name";
      hasError = true;
    }
    if (!signupEmail.trim()) {
      errors.email = "Please enter your email";
      hasError = true;
    } else if (!validateIITPEmail(signupEmail)) {
      errors.email = "Please use your IITP email (format: name_rollno@iitp.ac.in)";
      hasError = true;
    }
    if (!signupPassword.trim()) {
      errors.password = "Please enter your password";
      hasError = true;
    }
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
      hasError = true;
    }
    if (signupPassword !== confirmPassword) {
      setPasswordsMatchError(true);
      hasError = true;
    } else {
      setPasswordsMatchError(false);
    }

    setSignupErrors(errors);

    if (!hasError) {
      try {
        setLoading(true);
        const rollNo = extractRollNumber(signupEmail);
        if (!rollNo) {
          setError("Invalid email format. Please use your IITP email (format: name_rollno@iitp.ac.in)");
          setLoading(false);
          return;
        }
        await authService.register({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          rollNo: rollNo,
          role: "student"
        });
        navigate("/");
      } catch (err) {
        setError(err.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (signupPassword === e.target.value) {
      setPasswordsMatchError(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    let errors = { email: "", password: "" };
    let hasError = false;

    if (!loginEmail.trim()) {
      errors.email = "Please enter your email";
      hasError = true;
    } else if (!validateIITPEmail(loginEmail)) {
      errors.email = "Please use your IITP email (format: name_rollno@iitp.ac.in)";
      hasError = true;
    }
    if (!loginPassword.trim()) {
      errors.password = "Please enter your password";
      hasError = true;
    }

    setLoginErrors(errors);

    if (!hasError) {
      try {
        setLoading(true);
        await authService.login(loginEmail, loginPassword);
        navigate("/home");
      } catch (err) {
        setError(err.message || "Login failed");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login_bg">
      <div className={`form_container ${isSignupActive ? "active" : ""}`}>
        {error && <div className="error-message">{error}</div>}
        
        {/* Login Form */}
        <div className="form login_form">
          <form onSubmit={handleLoginSubmit} noValidate>
            <h2>Login</h2>
            <div className="input_box">
              <input
                type="email"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loading}
              />
              <i className="uil uil-envelope-alt email"></i>
              {loginErrors.email && (
                <span className="premium-warning">{loginErrors.email}</span>
              )}
            </div>
            <div className="input_box">
              <input
                type={showPassword.loginPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={loading}
              />
              <i className="uil uil-lock password"></i>
              <i
                className={`uil ${
                  showPassword.loginPassword ? "uil-eye" : "uil-eye-slash"
                } pw_hide`}
                onClick={() => togglePasswordVisibility("loginPassword")}
              ></i>
              {loginErrors.password && (
                <span className="premium-warning">{loginErrors.password}</span>
              )}
            </div>
            <div className="option_field">
              <span className="checkbox">
                <input type="checkbox" id="check" />
                <label htmlFor="check">Remember me</label>
              </span>
              <Link to="#" className="forgot_pw">
                Forgot password?
              </Link>
            </div>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Loading..." : "Login Now"}
            </button>
            <div className="login_signup">
              Don't have an account?{" "}
              <a
                href="#"
                id="signup"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSignupActive(true);
                }}
              >
                Signup
              </a>
            </div>
          </form>
        </div>

        {/* Signup Form */}
        <div className="form signup_form">
          <form id="signup-form" onSubmit={handleSignupSubmit} noValidate>
            <h2>Signup</h2>
            <div className="input_box">
              <input
                type="text"
                placeholder="Enter your name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                disabled={loading}
              />
              <i className="uil uil-user"></i>
              {signupErrors.name && (
                <span className="premium-warning">{signupErrors.name}</span>
              )}
            </div>
            <div className="input_box">
              <input
                type="email"
                placeholder="Enter your email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                disabled={loading}
              />
              <i className="uil uil-envelope-alt email"></i>
              {signupErrors.email && (
                <span className="premium-warning">{signupErrors.email}</span>
              )}
            </div>
            <div className="input_box">
              <input
                type={showPassword.signupPassword ? "text" : "password"}
                placeholder="Create password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                disabled={loading}
              />
              <i className="uil uil-lock password"></i>
              <i
                className={`uil ${
                  showPassword.signupPassword ? "uil-eye" : "uil-eye-slash"
                } pw_hide`}
                onClick={() => togglePasswordVisibility("signupPassword")}
              ></i>
              {signupErrors.password && (
                <span className="premium-warning">{signupErrors.password}</span>
              )}
            </div>
            <div className="input_box">
              <input
                type={showPassword.confirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={loading}
              />
              <i className="uil uil-lock password"></i>
              <i
                className={`uil ${
                  showPassword.confirmPassword ? "uil-eye" : "uil-eye-slash"
                } pw_hide`}
                onClick={() => togglePasswordVisibility("confirmPassword")}
              ></i>
              {signupErrors.confirmPassword && (
                <span className="premium-warning">{signupErrors.confirmPassword}</span>
              )}
              {passwordsMatchError && (
                <span className="premium-warning">Passwords do not match</span>
              )}
            </div>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Loading..." : "Signup Now"}
            </button>
            <div className="login_signup">
              Already have an account?{" "}
              <a
                href="#"
                id="login"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSignupActive(false);
                }}
              >
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
