import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@Controller('companies/:companyId/projects')
@UseGuards(JwtAuthGuard, CompanyAccessGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async create(
    @Param('companyId') companyId: string,
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.create(
      companyId,
      createProjectDto,
    );
    return plainToInstance(ProjectResponseDto, project, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
    type: [ProjectResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async findAll(
    @Param('companyId') companyId: string,
  ): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsService.findAll(companyId);
    return plainToInstance(ProjectResponseDto, projects, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific project by ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findOne(companyId, id);
    return plainToInstance(ProjectResponseDto, project, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.update(
      companyId,
      id,
      updateProjectDto,
    );
    return plainToInstance(ProjectResponseDto, project, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete a project (Superadmin only)',
    description: 'Only superadmin role can delete projects',
  })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin role required' })
  async remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.projectsService.remove(companyId, id);
  }
}

