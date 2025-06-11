import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SubjectDetail from '../components/SubjectDetail/SubjectDetail';
import AdminSubjectDetails from '../components/Admin/AdminSubjectDetails/AdminSubjectDetails';

const SubjectRoute = () => {
  const { subjectId } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    console.log('Full UserInfo:', userInfo); // Debug full userInfo
    console.log('User Email:', userInfo.email); // Debug email
    console.log('User Role:', userInfo.role); // Debug role
    const isAdminUser = userInfo.email === 'admin_24a12res100@iitp.ac.in';
    console.log('Is Admin Check:', isAdminUser); // Debug admin check
    setIsAdmin(isAdminUser);
  }, []);

  console.log('Final isAdmin state:', isAdmin); // Debug final state
  return isAdmin ? <AdminSubjectDetails subjectId={subjectId} /> : <SubjectDetail subjectId={subjectId} />;
};

export default SubjectRoute;
