// Shapes returned by job-portal-api and campus-placement-api.

export type WorkMode = 'ONSITE' | 'HYBRID' | 'REMOTE';
export type EmploymentType = 'FULL_TIME' | 'INTERNSHIP' | 'INTERNSHIP_PPO' | 'CONTRACT';
export type PlacementStatus = 'NOT_PLACED' | 'IN_PROCESS' | 'PLACED' | 'OPTED_OUT';

export interface Job {
  id: number;
  code: string;
  title: string;
  company: string;
  industry: string;
  roleCategory: string;
  description: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  requiredSkills: string[];
  preferredSkills: string[];
  eligibleDegrees: string[];
  eligibleBranches: string[];
  eligibleGradYears: number[];
  minCgpa: number;
  maxActiveBacklogs: number;
  minSchoolPct: number | null;
  salaryMinLpa: number;
  salaryMaxLpa: number;
  openings: number;
  status: 'OPEN' | 'CLOSED';
  applicationDeadline: string;
}

export interface Project {
  title: string;
  techStack: string[];
  description: string;
}

export interface Student {
  id: number;
  rollNo: string;
  name: string;
  email: string;
  phone: string;
  degree: string;
  branch: string;
  graduationYear: number;
  cgpa: number;
  activeBacklogs: number;
  tenthPct: number;
  twelfthPct: number;
  skills: string[];
  certifications: string[];
  projects: Project[];
  internshipMonths: number;
  preferredRoles: string[];
  preferredLocations: string[];
  placementStatus: PlacementStatus;
  placedCompany: string | null;
}

export interface ListResponse<T> {
  data: T[];
  meta: { total: number; page?: number; limit?: number; pages?: number };
}
