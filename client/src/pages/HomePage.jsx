import React from "react";
import heroVideo from "../assets/videos/hero-banner-video.mp4";

const HomePage = () => {
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

      {/* Additional Content */}
      <main className="container-fluid">
        <section className="additional-content">
          <h2>About Us</h2>
          <p className="light-text">
            New Flow Beauty Salon & Barber Shop offers exceptional services tailored to your needs. Discover the perfect balance of beauty and relaxation with us.
          </p>
        </section>
      </main>
    </div>
  );
};

export default HomePage;