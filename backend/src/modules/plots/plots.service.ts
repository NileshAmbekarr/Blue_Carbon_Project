import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plot } from '../../entities/plot.entity';
import { Project } from '../../entities/project.entity';
import { CreatePlotDto } from './dto/create-plot.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class PlotsService {
  constructor(
    @InjectRepository(Plot)
    private plotsRepository: Repository<Plot>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(createPlotDto: CreatePlotDto): Promise<Plot> {
    // Verify project exists
    const project = await this.projectsRepository.findOne({
      where: { id: createPlotDto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const plot = this.plotsRepository.create(createPlotDto);
    return this.plotsRepository.save(plot);
  }

  async findAll(): Promise<Plot[]> {
    return this.plotsRepository.find({
      relations: ['project'],
    });
  }

  async findByProject(projectId: string): Promise<Plot[]> {
    return this.plotsRepository.find({
      where: { projectId },
      relations: ['project'],
    });
  }

  async findById(id: string): Promise<Plot> {
    const plot = await this.plotsRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }

    return plot;
  }

  async update(id: string, updatePlotDto: UpdatePlotDto): Promise<Plot> {
    const plot = await this.findById(id);

    // Verify project exists if being updated
    if (updatePlotDto.projectId) {
      const project = await this.projectsRepository.findOne({
        where: { id: updatePlotDto.projectId },
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    await this.plotsRepository.update(id, updatePlotDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const plot = await this.findById(id);
    await this.plotsRepository.remove(plot);
  }

  async validateGeofence(plotId: string, lat: number, lng: number): Promise<boolean> {
    const plot = await this.findById(plotId);
    
    // This would typically use PostGIS ST_Contains function
    // For now, returning true as placeholder
    // TODO: Implement actual geospatial validation using PostGIS
    return true;
  }

  async calculateTotalArea(projectId: string): Promise<number> {
    const plots = await this.findByProject(projectId);
    return plots.reduce((total, plot) => total + Number(plot.areaHectares), 0);
  }

  async findPlotsWithinRadius(lat: number, lng: number, radiusKm: number): Promise<Plot[]> {
    // This would use PostGIS ST_DWithin function
    // Placeholder implementation
    // TODO: Implement actual geospatial query using PostGIS
    return this.plotsRepository.find({
      relations: ['project'],
    });
  }
}
