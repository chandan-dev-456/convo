import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
export default function JoinPage() {
    const navigate = useNavigate();

    const [guestName, setGuestName] = useState("");
    const [meetingId, setMeetingId] = useState("");
    // const [link, setLink] = useState("");

    const handleGuestJoin = () => {
        if (!guestName || !meetingId) return;

        navigate(`/meeting/${meetingId}`, {
            state: {
                guestName,
                role: "guest"
            }
        });
    };

    return (
        <div className="container-fluid ">
            <div className="tag-line hero-spacing text-center fade-in">
                <h1 className="read-the-docs mb-2">
                    Video calls and meetings for everyone
                </h1>
                <p className="mb-0">
                    <span>Connect and collaborate from anywhere with </span>
                    <span className="highlight">Convo</span>
                </p>
            </div>
            <div className="join-options row mt-5 g-3">
                {/* Guest Name */}
                <div className="col-12">
                    <input
                        placeholder="Enter your name"
                        type="text"
                        name="username"
                        className="meeting-Code rounded-2 w-100"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                    />
                </div>

                {/* Meeting ID */}
                <div className="col-md-8">
                    <input
                        placeholder="Enter meeting link"
                        type="text"
                        name="meetId"
                        className="meeting-Code rounded-2 w-100"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                    />
                </div>

                {/* Join Button */}
                <div className="col-md-4 d-grid" style={{fontSize:"0.9em"}}>
                    <button
                        className="highlight rounded-3"
                        disabled={!guestName || !meetingId}
                        onClick={handleGuestJoin}
                    >
                        Join as Guest
                    </button>
                </div>

            </div>

            <p className="text-muted">_________________________________</p>
            <Link to="/signup" className="text-decoration-none new-meet-link">Sign in to create meetings</Link>
        </div>
    )
}