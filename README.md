# VedaVision - AI Ayurvedic Identification Platform

VedaVision is a Next.js web application that acts as an intelligent portal for Ayurvedic medicine. It utilizes Google's Gemini 1.5 Flash Vision model to process images of plants or medicinal items and dynamically generates highly structured, expertly sourced data referencing the World Health Organization (WHO) Guidelines and the Pharmacopoeia of India (AYUSH).

## 🚀 How the "Dataset" Works in VedaVision

Unlike traditional machine learning models that require downloading gigabytes of CSVs or pre-labeled image datasets, **VedaVision does not use a locally hosted dataset file (like a .csv or .json)**. 

Instead, VedaVision utilizes a **Retrieval-Augmented Generation (RAG) inspired approach** via the Gemini 1.5 Flash API.

### 1. The "Open Dataset" Model (Gemini Vision)
The Gemini 1.5 model has been pre-trained by Google on an almost unfathomable amount of internet data, including botany, medical texts, and global encyclopedias. When you upload a picture to VedaVision, Gemini's Vision encoder analyzes the visual features to identify the plant (e.g., *Ocimum tenuiflorum* / Tulsi).

### 2. Strict Prompt-Based Sourced Data (Text API)
Once the plant is identified, our Next.js backend (`app/api/analyze/route.js`) forces the AI to only extract and structure data according to specific global guidelines. We do this by feeding the AI a highly specific **System Prompt**:

> "CRITICAL INSTRUCTIONS: All knowledge must carefully align with WHO guidelines and the Pharmacopoeia of India (AYUSH)."

By doing this, we turn Gemini into a dynamically filtered dataset. The AI searches its vast internal pre-trained weights for the identified plant, but strictly filters the generated response (Dosages, Contraindications, Preparation Methods) to match the approved medical guidelines from AYUSH and WHO.

### Why is this better for VedaVision?
1. **Infinite Scale:** You don't have to manually label thousands of images of Tulsi or Neem. Gemini can already identify thousands of species natively.
2. **Dynamic Languages:** Because the dataset is generated live by the LLM, we can translate the entire medical profile into Telugu, Tamil, Kannada, or Malayalam instantly.
3. **No Database Required:** It keeps the application lightweight. All you need is an API key, and you instantly have access to an "open" dataset.

---

## 🛠 Getting Started

1. Clone or download this project.
2. Ensure you have Node.js installed.
3. Open the `.env.local` file and add your Google Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```
4. Run the development server:
   ```bash
   npm install
   npm run dev
   ```
5. Open [http://localhost:3003](http://localhost:3003) in your browser.
