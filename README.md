# AI Policy Recommender

## Project Overview
This AI is a student project built to help people understand health insurance policies without having to read 50-page PDF documents. The system uses **Retrieval-Augmented Generation (RAG)** to analyze user profiles (like age, income, and health history) and compare them against actual insurance policy documents to find the best match.

Instead of just guessing, the AI looks up the exact terms and conditions from a private database, making the advice much more reliable than a standard chatbot.

## Features
*   **Personalized Recommendations**: Finds policies based on your Age, Lifestyle, Pre-existing conditions, Income, and City.
*   **RAG-based Retrieval**: Automatically searches through uploaded PDFs to find relevant coverage details.
*   **AI-generated Explanations**: Explains *why* a policy was picked in simple English (no confusing "insurance-speak").
*   **Admin Tools**: A simple dashboard to upload new policies and manage the "knowledge base" (the PDFs the AI reads).

## System Architecture
The data flow is pretty straightforward:
1.  **User Input**: User fills out a profile on the React frontend.
2.  **Retrieval**: The FastAPI backend takes the profile and searches the **ChromaDB** vector database for matching policy text chunks.
3.  **Generation**: The retrieved text is sent to the LLM (Grok-beta/Llama-3) as "context".
4.  **Output**: The AI generates a structured recommendation with a comparison table and a personalized note.

### RAG Pipeline (How it works)
The RAG (Retrieval-Augmented Generation) pipeline is the most important part of my project:
*   **Document Ingestion**: I upload insurance SIDs (Standard Information Documents) as PDFs.
*   **Chunking**: Since the documents are long, I split them into 1000-character pieces with a 200-character overlap so the AI doesn't lose the context of a sentence that got cut in half.
*   **Embeddings**: I use the `all-MiniLM-L6-v2` model to turn text into vectors (math numbers that represent meaning).
*   **Retrieval**: When you ask for a recommendation, the system calculates which chunks are "closest" in meaning to your profile.
*   **Grounding**: I tell the AI it **must** only use the provided text. If it can't find a premium or a benefit in the chunks, it has to say "Refer to Insurer" instead of making it up. This stops the AI from hallucinating fake prices.

## AI Design Decisions
*   **LangChain**: I chose to follow LangChain patterns for orchestration because it's the industry standard for RAG apps, and it made it much easier to manage the flow between my database and the AI.
*   **ChromaDB**: I used Chroma because it’s open-source and saves data locally in a folder. I didn't want to deal with complex cloud database setups for a prototype.
*   **RAG Approach**: I implemented RAG instead of just "fine-tuning" a model because insurance rules change all the time. With RAG, I can just upload a new PDF and the AI immediately knows the updated rules.

## Prompt Design
The prompt is the "brain" of my AI. I gave it strict rules:
*   **Rules**: "Use ONLY provided policy data," "No guessing," and "Avoid hallucination."
*   **Context Structure**: I pass the user profile and the retrieved policy chunks separately so the AI can compare them accurately.
*   **Output Format**: I forced the AI to respond in JSON format. This ensures the frontend always gets a clean comparison table and a properly formatted explanation.

## Setup Instructions

### 1. Install Dependencies
Go into both the frontend and backend folders and install the packages:
```bash
# In /frontend
npm install

# In /backend
pip install -r requirements.txt
```

### 2. Required Environment Variables
Create a `.env` file in the `backend/` directory:
```env
XAI_API_KEY=your_key_here
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
DATABASE_PATH=./chroma_db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password123
```

*   **Terminal 1 (Backend)**: `python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload` (runs on port 5000)
*   **Terminal 2 (Frontend)**: `npm run dev` (runs on port 5173)

### 4. Running Tests
The project includes a suite of unit tests for the RAG pipeline and API endpoints:
```bash
cd backend
python -m pytest tests/
```

## Demo Scenarios
To test the full flow, use the sample policies in `/policyPDF` and try these scenarios:
1.  **Healthy Young Professional**: 25-30 years, "Active", looking for high OPD/Key benefits.
2.  **Senior with Conditions**: 55-65 years, "Diabetes/Hypertension", looking for short waiting periods.
3.  **Affordability Focus**: Lower income bracket, Tier-3 city, looking for high suitability scores in budget policies.

## Code Quality Compliance
*   **Security**: No API keys are stored in the repo. All configuration is via `.env`.
*   **Logic**: Recommendation logic is grounded in RAG. If data is missing from PDFs, the AI is instructed to avoid hallucinations and refer to the insurer.
*   **Form Structure**: The user profile form contains exactly 6 fields as required.
*   **Persistence**: Uses a persistent local ChromaDB instance (folder-based) for easy portability.

## Limitations
*   **Small Dataset**: I only tested this with a few sample insurance policies. It might need more data for edge cases.
*   **Prototype Nature**: This is a student project for a symposium and isn't meant for actual financial or medical advice.
*   **No Real-time API**: I am reading from static PDFs, so if an insurer changes their rates tomorrow, the PDF would need to be re-uploaded.

