import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'login_security_events' })
@Index('ix_login_security_identifier_created', ['identifierHash', 'createdAt'])
@Index('ix_login_security_ip_created', ['ipHash', 'createdAt'])
export class LoginSecurityEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 64 }) identifierHash: string;
  @Column({ type: 'varchar', length: 64 }) ipHash: string;
  @Column({ type: 'boolean', default: false }) succeeded: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
