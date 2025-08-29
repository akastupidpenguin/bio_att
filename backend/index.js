const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};
const server = https.createServer(httpsOptions, app);

const wss = new WebSocket.Server({ server });

const sessions = new Map();

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'register_session') {
                const sessionId = data.payload;
                sessions.set(sessionId, ws);
                console.log(`Session created: ${sessionId}`);
                ws.on('close', () => { sessions.delete(sessionId); console.log(`Session closed: ${sessionId}`); });
            } else if (data.type === 'image_frame') {
                const { sessionId, image } = data.payload;
                const teacherWs = sessions.get(sessionId);
                if (teacherWs) {
                    teacherWs.send(JSON.stringify({ type: 'image_frame', payload: image }));
                }
            }
        } catch (error) {
            const sessionId = message.toString();
            sessions.set(sessionId, ws);
            console.log(`Legacy session created: ${sessionId}`);
            ws.on('close', () => { sessions.delete(sessionId); console.log(`Legacy session closed: ${sessionId}`); });
        }
    });
});

app.set('sessions', sessions);
connectDB();
app.use(cors());
app.use(express.json({ extended: false, limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/capture', require('./routes/capture'));
app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Secure server started on port ${PORT}`));