// Shared vocabulary for seed data. Kept identical in job-portal-api and
// campus-placement-api so job requirements and student skills line up.

export interface RoleProfile {
  category: string;
  titles: string[];
  coreSkills: string[];
  extraSkills: string[];
  branches: string[];
  degrees: string[];
  industries: string[];
}

export const BRANCHES = {
  CSE: 'Computer Science',
  IT: 'Information Technology',
  AIDS: 'AI & Data Science',
  ECE: 'Electronics & Communication',
  EEE: 'Electrical & Electronics',
  MECH: 'Mechanical',
  MCA: 'Computer Applications',
} as const;

const SOFTWARE_BRANCHES = [BRANCHES.CSE, BRANCHES.IT, BRANCHES.AIDS, BRANCHES.MCA];
const CIRCUIT_BRANCHES = [BRANCHES.ECE, BRANCHES.EEE];

export const ROLE_PROFILES: RoleProfile[] = [
  {
    category: 'Backend Developer',
    titles: ['Backend Engineer', 'Software Engineer - Backend', 'Associate Java Developer', 'Node.js Developer', 'API Developer'],
    coreSkills: ['Java', 'Spring Boot', 'Node.js', 'SQL', 'REST APIs', 'PostgreSQL', 'Python', 'Microservices'],
    extraSkills: ['Docker', 'Redis', 'Kafka', 'AWS', 'Git', 'MongoDB'],
    branches: [...SOFTWARE_BRANCHES, BRANCHES.ECE],
    degrees: ['B.Tech', 'B.E.', 'MCA', 'M.Tech'],
    industries: ['Fintech', 'E-commerce', 'SaaS', 'IT Services'],
  },
  {
    category: 'Frontend Developer',
    titles: ['Frontend Engineer', 'React Developer', 'UI Developer', 'Angular Developer'],
    coreSkills: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Angular', 'Next.js'],
    extraSkills: ['Redux', 'Tailwind CSS', 'Jest', 'Figma', 'Git', 'GraphQL'],
    branches: [...SOFTWARE_BRANCHES, BRANCHES.ECE],
    degrees: ['B.Tech', 'B.E.', 'MCA', 'B.Sc'],
    industries: ['E-commerce', 'SaaS', 'Media', 'IT Services'],
  },
  {
    category: 'Full Stack Developer',
    titles: ['Full Stack Engineer', 'MERN Stack Developer', 'Software Developer', 'Graduate Engineer Trainee - Full Stack'],
    coreSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'MongoDB', 'REST APIs', 'Express.js'],
    extraSkills: ['Docker', 'AWS', 'GraphQL', 'Next.js', 'Git', 'Redis'],
    branches: [...SOFTWARE_BRANCHES, BRANCHES.ECE, BRANCHES.EEE],
    degrees: ['B.Tech', 'B.E.', 'MCA', 'M.Tech'],
    industries: ['SaaS', 'Startup', 'Edtech', 'IT Services'],
  },
  {
    category: 'Data Analyst',
    titles: ['Data Analyst', 'Business Intelligence Analyst', 'Junior Data Analyst', 'Analytics Associate'],
    coreSkills: ['SQL', 'Excel', 'Python', 'Power BI', 'Tableau', 'Statistics'],
    extraSkills: ['Pandas', 'R', 'Data Visualization', 'Communication'],
    branches: [...SOFTWARE_BRANCHES, BRANCHES.ECE, BRANCHES.EEE, BRANCHES.MECH],
    degrees: ['B.Tech', 'B.E.', 'MCA', 'B.Sc', 'M.Tech'],
    industries: ['Consulting', 'Retail', 'Banking', 'Healthcare'],
  },
  {
    category: 'Data Scientist / ML Engineer',
    titles: ['Machine Learning Engineer', 'Associate Data Scientist', 'AI Engineer', 'ML Engineer - NLP'],
    coreSkills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'Scikit-learn', 'Statistics', 'SQL', 'Deep Learning'],
    extraSkills: ['TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'LLMs', 'MLOps'],
    branches: [BRANCHES.CSE, BRANCHES.AIDS, BRANCHES.IT],
    degrees: ['B.Tech', 'B.E.', 'M.Tech'],
    industries: ['AI', 'Healthcare', 'Fintech', 'SaaS'],
  },
  {
    category: 'DevOps / Cloud Engineer',
    titles: ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer - Trainee', 'Cloud Support Associate'],
    coreSkills: ['Linux', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Bash', 'Terraform'],
    extraSkills: ['Azure', 'Ansible', 'Prometheus', 'Python', 'Git', 'Networking'],
    branches: [...SOFTWARE_BRANCHES, BRANCHES.ECE],
    degrees: ['B.Tech', 'B.E.', 'MCA'],
    industries: ['Cloud', 'SaaS', 'IT Services', 'Telecom'],
  },
  {
    category: 'QA / Test Automation',
    titles: ['QA Engineer', 'Test Automation Engineer', 'Software Development Engineer in Test', 'Quality Analyst'],
    coreSkills: ['Manual Testing', 'Selenium', 'Java', 'Test Automation', 'SQL', 'Postman'],
    extraSkills: ['Cypress', 'JMeter', 'Jest', 'JIRA', 'API Testing'],
    branches: [...SOFTWARE_BRANCHES, BRANCHES.ECE, BRANCHES.EEE],
    degrees: ['B.Tech', 'B.E.', 'MCA', 'B.Sc'],
    industries: ['IT Services', 'Banking', 'SaaS'],
  },
  {
    category: 'Mobile Developer',
    titles: ['Android Developer', 'Flutter Developer', 'iOS Developer', 'Mobile App Engineer'],
    coreSkills: ['Kotlin', 'Android', 'Java', 'Flutter', 'Dart', 'Swift', 'React Native'],
    extraSkills: ['Firebase', 'REST APIs', 'Git', 'SQLite'],
    branches: [...SOFTWARE_BRANCHES, BRANCHES.ECE],
    degrees: ['B.Tech', 'B.E.', 'MCA'],
    industries: ['Consumer Apps', 'Fintech', 'Startup'],
  },
  {
    category: 'Cybersecurity Analyst',
    titles: ['Security Analyst', 'SOC Analyst', 'Associate Security Engineer'],
    coreSkills: ['Network Security', 'Linux', 'Python', 'OWASP', 'SIEM', 'Ethical Hacking'],
    extraSkills: ['Wireshark', 'Cloud Security', 'Networking', 'Bash'],
    branches: [BRANCHES.CSE, BRANCHES.IT, BRANCHES.ECE],
    degrees: ['B.Tech', 'B.E.', 'MCA', 'M.Tech'],
    industries: ['Cybersecurity', 'Banking', 'IT Services'],
  },
  {
    category: 'Embedded / IoT Engineer',
    titles: ['Embedded Software Engineer', 'IoT Engineer', 'Firmware Engineer - Trainee', 'VLSI Design Engineer'],
    coreSkills: ['C', 'C++', 'Embedded C', 'Microcontrollers', 'RTOS', 'IoT'],
    extraSkills: ['Verilog', 'VLSI', 'MATLAB', 'PCB Design', 'Python'],
    branches: [...CIRCUIT_BRANCHES, BRANCHES.CSE],
    degrees: ['B.Tech', 'B.E.', 'M.Tech'],
    industries: ['Semiconductors', 'Automotive', 'Consumer Electronics'],
  },
  {
    category: 'Mechanical / Design Engineer',
    titles: ['Graduate Engineer Trainee - Mechanical', 'Design Engineer', 'Production Engineer'],
    coreSkills: ['AutoCAD', 'SolidWorks', 'CATIA', 'GD&T', 'Manufacturing Processes'],
    extraSkills: ['ANSYS', 'MATLAB', 'Six Sigma', 'Python'],
    branches: [BRANCHES.MECH],
    degrees: ['B.Tech', 'B.E.'],
    industries: ['Automotive', 'Manufacturing', 'Aerospace'],
  },
];

export const LOCATIONS = ['Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Mumbai', 'Noida', 'Gurugram', 'Kochi', 'Coimbatore'];
