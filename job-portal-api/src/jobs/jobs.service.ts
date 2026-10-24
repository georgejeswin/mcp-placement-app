import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { ListJobsQuery } from './dto/list-jobs.query';

const insensitive = (value: string) => ({ equals: value, mode: Prisma.QueryMode.insensitive });

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListJobsQuery) {
    const where: Prisma.JobWhereInput = {
      roleCategory: query.roleCategory ? insensitive(query.roleCategory) : undefined,
      location: query.location ? insensitive(query.location) : undefined,
      workMode: query.workMode,
      employmentType: query.employmentType,
      status: query.status,
      eligibleBranches: query.branch ? { has: query.branch } : undefined,
      eligibleGradYears: query.gradYear ? { has: query.gradYear } : undefined,
      minCgpa: query.cgpa !== undefined ? { lte: query.cgpa } : undefined,
      salaryMinLpa: query.minSalaryLpa !== undefined ? { gte: query.minSalaryLpa } : undefined,
      OR: query.q
        ? ['title', 'company', 'description'].map((field) => ({
            [field]: { contains: query.q, mode: Prisma.QueryMode.insensitive },
          }))
        : undefined,
      AND: query.skills?.length
        ? [{ OR: [{ requiredSkills: { hasSome: query.skills } }, { preferredSkills: { hasSome: query.skills } }] }]
        : undefined,
    };

    const paginate = query.page !== undefined || query.limit !== undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        orderBy: { [query.sortBy ?? 'id']: query.order ?? 'asc' },
        skip: paginate ? (page - 1) * limit : undefined,
        take: paginate ? limit : undefined,
      }),
    ]);

    return {
      data,
      meta: paginate ? { total, page, limit, pages: Math.ceil(total / limit) } : { total },
    };
  }

  async findOne(id: number) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }
}
