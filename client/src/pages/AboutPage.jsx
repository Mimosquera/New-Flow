import React from "react";

const Header = () => {
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
    <div className="container-fluid">
      <Header />
      <main className="container-fluid">
        <div>
          <Services />
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
