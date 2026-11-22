import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
export enum AdStatus { DRAFT='draft', ACTIVE='active', PAUSED='paused', ENDED='ended' }
export enum AdPlacement { HOME='home', SEARCH='search' }
export enum AdTargetType { NONE='none', DOCTOR='doctor', FACILITY='facility', HOSPITAL='hospital' }
@Entity({name:'advertisements'})
@Index('ix_advertisements_status_dates',['status','startsAt','endsAt'])
@Index('ix_advertisements_placement_status',['placement','status'])
export class Advertisement {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'varchar',length:160}) advertiserName:string;
 @Column({type:'varchar',length:160}) title:string;
 @Column({type:'text',nullable:true}) description:string|null;
 @Column({type:'text',nullable:true}) imageUrl:string|null;
 @Column({type:'text',nullable:true}) targetUrl:string|null;
 @Column({type:'varchar',length:20,default:AdPlacement.HOME}) placement:AdPlacement;
 @Column({type:'varchar',length:16,default:AdTargetType.NONE}) targetType:AdTargetType;
 @Column({type:'uuid',nullable:true}) targetId:string|null;
 @Column({type:'varchar',length:16,default:AdStatus.DRAFT}) status:AdStatus;
 @Column({type:'timestamptz'}) startsAt:Date;
 @Column({type:'timestamptz'}) endsAt:Date;
 @Column({type:'integer',default:0}) priceIqd:number;
 @Column({type:'integer',default:0}) paidAmountIqd:number;
 @Column({type:'varchar',length:120,nullable:true}) paymentReference:string|null;
 @Column({type:'integer',default:0}) impressions:number;
 @Column({type:'integer',default:0}) clicks:number;
 @Column({type:'uuid'}) createdBy:string;
 @Column({type:'text',nullable:true}) ownerNote:string|null;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt:Date;
}
