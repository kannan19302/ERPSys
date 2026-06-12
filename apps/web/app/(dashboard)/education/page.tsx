'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  RefreshCw, 
  UserPlus, 
  BookOpen, 
  Library, 
  Sparkles,
  Search
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  dateOfBirth: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
}

interface Timetable {
  id: string;
  room: string;
  weekday: string;
  startTime: string;
  endTime: string;
  course: {
    name: string;
    code: string;
  };
}

export default function EducationPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'courses' | 'timetables'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [sRes, cRes, tRes] = await Promise.all([
        fetch('http://localhost:3001/education/students', { headers }),
        fetch('http://localhost:3001/education/courses', { headers }),
        fetch('http://localhost:3001/education/timetables', { headers }),
      ]);

      const [sData, cData, tData] = await Promise.all([
        sRes.json(), cRes.json(), tRes.json()
      ]);

      setStudents(Array.isArray(sData) ? sData : []);
      setCourses(Array.isArray(cData) ? cData : []);
      setTimetables(Array.isArray(tData) ? tData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStudent = async () => {
    const firstName = prompt('Enter Student First Name:');
    if (!firstName) return;
    const lastName = prompt('Enter Student Last Name:');
    if (!lastName) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/education/students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth: '2010-06-12',
          enrollmentNumber: `STU-${Date.now().toString().slice(-4)}`,
          parentContact: JSON.stringify({ mother: 'Jane Smith', phone: '123-456-7890' })
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to register student.');
      }
    } catch {
      alert('Error registering student.');
    }
  };

  const handleCreateCourse = async () => {
    const name = prompt('Enter Course Name:');
    if (!name) return;
    const code = prompt('Enter Course Code (e.g. MATH-101):');
    if (!code) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/education/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          code,
          credits: 3,
          description: 'Standard academic curriculum course'
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to add course.');
      }
    } catch {
      alert('Error adding course.');
    }
  };

  const filteredStudents = students.filter(s => s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || s.lastName.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Education Registry...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <GraduationCap style={{ color: 'var(--color-primary)' }} />
            Education Academy Hub
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Manage student registrations, academic course curriculums, school timetables, and library holdings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleCreateCourse} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <BookOpen size={16} style={{ color: 'var(--color-primary)' }} /> Create Course
          </button>
          <button onClick={handleCreateStudent} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: 'var(--color-bg-elevated)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <UserPlus size={16} /> Enroll Student
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('students')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'students' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'students' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <GraduationCap size={16} /> Students Directory
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'courses' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'courses' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <BookOpen size={16} /> Academy Courses
        </button>
        <button 
          onClick={() => setActiveTab('timetables')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'timetables' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'timetables' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Library size={16} /> Timetable Schedules
        </button>
      </div>

      {/* Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'students' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search student roster..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-9)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-xs)'
                  }}
                />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Student ID</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Name</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>DOB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold', color: 'var(--color-primary)' }}>{s.enrollmentNumber}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{s.firstName} {s.lastName}</td>
                      <td style={{ padding: 'var(--space-2.5)', color: 'var(--color-text-secondary)' }}>{new Date(s.dateOfBirth).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No students enrolled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'courses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Course Code</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Name</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{c.code}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{c.name}</td>
                      <td style={{ padding: 'var(--space-2.5)', color: 'var(--color-text-secondary)' }}>{c.credits} Credits</td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No academic courses listed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'timetables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {timetables.map(t => (
                  <div key={t.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{t.course.name} ({t.course.code})</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Classroom: {t.room}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Weekday: {t.weekday}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>{t.startTime} - {t.endTime}</p>
                    </div>
                  </div>
                ))}
                {timetables.length === 0 && (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No timetable scheduling items defined.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Rules info */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
            Timetable Scheduler
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
             timetables configure professor shifts and classroom utilization, checking for conflicts automatically.
          </p>
        </div>

      </div>
    </div>
  );
}
