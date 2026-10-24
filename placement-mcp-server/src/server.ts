import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { campus, jobPortal } from './api-client.js';
import { evaluate, isAvailable, isJobOpen, isRealisticTarget, recommendSkills, type MatchResult } from './matching.js';
import type { Job, Student } from './types.js';

const DEFAULT_MIN_SKILL_COVERAGE = 0.6;

const jobSummary = (j: Job) => ({
  id: j.id,
  code: j.code,
  title: j.title,
  company: j.company,
  roleCategory: j.roleCategory,
  location: j.location,
  workMode: j.workMode,
  employmentType: j.employmentType,
  salaryLpa: `${j.salaryMinLpa}-${j.salaryMaxLpa}`,
  minCgpa: j.minCgpa,
  maxActiveBacklogs: j.maxActiveBacklogs,
  eligibleBranches: j.eligibleBranches,
  requiredSkills: j.requiredSkills,
  preferredSkills: j.preferredSkills,
  openings: j.openings,
  status: j.status,
  deadline: j.applicationDeadline.slice(0, 10),
});

// Contact details are left out of list views; get_student returns the full record.
const studentSummary = (s: Student) => ({
  id: s.id,
  rollNo: s.rollNo,
  name: s.name,
  degree: s.degree,
  branch: s.branch,
  graduationYear: s.graduationYear,
  cgpa: s.cgpa,
  activeBacklogs: s.activeBacklogs,
  skills: s.skills,
  preferredRoles: s.preferredRoles,
  placementStatus: s.placementStatus,
});

const matchSummary = (m: MatchResult) => ({
  score: m.score,
  fit: m.fit,
  eligible: m.eligible,
  requiredSkillCoverage: m.requiredSkillCoverage,
  missingRequiredSkills: m.missingRequiredSkills,
  failedRules: m.failedRules.map((r) => `${r.rule}: ${r.detail}`),
});

const json = (value: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

async function run(fn: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return json(await fn());
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: (err as Error).message }] };
  }
}

function countBy<T>(items: T[], key: (t: T) => string | string[]) {
  const counts: Record<string, number> = {};
  for (const item of items) for (const k of [key(item)].flat()) counts[k] = (counts[k] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

const studentRef = z
  .string()
  .describe('Student id (e.g. "42") or roll number (e.g. "27CSE014")');
const limit = (def: number) => z.number().int().min(1).max(200).default(def).describe(`Max results (default ${def})`);
const minSkillCoverage = z
  .number()
  .min(0)
  .max(1)
  .default(DEFAULT_MIN_SKILL_COVERAGE)
  .describe('Fraction of a job\'s required skills a student must have for it to count as a realistic target (default 0.6)');

/** Evaluates every available student against every open job once. */
async function evaluateAll(filter: { branch?: string; graduationYear?: number }) {
  const [jobs, students] = await Promise.all([jobPortal.all(), campus.all()]);
  const openJobs = jobs.filter((j) => isJobOpen(j));
  const pool = students.filter(
    (s) =>
      isAvailable(s) &&
      (!filter.branch || s.branch.toLowerCase() === filter.branch.toLowerCase()) &&
      (!filter.graduationYear || s.graduationYear === filter.graduationYear),
  );
  const results = pool.map((student) => ({
    student,
    matches: openJobs.map((job) => ({ job, match: evaluate(student, job) })),
  }));
  return { openJobs, results };
}

export function createServer() {
  const server = new McpServer(
    { name: 'placement-mcp-server', version: '1.0.0' },
    {
      instructions:
        'Campus placement assistant. Jobs come from the job portal; students come from the campus placement system. ' +
        'Eligibility is rule-based (degree, branch, graduation year, CGPA, backlogs, school %), and suitability is a 0-100 score ' +
        '(required skills 50, preferred skills 15, CGPA margin 15, role/location preference 10, internships/projects 10). ' +
        'Use match_students_for_job / match_jobs_for_student for ranking, check_eligibility to explain one pair, ' +
        'find_placeable_students and placement_insights for cohort-level questions, and recommend_upskilling for advice.',
    },
  );

  server.registerTool(
    'search_jobs',
    {
      title: 'Search job openings',
      description: 'List job openings from the job portal with optional filters. Returns compact summaries.',
      inputSchema: {
        q: z.string().optional().describe('Free-text search in title, company and description'),
        roleCategory: z.string().optional().describe('e.g. "Backend Developer", "Data Analyst"'),
        location: z.string().optional().describe('e.g. "Bengaluru" or "Remote"'),
        workMode: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
        employmentType: z.enum(['FULL_TIME', 'INTERNSHIP', 'INTERNSHIP_PPO', 'CONTRACT']).optional(),
        status: z.enum(['OPEN', 'CLOSED']).optional(),
        skills: z.array(z.string()).optional().describe('Jobs mentioning ANY of these skills (exact names, e.g. "Node.js")'),
        branch: z.string().optional().describe('Jobs open to this branch, e.g. "Computer Science"'),
        gradYear: z.number().int().optional(),
        cgpa: z.number().optional().describe('Only jobs whose CGPA cut-off is at or below this value'),
        minSalaryLpa: z.number().optional(),
        limit: limit(25),
      },
    },
    ({ limit, ...filters }) =>
      run(async () => {
        const res = await jobPortal.search({ ...filters, page: 1, limit });
        return { total: res.meta.total, returned: res.data.length, jobs: res.data.map(jobSummary) };
      }),
  );

  server.registerTool(
    'get_job',
    {
      title: 'Get job details',
      description: 'Full details of one job opening, including description and eligibility criteria.',
      inputSchema: { jobId: z.number().int().describe('Job id') },
    },
    ({ jobId }) => run(() => jobPortal.get(jobId)),
  );

  server.registerTool(
    'search_students',
    {
      title: 'Search students',
      description: 'List students from the campus placement system with optional filters. Contact details are omitted.',
      inputSchema: {
        q: z.string().optional().describe('Search in name, roll number and email'),
        branch: z.string().optional().describe('e.g. "Computer Science", "Electronics & Communication"'),
        degree: z.string().optional().describe('e.g. "B.Tech", "MCA"'),
        graduationYear: z.number().int().optional(),
        minCgpa: z.number().optional(),
        maxBacklogs: z.number().int().optional(),
        skills: z.array(z.string()).optional().describe('Students having ANY of these skills'),
        allSkills: z.array(z.string()).optional().describe('Students having ALL of these skills'),
        preferredRole: z.string().optional(),
        placementStatus: z.enum(['NOT_PLACED', 'IN_PROCESS', 'PLACED', 'OPTED_OUT']).optional(),
        sortBy: z.enum(['id', 'cgpa', 'name', 'internshipMonths']).optional(),
        order: z.enum(['asc', 'desc']).optional(),
        limit: limit(25),
      },
    },
    ({ limit, ...filters }) =>
      run(async () => {
        const res = await campus.search({ ...filters, page: 1, limit });
        return { total: res.meta.total, returned: res.data.length, students: res.data.map(studentSummary) };
      }),
  );

  server.registerTool(
    'get_student',
    {
      title: 'Get student profile',
      description: 'Full profile of one student: academics, skills, projects, certifications, preferences and status.',
      inputSchema: { student: studentRef },
    },
    ({ student }) => run(() => campus.get(student)),
  );

  server.registerTool(
    'check_eligibility',
    {
      title: 'Check student vs job',
      description: 'Explain whether a student is eligible for a job (rule by rule) and how well they fit (score breakdown).',
      inputSchema: { student: studentRef, jobId: z.number().int() },
    },
    ({ student, jobId }) =>
      run(async () => {
        const [s, job] = await Promise.all([campus.get(student), jobPortal.get(jobId)]);
        const m = evaluate(s, job);
        return { student: studentSummary(s), job: jobSummary(job), ...m };
      }),
  );

  server.registerTool(
    'match_students_for_job',
    {
      title: 'Rank students for a job',
      description: 'Rank students by suitability for one job. By default only eligible students who are still available are returned.',
      inputSchema: {
        jobId: z.number().int(),
        limit: limit(10),
        minScore: z.number().min(0).max(100).default(0),
        includeIneligible: z.boolean().default(false).describe('Also rank students who fail an eligibility rule'),
        includeUnavailable: z.boolean().default(false).describe('Also include PLACED / OPTED_OUT students'),
      },
    },
    ({ jobId, limit, minScore, includeIneligible, includeUnavailable }) =>
      run(async () => {
        const [job, students] = await Promise.all([jobPortal.get(jobId), campus.all()]);
        const evaluated = students
          .filter((s) => includeUnavailable || isAvailable(s))
          .map((s) => ({ s, m: evaluate(s, job) }));
        const eligible = evaluated.filter((e) => e.m.eligible);
        const ranked = evaluated
          .filter((e) => (includeIneligible || e.m.eligible) && e.m.score >= minScore)
          .sort((a, b) => Number(b.m.eligible) - Number(a.m.eligible) || b.m.score - a.m.score)
          .slice(0, limit);

        return {
          job: jobSummary(job),
          pool: {
            studentsConsidered: evaluated.length,
            eligible: eligible.length,
            eligibleWithStrongOrGoodFit: eligible.filter((e) => e.m.fit === 'strong' || e.m.fit === 'good').length,
            ineligibleByRule: countBy(evaluated.filter((e) => !e.m.eligible), (e) => e.m.failedRules.map((r) => r.rule)),
          },
          candidates: ranked.map(({ s, m }) => ({ ...studentSummary(s), ...matchSummary(m), reasons: m.reasons })),
        };
      }),
  );

  server.registerTool(
    'match_jobs_for_student',
    {
      title: 'Rank jobs for a student',
      description:
        'Rank open jobs by suitability for one student. Also returns "nearMisses": well-matched jobs blocked by exactly one rule.',
      inputSchema: {
        student: studentRef,
        limit: limit(10),
        includeClosed: z.boolean().default(false),
      },
    },
    ({ student, limit, includeClosed }) =>
      run(async () => {
        const [s, jobs] = await Promise.all([campus.get(student), jobPortal.all()]);
        const evaluated = jobs
          .filter((j) => includeClosed || isJobOpen(j))
          .map((job) => ({ job, m: evaluate(s, job) }))
          .sort((a, b) => b.m.score - a.m.score);
        const eligible = evaluated.filter((e) => e.m.eligible);
        const nearMisses = evaluated
          .filter((e) => !e.m.eligible && e.m.failedRules.length === 1 && e.m.requiredSkillCoverage >= DEFAULT_MIN_SKILL_COVERAGE)
          .slice(0, 5);

        return {
          student: studentSummary(s),
          available: isAvailable(s),
          jobsConsidered: evaluated.length,
          eligibleJobs: eligible.length,
          matches: eligible.slice(0, limit).map(({ job, m }) => ({ ...jobSummary(job), ...matchSummary(m), reasons: m.reasons })),
          nearMisses: nearMisses.map(({ job, m }) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            score: m.score,
            blockedBy: `${m.failedRules[0].rule}: ${m.failedRules[0].detail}`,
          })),
        };
      }),
  );

  server.registerTool(
    'find_placeable_students',
    {
      title: 'Find placeable students',
      description:
        'Available students who are eligible for at least one open job AND cover enough of its required skills. ' +
        'Also summarises why the remaining students are not yet placeable.',
      inputSchema: {
        branch: z.string().optional(),
        graduationYear: z.number().int().optional(),
        minSkillCoverage,
        limit: limit(50),
      },
    },
    ({ branch, graduationYear, minSkillCoverage, limit }) =>
      run(async () => {
        const { openJobs, results } = await evaluateAll({ branch, graduationYear });

        const rows = results.map(({ student, matches }) => {
          const targets = matches
            .filter((x) => isRealisticTarget(x.match, minSkillCoverage))
            .sort((a, b) => b.match.score - a.match.score);
          return { student, matches, targets };
        });
        const placeable = rows.filter((r) => r.targets.length > 0).sort((a, b) => b.targets[0].match.score - a.targets[0].match.score);
        const notPlaceable = rows.filter((r) => r.targets.length === 0);

        // Why a student has no realistic target: eligible somewhere but short on skills, or else the rule failing most often.
        const blockerOf = (r: (typeof rows)[number]): string => {
          if (r.matches.some((x) => x.match.eligible)) return 'skills_gap';
          const [topRule] = Object.keys(countBy(r.matches, (x) => x.match.failedRules.map((f) => f.rule)));
          return topRule ? `blocked_by_${topRule}` : 'no_open_jobs';
        };

        return {
          openJobs: openJobs.length,
          availableStudents: rows.length,
          placeableCount: placeable.length,
          notPlaceableCount: notPlaceable.length,
          criteria: { minSkillCoverage },
          placeable: placeable.slice(0, limit).map((r) => ({
            ...studentSummary(r.student),
            realisticTargets: r.targets.length,
            strongMatches: r.targets.filter((t) => t.match.fit === 'strong').length,
            bestMatches: r.targets.slice(0, 3).map((t) => ({
              jobId: t.job.id,
              title: t.job.title,
              company: t.job.company,
              score: t.match.score,
              fit: t.match.fit,
            })),
          })),
          notPlaceable: {
            byReason: countBy(notPlaceable, blockerOf),
            students: notPlaceable.slice(0, limit).map((r) => ({
              id: r.student.id,
              rollNo: r.student.rollNo,
              name: r.student.name,
              branch: r.student.branch,
              cgpa: r.student.cgpa,
              activeBacklogs: r.student.activeBacklogs,
              reason: blockerOf(r),
            })),
          },
        };
      }),
  );

  server.registerTool(
    'recommend_upskilling',
    {
      title: 'Recommend skills to learn',
      description:
        'Step-by-step learning plan for one student: each step adds the missing skill that turns the most open jobs ' +
        '(that the student already meets the academic criteria for) into realistic targets.',
      inputSchema: {
        student: studentRef,
        minSkillCoverage,
        maxSkills: limit(5).describe('Max skills in the plan (default 5)'),
        targetRoles: z
          .union([z.literal('preferred'), z.literal('all'), z.array(z.string())])
          .default('preferred')
          .describe('"preferred" = the student\'s preferred roles (default), "all", or a list of role categories'),
      },
    },
    ({ student, minSkillCoverage, maxSkills, targetRoles }) =>
      run(async () => {
        const [s, jobs] = await Promise.all([campus.get(student), jobPortal.all()]);
        const roles = targetRoles === 'all' ? undefined : (targetRoles === 'preferred' ? s.preferredRoles : targetRoles).map((r) => r.toLowerCase());
        const openJobs = jobs.filter((j) => isJobOpen(j) && (!roles || roles.includes(j.roleCategory.toLowerCase())));
        const { eligibleJobs, plan } = recommendSkills(s, openJobs, minSkillCoverage, maxSkills);
        return {
          student: studentSummary(s),
          targetRoles: roles ? targetRoles === 'preferred' ? s.preferredRoles : targetRoles : 'all',
          academicallyEligibleJobs: eligibleJobs,
          currentRealisticTargets: openJobs.filter((j) => isRealisticTarget(evaluate(s, j), minSkillCoverage)).length,
          learningPlan: plan,
          note: eligibleJobs === 0 ? 'Student fails academic criteria (CGPA/backlogs/branch/year) for every open job; skills alone will not help.' : undefined,
        };
      }),
  );

  server.registerTool(
    'placement_insights',
    {
      title: 'Placement insights',
      description:
        'Cohort overview: placeable students by branch, open roles vs candidate supply, skill demand vs supply, and common blockers.',
      inputSchema: { graduationYear: z.number().int().optional(), minSkillCoverage },
    },
    ({ graduationYear, minSkillCoverage }) =>
      run(async () => {
        const [{ openJobs, results }, students] = await Promise.all([evaluateAll({ graduationYear }), campus.all()]);
        const cohort = students.filter((s) => !graduationYear || s.graduationYear === graduationYear);
        const isPlaceable = (r: (typeof results)[number]) => r.matches.some((x) => isRealisticTarget(x.match, minSkillCoverage));

        const byBranch: Record<string, { total: number; available: number; placeable: number; placed: number }> = {};
        for (const s of cohort) {
          const b = (byBranch[s.branch] ??= { total: 0, available: 0, placeable: 0, placed: 0 });
          b.total++;
          if (s.placementStatus === 'PLACED') b.placed++;
        }
        for (const r of results) {
          byBranch[r.student.branch].available++;
          if (isPlaceable(r)) byBranch[r.student.branch].placeable++;
        }

        const roles = [...new Set(openJobs.map((j) => j.roleCategory))].map((role) => {
          const roleJobs = openJobs.filter((j) => j.roleCategory === role);
          const candidates = results.filter((r) =>
            r.matches.some((x) => x.job.roleCategory === role && isRealisticTarget(x.match, minSkillCoverage)),
          ).length;
          const openings = roleJobs.reduce((n, j) => n + j.openings, 0);
          return { role, openJobs: roleJobs.length, openings, realisticCandidates: candidates };
        });

        const demand = countBy(openJobs, (j) => j.requiredSkills);
        const available = results.map((r) => r.student);
        const skillGap = Object.entries(demand)
          .slice(0, 15)
          .map(([skill, jobs]) => ({
            skill,
            requiredByOpenJobs: jobs,
            availableStudentsWithSkill: available.filter((s) => s.skills.includes(skill)).length,
          }));

        const blockers = countBy(
          results.flatMap((r) => r.matches.filter((x) => !x.match.eligible)),
          (x) => x.match.failedRules.filter((f) => f.rule !== 'job_open').map((f) => f.rule),
        );

        const placeableCount = results.filter(isPlaceable).length;
        return {
          graduationYear: graduationYear ?? 'all',
          students: cohort.length,
          byStatus: countBy(cohort, (s) => s.placementStatus),
          availableStudents: results.length,
          placeableStudents: placeableCount,
          placeablePct: results.length ? Math.round((placeableCount / results.length) * 100) : 0,
          openJobs: openJobs.length,
          totalOpenings: openJobs.reduce((n, j) => n + j.openings, 0),
          byBranch,
          rolesSupplyVsDemand: roles.sort((a, b) => b.openings - a.openings),
          topRequiredSkills: skillGap,
          eligibilityFailuresByRule: blockers,
        };
      }),
  );

  return server;
}
