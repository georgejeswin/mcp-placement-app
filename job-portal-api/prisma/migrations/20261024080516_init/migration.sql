-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'INTERNSHIP', 'INTERNSHIP_PPO', 'CONTRACT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "role_category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "work_mode" "WorkMode" NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "required_skills" TEXT[],
    "preferred_skills" TEXT[],
    "eligible_degrees" TEXT[],
    "eligible_branches" TEXT[],
    "eligible_grad_years" INTEGER[],
    "min_cgpa" DOUBLE PRECISION NOT NULL,
    "max_active_backlogs" INTEGER NOT NULL,
    "min_school_pct" DOUBLE PRECISION,
    "salary_min_lpa" DOUBLE PRECISION NOT NULL,
    "salary_max_lpa" DOUBLE PRECISION NOT NULL,
    "openings" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "application_deadline" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_code_key" ON "jobs"("code");

-- CreateIndex
CREATE INDEX "jobs_role_category_idx" ON "jobs"("role_category");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");
