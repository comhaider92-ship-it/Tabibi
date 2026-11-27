import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
 constructor(@InjectRepository(User) private readonly repo:Repository<User>){}
 findByIdentifier(identifier:string) {
  const value=identifier.trim().toLowerCase();
  return this.repo.createQueryBuilder('u').addSelect('u.passwordHash')
   .where('LOWER(u.email) = :value',{value}).orWhere('u.phone = :phone',{phone:identifier.trim()}).getOne();
 }
 findById(id:string){return this.repo.findOne({where:{id}});}
 create(data:Partial<User>){return this.repo.save(this.repo.create(data));}
 listPendingFacilityManagers(){return this.repo.find({where:{role:UserRole.FACILITY_MANAGER,isActive:false},select:['id','displayName','email','phone','role','isVerified','createdAt'],order:{createdAt:'ASC'}});}
 async approveFacilityManager(id:string){const user=await this.repo.findOne({where:{id,role:UserRole.FACILITY_MANAGER,isActive:false}});if(!user)return null;user.isActive=true;user.isVerified=true;return this.repo.save(user);}
 async updatePassword(id:string,password:string){
  await this.repo.increment({id},'tokenVersion',1);
  await this.repo.update({id},{passwordHash:await bcrypt.hash(password,12)});
 }
 async changePassword(id:string,currentPassword:string,newPassword:string){
  const user=await this.repo.createQueryBuilder('u').addSelect('u.passwordHash').where('u.id=:id',{id}).getOne();
  if(!user || !(await bcrypt.compare(currentPassword,user.passwordHash))) return false;
  await this.repo.update({id},{passwordHash:await bcrypt.hash(newPassword,12),tokenVersion:(user.tokenVersion||0)+1});
  return true;
 }
 async revokeAllSessions(id:string){await this.repo.increment({id},'tokenVersion',1);}
 async updateContact(id:string,contactType:'phone'|'email',value:string){
  const update=contactType==='email'?{email:value.trim().toLowerCase()}:{phone:value.trim()};
  await this.repo.update({id},update);
  return this.findById(id);
 }
 async updateDisplayName(id:string,displayName:string){
  await this.repo.update({id},{displayName:displayName.trim()});
  return this.findById(id);
 }
 async markVerified(id:string){await this.repo.update({id},{isVerified:true});}
 findOwnerByEmail(email:string){return this.repo.findOne({where:{email:email.toLowerCase()}});}
}
