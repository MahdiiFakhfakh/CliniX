import re


SYMPTOM_SPECIALTY_RULES = (
    (("headache", "migraine", "dizziness", "seizure", "numbness", "memory loss"), "Neurology"),
    (("rash", "acne", "eczema", "itchy skin", "skin", "mole"), "Dermatology"),
    (("chest pain", "palpitation", "heart", "blood pressure", "hypertension"), "Cardiology"),
    (("cough", "asthma", "shortness of breath", "wheezing", "lung"), "Pulmonology"),
    (("stomach", "abdominal", "diarrhea", "vomiting", "nausea", "constipation"), "Gastroenterology"),
    (("fever", "infection", "flu", "sore throat"), "Family Medicine"),
    (("diabetes", "thyroid", "hormone"), "Endocrinology"),
    (("kidney", "urine", "urination"), "Nephrology"),
    (("joint", "arthritis", "back pain", "pain in my back", "knee", "shoulder", "fracture"), "Orthopedics"),
    (("anxiety", "depression", "panic", "mental health", "insomnia"), "Psychiatry"),
    (("eye", "vision", "blurry vision"), "Ophthalmology"),
    (("allergy", "sneezing", "hives"), "Allergy & Immunology"),
)


def field_from_symptom(symptom: str | None) -> str | None:
    if not symptom:
        return None

    normalized = symptom.lower()
    for symptoms, specialty in SYMPTOM_SPECIALTY_RULES:
        if any(re.search(rf"\b{re.escape(item)}\b", normalized) for item in symptoms):
            return specialty
    return None
