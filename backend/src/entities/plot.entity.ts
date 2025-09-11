import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('plots')
export class Plot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('geometry', { spatialFeatureType: 'Polygon', srid: 4326 })
  geojsonPolygon: string;

  @Column('decimal', { precision: 10, scale: 4 })
  areaHectares: number;

  @Column({ nullable: true })
  soilType: string;

  @Column({ nullable: true })
  vegetationType: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  baselineBiomass: number;

  @Column({ name: 'project_id' })
  projectId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.plots)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
