"""Reusable constrained field types shared by request schemas."""

from typing import Annotated

from pydantic import AfterValidator, Field, StringConstraints

# bcrypt only uses the first 72 bytes of a password, so longer ones are rejected.
BCRYPT_MAX_BYTES = 72
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 72
MAX_ALLERGIES = 30


def _password_fits_bcrypt(value: str) -> str:
    if len(value.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise ValueError(f"Password must be at most {BCRYPT_MAX_BYTES} bytes.")
    return value


def _password_is_strong(value: str) -> str:
    """Strength rules (mirrored by frontend/src/features/auth/schemas/fieldRules.ts)."""
    if not any(char.isalpha() for char in value) or not any(char.isdigit() for char in value):
        raise ValueError("Password must contain at least one letter and one number.")
    if value.strip() != value:
        raise ValueError("Password cannot start or end with a space.")
    return value


NewPassword = Annotated[
    str,
    Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH),
    AfterValidator(_password_fits_bcrypt),
    AfterValidator(_password_is_strong),
]

# Existing passwords are only compared, never stored; a loose upper bound stops abuse.
ExistingPassword = Annotated[str, Field(min_length=1, max_length=128)]

FullName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]

AllergyName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]

AllergyList = Annotated[list[AllergyName], Field(max_length=MAX_ALLERGIES)]

# Realistic body ranges, shared with the React onboarding form (features/onboarding/schemas).
AGE_MIN, AGE_MAX = 10, 100
HEIGHT_MIN_CM, HEIGHT_MAX_CM = 50, 300
WEIGHT_MIN_KG, WEIGHT_MAX_KG = 20, 500

Age = Annotated[int, Field(ge=AGE_MIN, le=AGE_MAX)]
HeightCm = Annotated[float, Field(ge=HEIGHT_MIN_CM, le=HEIGHT_MAX_CM)]
WeightKg = Annotated[float, Field(ge=WEIGHT_MIN_KG, le=WEIGHT_MAX_KG)]
