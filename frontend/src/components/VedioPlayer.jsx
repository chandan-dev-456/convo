import { useEffect, useRef } from "react";

export default function VideoPlayer({ stream, muted, audio, video }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!videoRef.current || !stream) return;
        videoRef.current.srcObject = stream;
    }, [stream, video]);

    return (
        <div className="position-relative rounded shadow h-100 w-100" style={{ 
            height: "100%", 
            width: "100%", 
            minHeight: "inherit",
            overflow: "hidden",
            backgroundColor: "#1a1a1a"
        }}>
            {video ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-100 h-100"
                    style={{
                        objectFit: "cover",
                        transform: "scaleX(-1)",
                        width: "100%",
                        height: "100%"
                    }}
                />
            ) : (
                <div className="d-flex justify-content-center align-items-center h-100 w-100 text-white" style={{ 
                    minHeight: "inherit",
                    height: "100%",
                    backgroundColor: "#2a2a2a"
                }}>
                    <div className="text-center">
                        <span style={{ fontSize: "3rem", opacity: 0.7 }}>📹</span>
                        <p className="mb-0 small text-muted mt-2">Camera is off</p>
                    </div>
                </div>
            )}

            {/* Audio mute icon - centered when camera is off */}
            {!audio && video && (
                <div
                    className="position-absolute"
                    style={{
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.7)",
                        borderRadius: "50%",
                        fontSize: "24px",
                        backdropFilter: "blur(4px)",
                        zIndex: 2,
                        pointerEvents: "none"
                    }}
                >
                    🔇
                </div>
            )}
            
            {/* Small audio indicator in corner when camera is on */}
            {!audio && video && (
                <div
                    className="position-absolute top-0 end-0 m-2 p-1 bg-dark bg-opacity-75 rounded-circle"
                    style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        backdropFilter: "blur(4px)",
                        zIndex: 1,
                        pointerEvents: "none"
                    }}
                >
                    🔇
                </div>
            )}
        </div>
    );
}
