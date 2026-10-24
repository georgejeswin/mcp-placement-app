import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { EmploymentType, JobStatus, WorkMode } from '../../generated/prisma';
import { CommaSeparated } from '../../query-transforms';

export class ListJobsQuery {
  @ApiPropertyOptional({ description: 'Search in title, company and description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Backend Developer' })
  @IsOptional()
  @IsString()
  roleCategory?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: WorkMode })
  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Comma-separated; matches required or preferred skills', example: 'React,Node.js' })
  @IsOptional()
  @CommaSeparated()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 2027 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gradYear?: number;

  @ApiPropertyOptional({ description: 'Only jobs whose CGPA cut-off is at or below this value', example: 7.2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cgpa?: number;

  @ApiPropertyOptional({ description: 'Minimum of the salary range (LPA)', example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSalaryLpa?: number;

  @ApiPropertyOptional({ enum: ['id', 'salaryMaxLpa', 'minCgpa', 'applicationDeadline'], default: 'id' })
  @IsOptional()
  @IsIn(['id', 'salaryMaxLpa', 'minCgpa', 'applicationDeadline'])
  sortBy?: 'id' | 'salaryMaxLpa' | 'minCgpa' | 'applicationDeadline';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number (1-based). Omit page and limit to get every job.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size, max 500' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
