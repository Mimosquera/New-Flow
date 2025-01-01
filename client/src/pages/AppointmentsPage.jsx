const Header = () => {
  return (
    <header className="header container-fluid">
      <div className="content">
        <h2>Make an Appointment!</h2>
        <p>Call or schedule online to make an appointment!</p>
      </div>
    </header>
  );
};

const AppointmentsPage = () => {
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

export default AppointmentsPage;
