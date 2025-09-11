import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CreditStatus } from '../common/enums/user-role.enum';
import { Project } from './project.entity';

@Entity('credits')
export class Credit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  batchId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amountTCO2e: number;

  @Column({
    type: 'enum',
    enum: CreditStatus,
    default: CreditStatus.PENDING,
  })
  status: CreditStatus;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ nullable: true })
  issuedToWallet: string;

  @Column({ nullable: true })
  retiredByWallet: string;

  @Column({ nullable: true })
  retirementReason: string;

  @Column({ nullable: true })
  blockchainTxHash: string;

  @Column({ nullable: true })
  ipfsHash: string;

  @Column({ nullable: true })
  issuedAt: Date;

  @Column({ nullable: true })
  retiredAt: Date;

  @Column({ nullable: true })
  revokedAt: Date;

  @Column({ name: 'project_id' })
  projectId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.credits)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
