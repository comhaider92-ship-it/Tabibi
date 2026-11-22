from pathlib import Path
root = Path(__file__).resolve().parent
checks = {
    "completed appointment required": "appointment.status !== AppointmentStatus.COMPLETED" in (root / "src/ratings/ratings.service.ts").read_text(),
    "beneficiary-only rating": "appointment.beneficiaryId !== patientId" in (root / "src/ratings/ratings.service.ts").read_text(),
    "unique appointment rating": "uq_doctor_rating_appointment" in (root / "src/ratings/rating.entity.ts").read_text(),
    "stars range enforced in DTO": "@Min(1) @Max(5)" in (root / "src/ratings/dto/create-rating.dto.ts").read_text(),
    "stars range enforced in DB": 'CHECK ("stars" >= 1 AND "stars" <= 5)' in (root / "src/database/migrations/1732000000000-CreateDoctorRatings.ts").read_text(),
    "owner moderation protected": "@Roles(UserRole.OWNER)" in (root / "src/ratings/ratings.controller.ts").read_text(),
    "reported ratings reviewed": "RatingStatus.UNDER_REVIEW" in (root / "src/ratings/ratings.service.ts").read_text(),
    "only published ratings listed": "status: RatingStatus.PUBLISHED" in (root / "src/ratings/ratings.service.ts").read_text(),
    "migration registered by glob": "migrations:['src/database/migrations/*.ts']" in (root / "src/database/data-source.ts").read_text(),
    "module registered": "RatingsModule" in (root / "src/app.module.ts").read_text(),
}
for name, ok in checks.items():
    print(("PASS" if ok else "FAIL") + " " + name)
print(f"{sum(checks.values())}/{len(checks)} checks passed")
raise SystemExit(0 if all(checks.values()) else 1)
