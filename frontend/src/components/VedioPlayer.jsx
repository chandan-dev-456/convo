import { useEffect, useRef } from "react";

export default function VideoPlayer({ stream, muted, audio, video }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!videoRef.current || !stream) return;
        videoRef.current.srcObject = stream;
    }, [stream, video]);

    return (
        <div className="position-relative rounded shadow h-100 w-100" style={{ height: "100%", width: "100%", minHeight: "inherit" }}>
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
                <div className="d-flex justify-content-center align-items-center h-100 w-100 text-white bg-dark" style={{ minHeight: "inherit" }}>
                    <div className="text-center">
                        <span style={{ fontSize: "2rem" }}>📹</span>
                        <p className="mb-0 small text-muted mt-1">Camera Off</p>
                    </div>
                </div>
            )}

            {!audio && (
                <div
                    className="position-absolute top-0 end-0 m-2 p-2 bg-dark bg-opacity-75 rounded-circle"
                    style={{
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        backdropFilter: "blur(4px)",
                        zIndex: 1
                    }}
                >
                    🔇
                </div>
            )}

        </div>
    );
}
