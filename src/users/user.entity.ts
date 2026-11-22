import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum UserRole { PATIENT='patient', DOCTOR='doctor', OWNER='owner' }
@Entity({name:'users'})
@Index('uq_users_email', ['email'], {unique:true, where:'email IS NOT NULL'})
@Index('uq_users_phone', ['phone'], {unique:true, where:'phone IS NOT NULL'})
export class User {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'varchar',length:254,nullable:true}) email:string|null;
 @Column({type:'varchar',length:32,nullable:true}) phone:string|null;
 @Column({type:'varchar',length:120}) displayName:string;
 @Column({type:'varchar',length:255,select:false}) passwordHash:string;
 @Column({type:'varchar',length:16}) role:UserRole;
 @Column({type:'boolean',default:false}) isVerified:boolean;
 @Column({type:'boolean',default:true}) isActive:boolean;
 @Column({type:'int',default:0}) tokenVersion:number;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
