import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
export enum OtpPurpose { VERIFY_ACCOUNT='verify_account', RESET_PASSWORD='reset_password', CHANGE_PHONE='change_phone', CHANGE_EMAIL='change_email' }
@Entity({name:'auth_otps'})
@Index('ix_auth_otps_user_purpose_created',['userId','purpose','createdAt'])
export class AuthOtp {
 @PrimaryGeneratedColumn('uuid') id:string;
 @Column({type:'uuid'}) userId:string;
 @Column({type:'varchar',length:254}) target:string;
 @Column({type:'varchar',length:24}) purpose:OtpPurpose;
 @Column({type:'varchar',length:255,select:false}) codeHash:string;
 @Column({type:'timestamptz'}) expiresAt:Date;
 @Column({type:'timestamptz',nullable:true}) consumedAt:Date|null;
 @Column({type:'int',default:0}) attempts:number;
 @CreateDateColumn({type:'timestamptz'}) createdAt:Date;
}
