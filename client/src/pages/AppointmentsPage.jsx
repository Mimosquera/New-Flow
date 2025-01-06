import React from "react";

const Header = () => {
  return (
    <header className="header container-fluid">
      <div>
        <h2>Make an Appointment!</h2>
        <p className="light-text">Call or schedule online to make an appointment!</p>
      </div>
    </header>
  );
};

const AppointmentsPage = () => {
  return (
    <div className="container-fluid">
      <Header />
      <main className="container-fluid">
        <div>
          {/* Add your content here */}
        </div>
      </main>
    </div>
  );
};

export default AppointmentsPage;
