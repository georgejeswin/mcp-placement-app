import { fakerEN_IN as faker } from '@faker-js/faker';
import { PlacementStatus, PrismaClient } from '../src/generated/prisma';
import { BRANCHES, LOCATIONS, ROLE_PROFILES, type RoleProfile } from './catalog';

const prisma = new PrismaClient();
faker.seed(2027);

type Branch = (typeof BRANCHES)[keyof typeof BRANCHES];

const BRANCH_SETUP: { branch: Branch; code: string; count: number; roles: [string, number][] }[] = [
  {
    branch: BRANCHES.CSE, code: 'CSE', count: 55,
    roles: [['Backend Developer', 5], ['Full Stack Developer', 5], ['Frontend Developer', 3], ['Data Scientist / ML Engineer', 3], ['DevOps / Cloud Engineer', 2], ['Mobile Developer', 2], ['Cybersecurity Analyst', 1], ['QA / Test Automation', 1]],
  },
  {
    branch: BRANCHES.IT, code: 'IT', count: 35,
    roles: [['Full Stack Developer', 4], ['Frontend Developer', 3], ['Backend Developer', 3], ['QA / Test Automation', 2], ['DevOps / Cloud Engineer', 2], ['Data Analyst', 2], ['Cybersecurity Analyst', 1]],
  },
  {
    branch: BRANCHES.AIDS, code: 'AD', count: 25,
    roles: [['Data Scientist / ML Engineer', 6], ['Data Analyst', 3], ['Backend Developer', 1]],
  },
  {
    branch: BRANCHES.ECE, code: 'ECE', count: 35,
    roles: [['Embedded / IoT Engineer', 5], ['Full Stack Developer', 2], ['Backend Developer', 2], ['QA / Test Automation', 2], ['Data Analyst', 1], ['DevOps / Cloud Engineer', 1]],
  },
  {
    branch: BRANCHES.EEE, code: 'EEE', count: 20,
    roles: [['Embedded / IoT Engineer', 4], ['Data Analyst', 2], ['QA / Test Automation', 2], ['Full Stack Developer', 1]],
  },
  {
    branch: BRANCHES.MECH, code: 'ME', count: 12,
    roles: [['Mechanical / Design Engineer', 5], ['Data Analyst', 2]],
  },
  {
    branch: BRANCHES.MCA, code: 'MCA', count: 18,
    roles: [['Full Stack Developer', 3], ['Backend Developer', 2], ['Frontend Developer', 2], ['QA / Test Automation', 2], ['Data Analyst', 1], ['Mobile Developer', 1]],
  },
];

const PROJECT_IDEAS: Record<string, string[]> = {
  'Backend Developer': ['Library Management API', 'Payment Gateway Simulator', 'URL Shortener Service', 'Hostel Booking Backend'],
  'Frontend Developer': ['Portfolio Website', 'Weather Dashboard', 'Movie Discovery App', 'Recipe Finder UI'],
  'Full Stack Developer': ['Campus Event Portal', 'E-commerce Store', 'Real-time Chat App', 'Expense Tracker'],
  'Data Analyst': ['Sales Performance Dashboard', 'COVID-19 Trend Analysis', 'Customer Churn Analysis', 'IPL Stats Explorer'],
  'Data Scientist / ML Engineer': ['Crop Yield Prediction', 'Fake News Classifier', 'Resume Screening with NLP', 'Face Mask Detection'],
  'DevOps / Cloud Engineer': ['CI/CD Pipeline for Microservices', 'Kubernetes Monitoring Stack', 'Serverless Image Resizer'],
  'QA / Test Automation': ['Automated Test Suite for E-commerce', 'API Regression Framework', 'Load Testing Toolkit'],
  'Mobile Developer': ['Attendance Tracker App', 'Food Delivery App Clone', 'Habit Tracker'],
  'Cybersecurity Analyst': ['Network Intrusion Detector', 'Phishing URL Detector', 'Vulnerability Scanner'],
  'Embedded / IoT Engineer': ['Smart Irrigation System', 'Home Automation with ESP32', 'Vehicle Tracking with GPS', 'RISC-V ALU in Verilog'],
  'Mechanical / Design Engineer': ['Go-Kart Chassis Design', 'Solar Dryer Design', 'Gearbox Optimisation with FEA'],
};

const CERTIFICATIONS: Record<string, string[]> = {
  'Backend Developer': ['Java Programming Certificate', 'SQL Advanced Certificate', 'AWS Cloud Practitioner'],
  'Frontend Developer': ['Responsive Web Design Certificate', 'JavaScript Algorithms Certificate'],
  'Full Stack Developer': ['Full Stack Web Development Bootcamp', 'MongoDB Developer Certificate', 'AWS Cloud Practitioner'],
  'Data Analyst': ['Data Analytics Professional Certificate', 'Power BI Data Analyst Certificate'],
  'Data Scientist / ML Engineer': ['Machine Learning Specialization', 'Deep Learning Specialization', 'TensorFlow Developer Certificate'],
  'DevOps / Cloud Engineer': ['AWS Solutions Architect Associate', 'Kubernetes Administrator Certificate', 'Azure Fundamentals'],
  'QA / Test Automation': ['ISTQB Foundation Level', 'Selenium WebDriver Certificate'],
  'Mobile Developer': ['Android Developer Certificate', 'Flutter Development Bootcamp'],
  'Cybersecurity Analyst': ['CompTIA Security+', 'Certified Ethical Hacker'],
  'Embedded / IoT Engineer': ['Embedded Systems Certificate', 'IoT Fundamentals'],
  'Mechanical / Design Engineer': ['SolidWorks Associate Certificate', 'Six Sigma Yellow Belt'],
};

const profileByCategory = new Map(ROLE_PROFILES.map((p) => [p.category, p]));

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;

/** Standard normal sample via Box-Muller using faker's seeded RNG. */
function gaussian() {
  const u = faker.number.float({ min: 1e-9, max: 1 });
  const v = faker.number.float({ min: 0, max: 1 });
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pickRole(roles: [string, number][]): RoleProfile {
  const category = faker.helpers.weightedArrayElement(roles.map(([value, weight]) => ({ value, weight })));
  return profileByCategory.get(category)!;
}

function buildStudent(setup: (typeof BRANCH_SETUP)[number], serial: number, graduationYear: number) {
  // A single latent "strength" drives CGPA, skills, internships and backlogs so the data is coherent.
  const strength = gaussian();
  const primary = pickRole(setup.roles);
  const secondary = faker.datatype.boolean(0.35) ? pickRole(setup.roles) : undefined;

  const coreCount = clamp(Math.round(3 + 1.3 * strength + gaussian() * 0.6), 1, primary.coreSkills.length);
  const skills = new Set([
    ...faker.helpers.arrayElements(primary.coreSkills, coreCount),
    ...faker.helpers.arrayElements(primary.extraSkills, clamp(Math.round(1 + strength), 0, 3)),
  ]);
  if (secondary && secondary !== primary) {
    faker.helpers.arrayElements(secondary.coreSkills, { min: 1, max: 3 }).forEach((s) => skills.add(s));
  }
  if (faker.datatype.boolean(0.6)) skills.add('Git');

  const backlogs = strength < -1.2
    ? faker.helpers.weightedArrayElement([{ value: 1, weight: 4 }, { value: 2, weight: 3 }, { value: 3, weight: 2 }, { value: 0, weight: 1 }])
    : strength < -0.4 && faker.datatype.boolean(0.2) ? 1 : 0;

  const skillList = [...skills];
  const projects = faker.helpers
    .arrayElements(PROJECT_IDEAS[primary.category], clamp(Math.round(1.5 + strength), 0, 3))
    .map((title) => ({
      title,
      techStack: faker.helpers.arrayElements(skillList, Math.min(skillList.length, faker.number.int({ min: 2, max: 4 }))),
      description: `Built a ${title.toLowerCase()} as part of ${faker.helpers.arrayElement(['a hackathon', 'the final-year project', 'a mini project', 'self-learning'])}.`,
    }));

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const rollNo = `${String(graduationYear).slice(2)}${setup.code}${String(serial).padStart(3, '0')}`;
  const placementStatus = graduationYear === 2026
    ? PlacementStatus.NOT_PLACED
    : faker.helpers.weightedArrayElement([
        { value: PlacementStatus.NOT_PLACED, weight: 68 },
        { value: PlacementStatus.IN_PROCESS, weight: 14 },
        { value: PlacementStatus.PLACED, weight: 12 },
        { value: PlacementStatus.OPTED_OUT, weight: 6 },
      ]);

  return {
    rollNo,
    name: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}.${rollNo}`.toLowerCase().replace(/[^a-z0-9.]/g, '') + '@students.example.edu',
    phone: `+91 ${faker.helpers.arrayElement(['6', '7', '8', '9'])}${faker.string.numeric(9)}`,
    degree: setup.branch === BRANCHES.MCA ? 'MCA' : faker.helpers.weightedArrayElement([{ value: 'B.Tech', weight: 3 }, { value: 'B.E.', weight: 1 }]),
    branch: setup.branch,
    graduationYear,
    cgpa: round(clamp(7.3 + 0.85 * strength + gaussian() * 0.35, 5.2, 9.8), 2),
    activeBacklogs: backlogs,
    tenthPct: round(clamp(82 + 7 * strength + gaussian() * 5, 55, 99)),
    twelfthPct: round(clamp(78 + 8 * strength + gaussian() * 6, 52, 98)),
    skills: skillList,
    certifications: faker.helpers.arrayElements(CERTIFICATIONS[primary.category], clamp(Math.round(0.5 + strength), 0, 2)),
    projects,
    internshipMonths: strength > 0.3 ? faker.helpers.arrayElement([2, 3, 6]) : faker.helpers.arrayElement([0, 0, 0, 2]),
    preferredRoles: [...new Set([primary.category, ...(secondary ? [secondary.category] : [])])],
    preferredLocations: faker.datatype.boolean(0.2)
      ? ['Any']
      : faker.helpers.arrayElements([...LOCATIONS, 'Remote'], { min: 2, max: 3 }),
    placementStatus,
    placedCompany: placementStatus === PlacementStatus.PLACED ? faker.company.name() : null,
  };
}

async function main() {
  const students = BRANCH_SETUP.flatMap((setup) =>
    // ~10% of each branch are 2026 graduates still looking for a job.
    Array.from({ length: setup.count }, (_, i) =>
      buildStudent(setup, i + 1, i < Math.round(setup.count * 0.1) ? 2026 : 2027),
    ),
  );

  await prisma.student.deleteMany();
  await prisma.$executeRawUnsafe('ALTER SEQUENCE students_id_seq RESTART WITH 1');
  const { count } = await prisma.student.createMany({ data: students });
  console.log(`Seeded ${count} students`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
