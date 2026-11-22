import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum WeeklyScheduleOwnerType { DOCTOR='doctor', FACILITY='facility' }
@Entity({name:'weekly_schedule_rules'})
@Index('ix_weekly_schedule_owner_day',['ownerType','ownerId','weekday','isActive'])
export class WeeklyScheduleRule {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'varchar',length:16}) ownerType:WeeklyScheduleOwnerType;
 @Column({type:'uuid'}) ownerId:string;
 @Column({type:'uuid',nullable:true}) serviceId:string|null;
 @Column({type:'smallint'}) weekday:number;
 @Column({type:'varchar',length:5}) startTime:string;
 @Column({type:'varchar',length:5}) endTime:string;
 @Column({type:'jsonb',default:() => "'[]'::jsonb"}) breaks:{startTime:string;endTime:string}[];
 @Column({type:'varchar',length:64,default:'Asia/Baghdad'}) timezone:string;
 @Column({type:'boolean',default:true}) isActive:boolean;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
