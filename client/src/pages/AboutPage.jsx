import React from "react";

const Header = () => {
  return (
    <header className="header container">
      <div>
        <h2 className="logo">About Us</h2>
        <p>We are dedicated to bringing out your best you!</p>
      </div>
    </header>
  );
};

const Services = () => {
  return (
    <section className="container">
        <h3>Services</h3>
          <div className="services-list container">
            <div className="service-item">
              <h4>Haircuts</h4>
              <p>Details about this amazing servcie.</p>
            </div>
            <div className="service-item">
              <h4>Hair Styling</h4>
              <p>Details about another amazing servcie.</p>
            </div>
          </div>
    </section>
  );
};

const AboutPage = () => {
  return (
    <div className="container">
      <Header />
      <main className="container">
        <Services />
      </main>
    </div>
  );
};

export default AboutPage;
