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

  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);

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

    setParticipants(prev => prev.map(p =>
      p.id === socket.id ? { ...p, video: track.enabled } : p
    ));

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

    setParticipants(prev => prev.map(p =>
      p.id === socket.id ? { ...p, audio: audioTrack.enabled } : p
    ));

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

      if (type === "audio") {
        setRemoteMedia(prev => ({ ...prev, audio: value }));
        setParticipants(prev => prev.map(p =>
          p.id === fromId ? { ...p, audio: value } : p
        ));
      }
      if (type === "video") {
        setRemoteMedia(prev => ({ ...prev, video: value }));
        setParticipants(prev => prev.map(p =>
          p.id === fromId ? { ...p, video: value } : p
        ));
      }
    });

    return () => {
      socket.off("media-update");
    };
  }, []);

  const initiateCall = async (targetUserId) => {
    if (!pcRef.current || !stream) return;

    const pc = pcRef.current;

    if (pc.getSenders().length === 0) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", {
      targetId: targetUserId,
      offer,
      fromId: socket.id
    });
  };

  const processPendingOffers = async () => {
    if (pendingOffersRef.current.length > 0 && pcRef.current && stream) {
      const offers = [...pendingOffersRef.current];
      pendingOffersRef.current = [];

      for (const { offer, fromId } of offers) {
        await handleOffer(offer, fromId);
      }
    }
  };

  const handleOffer = async (offer, fromId) => {
    targetRef.current = fromId;
    const pc = pcRef.current;

    if (pc.getSenders().length === 0) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    await pc.setRemoteDescription(offer);

    for (const c of iceQueue.current) {
      await pc.addIceCandidate(c);
    }
    iceQueue.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", {
      targetId: fromId,
      answer,
      fromId: socket.id
    });
  };

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      socket.emit("join-room", {
        roomId: roomId,
        name: name
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, name]);

  useEffect(() => {
    socket.on("user-joined", async (data) => {
      targetRef.current = data.userId;

      if (!stream) {
        const waitForStream = setInterval(() => {
          if (stream && pcRef.current) {
            clearInterval(waitForStream);
            initiateCall(data.userId);
          }
        }, 100);
        return;
      }

      if (pcRef.current && stream) {
        await initiateCall(data.userId);
      }
    });

    return () => {
      socket.off("user-joined");
    };
  }, [stream]);

  useEffect(() => {
    if (!stream) return;

    if (!pcRef.current) {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && targetRef.current) {
          socket.emit("ice-candidate", {
            targetId: targetRef.current,
            candidate: event.candidate,
            fromId: socket.id
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setIsConnected(true);
        }
      };
    }
    processPendingOffers();

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    socket.on("offer", async ({ offer, fromId }) => {
      if (!pcRef.current || !stream) {
        pendingOffersRef.current.push({ offer, fromId });
        return;
      }

      await handleOffer(offer, fromId);
    });

    return () => {
      socket.off("offer");
    };
  }, [stream]);

  useEffect(() => {
    socket.on("answer", async ({ answer, fromId }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(answer);

      for (const c of iceQueue.current) {
        await pcRef.current.addIceCandidate(c);
      }
      iceQueue.current = [];
    });

    return () => {
      socket.off("answer");
    };
  }, []);

  useEffect(() => {
    socket.on("ice-candidate", async ({ candidate, fromId }) => {
      if (candidate && pcRef.current) {
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(candidate);
        } else {
          iceQueue.current.push(candidate);
        }
      }
    });

    return () => {
      socket.off("ice-candidate");
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUsers = (users) => {
      const usersWithMedia = users.map(user => ({
        ...user,
        audio: user.id === socket.id ? audioOn : true,
        video: user.id === socket.id ? videoOn : true
      }));
      setParticipants(usersWithMedia);
    };

    socket.on("existing-users", handleUsers);

    return () => {
      socket.off("existing-users", handleUsers);
    };
  }, [socket, audioOn, videoOn]);

  useEffect(() => {
    socket.on("user-left", ({ userId }) => {
      if (targetRef.current === userId) {
        setRemoteStream(null);
        setIsConnected(false);
        targetRef.current = null;
      }
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    return () => {
      socket.off("user-left");
    };
  }, []);

  const otherUser = participants.find(user => user.id !== socket.id);

  const getVideoGridClass = () => {
    const videoCount = [stream ? 1 : 0, remoteStream ? 1 : 0].filter(Boolean).length;
    if (videoCount === 1) return "video-grid one";
    if (videoCount === 2) return "video-grid two";
    return "video-grid multi";
  };

  return (
    <div className="bg-dark text-white min-vh-100 d-flex flex-column" style={{ height: "100vh", overflow: "hidden", paddingBottom: "0" }}>

      <div className="position-sticky top-0 bg-dark z-3 px-2 px-sm-3 py-2 shadow-sm" style={{ zIndex: 1020 }}>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 text-truncate" style={{ fontSize: "14px" }}>
            Meeting: {roomId}
          </h6>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="btn btn-sm btn-outline-light position-relative"
            style={{ fontSize: "12px" }}
          >
            👥 {participants.length}
            {!showParticipants && participants.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New</span>
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-2 px-sm-3 mt-2 flex-grow-1" style={{ overflow: "hidden" }}>
        <div className={getVideoGridClass()}>
          {/* local video */}
          <div className="position-relative rounded shadow h-100 w-100">
            {stream ? (
              <VideoPlayer
                stream={stream}
                muted={true}
                audio={audioOn}
                video={videoOn}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 bg-dark rounded w-100">
                <div className="text-center">
                  <div className="spinner-border text-light mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mb-0 small text-muted">Loading camera...</p>
                </div>
              </div>
            )}
            <div className="position-absolute bg-dark bg-opacity-75 px-2 py-1 rounded small" style={{ bottom: "10px", left: "10px", zIndex: 2 }}>
              {name} (You) {!audioOn && "🔇"} {!videoOn && "📹"}
            </div>
          </div>

          {/* Remote Video */}
          {remoteStream && (
            <div className="position-relative rounded shadow h-100 w-100">
              <VideoPlayer
                stream={remoteStream}
                muted={false}
                audio={remoteMedia.audio}
                video={remoteMedia.video}
              />
              <div className="position-absolute bg-dark bg-opacity-75 px-2 py-1 rounded small" style={{ bottom: "10px", left: "10px", zIndex: 2 }}>
                {otherUser?.name || "Other User"}
                {!remoteMedia.audio && " 🔇"}
                {!remoteMedia.video && " 📹"}
              </div>
            </div>
          )}

          {/* Waiting State */}
          {!remoteStream && participants.length > 1 && (
            <div className="d-flex align-items-center justify-content-center h-100 bg-secondary rounded shadow w-100">
              <div className="text-center">
                <div className="spinner-grow text-light mb-2" role="status">
                  <span className="visually-hidden">Waiting...</span>
                </div>
                <p className="mb-0 small">Waiting for {otherUser?.name || 'other user'} to join...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Participants Drawer */}
      {showParticipants && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75"
            style={{ zIndex: 1040 }}
            onClick={() => setShowParticipants(false)}
          />

          <div
            className="position-fixed bottom-0 start-0 end-0 bg-dark rounded-top-3 shadow-lg"
            style={{
              zIndex: 1050,
              maxHeight: "60vh",
              animation: "slideUp 0.3s ease-out"
            }}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
              <h6 className="mb-0">Participants ({participants.length})</h6>
              <button
                onClick={() => setShowParticipants(false)}
                className="btn-close btn-close-white"
              />
            </div>

            <div style={{ maxHeight: "calc(60vh - 60px)", overflowY: "auto" }}>
              {participants.map((user) => (
                <div
                  key={user.id}
                  className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary"
                >
                  <div className="d-flex align-items-center gap-2 flex-grow-1">
                    <div className={`rounded-circle bg-${user.id === socket.id ? 'warning' : 'info'} bg-opacity-50`}
                      style={{ width: "10px", height: "10px" }}></div>
                    <span className="small">
                      {user.name}
                      {user.id === socket.id && <span className="text-warning ms-1">(You)</span>}
                    </span>
                  </div>

                  <div className="d-flex gap-3">
                    {user.id !== socket.id && (
                      <>
                        {user.audio !== undefined && (
                          user.audio ?
                            <span className="text-success" title="Microphone on">🎤</span> :
                            <span className="text-muted" title="Microphone off">🔇</span>
                        )}
                        {user.video !== undefined && (
                          user.video ?
                            <span className="text-info" title="Camera on">📹</span> :
                            <span className="text-muted" title="Camera off">📹❌</span>
                        )}
                      </>
                    )}

                    {user.id === targetRef.current && (
                      <span className="badge bg-info rounded-pill" style={{ fontSize: "10px" }}>Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      {showParticipants && window.innerWidth >= 992 && (
        <div className="position-fixed top-0 end-0 h-100 bg-dark shadow-lg" style={{ width: "280px", zIndex: 1030, top: "60px" }}>
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Participants ({participants.length})</h6>
              <button
                onClick={() => setShowParticipants(false)}
                className="btn-close btn-close-white"
              />
            </div>

            <div style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
              {participants.map((user) => (
                <div
                  key={user.id}
                  className="d-flex justify-content-between align-items-center p-2 mb-2 rounded bg-secondary bg-opacity-25"
                >
                  <div className="d-flex align-items-center gap-2 flex-grow-1">
                    <div className={`rounded-circle bg-${user.id === socket.id ? 'warning' : 'info'} bg-opacity-50`}
                      style={{ width: "8px", height: "8px" }}></div>
                    <span className="small text-truncate" style={{ maxWidth: "120px" }}>
                      {user.name}
                      {user.id === socket.id && <span className="text-warning ms-1">(You)</span>}
                    </span>
                  </div>

                  <div className="d-flex gap-2">
                    {user.id !== socket.id && (
                      <>
                        {user.audio !== undefined && !user.audio && (
                          <span className="text-muted small" title="Microphone off">🔇</span>
                        )}
                        {user.video !== undefined && !user.video && (
                          <span className="text-muted small" title="Camera off">📹❌</span>
                        )}
                      </>
                    )}

                    {user.id === targetRef.current && (
                      <span className="badge bg-info rounded-pill" style={{ fontSize: "10px" }}>📹</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="p-3 bg-dark" style={{ zIndex: 1020 }}>
        <div className="d-flex justify-content-center gap-3">
          <button
            onClick={toggleVideo}
            className={`btn rounded-circle shadow-lg ${videoOn ? 'btn-outline-light' : 'btn-danger'}`}
            style={{ width: "50px", height: "50px", fontSize: "20px" }}
          >
            {videoOn ? "📹" : "🚫📹"}
          </button>

          <button
            onClick={toggleAudio}
            className={`btn rounded-circle shadow-lg ${audioOn ? 'btn-outline-light' : 'btn-danger'}`}
            style={{ width: "50px", height: "50px", fontSize: "20px" }}
          >
            {audioOn ? "🎤" : "🔇"}
          </button>

          <button
            onClick={endMeet}
            className="btn btn-danger rounded-circle shadow-lg"
            style={{ width: "50px", height: "50px", fontSize: "20px" }}
          >
            📞
          </button>
        </div>

        <div className="d-flex justify-content-center gap-4 mt-2 d-sm-none">
          <small className="text-white-50">{videoOn ? "Video" : "Off"}</small>
          <small className="text-white-50">{audioOn ? "Audio" : "Mute"}</small>
          <small className="text-danger">End</small>
        </div>
      </div>
      <style jsx>{`
          .video-grid {
            display: grid;
            gap: 12px;
            width: 100%;
            height: calc(100vh - 160px); /* Use full available height */
          }
          
          .video-grid.one {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
          }
          
          .video-grid.one > div {
            height: 100%;
            max-height: calc(100vh - 180px);
          }
          
          .video-grid.two {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: 1fr;
          }
          
          .video-grid.two > div {
            height: 100%;
            max-height: calc(100vh - 180px);
          }
          
          .video-grid.multi {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            grid-auto-rows: 1fr;
          }
          
          .video-grid > div {
            min-width: 0;
            overflow: hidden;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            position: relative;
          }
        
          /* Desktop Large Screens */
          @media (min-width: 1200px) {
            .video-grid {
              height: calc(100vh - 160px);
            }
            .video-grid.one > div,
            .video-grid.two > div {
              max-height: calc(100vh - 180px);
            }
          }
        
          /* Desktop Medium Screens */
          @media (min-width: 992px) and (max-width: 1199px) {
            .video-grid {
              height: calc(100vh - 160px);
            }
            .video-grid.one > div,
            .video-grid.two > div {
              max-height: calc(100vh - 180px);
            }
          }
        
          /* Tablet Screens */
          @media (min-width: 768px) and (max-width: 991px) {
            .video-grid {
              height: calc(100vh - 150px);
              gap: 10px;
            }
            .video-grid.two {
              grid-template-columns: repeat(2, 1fr);
            }
            .video-grid.one > div,
            .video-grid.two > div {
              max-height: calc(100vh - 170px);
            }
          }
        
          /* Mobile Screens */
          @media (max-width: 767px) {
            .video-grid {
              height: auto;
              min-height: auto;
              gap: 8px;
            }
            
            .video-grid.one {
              grid-template-columns: 1fr;
              height: 60vh;
            }
            
            .video-grid.one > div {
              height: 60vh;
              max-height: 60vh;
            }
            
            .video-grid.two {
              grid-template-columns: 1fr;
              grid-template-rows: repeat(2, 1fr);
              height: auto;
              min-height: 80vh;
            }
            
            .video-grid.two > div {
              height: 40vh;
              min-height: 250px;
              max-height: 45vh;
            }
            
            .video-grid.multi {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        
          /* Small Mobile Screens */
          @media (max-width: 480px) {
            .video-grid.one {
              height: 55vh;
            }
            
            .video-grid.one > div {
              height: 55vh;
              max-height: 55vh;
            }
            
            .video-grid.two > div {
              height: 35vh;
              min-height: 200px;
              max-height: 40vh;
            }
          }
          
          /* Landscape mode fix for laptop/desktop */
          @media (min-width: 768px) {
            .video-grid.two > div {
              overflow-y: auto; /* Allow scroll if content overflows */
            }
            
            /* Ensure VideoPlayer fills the container */
            .video-grid.two > div > div {
              height: 100% !important;
              min-height: 100% !important;
            }
          }
          
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        
          .z-3 {
            z-index: 1030;
          }
        `}</style>
    </div>
  );
}
