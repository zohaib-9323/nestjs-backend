import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { CacheInvalidationService } from '../voiceflow/cache-invalidation.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private cacheInvalidationService: CacheInvalidationService,
  ) {}

  async create(
    companyId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    const project = new this.projectModel({
      ...createProjectDto,
      companyId: new Types.ObjectId(companyId),
    });

    const savedProject = await project.save();

    // Add project to company's projects array
    await this.companyModel.findByIdAndUpdate(companyId, {
      $addToSet: { projects: savedProject._id },
    });

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);

    return savedProject;
  }

  async findAll(companyId: string): Promise<Project[]> {
    return this.projectModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findOne(companyId: string, projectId: string): Promise<Project> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Invalid project ID format');
    }

    const project = await this.projectModel
      .findOne({
        _id: new Types.ObjectId(projectId),
        companyId: new Types.ObjectId(companyId),
      })
      .lean()
      .exec();

    if (!project) {
      throw new NotFoundException(
        'Project not found or does not belong to this company',
      );
    }

    return project;
  }

  async update(
    companyId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Invalid project ID format');
    }

    const project = await this.projectModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(projectId),
          companyId: new Types.ObjectId(companyId),
        },
        { $set: updateProjectDto },
        { new: true },
      )
      .lean()
      .exec();

    if (!project) {
      throw new NotFoundException(
        'Project not found or does not belong to this company',
      );
    }

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);

    return project;
  }

  async remove(companyId: string, projectId: string): Promise<void> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Invalid project ID format');
    }

    const result = await this.projectModel
      .deleteOne({
        _id: new Types.ObjectId(projectId),
        companyId: new Types.ObjectId(companyId),
      })
      .lean()
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        'Project not found or does not belong to this company',
      );
    }

    // Remove project from company's projects array
    await this.companyModel.findByIdAndUpdate(companyId, {
      $pull: { projects: new Types.ObjectId(projectId) },
    });

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);
  }
}

