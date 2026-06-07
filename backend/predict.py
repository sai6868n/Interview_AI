import joblib
import pandas as pd

stress_model = joblib.load("models/stress_model.pkl")
confidence_model = joblib.load("models/confidence_model.pkl")
interview_model = joblib.load("models/interview_model.pkl")

le_stress = joblib.load("models/stress_encoder.pkl")
le_result = joblib.load("models/result_encoder.pkl")
def evaluate_candidate(data):

    df = pd.DataFrame([data])

    stress = stress_model.predict(df)[0]

    confidence = confidence_model.predict(df)[0]

    interview_input = df.copy()

    interview_input["Predicted_Stress"] = stress
    interview_input["Predicted_Confidence"] = confidence

    result = interview_model.predict(
        interview_input
    )[0]

    return {
        "stress_level":
            le_stress.inverse_transform(
                [int(stress)]
            )[0],

        "confidence_score":
            round(float(confidence), 2),

        "interview_result":
            le_result.inverse_transform(
                [int(result)]
            )[0]
    }