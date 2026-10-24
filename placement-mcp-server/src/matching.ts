import type { Job, Student } from './types.js';

// Score weights (sum to 100).
const WEIGHTS = {
  requiredSkills: 50,
  preferredSkills: 15,
  cgpaMargin: 15,
  preferenceFit: 10,
  experience: 10,
};

/** CGPA points above the cut-off that earn the full CGPA-margin score. */
const FULL_CGPA_MARGIN = 1.5;

const SKILL_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  node: 'node.js',
  nodejs: 'node.js',
  reactjs: 'react',
  'react.js': 'react',
  nextjs: 'next.js',
  express: 'express.js',
  postgres: 'postgresql',
  k8s: 'kubernetes',
  ml: 'machine learning',
  dl: 'deep learning',
  'ci-cd': 'ci/cd',
  sklearn: 'scikit-learn',
};

export const normalizeSkill = (skill: string) => {
  const s = skill.trim().toLowerCase();
  return SKILL_ALIASES[s] ?? s;
};

export type Rule = 'job_open' | 'degree' | 'branch' | 'graduation_year' | 'cgpa' | 'backlogs' | 'school_pct';

export interface RuleCheck {
  rule: Rule;
  passed: boolean;
  detail: string;
}

export interface MatchResult {
  eligible: boolean;
  /** Student has not been placed and has not opted out. */
  available: boolean;
  score: number;
  fit: 'strong' | 'good' | 'moderate' | 'weak';
  requiredSkillCoverage: number;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  failedRules: RuleCheck[];
  checks: RuleCheck[];
  breakdown: Record<keyof typeof WEIGHTS, number>;
  reasons: string[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export const isAvailable = (s: Student) => s.placementStatus === 'NOT_PLACED' || s.placementStatus === 'IN_PROCESS';

export const isJobOpen = (job: Job, today = new Date()) =>
  job.status === 'OPEN' && new Date(job.applicationDeadline).getTime() >= startOfDay(today).getTime();

function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function overlap(jobSkills: string[], studentSkills: Set<string>) {
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of jobSkills) (studentSkills.has(normalizeSkill(skill)) ? matched : missing).push(skill);
  return { matched, missing };
}

export function checkRules(student: Student, job: Job, today = new Date()): RuleCheck[] {
  const lowestSchoolPct = Math.min(student.tenthPct, student.twelfthPct);
  const lower = (xs: string[]) => xs.map((x) => x.toLowerCase());

  const checks: RuleCheck[] = [
    {
      rule: 'job_open',
      passed: isJobOpen(job, today),
      detail: job.status !== 'OPEN' ? 'job is closed' : `applications close ${job.applicationDeadline.slice(0, 10)}`,
    },
    {
      rule: 'degree',
      passed: lower(job.eligibleDegrees).includes(student.degree.toLowerCase()),
      detail: `${student.degree} vs allowed ${job.eligibleDegrees.join(', ')}`,
    },
    {
      rule: 'branch',
      passed: lower(job.eligibleBranches).includes(student.branch.toLowerCase()),
      detail: `${student.branch} vs allowed ${job.eligibleBranches.join(', ')}`,
    },
    {
      rule: 'graduation_year',
      passed: job.eligibleGradYears.includes(student.graduationYear),
      detail: `${student.graduationYear} vs allowed ${job.eligibleGradYears.join(', ')}`,
    },
    {
      rule: 'cgpa',
      passed: student.cgpa >= job.minCgpa,
      detail: `CGPA ${student.cgpa} vs cut-off ${job.minCgpa}`,
    },
    {
      rule: 'backlogs',
      passed: student.activeBacklogs <= job.maxActiveBacklogs,
      detail: `${student.activeBacklogs} active backlog(s) vs max ${job.maxActiveBacklogs}`,
    },
  ];
  if (job.minSchoolPct !== null) {
    checks.push({
      rule: 'school_pct',
      passed: lowestSchoolPct >= job.minSchoolPct,
      detail: `lowest of 10th/12th is ${lowestSchoolPct}% vs required ${job.minSchoolPct}%`,
    });
  }
  return checks;
}

/** Rule-based eligibility plus a 0-100 suitability score with an explanation. */
export function evaluate(student: Student, job: Job, today = new Date()): MatchResult {
  const checks = checkRules(student, job, today);
  const failedRules = checks.filter((c) => !c.passed);
  const eligible = failedRules.length === 0;

  const studentSkills = new Set(student.skills.map(normalizeSkill));
  const required = overlap(job.requiredSkills, studentSkills);
  const preferred = overlap(job.preferredSkills, studentSkills);
  const requiredSkillCoverage = job.requiredSkills.length ? required.matched.length / job.requiredSkills.length : 1;
  const preferredCoverage = job.preferredSkills.length ? preferred.matched.length / job.preferredSkills.length : 0;

  const roleMatch = student.preferredRoles.some((r) => r.toLowerCase() === job.roleCategory.toLowerCase());
  const locations = student.preferredLocations.map((l) => l.toLowerCase());
  const locationMatch =
    job.workMode === 'REMOTE' || locations.includes('any') || locations.includes(job.location.toLowerCase());

  const jobSkills = new Set([...job.requiredSkills, ...job.preferredSkills].map(normalizeSkill));
  const relevantProjects = student.projects.filter((p) => p.techStack.some((t) => jobSkills.has(normalizeSkill(t))));

  const breakdown = {
    requiredSkills: WEIGHTS.requiredSkills * requiredSkillCoverage,
    preferredSkills: WEIGHTS.preferredSkills * preferredCoverage,
    cgpaMargin: WEIGHTS.cgpaMargin * clamp01((student.cgpa - job.minCgpa) / FULL_CGPA_MARGIN),
    preferenceFit: (roleMatch ? 7 : 0) + (locationMatch ? 3 : 0),
    experience: 6 * clamp01(student.internshipMonths / 6) + 4 * clamp01(relevantProjects.length / 2),
  };
  for (const key of Object.keys(breakdown) as (keyof typeof breakdown)[]) breakdown[key] = round1(breakdown[key]);
  const score = round1(Object.values(breakdown).reduce((a, b) => a + b, 0));

  const reasons = [
    `matches ${required.matched.length}/${job.requiredSkills.length} required skills` +
      (required.missing.length ? ` (missing ${required.missing.join(', ')})` : ''),
    `${preferred.matched.length}/${job.preferredSkills.length} preferred skills`,
    `CGPA ${student.cgpa} vs cut-off ${job.minCgpa}`,
    roleMatch ? `role is in student's preferences` : `role not in student's preferences (${student.preferredRoles.join(', ')})`,
    locationMatch ? `location fits` : `${job.location} not in preferred locations`,
    `${student.internshipMonths} month(s) internship, ${relevantProjects.length} relevant project(s)`,
    ...failedRules.map((r) => `NOT ELIGIBLE - ${r.rule}: ${r.detail}`),
  ];

  return {
    eligible,
    available: isAvailable(student),
    score,
    fit: score >= 75 ? 'strong' : score >= 55 ? 'good' : score >= 40 ? 'moderate' : 'weak',
    requiredSkillCoverage: round1(requiredSkillCoverage * 100) / 100,
    matchedRequiredSkills: required.matched,
    missingRequiredSkills: required.missing,
    matchedPreferredSkills: preferred.matched,
    failedRules,
    checks,
    breakdown,
    reasons,
  };
}

/** A job is a realistic target when the student is eligible and covers enough of its required skills. */
export const isRealisticTarget = (m: MatchResult, minSkillCoverage: number) =>
  m.eligible && m.requiredSkillCoverage >= minSkillCoverage;

export interface LearningStep {
  skill: string;
  /** Realistic targets once this skill and all earlier steps are learned. */
  realisticTargetsAfter: number;
  /** Academically eligible jobs that list this skill as required. */
  requiredByJobs: number;
}

/**
 * Greedy learning plan: repeatedly pick the missing skill that turns the most academically eligible
 * jobs into realistic targets, given the skills picked so far.
 */
export function recommendSkills(student: Student, jobs: Job[], minSkillCoverage: number, maxSteps: number, today = new Date()) {
  const eligibleJobs = jobs.filter((job) => evaluate(student, job, today).eligible);
  const known = new Set(student.skills.map(normalizeSkill));
  const coverage = (job: Job) =>
    job.requiredSkills.length ? job.requiredSkills.filter((s) => known.has(normalizeSkill(s))).length / job.requiredSkills.length : 1;
  const targets = () => eligibleJobs.filter((job) => coverage(job) >= minSkillCoverage).length;

  const candidates = new Map<string, string>(); // normalized -> display name
  for (const job of eligibleJobs) for (const s of job.requiredSkills) if (!known.has(normalizeSkill(s))) candidates.set(normalizeSkill(s), s);
  const requiredBy = (skill: string) => eligibleJobs.filter((j) => j.requiredSkills.some((s) => normalizeSkill(s) === skill)).length;

  const plan: LearningStep[] = [];
  while (plan.length < maxSteps && candidates.size) {
    let best: { skill: string; after: number; progress: number; requiredBy: number } | undefined;
    // Ties go to skills that move not-yet-reachable jobs closer to the bar, then to the most demanded.
    const unmet = eligibleJobs.filter((job) => coverage(job) < minSkillCoverage);
    for (const skill of candidates.keys()) {
      known.add(skill);
      const after = targets();
      known.delete(skill);
      const progress = unmet.filter((j) => j.requiredSkills.some((s) => normalizeSkill(s) === skill)).length;
      const req = requiredBy(skill);
      const better =
        !best ||
        after > best.after ||
        (after === best.after && (progress > best.progress || (progress === best.progress && req > best.requiredBy)));
      if (better) best = { skill, after, progress, requiredBy: req };
    }
    known.add(best!.skill);
    plan.push({ skill: candidates.get(best!.skill)!, realisticTargetsAfter: best!.after, requiredByJobs: best!.requiredBy });
    candidates.delete(best!.skill);
  }
  return { eligibleJobs: eligibleJobs.length, plan };
}
