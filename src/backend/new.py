import google.generativeai as genai
genai.configure(api_key="AIzaSyC8f-sZzHSqMfR2EEu273C_QHRbxoxGQCw")
gemini = genai.GenerativeModel("gemini-1.5-flash")
def chat_bot(prompt):
    response = gemini.generate_content([prompt])
    return response.text
