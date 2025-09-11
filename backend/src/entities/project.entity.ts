import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ProjectStatus } from '../common/enums/user-role.enum';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Plot } from './plot.entity';
import { Credit } from './credit.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Column({ nullable: true })
  methodology: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  bufferPercentage: number;

  @Column({ nullable: true })
  baselineDocuments: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimatedCredits: number;

  @Column({ nullable: true })
  projectPeriodStart: Date;

  @Column({ nullable: true })
  projectPeriodEnd: Date;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'created_by' })
  createdById: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedById: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  blockchainTxHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, (organization) => organization.projects)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @OneToMany(() => Plot, (plot) => plot.project)
  plots: Plot[];

  @OneToMany(() => Credit, (credit) => credit.project)
  credits: Credit[];
}
