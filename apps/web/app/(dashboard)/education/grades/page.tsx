'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import { PageHeader, Card, Button, Badge, KPICard } from '@unerp/ui';
import { BookOpen, Award, Save, Users } from 'lucide-react';

const COURSES_MOCK = [
  { id: '1', name: 'Mathematics 101', code: 'MATH101' },
  { id: '2', name: 'English Literature', code: 'ENG201' },
  { id: '3', name: 'Physics', code: 'PHY101' },
];

const STUDENTS_MOCK = [
  { id: '1', name: 'Alice Johnson', roll: 'STU-001' },
  { id: '2', name: 'Bob Smith', roll: 'STU-002' },
  { id: '3', name: 'Carol Williams', roll: 'STU-003' },
  { id: '4', name: 'David Brown', roll: 'STU-004' },
  { id: '5', name: 'Eva Davis', roll: 'STU-005' },
];

export default function GradeBookPage() {
  const [selectedCourse, setSelectedCourse] = useState(COURSES_MOCK[0]?.id || '');
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({});

  const assessments = ['Quiz 1', 'Midterm', 'Quiz 2', 'Assignment', 'Final'];

  const getGrade = (studentId: string, assessment: string): number => {
    return grades[studentId]?.[assessment] ?? 0;
  };

  const setGradeValue = (studentId: string, assessment: string, value: number) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [assessment]: value },
    }));
  };

  const getAverage = (studentId: string): number => {
    const vals = assessments.map(a => getGrade(studentId, a)).filter(v => v > 0);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };

  const getLetterGrade = (avg: number): string => {
    if (avg >= 90) return 'A';
    if (avg >= 80) return 'B';
    if (avg >= 70) return 'C';
    if (avg >= 60) return 'D';
    return avg > 0 ? 'F' : '—';
  };

  return (
    <div className="ui-stack-6">
      <PageHeader title="Grade Book" description="Spreadsheet-style grade entry per course and student"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Grades' }]}
        actions={<Button variant="primary"><Save size={14} className="mr-2" /> Save Grades</Button>}
      />

      <div className="ui-grid-auto-sm">
        <KPICard title="Students" value={STUDENTS_MOCK.length} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="Assessments" value={assessments.length} icon={<BookOpen size={18} />} color="var(--color-info)" />
        <KPICard title="Class Average" value={`${Math.round(STUDENTS_MOCK.map(s => getAverage(s.id)).reduce((a, b) => a + b, 0) / STUDENTS_MOCK.length) || 0}%`} icon={<Award size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div className={styles.s1}>
          {COURSES_MOCK.map(c => (
            <button key={c.id} onClick={() => setSelectedCourse(c.id)} style={{ borderColor: selectedCourse === c.id ? 'var(--color-primary)' : 'var(--color-border)', background: selectedCourse === c.id ? 'var(--color-primary-light)' : 'var(--color-bg)', color: selectedCourse === c.id ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s2}>
              {c.code}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className={styles.s3}>
          <table className={styles.s4}>
            <thead>
              <tr className={styles.s5}>
                <th className={styles.s6}>Student</th>
                {assessments.map(a => (
                  <th key={a} className={styles.s7}>{a}</th>
                ))}
                <th className={styles.s8}>Avg</th>
                <th className={styles.s8}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {STUDENTS_MOCK.map(student => {
                const avg = getAverage(student.id);
                const letter = getLetterGrade(avg);
                return (
                  <tr key={student.id} className={styles.s9}>
                    <td className="p-3">
                      <div className="font-medium">{student.name}</div>
                      <div className="ui-text-xs-tertiary">{student.roll}</div>
                    </td>
                    {assessments.map(assessment => (
                      <td key={assessment} className={styles.s10}>
                        <input
                          type="number" min="0" max="100"
                          value={getGrade(student.id, assessment) || ''}
                          onChange={e => setGradeValue(student.id, assessment, Number(e.target.value))}
                          placeholder="—"
                          className={styles.s11}
                        />
                      </td>
                    ))}
                    <td className={styles.s12}>{avg > 0 ? `${avg}%` : '—'}</td>
                    <td className={styles.s13}>
                      <Badge variant={letter === 'A' ? 'success' : letter === 'B' ? 'info' : letter === 'C' ? 'warning' : letter === 'F' ? 'danger' : 'default'}>{letter}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
