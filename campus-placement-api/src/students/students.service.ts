import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { ListStudentsQuery } from './dto/list-students.query';

const insensitive = (value: string) => ({ equals: value, mode: Prisma.QueryMode.insensitive });

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListStudentsQuery) {
    const where: Prisma.StudentWhereInput = {
      branch: query.branch ? insensitive(query.branch) : undefined,
      degree: query.degree ? insensitive(query.degree) : undefined,
      graduationYear: query.graduationYear,
      cgpa: query.minCgpa !== undefined ? { gte: query.minCgpa } : undefined,
      activeBacklogs: query.maxBacklogs !== undefined ? { lte: query.maxBacklogs } : undefined,
      placementStatus: query.placementStatus,
      preferredRoles: query.preferredRole ? { has: query.preferredRole } : undefined,
      skills:
        query.skills?.length || query.allSkills?.length
          ? {
              hasSome: query.skills?.length ? query.skills : undefined,
              hasEvery: query.allSkills?.length ? query.allSkills : undefined,
            }
          : undefined,
      OR: query.q
        ? ['name', 'rollNo', 'email'].map((field) => ({
            [field]: { contains: query.q, mode: Prisma.QueryMode.insensitive },
          }))
        : undefined,
    };

    const paginate = query.page !== undefined || query.limit !== undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
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
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException(`Student ${id} not found`);
    return student;
  }

  async findByRollNo(rollNo: string) {
    const student = await this.prisma.student.findUnique({ where: { rollNo: rollNo.toUpperCase() } });
    if (!student) throw new NotFoundException(`Student with roll number ${rollNo} not found`);
    return student;
  }
}
