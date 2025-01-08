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

const GoogleMap = () => {
  return (
    <div className="google-map-container my-4 header">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3166.492937810876!2d-77.52936438793131!3d37.4726924293863!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b10d703a083203%3A0x4064bb814e21c354!2sNew%20Flow%20Beauty%20Salon%20%26%20Barber%20Shop!5e0!3m2!1sen!2sus!4v1736369030373!5m2!1sen!2sus"
        className="google-map-iframe"
        allow="geolocation"
        allowFullScreen=""
        loading="lazy"
        title="Google Maps Location"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    </div>
  );
};

const AboutUsDetails = () => {
  return (
    <section className="container-fluid">
      <h3>Our Story</h3>
      <p className="light-text sub-text">
        At New Flow, we are proud to be a Latino-owned barbershop and beauty salon rooted in the heart of our community. Since opening our doors in 2009, our mission has been to blend tradition, culture, and creativity to bring out the best in everyone who walks through our doors.
      </p>
      <h3>Our Mission</h3>
      <p className="light-text sub-text">
        We strive to provide exceptional grooming and beauty services while celebrating the vibrant spirit of our Latino heritage. From the rhythmic beats of salsa and reggaetón in the background to the warm and lively conversations in Spanish and English, our space reflects the richness of our culture. But above all, our doors are open to everyone, and we’re dedicated to making all feel welcomed, valued, and at home.
      </p>
      <h3>Why Choose Us?</h3>
      <ul>
        <li className="light-text sub-text">Expert barbers and stylists who are mostly Latino and proudly local.</li>
        <li className="light-text sub-text">An authentic, lively atmosphere inspired by Latino culture.</li>
        <li className="light-text sub-text">A commitment to inclusivity—everyone is welcome here!</li>
        <li className="light-text sub-text">High-quality haircare and grooming services tailored to all hair types and styles.</li>
        <li className="light-text sub-text">A community-centered approach, supporting local events and initiatives.</li>
      </ul>
      <h3>Meet Our Team</h3>
      <p className="light-text sub-text">
        Our team is the heart of New Flow. Most of our barbers and stylists are proud Latinos who bring years of expertise and a deep passion for their craft. With every cut, color, and style, we infuse a bit of our culture and creativity to ensure you leave looking and feeling your absolute best.
      </p>
      <h3>Our Community</h3>
      <p className="light-text sub-text">
        We believe a barbershop and salon should be more than a place for a haircut—it should be a hub for connection and culture. Whether you’re stopping by for a quick trim or a total transformation, you’ll feel the warmth and vibrancy that define our community. ¡Todos son bienvenidos aquí!
      </p>
    </section>
  );
};



const AboutPage = () => {
  return (
    <div className="d-flex flex-column w-100">
      <HeroBanner />
      <main className="container-fluid">
        <PageTitle />
        <GoogleMap />
        <AboutUsDetails />
      </main>
    </div>
  );
};

export default AboutPage;