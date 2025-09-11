import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MrvReport, MrvReportDocument } from '../../schemas/mrv-report.schema';
import { MonitoringEvent, MonitoringEventDocument } from '../../schemas/monitoring-event.schema';
import { CreateMrvReportDto } from './dto/create-mrv-report.dto';
import { UpdateMrvReportDto } from './dto/update-mrv-report.dto';
import { CreateMonitoringEventDto } from './dto/create-monitoring-event.dto';

@Injectable()
export class MrvService {
  constructor(
    @InjectModel(MrvReport.name)
    private mrvReportModel: Model<MrvReportDocument>,
    @InjectModel(MonitoringEvent.name)
    private monitoringEventModel: Model<MonitoringEventDocument>,
  ) {}

  // MRV Reports
  async createReport(createMrvReportDto: CreateMrvReportDto): Promise<MrvReport> {
    const report = new this.mrvReportModel(createMrvReportDto);
    return report.save();
  }

  async findAllReports(): Promise<MrvReport[]> {
    return this.mrvReportModel.find().exec();
  }

  async findReportById(id: string): Promise<MrvReport> {
    const report = await this.mrvReportModel.findById(id).exec();
    if (!report) {
      throw new NotFoundException('MRV Report not found');
    }
    return report;
  }

  async findReportsByProject(projectId: string): Promise<MrvReport[]> {
    return this.mrvReportModel.find({ projectId }).exec();
  }

  async findReportsByPlot(plotId: string): Promise<MrvReport[]> {
    return this.mrvReportModel.find({ plotId }).exec();
  }

  async findReportsByStatus(status: string): Promise<MrvReport[]> {
    return this.mrvReportModel.find({ status }).exec();
  }

  async updateReport(id: string, updateMrvReportDto: UpdateMrvReportDto): Promise<MrvReport> {
    const updatedReport = await this.mrvReportModel
      .findByIdAndUpdate(id, updateMrvReportDto, { new: true })
      .exec();

    if (!updatedReport) {
      throw new NotFoundException('MRV Report not found');
    }

    return updatedReport;
  }

  async verifyReport(id: string, verifiedBy: string): Promise<MrvReport> {
    return this.updateReport(id, {
      status: 'verified',
      verifiedBy,
      verifiedAt: new Date(),
    });
  }

  async rejectReport(id: string, rejectionReason: string): Promise<MrvReport> {
    return this.updateReport(id, {
      status: 'rejected',
      rejectionReason,
    });
  }

  async removeReport(id: string): Promise<void> {
    const result = await this.mrvReportModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('MRV Report not found');
    }
  }

  // Monitoring Events
  async createEvent(createMonitoringEventDto: CreateMonitoringEventDto): Promise<MonitoringEvent> {
    const event = new this.monitoringEventModel(createMonitoringEventDto);
    return event.save();
  }

  async findAllEvents(): Promise<MonitoringEvent[]> {
    return this.monitoringEventModel.find().exec();
  }

  async findEventById(id: string): Promise<MonitoringEvent> {
    const event = await this.monitoringEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Monitoring Event not found');
    }
    return event;
  }

  async findEventsByProject(projectId: string): Promise<MonitoringEvent[]> {
    return this.monitoringEventModel.find({ projectId }).exec();
  }

  async findEventsByPlot(plotId: string): Promise<MonitoringEvent[]> {
    return this.monitoringEventModel.find({ plotId }).exec();
  }

  async findEventsByType(eventType: string): Promise<MonitoringEvent[]> {
    return this.monitoringEventModel.find({ eventType }).exec();
  }

  async updateEvent(id: string, updateData: any): Promise<MonitoringEvent> {
    const updatedEvent = await this.monitoringEventModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException('Monitoring Event not found');
    }

    return updatedEvent;
  }

  async verifyEvent(id: string, verifiedBy: string): Promise<MonitoringEvent> {
    return this.updateEvent(id, {
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
    });
  }

  async removeEvent(id: string): Promise<void> {
    const result = await this.monitoringEventModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Monitoring Event not found');
    }
  }

  // Analytics and Statistics
  async getReportStats(projectId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byMethodology: Record<string, number>;
  }> {
    const query = projectId ? { projectId } : {};
    const reports = await this.mrvReportModel.find(query).exec();

    const byStatus = reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byMethodology = reports.reduce((acc, report) => {
      acc[report.methodology] = (acc[report.methodology] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: reports.length,
      byStatus,
      byMethodology,
    };
  }

  async getEventStats(projectId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    verified: number;
  }> {
    const query = projectId ? { projectId } : {};
    const events = await this.monitoringEventModel.find(query).exec();

    const byType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: events.length,
      byType,
      verified: events.filter(e => e.isVerified).length,
    };
  }

  async getCarbonCalculations(projectId: string): Promise<{
    totalCarbon: number;
    averageUncertainty: number;
    reportCount: number;
  }> {
    const reports = await this.findReportsByProject(projectId);
    
    const totalCarbon = reports.reduce((sum, report) => 
      sum + (report.results?.carbonTonsCO2e || 0), 0);
    
    const uncertainties = reports
      .map(r => r.results?.uncertainty)
      .filter(u => u !== undefined);
    
    const averageUncertainty = uncertainties.length > 0 
      ? uncertainties.reduce((sum, u) => sum + u, 0) / uncertainties.length 
      : 0;

    return {
      totalCarbon,
      averageUncertainty,
      reportCount: reports.length,
    };
  }

  // Integration with Python MRV Service
  async submitForProcessing(reportId: string): Promise<MrvReport> {
    // TODO: Implement actual integration with Python MRV microservice
    // This would send data to the Python service for analysis
    return this.updateReport(reportId, {
      status: 'processing',
      processedAt: new Date(),
    });
  }

  async receiveProcessingResults(reportId: string, results: any): Promise<MrvReport> {
    return this.updateReport(reportId, {
      status: 'completed',
      results,
      processedAt: new Date(),
    });
  }
}
