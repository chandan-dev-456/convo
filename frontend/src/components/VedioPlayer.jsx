import { useEffect, useRef } from "react";

export default function VideoPlayer({ stream, muted, audio, video }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!videoRef.current || !stream) return;

        videoRef.current.srcObject = stream;
    }, [stream,video]);

    return (
        <div
            className="position-relative rounded shadow overflow-hidden"
            style={{ width: "100%", height: "80vh", backgroundColor: "#000" }}
        >
            {video ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scaleX(-1)"
                    }}
                />
            ) : (
                <div className="d-flex justify-content-center align-items-center h-100 text-white">
                    Camera Off
                </div>
            )}

            {!audio && (
                <div
                    className="position-absolute top-0 end-0 p-2 text-white"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                >
                    🔇
                </div>
            )}
        </div>
    );
}

