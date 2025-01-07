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
        <h2>Make an Appointment!</h2>
        <p className="light-text">Call or schedule online to make an appointment!</p>
      </div>
    </header>
  );
};

const AppointmentsPage = () => {
  return (
    <div className="d-flex flex-column w-100">
      <HeroBanner />
      <main className="container-fluid">
        <div>
          <PageTitle />
        </div>
      </main>
    </div>
  );
};

export default AppointmentsPage;
