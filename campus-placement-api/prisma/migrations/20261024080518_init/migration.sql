-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('NOT_PLACED', 'IN_PROCESS', 'PLACED', 'OPTED_OUT');

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "roll_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "active_backlogs" INTEGER NOT NULL DEFAULT 0,
    "tenth_pct" DOUBLE PRECISION NOT NULL,
    "twelfth_pct" DOUBLE PRECISION NOT NULL,
    "skills" TEXT[],
    "certifications" TEXT[],
    "projects" JSONB NOT NULL DEFAULT '[]',
    "internship_months" INTEGER NOT NULL DEFAULT 0,
    "preferred_roles" TEXT[],
    "preferred_locations" TEXT[],
    "placement_status" "PlacementStatus" NOT NULL DEFAULT 'NOT_PLACED',
    "placed_company" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_roll_no_key" ON "students"("roll_no");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_branch_idx" ON "students"("branch");

-- CreateIndex
CREATE INDEX "students_placement_status_idx" ON "students"("placement_status");
