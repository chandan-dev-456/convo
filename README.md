# Convo — Real-Time Video Calling App

Convo is a Google Meet–style real-time video calling application built using **WebRTC** and **Socket.IO**.  
It supports multi-user video calls with dynamic grid layout, mute/video controls, and proper handling of late joiners.

This project focuses on **correct WebRTC signaling architecture** rather than UI polish.

---

## 🚀 Features

- Peer-to-peer video calling using WebRTC
- Two-user mesh connection (no SFU)
- Dynamic Google Meet–style video grid
- Mute / Unmute audio per user
- Video ON / OFF with track replacement
- Late joiner support
- Proper cleanup on user disconnect
- Room-based signaling using Socket.IO

---

## 🧠 Key Technical Concepts Used

- WebRTC Offer / Answer model  
  > Only the **joining peer creates offers**, existing peers only answer (prevents glare)

- Track replacement using `RTCRtpSender.replaceTrack()`
- Explicit MediaStream rebinding to avoid black video issues
- Room-scoped Socket.IO signaling
- Environment-based configuration (`.env`)

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- WebRTC
- Socket.IO Client

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB (setup ready, auth optional)

---

## 📁 Project Structure
convo/
├── backend/
│ ├── src/
│ ├── socketManager.js
│ ├── .env.example
│ └── package.json
│
├── frontend/
│ ├── src/
│ ├── pages/VideoMeet.jsx
│ ├── components/VideoPlayer.jsx
│ ├── .env.example
│ └── package.json
│
├── .gitignore
└── README.md


---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm
- Modern browser (Chrome / Firefox)

---

### 1️⃣ Clone the repository

```bash
git clone https://github.com/<your-username>/convo.git
cd convo
