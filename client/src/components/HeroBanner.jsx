import React from "react";
import heroVideo from "../assets/videos/hero-banner-video.mp4";

const HeroBanner = () => {
  return (
    <div className="homepage">
      {/* Hero Banner */}
      <div className="hero-banner">
        <video
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay"></div>
      </div>
    </div>
  );
};

export default HeroBanner;