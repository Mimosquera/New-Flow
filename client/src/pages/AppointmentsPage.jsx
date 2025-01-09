import React from "react";
import HeroBanner from "../components/HeroBanner";
import ContactSection from "../components/ContactSection";

const PageTitle = () => {
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
    <div className="d-flex flex-column w-100">
      <HeroBanner />
      <main className="container-fluid">
        <div>
          <PageTitle />
          <ContactSection />
        </div>
      </main>
    </div>
  );
};

export default AppointmentsPage;
