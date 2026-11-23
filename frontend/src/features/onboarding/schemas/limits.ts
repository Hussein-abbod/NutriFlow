/** Same limits as backend/app/schemas/common.py and schemas/onboarding.py. */
export const AGE_RANGE = { min: 10, max: 100 } as const;
export const HEIGHT_RANGE_CM = { min: 50, max: 300 } as const;
export const WEIGHT_RANGE_KG = { min: 20, max: 500 } as const;
/** The Flutter slider goes to 52 weeks (the backend accepts up to 104). */
export const GOAL_PERIOD_RANGE_WEEKS = { min: 1, max: 52 } as const;
export const MAX_ALLERGIES = 30;
export const MAX_ALLERGY_LENGTH = 100;
export const MAX_OTHER_ALLERGIES_INPUT = 500;

/** Slider ranges of step_basic_info.dart (the text field accepts the wider ranges above). */
export const HEIGHT_SLIDER_CM = { min: 100, max: 250 } as const;
export const WEIGHT_SLIDER_KG = { min: 30, max: 200 } as const;
