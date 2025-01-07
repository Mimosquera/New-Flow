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
        <h2>About Us</h2>
        <p className="light-text">We are dedicated to bringing out your best you!</p>
      </div>
    </header>
  );
};

const Services = () => {
  return (
    <section className="container-fluid">
        <h3>Services</h3>
          <div className="services-list container-fluid">
            <div className="service-item">
              <h4>Haircuts</h4>
              <p className="light-text">Details about this amazing servcie.</p>
            </div>
            <div className="service-item">
              <h4>Hair Styling</h4>
              <p className="light-text">Details about another amazing servcie.</p>
            </div>
          </div>
    </section>
  );
};

const AboutPage = () => {
  return (
    <div className="d-flex flex-column w-100">
      <HeroBanner />
      <main className="container-fluid">
          <PageTitle />
          <Services />
      </main>
    </div>
  );
};

export default AboutPage;