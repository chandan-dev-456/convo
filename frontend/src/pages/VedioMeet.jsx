import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoPlayer from "../components/VedioPlayer";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL);


const getGridStyle = (count) => {
  if (count === 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 9) return { cols: 3, rows: 3 };
  if (count <= 12) return { cols: 4, rows: 3 };
  return { cols: 4, rows: Math.ceil(count / 4) };
};

export default function VideoMeet() {
  const { url: roomId } = useParams();
  const navigate = useNavigate();

  const [peers, setPeers] = useState([]);
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState(true);

  const localStreamRef = useRef(null);
  const peerConnections = useRef({});

  useEffect(() => {
    init();
    return leaveCall;
  }, []);

  const init = async () => {
    // ✅ FIX 3: clear old listeners
    socket.off("existing-users");
    socket.off("user-joined");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    socket.off("user-left");
    socket.off("media-update");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localStreamRef.current = stream;

    setPeers([{
      id: "local",
      stream,
      audio: true,
      video: true
    }]);

    socket.on("existing-users", (users) => {
      users.forEach(userId => createOffer(userId));
    });

    socket.emit("join-room", { roomId });

    socket.on("offer", ({ offer, fromId }) => {
      handleOffer(offer, fromId);
    });

    socket.on("answer", ({ answer, fromId }) => {
      handleAnswer(answer, fromId);
    });

    socket.on("ice-candidate", ({ candidate, fromId }) => {
      handleIce(candidate, fromId);
    });

    socket.on("user-left", ({ userId }) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setPeers(prev => prev.filter(p => p.id !== userId));
    });

    socket.on("media-update", ({ type, value, fromId }) => {
      setPeers(prev =>
        prev.map(p =>
          p.id === fromId ? { ...p, [type]: value } : p
        )
      );
    });
  };

  const createPeer = (id) => {
    if (peerConnections.current[id]) return peerConnections.current[id];

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    // 🔥 ALWAYS add audio track
    localStreamRef.current.getAudioTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    // 🔥 ADD video track ONLY if video is ON
    if (video) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        pc.addTrack(videoTracks[0], localStreamRef.current);
      }
    }

    pc.ontrack = (e) => {
      setPeers(prev => {
        if (prev.find(p => p.id === id)) return prev;
        return [...prev, {
          id,
          stream: e.streams[0],
          audio: true,
          video: true
        }];
      });
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: e.candidate,
          fromId: socket.id
        });
      }
    };

    peerConnections.current[id] = pc;
    return pc;
  };

  const createOffer = async (id) => {
    const pc = createPeer(id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", {
      roomId,
      offer,
      fromId: socket.id
    });
  };

  const handleOffer = async (offer, fromId) => {
    const pc = createPeer(fromId);
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", {
      roomId,
      answer,
      fromId: socket.id
    });
  };

  const handleAnswer = async (answer, fromId) => {
    const pc = peerConnections.current[fromId];
    if (!pc) return;
    await pc.setRemoteDescription(answer);
  };

  const handleIce = async (candidate, fromId) => {
    const pc = peerConnections.current[fromId];
    if (!pc) return;
    await pc.addIceCandidate(candidate);
  };

  const toggleAudio = () => {
    localStreamRef.current.getAudioTracks().forEach(
      t => (t.enabled = !audio)
    );

    socket.emit("media-update", {
      roomId,
      type: "audio",
      value: !audio,
      fromId: socket.id
    });

    setAudio(!audio);
    setPeers(prev =>
      prev.map(p =>
        p.id === "local" ? { ...p, audio: !audio } : p
      )
    );
  };

  // ✅ FIX 1 + 2: correct video toggle
  const toggleVideo = async () => {
    if (video) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.stop();
        localStreamRef.current.removeTrack(track);
      });

      socket.emit("media-update", {
        roomId,
        type: "video",
        value: false,
        fromId: socket.id
      });

      setVideo(false);
      setPeers(prev =>
        prev.map(p =>
          p.id === "local" ? { ...p, video: false } : p
        )
      );
    } else {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newTrack = camStream.getVideoTracks()[0];

      const newStream = new MediaStream([
        ...localStreamRef.current.getAudioTracks(),
        newTrack
      ]);
      localStreamRef.current = newStream;
      setPeers(prev =>
        prev.map(p =>
          p.id === "local"
            ? { ...p, stream: newStream }
            : p
        )
      );

      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(newTrack);
        else pc.addTrack(newTrack, newStream);
      });

      socket.emit("media-update", {
        roomId,
        type: "video",
        value: true,
        fromId: socket.id
      });

      setVideo(true);
      setPeers(prev =>
        prev.map(p =>
          p.id === "local" ? { ...p, video: true } : p
        )
      );
    }
  };

  const leaveCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    socket.disconnect();
    navigate("/");
  };

  const { cols, rows } = getGridStyle(peers.length);

  return (
    <div className="bg-dark text-white vh-100 p-3">
      <h5 className="text-center">Meeting: {roomId}</h5>

      <div
        style={{
          display: "grid",
          gap: "12px",
          height: "80vh",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {peers.map(p => (
          <VideoPlayer
            key={p.id}
            stream={p.stream}
            muted={p.id === "local"}
            audio={p.audio}
            video={p.video}
          />
        ))}
      </div>

      <div className="d-flex justify-content-center gap-3 mt-3">
        <button className="btn btn-warning" onClick={toggleVideo}>
          {video ? "Video Off" : "Video On"}
        </button>
        <button className="btn btn-warning" onClick={toggleAudio}>
          {audio ? "Mute" : "Unmute"}
        </button>
        <button className="btn btn-danger" onClick={leaveCall}>
          End Call
        </button>
      </div>
    </div>
  );
}
