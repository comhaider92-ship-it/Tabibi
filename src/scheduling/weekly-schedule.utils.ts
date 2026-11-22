import { BadRequestException } from '@nestjs/common';
import { WeeklyScheduleRuleDto } from './dto/weekly-schedule.dto';
export function minuteOfDay(value:string):number { const [h,m]=value.split(':').map(Number); return h*60+m; }
export function validateWeeklyRules(rules:WeeklyScheduleRuleDto[]) {
 const groups=new Map<number,WeeklyScheduleRuleDto[]>();
 for(const r of rules){
  const start=minuteOfDay(r.startTime),end=minuteOfDay(r.endTime);
  if(start>=end) throw new BadRequestException('وقت نهاية الدوام يجب أن يكون بعد البداية وفي اليوم نفسه');
  try { new Intl.DateTimeFormat('en-US',{timeZone:r.timezone??'Asia/Baghdad'}).format(new Date()); } catch { throw new BadRequestException('المنطقة الزمنية غير صحيحة'); }
  const breaks=[...(r.breaks??[])].sort((a,b)=>minuteOfDay(a.startTime)-minuteOfDay(b.startTime));
  for(let i=0;i<breaks.length;i++){
   const bs=minuteOfDay(breaks[i].startTime),be=minuteOfDay(breaks[i].endTime);
   if(bs>=be||bs<start||be>end) throw new BadRequestException('يجب أن تكون الاستراحة داخل وقت الدوام');
   if(i&&bs<minuteOfDay(breaks[i-1].endTime)) throw new BadRequestException('فترات الاستراحة متداخلة');
  }
  const arr=groups.get(r.weekday)??[]; arr.push(r); groups.set(r.weekday,arr);
 }
 for(const arr of groups.values()){
  const sorted=[...arr].sort((a,b)=>minuteOfDay(a.startTime)-minuteOfDay(b.startTime));
  for(let i=1;i<sorted.length;i++) if(minuteOfDay(sorted[i].startTime)<minuteOfDay(sorted[i-1].endTime)) throw new BadRequestException('فترات الدوام في اليوم نفسه متداخلة');
 }
}
export function zonedLocalToUtc(date:string,time:string,timeZone:string):Date {
 const [y,mo,d]=date.split('-').map(Number),[h,mi]=time.split(':').map(Number);
 const target=Date.UTC(y,mo-1,d,h,mi,0);
 let guess=target;
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 for(let i=0;i<3;i++){
  const parts=Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
  const represented=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,0);
  guess+=target-represented;
 }
 return new Date(guess);
}
export function dateWeekday(date:string):number { const [y,m,d]=date.split('-').map(Number); return new Date(Date.UTC(y,m-1,d)).getUTCDay(); }
export function zonedDateTimeParts(date:Date,timeZone:string) {
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
 return {year:parts.year,month:parts.month,day:parts.day,weekday:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday),minuteOfDay:Number(parts.hour)*60+Number(parts.minute)};
}
