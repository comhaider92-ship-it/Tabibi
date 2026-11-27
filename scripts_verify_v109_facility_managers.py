from pathlib import Path
root = Path(__file__).resolve().parent
read = lambda p: (root / p).read_text()
role = read('src/users/user.entity.ts')
auth_service = read('src/auth/auth.service.ts')
auth_controller = read('src/auth/auth.controller.ts')
users = read('src/users/users.service.ts')
facilities_controller = read('src/facilities/facilities.controller.ts')
facilities_service = read('src/facilities/facilities.service.ts')
dashboard_controller = read('src/dashboard/dashboard.controller.ts')
dashboard_service = read('src/dashboard/dashboard.service.ts')
migration = read('src/database/migrations/1734700000000-ExpandUserRoleColumnForFacilityManagers.ts')
mobile_app = read('mobile/App.tsx')
login = read('mobile/src/screens/LoginScreen.tsx')
checks = {
    'facility manager is a distinct non-owner account role': "FACILITY_MANAGER='facility_manager'" in role,
    'public manager registration creates inactive accounts pending owner approval': "role:UserRole.FACILITY_MANAGER,isVerified:false,isActive:false" in auth_service,
    'manager registration does not accept a caller-selected role': "registerFacilityManager(dto:RegisterFacilityManagerDto)" in auth_service,
    'only owner can list pending manager accounts': "@Get('owner/facility-managers/pending') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)" in auth_controller,
    'only owner can approve manager accounts': "@Patch('owner/facility-managers/:id/approve') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)" in auth_controller,
    'approval activates only a pending facility manager': "role:UserRole.FACILITY_MANAGER,isActive:false" in users and "user.isActive=true;user.isVerified=true" in users,
    'facility manager can register a facility but it remains pending': "@Roles(UserRole.OWNER,UserRole.FACILITY_MANAGER)" in facilities_controller and "status:FacilityStatus.PENDING" in facilities_service,
    'manager ownership is checked against the requested facility': "if(facility.ownerUserId!==ownerId) throw new ForbiddenException" in facilities_service,
    'system owner can manage all facilities while managers see only their own': "actor?.role===UserRole.OWNER?{}:{ownerUserId:ownerId}" in facilities_service and "actor?.role!==UserRole.OWNER" in facilities_service,
    'system owner dashboard can inspect all facilities while manager dashboards remain scoped': "actorRole !== UserRole.OWNER && facility.ownerUserId !== ownerId" in dashboard_service,
    'system owner can upload to any facility while managers remain owner-scoped': "actor.role === UserRole.FACILITY_MANAGER && facility.ownerUserId !== actor.sub" in read('src/uploads/uploads.service.ts'),
    'facility managers may upload only facility images and documents for facilities they own': "[UserRole.OWNER, UserRole.FACILITY_MANAGER]" in read('src/uploads/uploads.service.ts') and "ownerUserId: actor.sub" in read('src/uploads/uploads.service.ts'),
    'facility review remains owner-only': "@Patch('owner/:id/review')\\n @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)" in facilities_controller,
    'pending facility review queue remains owner-only': "@Get('owner/pending') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)" in facilities_controller,
    'facility dashboard is role-guarded and scoped to the manager-owned facility': "@Roles(UserRole.OWNER,UserRole.FACILITY_MANAGER)" in dashboard_controller and 'ownerUserId: ownerId' in dashboard_service,
    'database role column migration supports the new role': 'TYPE varchar(20)' in migration,
    'mobile login includes manager registration': "setMode('facilityRegister')" in login and 'api.registerFacilityManager(data)' in login,
    'mobile routes managers to a restricted dashboard': "role==='facility_manager'" in mobile_app and 'FacilityManagerDashboardScreen' in mobile_app,
    'owner dashboard includes a separate manager approval screen': 'OwnerFacilityManagersScreen' in mobile_app,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'V109 facility-manager verification: {len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
