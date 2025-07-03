import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import HomeRoute from "./pages/HomeRoute";
import ExamRoute from "./pages/ExamRoute";
import ExamDetailsRoute from "./pages/ExamDetailsRoute";
import ReviewRoute from "./pages/ReviewRoute";
import SubjectRoute from "./pages/SubjectRoute";
import LoginRoute from "./pages/LoginRoute";
import ExamResultsRoute from "./pages/ExamResultsRoute";
import NavbarHome from "./components/NavbarHome/NavbarHome";
import NavbarExam from "./components/ExamPage/NavbarExam/NavbarExam";
import Footer from "./components/HomePage/Footer/Footer";
import SubmissionView from "./components/Admin/SubmissionView/SubmissionView";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Loading from "./components/Loading/Loading";
import { api } from "./services/api";

export const GlobalLoadingContext = createContext();

const Layout = ({ children }) => {
  const location = useLocation();
  const isExamPage = location.pathname === "/exam" || location.pathname === "/review";
  const isAuthPage = location.pathname === "/login";

  return (
    <>
      {!isAuthPage && (isExamPage ? <NavbarExam /> : <NavbarHome />)}
      {children}
      {!isAuthPage && <Footer />}
    </>
  );
};

function App() {
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    let requestCount = 0;
    const start = () => {
      requestCount++;
      setGlobalLoading(true);
    };
    const end = () => {
      requestCount = Math.max(0, requestCount - 1);
      if (requestCount === 0) setGlobalLoading(false);
    };
    const reqInterceptor = api.interceptors.request.use((config) => {
      start();
      return config;
    });
    const resInterceptor = api.interceptors.response.use(
      (response) => {
        end();
        return response;
      },
      (error) => {
        end();
        throw error;
      }
    );
    return () => {
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, []);

  return (
    <GlobalLoadingContext.Provider value={globalLoading}>
      <Router>
        {globalLoading && <Loading />}
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/home" element={<HomeRoute />} />
              <Route path="/exam-details" element={<ExamDetailsRoute />} />
              <Route path="/exam" element={<ExamRoute />} />
              <Route path="/review" element={<ReviewRoute />} />
              <Route path="/home/:subjectId" element={<SubjectRoute />} />
              <Route path="/admin/exam-results/:examId" element={<ExamResultsRoute />} />
              <Route path="/admin/submission/:attemptId" element={<SubmissionView />} />
            </Route>
            
            {/* Catch-all route for unhandled paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </GlobalLoadingContext.Provider>
  );
}

export default App;
