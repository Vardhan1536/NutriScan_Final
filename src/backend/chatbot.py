import google.generativeai as genai
import os

API_KEY = "AIzaSyCUS9uEV_iQHG_I3BofUVN4bPtOA5L6P0E"  
genai.configure(api_key=API_KEY)

# Initialize the model1
model1 = genai.GenerativeModel('gemini-1.5-pro')
hist =  ["Task 1: Health Score\nScore: 2.5/5","Task 2: Description\nA samosa is a fried or baked pastry typically filled with a savory mixture of potatoes, peas, and spices. The outer covering is usually made from a flaky dough. Samosas can vary widely in size, ingredients, and preparation methods, leading to differences in nutritional content. They are a popular snack or appetizer in many parts of the world, particularly South Asia."]
   
initial_history = [
    {
        "role": "user",
        "parts": hist },
   
]
# Start a chat session
chat = model1.start_chat(history=initial_history)

def chatbot_conversation():
    print("Welcome to Gemini 1.5 Pro Chatbot!")
    print("Type 'quit' to exit the conversation")
    print("----------------------------------------")
    
    while True:
        # Get user input
        user_input = input("You: ")
        
        # Check if user wants to quit
        if user_input.lower() == 'quit':
            print("Goodbye!")
            break
            
        try:
            # Send message to Gemini and get response
            response = chat.send_message(user_input)
            
            # Print the response
            print("Gemini: ", response.text)
            print("----------------------------------------")
            
        except Exception as e:
            print(f"An error occurred: {e}")
            print("----------------------------------------")

# Run the chatbot
if __name__ == "__main__":
    chatbot_conversation()