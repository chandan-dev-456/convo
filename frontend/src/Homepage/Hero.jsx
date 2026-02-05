import React from "react";
import { Link } from "react-router-dom";
export default function Hero() {
    return (
        <div>
            <h1>
                <span className="highlight">Connect</span>
                <span style={{ color: "whitesmoke" }}> with your loved ones</span>
            </h1>
            <p>More than calls — it’s Convo</p>
            <Link to="/guest">
                <button className="highlight rounded-3">Get Started</button>
            </Link>

        </div>

    )
}