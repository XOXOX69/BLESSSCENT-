import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SyncLogStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

@Entity('sync_logs')
@Index(['branchId', 'createdAt'])
@Index(['deviceId', 'createdAt'])
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ name: 'sync_type' })
  syncType: string; // 'PUSH' or 'PULL'

  @Column({
    type: 'varchar',
    default: SyncLogStatus.SUCCESS,
  })
  status: SyncLogStatus;

  @Column({ name: 'items_count', default: 0 })
  itemsCount: number;

  @Column({ name: 'success_count', default: 0 })
  successCount: number;

  @Column({ name: 'failed_count', default: 0 })
  failedCount: number;

  @Column({ name: 'conflict_count', default: 0 })
  conflictCount: number;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
