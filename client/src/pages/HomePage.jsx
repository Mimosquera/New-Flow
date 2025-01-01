const Header = () => {
  return (
    <header className="header">
      <div className="content">
        <h2>New Flow</h2>
        <p className="light-text">New You.</p>
      </div>
    </header>
  );
};

const HomePage = () => {
  return (
    <div className="container-fluid">
      <Header />
      <main className="container-fluid">
        <div className="content">
          {/* Add your content here */}
        </div>
      </main>
    </div>
  );
};

export default HomePage;