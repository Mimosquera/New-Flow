const Header = () => {
    return (
      <header className="header">
        <div className="container">
          <h1 className="logo">MyWebsite</h1>
        </div>
      </header>
    );
  };
  
  const HeroSection = () => {
    return (
      <section className="hero" id="home">
        <div className="container">
          <h1>Welcome to MyWebsite</h1>
          <p>Your one-stop solution for amazing features.</p>
          <button className="btn-primary">Get Started</button>
        </div>
      </section>
    );
  };
  
  const Features = () => {
    return (
      <section className="features" id="features">
        <div className="container">
          <h2>Features</h2>
          <div className="feature-list">
            <div className="feature-item">
              <h3>Feature One</h3>
              <p>Details about this amazing feature.</p>
            </div>
            <div className="feature-item">
              <h3>Feature Two</h3>
              <p>Details about another amazing feature.</p>
            </div>
            <div className="feature-item">
              <h3>Feature Three</h3>
              <p>Details about yet another feature.</p>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  
  const Footer = () => {
    return (
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} MyWebsite. All rights reserved.</p>
        </div>
      </footer>
    );
  };
  
  const HomePage = () => {
    return (
      <div>
        <Header />
        <main className="container">
          <HeroSection />
          <Features />
        </main>
        <Footer />
      </div>
    );
  };
  
  export default HomePage;  