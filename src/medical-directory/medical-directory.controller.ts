import { Controller, Get } from '@nestjs/common';

export const DOCTOR_SPECIALTIES = [
  { code:'pediatrics', name:'الأطفال', group:'doctors' },
  { code:'ob-gyn', name:'نسائية وتوليد', group:'doctors' },
  { code:'internal-medicine', name:'باطنية', group:'doctors' },
  { code:'cardiology', name:'قلبية', group:'doctors' },
  { code:'orthopedics', name:'عظام ومفاصل', group:'doctors' },
  { code:'dermatology', name:'جلدية', group:'doctors' },
  { code:'neurology', name:'أعصاب', group:'doctors' },
  { code:'ophthalmology', name:'عيون', group:'doctors' },
  { code:'dentistry', name:'أسنان', group:'doctors' },
  { code:'ent', name:'أنف وأذن وحنجرة', group:'doctors' },
  { code:'general-surgery', name:'جراحة عامة', group:'doctors' },
  { code:'urology', name:'مسالك بولية', group:'doctors' },
  { code:'pulmonology', name:'صدرية وتنفسية', group:'doctors' },
  { code:'psychiatry', name:'نفسية', group:'doctors' },
  { code:'oncology', name:'أورام', group:'doctors' },
  { code:'endocrinology', name:'غدد صماء وسكري', group:'doctors' },
  { code:'family-medicine', name:'طب الأسرة', group:'doctors' },
  { code:'nutrition', name:'تغذية علاجية', group:'doctors' },
  { code:'other', name:'اختصاصات أخرى', group:'doctors' },
];

export const DIAGNOSTIC_SERVICES = [
  { code:'laboratory', name:'مختبرات وتحاليل', group:'diagnostics' },
  { code:'mri', name:'رنين مغناطيسي', group:'diagnostics' },
  { code:'xray', name:'أشعة سينية', group:'diagnostics' },
  { code:'ultrasound', name:'سونار', group:'diagnostics' },
  { code:'ct-scan', name:'مفراس طبقي', group:'diagnostics' },
  { code:'mammography', name:'تصوير الثدي', group:'diagnostics' },
  { code:'ecg', name:'تخطيط القلب', group:'diagnostics' },
  { code:'echo', name:'إيكو القلب', group:'diagnostics' },
  { code:'bone-density', name:'فحص كثافة العظام', group:'diagnostics' },
  { code:'endoscopy', name:'ناظور', group:'diagnostics' },
];

@Controller('medical-directory')
export class MedicalDirectoryController {
  @Get('categories') categories() {
    return { doctors: DOCTOR_SPECIALTIES, diagnostics: DIAGNOSTIC_SERVICES };
  }
}
