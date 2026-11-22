import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum FacilityStatus { PENDING='pending', APPROVED='approved', REJECTED='rejected', SUSPENDED='suspended' }
@Entity({name:'medical_facilities'})
@Index('ix_medical_facilities_status_city',['status','city'])
export class MedicalFacility {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) ownerUserId:string;
 @Column({type:'varchar',length:180}) name:string;
 @Column({type:'varchar',length:32}) facilityType:string;
 @Column({type:'varchar',length:80}) city:string;
 @Column({type:'varchar',length:220}) address:string;
 @Column({type:'varchar',length:32,nullable:true}) phone:string|null;
 @Column({type:'text',nullable:true}) description:string|null;
 @Column({type:'text',nullable:true}) imageUrl:string|null;
 @Column({type:'varchar',length:16,default:FacilityStatus.PENDING}) status:FacilityStatus;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
