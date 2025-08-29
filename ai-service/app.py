from flask import Flask, request, jsonify
import base64
import cv2
import numpy as np
from PIL import Image
import io
import dlib
from scipy.spatial import distance as dist
from sklearn.metrics.pairwise import cosine_similarity
import torch
import torchvision.transforms as transforms
from facenet_pytorch import InceptionResnetV1
import os

# --- Model and Liveness Setup ---
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = InceptionResnetV1(pretrained='vggface2', classify=False, device=device).eval()
print(f"Model loaded on device: {device}")

try:
    predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
    detector = dlib.get_frontal_face_detector()
except RuntimeError:
    print("\nERROR: Could not find 'shape_predictor_68_face_landmarks.dat'.\n")
    exit()

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

EYE_AR_THRESH = 0.22
EYE_AR_CONSEC_FRAMES = 2

LIVENESS_STATE = "WAITING_FOR_OPEN"
BLINK_COUNTER = 0

def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    return (A + B) / (2.0 * C)

transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

def get_embedding(img):
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    tensor = transform(pil_img).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model(tensor)
    return embedding.cpu().numpy().flatten()

app = Flask(__name__)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

@app.route('/check_liveness', methods=['POST'])
def check_liveness():
    global LIVENESS_STATE, BLINK_COUNTER

    # --- Cooldown logic ---
    if not hasattr(check_liveness, "last_blink_time"):
        check_liveness.last_blink_time = 0
    COOLDOWN_MS = 700  # 0.7 seconds, adjust as needed

    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"error": "Missing image"}), 400
    image_data = base64.b64decode(data['image'])
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None: return jsonify({"error": "Could not decode image"}), 400
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    rects = detector(gray, 0)
    
    response = {"blink_detected": False, "status": LIVENESS_STATE}

    if len(rects) == 0:
        LIVENESS_STATE = "WAITING_FOR_OPEN"
        BLINK_COUNTER = 0
        return jsonify(response)

    for rect in rects:
        shape = predictor(gray, rect)
        shape = np.array([(shape.part(i).x, shape.part(i).y) for i in range(68)])
        leftEye = shape[42:48]
        rightEye = shape[36:42]
        ear = (eye_aspect_ratio(leftEye) + eye_aspect_ratio(rightEye)) / 2.0

        # 1. Wait for eyes open
        if LIVENESS_STATE == "WAITING_FOR_OPEN":
            if ear > EYE_AR_THRESH + 0.04:  # Slightly more tolerant
                LIVENESS_STATE = "WAITING_FOR_BLINK"
                response["status"] = "BLINK_NOW"
                print("Liveness: Eyes open, now waiting for blink.")
        
        # 2. Wait for blink
        elif LIVENESS_STATE == "WAITING_FOR_BLINK":
            if ear < EYE_AR_THRESH:
                BLINK_COUNTER += 1
            else:
                # 3. Blink detected
                if BLINK_COUNTER >= EYE_AR_CONSEC_FRAMES:
                    now = int(cv2.getTickCount() / cv2.getTickFrequency() * 1000)
                    if now - check_liveness.last_blink_time > COOLDOWN_MS:
                        response["blink_detected"] = True
                        _, buffer = cv2.imencode('.jpg', img)
                        live_image_b64 = base64.b64encode(buffer).decode('utf-8')
                        response["live_image"] = live_image_b64
                        print("Blink detected!")
                        check_liveness.last_blink_time = now
                LIVENESS_STATE = "WAITING_FOR_OPEN"
                BLINK_COUNTER = 0

    return jsonify(response)


@app.route('/enroll_face', methods=['POST'])
def enroll_face():
    global LIVENESS_STATE, BLINK_COUNTER
    LIVENESS_STATE = "WAITING_FOR_OPEN"
    BLINK_COUNTER = 0
    
    data = request.get_json()
    if not data or 'image' not in data or 'userId' not in data:
        return jsonify({"error": "Missing image or userId"}), 400
    user_id = data['userId']
    image_data = base64.b64decode(data['image'])
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None: return jsonify({"error": "Could not decode image"}), 400
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) == 0: return jsonify({"error": "No face detected"}), 400
    if len(faces) > 1: return jsonify({"error": "Multiple faces detected"}), 400
    x, y, w, h = faces[0]
    face_img = img[y:y+h, x:x+w]
    try:
        embedding = get_embedding(face_img)
        print(f"Successfully created embedding for user: {user_id}")
        return jsonify({"message": "Face embedding created successfully", "userId": user_id, "embedding": embedding.tolist()})
    except Exception as e:
        print(f"Error creating embedding: {e}")
        return jsonify({"error": "Could not process face image."}), 500

@app.route('/recognize_faces', methods=['POST'])
def recognize_faces():
    data = request.get_json()
    if not data or 'image' not in data or 'known_students' not in data:
        return jsonify({"error": "Missing image or known_students list"}), 400
    known_students = data['known_students']
    if not known_students:
        return jsonify({"recognized_ids": []})
    image_data = base64.b64decode(data['image'])
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None: return jsonify({"error": "Could not decode image"}), 400

    known_embeddings_list = []
    known_ids = []
    for student in known_students:
        try:
            byte_array = np.array(student['embedding'], dtype=np.uint8)
            float_embedding = byte_array.view(dtype=np.float32)
            if not np.isnan(float_embedding).any():
                known_embeddings_list.append(float_embedding)
                known_ids.append(student['_id'])
        except Exception as err:
            print(f"DEBUG: Error processing embedding for student {student['_id']}: {err}")
    if not known_embeddings_list:
        return jsonify({"error": "No valid enrolled faces to compare against."}), 400
    known_embeddings = np.array(known_embeddings_list)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) == 0: return jsonify({"recognized_ids": []})
    recognized_ids = []
    for (x, y, w, h) in faces:
        face_img = img[y:y+h, x:x+w]
        try:
            unknown_embedding = get_embedding(face_img)
            similarities = cosine_similarity(unknown_embedding.reshape(1, -1), known_embeddings)
            best_match_index = np.argmax(similarities)
            best_match_score = similarities[0][best_match_index]
            if best_match_score > 0.5:
                recognized_ids.append(known_ids[best_match_index])
        except Exception as err:
            print(f"Could not process a face: {err}")
            continue
    return jsonify({"recognized_ids": list(set(recognized_ids))})

@app.route('/get_embedding', methods=['POST'])
def get_embedding_route():
    """A simple route to get an embedding from a single image."""
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"error": "Missing image"}), 400

    image_data = base64.b64decode(data['image'])
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None: return jsonify({"error": "Could not decode image"}), 400

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # --- HYBRID DETECTION LOGIC ---
    # First, try the more accurate dlib detector
    rects = detector(gray, 1)
    
    # If dlib fails, fall back to the more lenient OpenCV detector
    if len(rects) == 0:
        faces_cv = face_cascade.detectMultiScale(gray, 1.1, 4)
        if len(faces_cv) > 0:
            # Convert OpenCV rects to dlib rects format for consistent processing
            rects = [dlib.rectangle(int(x), int(y), int(x + w), int(y + h)) for (x, y, w, h) in faces_cv]

    if len(rects) == 0:
        return jsonify({"error": "No face detected"}), 400
    
    # Find the largest face in the image
    main_face = max(rects, key=lambda rect: rect.width() * rect.height())
    x, y, w, h = main_face.left(), main_face.top(), main_face.width(), main_face.height()
    
    x, y = max(0, x), max(0, y)
    face_img = img[y:y+h, x:x+w]
    # --- END OF HYBRID LOGIC ---
    
    try:
        embedding = get_embedding(face_img)
        return jsonify({"embedding": embedding.tolist()})
    except Exception as e:
        print(f"Error creating embedding: {e}")
        return jsonify({"error": "Could not process face image."}), 500

@app.route('/check_duplicate', methods=['POST'])
def check_duplicate():
    """Checks if a new embedding is a duplicate of any known embeddings."""
    data = request.get_json()
    if not data or 'new_embedding' not in data or 'known_students' not in data:
        return jsonify({"error": "Missing new_embedding or known_students list"}), 400

    new_embedding = np.array(data['new_embedding']).reshape(1, -1)
    known_students = data['known_students']

    if not known_students:
        return jsonify({"is_duplicate": False})

    known_embeddings_list = []
    for student in known_students:
        byte_array = np.array(student['embedding'], dtype=np.uint8)
        float_embedding = byte_array.view(dtype=np.float32)
        known_embeddings_list.append(float_embedding)
    
    known_embeddings = np.array(known_embeddings_list)

    similarities = cosine_similarity(new_embedding, known_embeddings)
    best_match_index = np.argmax(similarities)
    best_match_score = similarities[0][best_match_index]

    if best_match_score > 0.7:
        duplicate_student = known_students[best_match_index]
        print(f"Duplicate DETECTED. Score: {best_match_score}. Matched with: {duplicate_student['name']}")
        return jsonify({
            "is_duplicate": True,
            "duplicate_student": {
                "_id": duplicate_student["_id"],
                "name": duplicate_student["name"]
            }
        })
    
    return jsonify({"is_duplicate": False})


# ... (keep the /recognize_faces route)

if __name__ == '__main__':
    port = int(os.environ.get('AI_SERVICE_PORT', 5002))
    app.run(debug=True, port=port)