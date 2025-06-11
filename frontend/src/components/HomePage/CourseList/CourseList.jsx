import React, { useState, useEffect } from "react";
import SubjectCard from "../SubjectCard/SubjectCard";
import "./CourseList.css";
import cardImage from "../../../assets/cardimage.jpeg";

const CourseList = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        console.log('Fetching subjects...');
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'Present' : 'Missing');
        
        const response = await fetch('http://localhost:5000/api/subjects', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.message || 'Failed to fetch subjects');
        }

        const subjects = await response.json();
        console.log('Received subjects:', subjects);
        setCourses(subjects.map(subject => ({
          id: subject._id,
          name: subject.name,
          image: cardImage
        })));
      } catch (error) {
        console.error('Error loading subjects:', error);
        // Fallback to hardcoded courses if fetch fails
        console.log('Using fallback courses');
        setCourses([
          {
            id: "102",
            name: "BO CDA 102: Mathematics-II",
            image: cardImage,
          },
          {
            id: "104",
            name: "BO CDA 104: Programming & Data Structures with Python",
            image: cardImage,
          },
          {
            id: "105",
            name: "BO CDA 105: Foundation of Data Analytics",
            image: cardImage,
          },
          {
            id: "106",
            name: "BO CDA 106: Numerical Methods for Data Science",
            image: cardImage,
          },
        ]);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <>
      <h1 className="my-courses">My Courses:</h1>
      <div className="course-container">
        <h3 className="course-overview">Course Overview</h3>
        <div className="courses-container">
          {courses.length === 0 ? (
            <div>Loading courses...</div>
          ) : (
            courses.map((course) => {
              console.log('Rendering course:', course);
              return (
                <SubjectCard
                  key={course.id}
                  id={course.id}
                  name={course.name}
                  image={course.image}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default CourseList;
