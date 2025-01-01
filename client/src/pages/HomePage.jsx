const Header = () => {
    return (
      <header className="header">
        <div>
          <h2>New Flow</h2>
          <p>New You.</p>
        </div>
      </header>
    );
  };

  
  const Services = () => {
    return (
      <section className="services" id="services">
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
  
  const HomePage = () => {
    return (
      <div className="container">
        <Header />
        <main className="container">
          
        </main>
      </div>
    );
  };
  
  export default HomePage;  