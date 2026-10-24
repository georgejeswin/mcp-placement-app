import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate, isRealisticTarget, normalizeSkill, recommendSkills } from './matching.js';
import type { Job, Student } from './types.js';

const today = new Date('2026-10-24');

const job = (overrides: Partial<Job> = {}): Job => ({
  id: 1, code: 'JOB-001', title: 'Backend Engineer', company: 'Acme', industry: 'SaaS',
  roleCategory: 'Backend Developer', description: '', location: 'Pune', workMode: 'ONSITE',
  employmentType: 'FULL_TIME', requiredSkills: ['Java', 'SQL', 'Spring Boot', 'REST APIs'],
  preferredSkills: ['Docker', 'AWS'], eligibleDegrees: ['B.Tech'], eligibleBranches: ['Computer Science'],
  eligibleGradYears: [2027], minCgpa: 7, maxActiveBacklogs: 0, minSchoolPct: 60,
  salaryMinLpa: 6, salaryMaxLpa: 9, openings: 3, status: 'OPEN', applicationDeadline: '2026-12-01T00:00:00.000Z',
  ...overrides,
});

const student = (overrides: Partial<Student> = {}): Student => ({
  id: 1, rollNo: '27CSE001', name: 'Test Student', email: '', phone: '', degree: 'B.Tech',
  branch: 'Computer Science', graduationYear: 2027, cgpa: 8.5, activeBacklogs: 0, tenthPct: 85, twelfthPct: 80,
  skills: ['java', 'SQL', 'Spring Boot', 'REST APIs', 'Docker'], certifications: [],
  projects: [{ title: 'API', techStack: ['Java', 'SQL'], description: '' }], internshipMonths: 6,
  preferredRoles: ['Backend Developer'], preferredLocations: ['Pune'], placementStatus: 'NOT_PLACED', placedCompany: null,
  ...overrides,
});

test('normalizes skill aliases and case', () => {
  assert.equal(normalizeSkill(' NodeJS '), 'node.js');
  assert.equal(normalizeSkill('Postgres'), 'postgresql');
});

test('a fully qualified student is eligible with a strong score', () => {
  const m = evaluate(student(), job(), today);
  assert.equal(m.eligible, true);
  assert.equal(m.requiredSkillCoverage, 1);
  assert.deepEqual(m.matchedPreferredSkills, ['Docker']);
  // 50 required + 7.5 preferred + 15 cgpa + 10 preference + 6 internship + 2 projects
  assert.equal(m.score, 90.5);
  assert.equal(m.fit, 'strong');
});

test('each academic rule blocks eligibility with a reason', () => {
  const cases: [Partial<Student>, string][] = [
    [{ cgpa: 6.9 }, 'cgpa'],
    [{ activeBacklogs: 1 }, 'backlogs'],
    [{ branch: 'Mechanical' }, 'branch'],
    [{ degree: 'MCA' }, 'degree'],
    [{ graduationYear: 2026 }, 'graduation_year'],
    [{ twelfthPct: 55 }, 'school_pct'],
  ];
  for (const [overrides, rule] of cases) {
    const m = evaluate(student(overrides), job(), today);
    assert.equal(m.eligible, false, rule);
    assert.deepEqual(m.failedRules.map((r) => r.rule), [rule]);
  }
});

test('closed or expired jobs are not eligible', () => {
  assert.equal(evaluate(student(), job({ status: 'CLOSED' }), today).eligible, false);
  assert.equal(evaluate(student(), job({ applicationDeadline: '2026-10-01T00:00:00.000Z' }), today).eligible, false);
});

test('skill coverage gates realistic targets', () => {
  const m = evaluate(student({ skills: ['Java', 'SQL'] }), job(), today);
  assert.equal(m.eligible, true);
  assert.equal(m.requiredSkillCoverage, 0.5);
  assert.deepEqual(m.missingRequiredSkills, ['Spring Boot', 'REST APIs']);
  assert.equal(isRealisticTarget(m, 0.6), false);
  assert.equal(isRealisticTarget(m, 0.5), true);
});

test('learning plan picks skills greedily by jobs unlocked', () => {
  const s = student({ skills: ['Java', 'SQL'] });
  const jobs = [
    job({ id: 1, requiredSkills: ['Java', 'SQL', 'Docker', 'Linux'] }),
    job({ id: 2, requiredSkills: ['Java', 'SQL', 'Docker'] }),
    job({ id: 3, requiredSkills: ['Java', 'Kafka', 'Redis'] }),
    job({ id: 4, requiredSkills: ['Java', 'SQL', 'Docker'], minCgpa: 9.9 }),
  ];
  const { eligibleJobs, plan } = recommendSkills(s, jobs, 0.75, 3, today);
  assert.equal(eligibleJobs, 3); // job 4 fails the CGPA cut-off
  assert.deepEqual(plan[0], { skill: 'Docker', realisticTargetsAfter: 2, requiredByJobs: 2 });
  // Kafka alone does nothing for job 3, but Kafka + Redis together unlock it.
  assert.deepEqual(plan.slice(1).map((p) => p.realisticTargetsAfter), [2, 3]);
});
