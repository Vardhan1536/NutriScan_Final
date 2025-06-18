# NutriScan – Your Smart Nutrition Assistant

This repository has website code of NutriScan
Demo Video Link : https://player.cloudinary.com/embed/?cloud_name=dejlliwlz&public_id=Vite_React_TS_-_Google_Chrome_2025-01-23_17-11-51_xycsrg&profile=cld-default

> **AI-powered food analysis system for real-time dietary guidance**

---

## Introduction

Many individuals struggle to make informed food choices due to limited knowledge about nutritional content, allergens, and dietary restrictions. Most existing solutions lack immediate guidance during shopping, leaving users unsure about what suits their health needs.

---

## Objective

**NutriScan** aims to bridge this gap by offering real-time nutritional insights through food item recognition and barcode/QR code analysis. It delivers **personalized recommendations** based on each user’s medical history and dietary preferences.

---

## Methodology

NutriScan leverages a multi-model AI pipeline for comprehensive food analysis:

- **Food Recognition**: CNN-based model for detecting food items.
- **Code Scanning**: PaddleOCR for extracting data from barcodes and QR codes.
- **Knowledge Retrieval**: RAG (Retrieval-Augmented Generation) model for structuring nutritional information.
- **Food Classification**: Decision Tree Classifier for categorizing based on health impact.
- **Nutrient Scoring**: Custom algorithm to compute nutrient value scores.
- **Contextual Insight**: Gemini AI to provide meaningful context and dietary impact.
- **Backend**: Built with FastAPI, connected to **MongoDB Atlas** for user profile and health data.

> _All components communicate via robust API design ensuring seamless experience._

---

### Workflow
![image](https://github.com/user-attachments/assets/aa1f6e2a-92cd-465f-ae53-8f78ca20f6b4)

## Results

- ✅ Real-time food recognition and nutrition extraction
- ✅ Health-based recommendation based on personal medical data
- ✅ Enhanced user confidence in food selection
- ✅ Integration-ready architecture for hospitals and fitness apps

---

## Screenshots & Demo
![image](https://github.com/user-attachments/assets/daeb71af-1ec5-4039-881e-f75f042ab0fc)
![image](https://github.com/user-attachments/assets/9cdc9c1a-5497-4f75-bdc1-0510cb8a1c9b)
![image](https://github.com/user-attachments/assets/2c927ad6-5c7d-4650-8e95-4c1762cfb315)

---

## Conclusion

NutriScan enhances consumer awareness by delivering **instant, AI-driven analysis** of food items. It empowers:

- Health-conscious users
- People with allergies or medical conditions
- Diet-focused fitness enthusiasts

---

## Contributors
- Balavardhan Tummalacherla
- Tanmayi Kona
- Maheswari Doddipatla
- Nowshin Farhana Shaik

---

## License

This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.

---
