import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMonitoringEventDto } from './dto/create-monitoring-event.dto';
import { UpdateMonitoringEventDto } from './dto/update-monitoring-event.dto';
import { MonitoringEvent } from '../../schemas/monitoring-event.schema';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectModel(MonitoringEvent.name)
    private monitoringEventModel: Model<MonitoringEvent>,
  ) {}

  async create(createMonitoringEventDto: CreateMonitoringEventDto, userId: string): Promise<MonitoringEvent> {
    const monitoringEvent = new this.monitoringEventModel({
      ...createMonitoringEventDto,
      uploaderId: userId,
      createdAt: new Date(),
    });

    return monitoringEvent.save();
  }

  async findAll(userId?: string, userRole?: UserRole): Promise<MonitoringEvent[]> {
    const query: any = {};

    // Apply role-based filtering
    if (userRole === UserRole.DEVELOPER && userId) {
      query.uploaderId = userId;
    }

    return this.monitoringEventModel.find(query).exec();
  }

  async findByProject(projectId: string): Promise<MonitoringEvent[]> {
    return this.monitoringEventModel.find({ projectId }).exec();
  }

  async findByPlot(plotId: string): Promise<MonitoringEvent[]> {
    return this.monitoringEventModel.find({ plotId }).exec();
  }

  async findById(id: string, userId?: string, userRole?: UserRole): Promise<MonitoringEvent> {
    const monitoringEvent = await this.monitoringEventModel.findById(id).exec();

    if (!monitoringEvent) {
      throw new NotFoundException('Monitoring event not found');
    }

    // Apply role-based access control
    if (userRole === UserRole.DEVELOPER && monitoringEvent.uploaderId !== userId) {
      throw new ForbiddenException('Access denied to this monitoring event');
    }

    return monitoringEvent;
  }

  async update(id: string, updateMonitoringEventDto: UpdateMonitoringEventDto, userId: string): Promise<MonitoringEvent> {
    const monitoringEvent = await this.findById(id);

    // Only creators can update their monitoring events (unless admin/auditor)
    if (monitoringEvent.uploaderId !== userId) {
      throw new ForbiddenException('You can only update your own monitoring events');
    }

    const updatedEvent = await this.monitoringEventModel
      .findByIdAndUpdate(id, { ...updateMonitoringEventDto, updatedAt: new Date() }, { new: true })
      .exec();

    return updatedEvent;
  }

  async remove(id: string, userId: string): Promise<void> {
    const monitoringEvent = await this.findById(id);

    // Only creators can delete their monitoring events (unless admin)
    if (monitoringEvent.uploaderId !== userId) {
      throw new ForbiddenException('You can only delete your own monitoring events');
    }

    await this.monitoringEventModel.findByIdAndDelete(id).exec();
  }
}
