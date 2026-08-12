export const mockDepartments = [
  {
    id: 'dept-cse-uuid-1111',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    head_of_dept: 'Dr. Yathish Aradhya',
    description: 'Department focusing on software engineering, AI, cyber security, and cloud architectures.'
  },
  {
    id: 'dept-ise-uuid-2222',
    name: 'Information Science & Engineering',
    code: 'ISE',
    head_of_dept: 'Dr. Suman K R',
    description: 'Department focusing on information systems, big data analytics, and web technologies.'
  },
  {
    id: 'dept-ece-uuid-3333',
    name: 'Electronics & Communication',
    code: 'ECE',
    head_of_dept: 'Prof. Rajesh Kumar',
    description: 'Department focusing on embedded systems, microcontrollers, VLSI, and signal processing.'
  },
  {
    id: 'dept-me-uuid-4444',
    name: 'Mechanical Engineering',
    code: 'ME',
    head_of_dept: 'Dr. Suresh M',
    description: 'Department focusing on robotics, thermodynamics, CAD/CAM, and automated manufacturing.'
  }
];

export const mockCourses = [
  {
    id: 'c1',
    department_id: 'dept-cse-uuid-1111',
    name: 'B.E. in Computer Science & Engineering',
    code: 'BE-CSE',
    degree: 'BE',
    credits: 160,
    duration_years: 4,
    description: 'Core computer science theory, algorithms, software development, and modern AI/ML technologies.'
  },
  {
    id: 'c2',
    department_id: 'dept-ise-uuid-2222',
    name: 'B.E. in Information Science & Engineering',
    code: 'BE-ISE',
    degree: 'BE',
    credits: 160,
    duration_years: 4,
    description: 'Focus on database architectures, cloud computing, information security, and web services.'
  },
  {
    id: 'c3',
    department_id: 'dept-ece-uuid-3333',
    name: 'B.E. in Electronics & Communication',
    code: 'BE-ECE',
    degree: 'BE',
    credits: 160,
    duration_years: 4,
    description: 'Circuits, digital signal processing, wireless communication, and IoT systems.'
  },
  {
    id: 'c4',
    department_id: 'dept-cse-uuid-1111',
    name: 'M.Tech in Software Engineering',
    code: 'MTECH-SE',
    degree: 'MTech',
    credits: 80,
    duration_years: 2,
    description: 'Advanced software design, cloud microservices, and distributed systems architecture.'
  }
];

export const mockSubjects = [
  { id: 'sub-1', name: 'Advanced Data Structures & Algorithms', code: '22CS61', credits: 4, course_id: 'c1' },
  { id: 'sub-2', name: 'Full Stack Web Development (React & Node)', code: '22CS62', credits: 4, course_id: 'c1' },
  { id: 'sub-3', name: 'Database Management Systems', code: '22CS63', credits: 4, course_id: 'c1' },
  { id: 'sub-4', name: 'Machine Learning & AI Principles', code: '22CS64', credits: 3, course_id: 'c1' },
  { id: 'sub-5', name: 'Cloud Computing & DevOps', code: '22CS65', credits: 3, course_id: 'c1' }
];

export const mockStudents = [
  {
    id: 'std-1',
    full_name: 'Sanjana S D',
    email: 'sanjana.sd@student.kit.edu',
    role: 'student',
    usn_emp_id: '1KT22CS042',
    department_id: 'dept-cse-uuid-1111',
    semester: 6,
    section: 'A',
    phone_number: '+91 9876543210',
    created_at: '2026-01-15T10:00:00Z',
    departments: { name: 'Computer Science & Engineering', code: 'CSE' }
  },
  {
    id: 'std-2',
    full_name: 'Amit Kumar',
    email: 'amit.kumar@student.kit.edu',
    role: 'student',
    usn_emp_id: '1KT22CS005',
    department_id: 'dept-cse-uuid-1111',
    semester: 6,
    section: 'A',
    phone_number: '+91 9876543211',
    created_at: '2026-01-15T10:30:00Z',
    departments: { name: 'Computer Science & Engineering', code: 'CSE' }
  },
  {
    id: 'std-3',
    full_name: 'Priya Rao',
    email: 'priya.rao@student.kit.edu',
    role: 'student',
    usn_emp_id: '1KT22CS030',
    department_id: 'dept-cse-uuid-1111',
    semester: 6,
    section: 'A',
    phone_number: '+91 9876543212',
    created_at: '2026-01-16T11:00:00Z',
    departments: { name: 'Computer Science & Engineering', code: 'CSE' }
  },
  {
    id: 'std-4',
    full_name: 'Karan Singh',
    email: 'karan.singh@student.kit.edu',
    role: 'student',
    usn_emp_id: '1KT22CS021',
    department_id: 'dept-cse-uuid-1111',
    semester: 6,
    section: 'A',
    phone_number: '+91 9876543213',
    created_at: '2026-01-16T11:30:00Z',
    departments: { name: 'Computer Science & Engineering', code: 'CSE' }
  },
  {
    id: 'std-5',
    full_name: 'Anjali Sharma',
    email: 'anjali.sharma@student.kit.edu',
    role: 'student',
    usn_emp_id: '1KT22CS008',
    department_id: 'dept-cse-uuid-1111',
    semester: 6,
    section: 'A',
    phone_number: '+91 9876543214',
    created_at: '2026-01-17T09:15:00Z',
    departments: { name: 'Computer Science & Engineering', code: 'CSE' }
  }
];

export const mockFaculty = [
  {
    id: 'fac-1',
    full_name: 'Prof. Yathish Aradhya B C',
    email: 'yathish.aradhya@kit.edu',
    role: 'faculty',
    usn_emp_id: 'EMP-CSE-001',
    department_id: 'dept-cse-uuid-1111',
    phone_number: '+91 9988776655',
    created_at: '2025-08-01T10:00:00Z',
    departments: { name: 'Computer Science & Engineering', code: 'CSE' }
  },
  {
    id: 'fac-2',
    full_name: 'Dr. Suman K R',
    email: 'suman.kr@kit.edu',
    role: 'faculty',
    usn_emp_id: 'EMP-ISE-002',
    department_id: 'dept-ise-uuid-2222',
    phone_number: '+91 9988776656',
    created_at: '2025-08-01T10:30:00Z',
    departments: { name: 'Information Science & Engineering', code: 'ISE' }
  }
];

export const mockJobs = [
  {
    id: 'job-1',
    company_name: 'Google',
    role: 'Software Engineer Intern',
    description: 'Join Google Core Infrastructure team. Develop highly scalable microservices and real-time backend engines.',
    package_lpa: '32.5',
    skills_required: 'React, Node.js, Algorithms, System Design',
    location: 'Bangalore (Hybrid)',
    created_at: '2026-07-01T10:00:00Z'
  },
  {
    id: 'job-2',
    company_name: 'Microsoft',
    role: 'Frontend Developer',
    description: 'Build responsive Azure portal dashboards with high reliability, clean UX, and component design systems.',
    package_lpa: '24.0',
    skills_required: 'TypeScript, React, Next.js, Tailwind CSS',
    location: 'Hyderabad',
    created_at: '2026-07-05T10:00:00Z'
  },
  {
    id: 'job-3',
    company_name: 'Amazon',
    role: 'Cloud DevOps Associate',
    description: 'Deploy and manage containerized topologies, automated CI/CD pipelines, and high availability AWS architectures.',
    package_lpa: '28.0',
    skills_required: 'Docker, Kubernetes, AWS, Terraform, CI/CD',
    location: 'Chennai (Remote)',
    created_at: '2026-07-10T10:00:00Z'
  }
];

export const mockAssignments = [
  {
    id: 'asgn-1',
    title: 'Full Stack REST API Project',
    description: 'Implement a complete RESTful API with authentication middleware, error handlers, and input validation.',
    due_date: '2026-08-25',
    subject_id: 'sub-2',
    semester: '6',
    section: 'A',
    attachment_url: 'https://campuscore.edu/docs/assignment1.pdf',
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'asgn-2',
    title: 'Data Structures & Trees Optimization',
    description: 'Construct AVL trees, Red-Black trees, and evaluate time complexities under benchmark operations.',
    due_date: '2026-08-30',
    subject_id: 'sub-1',
    semester: '6',
    section: 'A',
    attachment_url: '',
    created_at: '2026-08-05T10:00:00Z'
  }
];

export const mockSubmissions = [
  {
    id: 'subm-1',
    assignment_id: 'asgn-1',
    student_id: 'demo-student-id',
    file_url: 'https://github.com/student/fullstack-project',
    status: 'graded',
    marks_obtained: '48',
    feedback: 'Excellent clean architecture and proper modular routes!',
    created_at: '2026-08-10T14:20:00Z'
  }
];

export const mockAttendance = [
  { id: 'att-1', student_id: 'demo-student-id', subject_id: 'sub-1', date: '2026-08-10', status: 'present' },
  { id: 'att-2', student_id: 'demo-student-id', subject_id: 'sub-2', date: '2026-08-10', status: 'present' },
  { id: 'att-3', student_id: 'demo-student-id', subject_id: 'sub-3', date: '2026-08-11', status: 'present' },
  { id: 'att-4', student_id: 'demo-student-id', subject_id: 'sub-4', date: '2026-08-11', status: 'present' },
  { id: 'att-5', student_id: 'demo-student-id', subject_id: 'sub-5', date: '2026-08-12', status: 'absent' }
];

export const mockMarks = [
  { id: 'mk-1', student_id: 'demo-student-id', subject_id: 'sub-1', exam_type: 'internal_1', marks_obtained: '45', max_marks: '50' },
  { id: 'mk-2', student_id: 'demo-student-id', subject_id: 'sub-2', exam_type: 'internal_1', marks_obtained: '48', max_marks: '50' },
  { id: 'mk-3', student_id: 'demo-student-id', subject_id: 'sub-3', exam_type: 'internal_1', marks_obtained: '42', max_marks: '50' },
  { id: 'mk-4', student_id: 'demo-student-id', subject_id: 'sub-4', exam_type: 'internal_1', marks_obtained: '46', max_marks: '50' }
];

export const mockApplications = [
  { id: 'app-1', job_id: 'job-1', student_id: 'demo-student-id', status: 'applied', created_at: '2026-08-01T10:00:00Z' }
];

export const mockMessages = [
  {
    id: 'msg-1',
    sender_id: 'fac-1',
    receiver_id: 'demo-student-id',
    message_text: 'Hello Sanjana, please review the latest Full Stack assignment specifications.',
    created_at: '2026-08-11T16:30:00Z'
  },
  {
    id: 'msg-2',
    sender_id: 'demo-student-id',
    receiver_id: 'fac-1',
    message_text: 'Thank you Professor! I have submitted the GitHub repository link.',
    created_at: '2026-08-11T16:35:00Z'
  }
];

export const mockTimetables = [
  { id: 'tt-1', day: 'Monday', period_1: 'Advanced Data Structures', period_2: 'Full Stack Web', period_3: 'DBMS', period_4: 'Machine Learning' },
  { id: 'tt-2', day: 'Tuesday', period_1: 'Full Stack Web', period_2: 'DBMS', period_3: 'Cloud & DevOps', period_4: 'Placement Training' },
  { id: 'tt-3', day: 'Wednesday', period_1: 'Machine Learning', period_2: 'Advanced Data Structures', period_3: 'DBMS Lab', period_4: 'DBMS Lab' },
  { id: 'tt-4', day: 'Thursday', period_1: 'Cloud & DevOps', period_2: 'Full Stack Web Lab', period_3: 'Full Stack Web Lab', period_4: 'Seminar' },
  { id: 'tt-5', day: 'Friday', period_1: 'DBMS', period_2: 'Machine Learning', period_3: 'Algorithms Lab', period_4: 'Sports / Mentorship' }
];

export const mockStats = {
  students: 48,
  faculty: 12,
  departments: 4,
  courses: 5,
  jobs: 3,
  recentLogs: [
    { id: 'log-1', action_type: 'USER_LOGIN', message: 'User admin@campuscore.edu signed in successfully.', created_at: '2026-08-12T10:00:00Z' },
    { id: 'log-2', action_type: 'MARKS_SUBMITTED', message: 'Internal 1 grades recorded for CSE-6A Web Dev.', created_at: '2026-08-12T09:30:00Z' },
    { id: 'log-3', action_type: 'JOB_POSTED', message: 'New placement drive: Google Software Engineer Intern.', created_at: '2026-08-11T14:15:00Z' },
    { id: 'log-4', action_type: 'ATTENDANCE_MARKED', message: 'Attendance sheet submitted for 22CS61 (48 present).', created_at: '2026-08-11T11:00:00Z' }
  ],
  trackData: [
    { name: 'Advanced', count: 18 },
    { name: 'Intermediate', count: 22 },
    { name: 'Beginner', count: 8 }
  ]
};
