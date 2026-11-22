import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({name:'facility_services'})
@Index('ix_facility_services_facility_active',['facilityId','isActive'])
export class FacilityService {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) facilityId:string;
 @Column({type:'varchar',length:40}) serviceCode:string;
 @Column({type:'varchar',length:160}) name:string;
 @Column({type:'integer',nullable:true}) priceIqd:number|null;
 @Column({type:'smallint',default:30}) expectedDurationMinutes:number;
 @Column({type:'boolean',default:true}) isActive:boolean;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
}
