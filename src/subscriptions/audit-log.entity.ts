import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({name:'owner_audit_logs'})
@Index('ix_owner_audit_logs_created',['createdAt'])
export class OwnerAuditLog {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) ownerId:string;
 @Column({type:'varchar',length:80}) action:string;
 @Column({type:'varchar',length:80}) targetType:string;
 @Column({type:'uuid',nullable:true}) targetId:string|null;
 @Column({type:'jsonb',default:{}}) details:Record<string,any>;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
}
