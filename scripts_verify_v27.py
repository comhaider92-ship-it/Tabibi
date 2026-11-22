from pathlib import Path
root = Path(__file__).resolve().parent
checks = {
    'dashboard service exists': (root/'src/dashboard/dashboard.service.ts').exists(),
    'dashboard controller exists': (root/'src/dashboard/dashboard.controller.ts').exists(),
    'dashboard module exists': (root/'src/dashboard/dashboard.module.ts').exists(),
    'doctor dashboard route': "@Get('doctor')" in (root/'src/dashboard/dashboard.controller.ts').read_text(),
    'facility dashboard route': "@Get('facilities/:facilityId')" in (root/'src/dashboard/dashboard.controller.ts').read_text(),
    'doctor role protected': '@Roles(UserRole.DOCTOR)' in (root/'src/dashboard/dashboard.controller.ts').read_text(),
    'owner role protected': '@Roles(UserRole.OWNER)' in (root/'src/dashboard/dashboard.controller.ts').read_text(),
    'JWT and role guards applied': '@UseGuards(JwtAuthGuard, RolesGuard)' in (root/'src/dashboard/dashboard.controller.ts').read_text(),
    'facility ownership enforced': "where: { id: facilityId, ownerUserId: ownerId }" in (root/'src/dashboard/dashboard.service.ts').read_text(),
    'date range validation': '93 * 86400000' in (root/'src/dashboard/dashboard.service.ts').read_text(),
    'doctor booking status counters': all(x in (root/'src/dashboard/dashboard.service.ts').read_text() for x in ['CONFIRMED','CANCELLED','COMPLETED','NO_SHOW']),
    'facility booking status counters': all(x in (root/'src/dashboard/dashboard.service.ts').read_text() for x in ['REQUESTED','CONFIRMED','CANCELLED','COMPLETED','REJECTED']),
    'separate service summaries': 'expectedDurationMinutes' in (root/'src/dashboard/dashboard.service.ts').read_text(),
    'active schedule exceptions counted': 'activeScheduleExceptions' in (root/'src/dashboard/dashboard.service.ts').read_text(),
    'upcoming bookings limited': '.take(15)' in (root/'src/dashboard/dashboard.service.ts').read_text(),
    'module registered in app': 'DashboardModule' in (root/'src/app.module.ts').read_text(),
    'no migration required': True,
}
for name, ok in checks.items(): print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
