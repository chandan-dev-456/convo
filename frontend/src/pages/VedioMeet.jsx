import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import VideoPlayer from "../components/VedioPlayer";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, { autoConnect: false });

export default function VedioMeet() {
  const { roomId } = useParams();
  const location = useLocation();
  const name = location.state?.guestName;

  const navigate = useNavigate();

  const [stream, setStream] = useState(null);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);

  const pcRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const targetRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const iceQueue = useRef([]);
  const pendingOffersRef = useRef([]);

  useEffect(() => {
    async function getMedia() {
      try {
        console.log("Requesting media devices...");
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log("Media stream obtained:", mediaStream.getTracks().length, "tracks");
        setStream(mediaStream);
      } catch (error) {
        console.error("Error getting media:", error);
      }
    }
    getMedia();
  }, []);

  const toggleVideo = () => {
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
    console.log("Video toggled:", track.enabled);

    if (isConnected && targetRef.current) {
      socket.emit("media-update", {
        targetId: targetRef.current,
        type: "video",
        value: track.enabled,
        fromId: socket.id
      });
    }
  };

  const toggleAudio = () => {
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setAudioOn(audioTrack.enabled);
    console.log("Audio toggled:", audioTrack.enabled);

    if (isConnected && targetRef.current) {
      socket.emit("media-update", {
        targetId: targetRef.current,
        type: "audio",
        value: audioTrack.enabled,
        fromId: socket.id
      });
    }
  };

  const endMeet = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    socket.disconnect();
    navigate('/join');
  };

  const [remoteMedia, setRemoteMedia] = useState({
    audio: true,
    video: true
  });

  useEffect(() => {
    socket.on("media-update", ({ type, value, fromId }) => {
      if (fromId === socket.id) return;
      console.log("Media update received:", type, value);
      if (type === "audio") {
        setRemoteMedia(prev => ({ ...prev, audio: value }));
      }
      if (type === "video") {
        setRemoteMedia(prev => ({ ...prev, video: value }));
      }
    });

    return () => {
      socket.off("media-update");
    };
  }, []);

  const initiateCall = async (targetUserId) => {
    console.log("Initiating call to:", targetUserId);
    console.log("PC Ref current:", !!pcRef.current);
    console.log("Stream available:", !!stream);
    
    if (!pcRef.current || !stream) {
      console.log("Cannot initiate call - PC or stream not ready");
      return;
    }

    const pc = pcRef.current;
    console.log("Current senders count:", pc.getSenders().length);

    if (pc.getSenders().length === 0) {
      console.log("Adding tracks to peer connection");
      stream.getTracks().forEach(track => {
        console.log("Adding track:", track.kind);
        pc.addTrack(track, stream);
      });
    }

    console.log("Creating offer...");
    const offer = await pc.createOffer();
    console.log("Offer created:", offer);
    await pc.setLocalDescription(offer);
    console.log("Local description set");

    socket.emit("offer", {
      targetId: targetUserId,
      offer,
      fromId: socket.id
    });
    console.log("Offer emitted to:", targetUserId);
  };

  const processPendingOffers = async () => {
    if (pendingOffersRef.current.length > 0 && pcRef.current && stream) {
      console.log("Processing pending offers:", pendingOffersRef.current.length);
      const offers = [...pendingOffersRef.current];
      pendingOffersRef.current = [];
      
      for (const { offer, fromId } of offers) {
        await handleOffer(offer, fromId);
      }
    }
  };

  const handleOffer = async (offer, fromId) => {
    console.log("Handling offer from:", fromId);
    targetRef.current = fromId;

    const pc = pcRef.current;
    
    if (pc.getSenders().length === 0) {
      console.log("Adding tracks to PC");
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    await pc.setRemoteDescription(offer);
    console.log("Remote description set");

    // Process queued ICE candidates
    for (const c of iceQueue.current) {
      await pc.addIceCandidate(c);
    }
    iceQueue.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log("Answer created and set");

    socket.emit("answer", {
      targetId: fromId,
      answer,
      fromId: socket.id
    });
    console.log("Answer emitted to:", fromId);
  };

  // Socket connection
  useEffect(() => {
    console.log("Connecting socket...");
    socket.connect();

    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket.id);
      socket.emit("join-room", {
        roomId: roomId,
        name: name
      });
    });

    return () => {
      console.log("Disconnecting socket");
      socket.disconnect();
    };
  }, [roomId, name]);

  // Handle user-joined
  useEffect(() => {
    socket.on("user-joined", async (data) => {
      console.log("🔵 user-joined event received:", data.userId);
      targetRef.current = data.userId;

      if (!stream) {
        console.log("Stream not ready, waiting...");
        const waitForStream = setInterval(() => {
          if (stream && pcRef.current) {
            console.log(" Stream ready now, initiating call");
            clearInterval(waitForStream);
            initiateCall(data.userId);
          }
        }, 100);
        return;
      }

      if (pcRef.current && stream) {
        console.log(" Stream and PC ready, initiating call immediately");
        await initiateCall(data.userId);
      } else {
        console.log(" PC or stream not ready:", { pc: !!pcRef.current, stream: !!stream });
      }
    });

    return () => {
      socket.off("user-joined");
    };
  }, [stream]);

  useEffect(() => {
    if (!stream) {
      console.log("No stream yet, skipping PC creation");
      return;
    }

    if (!pcRef.current) {
      console.log("Creating new RTCPeerConnection");
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      pcRef.current = pc;

      console.log("Adding tracks to PC");
      stream.getTracks().forEach(track => {
        console.log("Adding track to PC:", track.kind);
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log("🎥 REMOTE STREAM RECEIVED!", event.streams[0]);
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && targetRef.current) {
          console.log("ICE candidate generated, sending to:", targetRef.current);
          socket.emit("ice-candidate", {
            targetId: targetRef.current,
            candidate: event.candidate,
            fromId: socket.id
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state changed:", pc.connectionState);
        if (pc.connectionState === "connected") {
          console.log("WebRTC connection established!");
          setIsConnected(true);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };
    }
    processPendingOffers();

    return () => {
      if (pcRef.current) {
        console.log("Closing peer connection");
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    socket.on("offer", async ({ offer, fromId }) => {
      console.log("OFFER received from:", fromId);
      
      if (!pcRef.current || !stream) {
        console.log("PC or stream not ready, storing offer for later");
        pendingOffersRef.current.push({ offer, fromId });
        return;
      }
      
      await handleOffer(offer, fromId);
    });

    return () => {
      socket.off("offer");
    };
  }, [stream]); 

  // handle answer
  useEffect(() => {
    socket.on("answer", async ({ answer, fromId }) => {
      console.log("ANSWER received from:", fromId);
      if (!pcRef.current) {
        console.error("No PC for answer");
        return;
      }
      await pcRef.current.setRemoteDescription(answer);
      console.log("Remote description set from answer");
      
      for (const c of iceQueue.current) {
        await pcRef.current.addIceCandidate(c);
      }
      iceQueue.current = [];
    });

    return () => {
      socket.off("answer");
    };
  }, []);

  // Handle ICE candidates
  useEffect(() => {
    socket.on("ice-candidate", async ({ candidate, fromId }) => {
      console.log("ICE candidate received from:", fromId);
      if (candidate && pcRef.current) {
        if (pcRef.current.remoteDescription) {
          console.log("Adding ICE candidate immediately");
          await pcRef.current.addIceCandidate(candidate);
        } else {
          console.log("Queuing ICE candidate");
          iceQueue.current.push(candidate);
        }
      }
    });

    return () => {
      socket.off("ice-candidate");
    };
  }, []);

  // Users list
  const [participants, setParticipants] = useState([]);
  useEffect(() => {
    if (!socket) return;

    const handleUsers = (users) => {
      console.log("Participants list updated:", users);
      setParticipants(users);
    };

    socket.on("existing-users", handleUsers);

    return () => {
      socket.off("existing-users", handleUsers);
    };
  }, [socket]);

  // Handle user leaving
  useEffect(() => {
    socket.on("user-left", ({ userId }) => {
      console.log("User left:", userId);
      if (targetRef.current === userId) {
        setRemoteStream(null);
        setIsConnected(false);
        targetRef.current = null;
      }
    });

    return () => {
      socket.off("user-left");
    };
  }, []);

  const otherUser = participants.find(user => user.id !== socket.id);

  // Debug render info
  console.log("Render state:", {
    hasStream: !!stream,
    hasRemoteStream: !!remoteStream,
    participantsCount: participants.length,
    targetId: targetRef.current,
    isConnected
  });

  return (
    <div className="bg-dark text-white vh-100 p-3">
      <h5 className="text-center">Meeting: {roomId}</h5>
      
      {/* Debug info
      <div style={{ fontSize: "12px", textAlign: "center", marginBottom: "10px", color: "#ccc" }}>
        Socket ID: {socket.id} | Remote Stream: {remoteStream ? "YES" : "NO"} | 
        Connected: {isConnected ? "YES" : "NO"} | Participants: {participants.length}
      </div> */}

      <div style={{ display: "flex", height: "80vh", gap: "12px" }}>

        {/* LEFT SIDE VIDEO */}
        <div
          style={{
            flex: 3,
            display: "grid",
            gridTemplateColumns: remoteStream ? "1fr 1fr" : "1fr",
            gap: "10px",
            height: "100%"
          }}
        >
          {/*VIDEO */}
          <div style={{ position: "relative" }}>
            {stream ? (
              <VideoPlayer
                stream={stream}
                muted={true}
                audio={audioOn}
                video={videoOn}
              />
            ) : (
              <div style={{ background: "#333", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Loading camera...
              </div>
            )}
            <div style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "rgba(0,0,0,0.6)",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "14px"
            }}>
              {name} (You)
            </div>
          </div>

          {remoteStream ? (
            <div style={{ position: "relative" }}>
              <VideoPlayer 
                stream={remoteStream} 
                muted={false}
                audio={remoteMedia.audio}
                video={remoteMedia.video}
              />
              {!remoteMedia.audio && (
                <div style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "rgba(0,0,0,0.6)",
                  padding: "4px 6px",
                  borderRadius: "4px"
                }}>
                  🔇
                </div>
              )}
              {!remoteMedia.video && (
                <div style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
                  background: "rgba(0,0,0,0.6)",
                  padding: "4px 8px",
                  borderRadius: "6px"
                }}>
                  Camera Off
                </div>
              )}
              <div style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "14px"
              }}>
                {otherUser?.name || "Other User"}
              </div>
            </div>
          ) : (
            <div style={{ 
              background: "#333", 
              height: "100%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              borderRadius: "10px"
            }}>
              Waiting for other user to join...
            </div>
          )}
        </div>

        {/* RIGHT SIDE USERS LIST */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#1e1e1e",
            borderRadius: "10px",
            padding: "10px",
            overflowY: "auto"
          }}
        >
          <h6 className="text-center mb-3">Participants ({participants.length})</h6>
          {participants?.map((user) => (
            <div
              key={user.id}
              style={{
                padding: "8px",
                marginBottom: "6px",
                backgroundColor: "#2c2c2c",
                borderRadius: "6px"
              }}
            >
              {user.name} {user.id === socket.id ? "(You)" : ""}
              {user.id === targetRef.current && " 📹"}
            </div>
          ))}
        </div>
      </div>

      {/* CONTROLS */}
      <div
        className="d-flex justify-content-center gap-3"
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10
        }}
      >
        <button className="btn btn-warning" onClick={toggleVideo}>
          {videoOn ? "Turn Video Off 📹" : "Turn Video On 🎥"}
        </button>
        <button className="btn btn-warning" onClick={toggleAudio}>
          {audioOn ? "Mute 🔇" : "Unmute 🔊"}
        </button>
        <button className="btn btn-danger" onClick={endMeet}>
          End Call
        </button>
      </div>
    </div>
  );
}