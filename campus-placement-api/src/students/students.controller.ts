import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListStudentsQuery } from './dto/list-students.query';
import { StudentsService } from './students.service';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List students (all by default; filter and paginate via query params)' })
  findAll(@Query() query: ListStudentsQuery) {
    return this.studentsService.findAll(query);
  }

  @Get('roll/:rollNo')
  @ApiOperation({ summary: 'Get a student by roll number' })
  findByRollNo(@Param('rollNo') rollNo: string) {
    return this.studentsService.findByRollNo(rollNo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single student' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }
}
