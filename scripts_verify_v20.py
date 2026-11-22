from pathlib import Path
root = Path(__file__).resolve().parent
service = (root / 'src/doctors/doctors.service.ts').read_text()
controller = (root / 'src/doctors/doctors.controller.ts').read_text()
dto = (root / 'src/doctors/dto/doctor-directory-query.dto.ts').read_text()
module = (root / 'src/doctors/doctors.module.ts').read_text()
migration = (root / 'src/database/migrations/1732100000000-AddDoctorDirectoryIndexes.ts').read_text()
docs = (root / 'docs/phase-v20-doctor-directory.md').read_text()
checks = {
    'directory exposes approved doctors only': "DoctorProfileStatus.APPROVED" in service,
    'name search supported': "p.fullName ILIKE :name" in service and 'name?: string' in dto,
    'main specialty search supported': "p.specialty ILIKE :specialty" in service,
    'precise sub-specialty search supported': "p.subSpecialty ILIKE :subSpecialty" in service,
    'city filter retained': "LOWER(p.city) = LOWER(:city)" in service and 'city?: string' in dto,
    'no area/district filter in query DTO': 'area' not in dto.lower() and 'district' not in dto.lower(),
    'minimum rating filter supported': 'minRating' in dto and 'COALESCE(stats.average, 0) >= :minRating' in service,
    'rating sort supported': "sort === 'rating'" in service,
    'experience and newest sort supported': "sort === 'experience'" in service and "sort === 'newest'" in service,
    'pagination bounded to 50': '@Max(50)' in dto and 'pagination:' in service,
    'rating aggregation uses published ratings only': 'RatingStatus.PUBLISHED' in service,
    'public profile detail endpoint exists': "@Get(':id')" in controller and 'publicDoctor(id)' in controller,
    'public detail hides non-approved profiles': 'status: DoctorProfileStatus.APPROVED' in service,
    'ratings repository registered': 'DoctorRating' in module,
    'directory indexes migration added': 'ix_doctor_profiles_approved_city_name' in migration and 'ix_doctor_profiles_approved_subspecialty' in migration,
    'no zone filter documented': 'no area/district filter' in docs.lower(),
    'inherited notification service class closure repaired': (root / 'src/notifications/notifications.service.ts').read_text().count('export class NotificationsService') == 1 and (root / 'src/notifications/notifications.service.ts').read_text().rstrip().endswith('}'),
}
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' ' + name)
print(f'{sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
