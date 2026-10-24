import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PlacementStatus } from '../../generated/prisma';
import { CommaSeparated } from '../../query-transforms';

export class ListStudentsQuery {
  @ApiPropertyOptional({ description: 'Search in name, roll number and email' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 'B.Tech' })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ example: 2027 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  graduationYear?: number;

  @ApiPropertyOptional({ example: 7.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minCgpa?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxBacklogs?: number;

  @ApiPropertyOptional({ description: 'Comma-separated; students having ANY of these skills', example: 'Python,SQL' })
  @IsOptional()
  @CommaSeparated()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Comma-separated; students having ALL of these skills', example: 'React,Node.js' })
  @IsOptional()
  @CommaSeparated()
  @IsArray()
  @IsString({ each: true })
  allSkills?: string[];

  @ApiPropertyOptional({ example: 'Backend Developer' })
  @IsOptional()
  @IsString()
  preferredRole?: string;

  @ApiPropertyOptional({ enum: PlacementStatus })
  @IsOptional()
  @IsEnum(PlacementStatus)
  placementStatus?: PlacementStatus;

  @ApiPropertyOptional({ enum: ['id', 'cgpa', 'name', 'internshipMonths'], default: 'id' })
  @IsOptional()
  @IsIn(['id', 'cgpa', 'name', 'internshipMonths'])
  sortBy?: 'id' | 'cgpa' | 'name' | 'internshipMonths';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number (1-based). Omit page and limit to get every student.' })
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
