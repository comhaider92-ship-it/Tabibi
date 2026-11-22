import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'auth_sessions' })
@Index('uq_auth_sessions_jti', ['jti'], { unique: true })
@Index('ix_auth_sessions_user_active', ['userId', 'revokedAt', 'expiresAt'])
export class AuthSession {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'varchar', length: 64 }) jti: string;
  @Column({ type: 'int', default: 0 }) tokenVersion: number;
  @Column({ type: 'varchar', length: 200, nullable: true }) userAgent: string | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) ipHash: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @Column({ type: 'timestamptz' }) lastSeenAt: Date;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) revokedAt: Date | null;
}
