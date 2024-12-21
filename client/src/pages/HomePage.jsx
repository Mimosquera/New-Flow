const Header = () => {
    return (
      <header className="header container">
        <div>
          <h1 className="logo">New Flow Beauty Salon & Barber Shop</h1>
          <p>New Flow, New You.</p>
        </div>
      </header>
    );
  };

  
  const Services = () => {
    return (
      <section className="services" id="services">
        <div className="container">
          <h2>Services</h2>
          <div className="services-list container">
            <div className="service-item">
              <h3>Haircuts</h3>
              <p>Details about this amazing servcie.</p>
            </div>
            <div className="service-item">
              <h3>Hair Styling</h3>
              <p>Details about another amazing servcie.</p>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  const HomePage = () => {
    return (
      <div className="container">
        <Header />
        <main className="container">
          <Services />
        </main>
      </div>
    );
  };
  
  export default HomePage;  