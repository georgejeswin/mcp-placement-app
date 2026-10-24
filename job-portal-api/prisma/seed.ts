import { faker } from '@faker-js/faker';
import { EmploymentType, JobStatus, PrismaClient, WorkMode } from '../src/generated/prisma';
import { LOCATIONS, ROLE_PROFILES, type RoleProfile } from './catalog';

const prisma = new PrismaClient();
faker.seed(2027);

// How many of the 100 openings belong to each role category.
const ROLE_COUNTS: Record<string, number> = {
  'Backend Developer': 16,
  'Frontend Developer': 12,
  'Full Stack Developer': 14,
  'Data Analyst': 10,
  'Data Scientist / ML Engineer': 10,
  'DevOps / Cloud Engineer': 9,
  'QA / Test Automation': 9,
  'Mobile Developer': 7,
  'Cybersecurity Analyst': 5,
  'Embedded / IoT Engineer': 5,
  'Mechanical / Design Engineer': 3,
};

// Salary tier drives how strict the eligibility criteria are.
const TIERS = [
  { name: 'dream', weight: 2, salary: [12, 28], cgpa: [8.0, 8.5], backlogs: [0], schoolPct: 75 },
  { name: 'core', weight: 5, salary: [6, 12], cgpa: [7.0, 7.5], backlogs: [0, 1], schoolPct: 60 },
  { name: 'mass', weight: 3, salary: [3.5, 6], cgpa: [6.0, 6.5], backlogs: [1, 2], schoolPct: null },
] as const;

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function buildJob(profile: RoleProfile, index: number) {
  const tier = faker.helpers.weightedArrayElement(TIERS.map((t) => ({ weight: t.weight, value: t })));
  const employmentType = faker.helpers.weightedArrayElement([
    { weight: 7, value: EmploymentType.FULL_TIME },
    { weight: 2, value: EmploymentType.INTERNSHIP_PPO },
    { weight: 1, value: EmploymentType.INTERNSHIP },
  ]);
  const workMode = faker.helpers.weightedArrayElement([
    { weight: 5, value: WorkMode.ONSITE },
    { weight: 4, value: WorkMode.HYBRID },
    { weight: 1, value: WorkMode.REMOTE },
  ]);
  const requiredSkills = faker.helpers.arrayElements(profile.coreSkills, { min: 3, max: 5 });
  const preferredSkills = faker.helpers.arrayElements(profile.extraSkills, { min: 2, max: 3 });
  const isOpen = index % 10 !== 9; // every 10th listing is closed
  const salaryMin = round1(faker.number.float({ min: tier.salary[0], max: (tier.salary[0] + tier.salary[1]) / 2 }));
  const salaryMax = round1(faker.number.float({ min: salaryMin + 1, max: tier.salary[1] }));
  const company = faker.company.name();
  const title = faker.helpers.arrayElement(profile.titles);

  return {
    code: `JOB-${String(index + 1).padStart(3, '0')}`,
    title: employmentType === EmploymentType.FULL_TIME ? title : `${title} Intern`,
    company,
    industry: faker.helpers.arrayElement(profile.industries),
    roleCategory: profile.category,
    description:
      `${company} is hiring a ${title} to join its ${faker.commerce.department().toLowerCase()} team. ` +
      `You will work with ${requiredSkills.slice(0, 3).join(', ')} and collaborate with cross-functional teams ` +
      `to ${faker.company.buzzPhrase().toLowerCase()}.`,
    location: workMode === WorkMode.REMOTE ? 'Remote' : faker.helpers.arrayElement(LOCATIONS),
    workMode,
    employmentType,
    requiredSkills,
    preferredSkills,
    eligibleDegrees: profile.degrees,
    eligibleBranches: faker.helpers.arrayElements(profile.branches, {
      min: Math.min(2, profile.branches.length),
      max: profile.branches.length,
    }),
    eligibleGradYears: employmentType === EmploymentType.FULL_TIME && faker.datatype.boolean(0.25) ? [2026, 2027] : [2027],
    minCgpa: faker.helpers.arrayElement(tier.cgpa),
    maxActiveBacklogs: faker.helpers.arrayElement(tier.backlogs),
    minSchoolPct: tier.schoolPct,
    salaryMinLpa: salaryMin,
    salaryMaxLpa: salaryMax,
    openings: faker.number.int({ min: 1, max: tier.name === 'mass' ? 40 : 8 }),
    status: isOpen ? JobStatus.OPEN : JobStatus.CLOSED,
    applicationDeadline: isOpen
      ? faker.date.between({ from: '2026-11-05', to: '2027-01-31' })
      : faker.date.between({ from: '2026-08-01', to: '2026-10-15' }),
  };
}

async function main() {
  const profiles = ROLE_PROFILES.flatMap((p) => Array.from({ length: ROLE_COUNTS[p.category] ?? 0 }, () => p));
  const jobs = faker.helpers.shuffle(profiles).map((profile, i) => buildJob(profile, i));

  await prisma.job.deleteMany();
  await prisma.$executeRawUnsafe('ALTER SEQUENCE jobs_id_seq RESTART WITH 1');
  const { count } = await prisma.job.createMany({ data: jobs });
  console.log(`Seeded ${count} jobs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
