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

const PageTitle = () => {
  return (
    <header className="header container-fluid">
      <div>
        <h2>Welcome!</h2>
        <p className="light-text">We're here to help you find the New You!</p>
      </div>
    </header>
  );
};

const HomePage = () => {
  return (
    <div className="d-flex flex-column w-100">
      <HeroBanner />
      <main className="container-fluid">
          <PageTitle />
      </main>
    </div>
  );
};

export default HomePage;