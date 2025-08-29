# kiit_biometric_attendance
Web app using mern+pytorch. Automating attendance and enhancing teacher's efficiency.
# Smart Attendance System

A web-based smart attendance system using AI-powered face recognition and liveness detection.

## Project Structure

```
.
├── ai-service/
│   ├── app.py
│   ├── requirements.txt
│   └── shape_predictor_68_face_landmarks.dat
├── backend/
│   ├── .env
│   ├── cert.pem
│   ├── index.js
│   ├── key.pem
│   ├── package.json
│   ├── config/
│   ├── middleware/
│   ├── models/
│   └── routes/
├── frontend/
│   ├── .gitignore
│   ├── package.json
│   ├── README.md
│   ├── public/
│   └── src/
├── .gitignore
└── README.md
```

## Components

- **ai-service/**: Python Flask service for face recognition, liveness detection, and embeddings.
- **backend/**: Node.js/Express API for authentication, attendance, and user management.
- **frontend/**: React web app for user interface and interaction.

## Setup

### 1. AI Service

- Install dependencies:
  ```sh
  cd ai-service
  pip install -r requirements.txt
  ```
- Download `shape_predictor_68_face_landmarks.dat` and place it in `ai-service/`.
- Run the service:
  ```sh
  python app.py
  ```

### 2. Backend

- Install dependencies:
  ```sh
  cd backend
  npm install
  ```
- Set up `.env` with your environment variables (see `.env.example` if available).
- Run the backend:
  ```sh
  node index.js
  ```

### 3. Frontend

- Install dependencies:
  ```sh
  cd frontend
  npm install
  ```
- Start the React app:
  ```sh
  npm start
  ```

## Usage

1. Start all three services as described above.
2. Access the frontend at [http://localhost:3000](http://localhost:3000).
3. Use the web interface to enroll faces, check liveness, and mark attendance.

## Notes

- The AI service requires a CUDA-capable GPU for best performance, but will fall back to CPU if unavailable.
- Certificates (`cert.pem`, `key.pem`) are used for HTTPS in development and should not be committed to version control.
- The model file `shape_predictor_68_face_landmarks.dat` is large and should be downloaded separately.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
