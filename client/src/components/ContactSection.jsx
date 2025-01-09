import React from "react";
import instagramLogo from "../assets/images/instagram-logo.png";

const ContactSection = () => {
    return (
      <section className="contact-section">
        <div className="container-fluid text-center">
          <h3>Contact Us</h3>
          <p className="light-text">Phone: (804) 745-2525</p>
          <p className="light-text">7102 Hull Street Road, Suite F, Chesterfield, Virginia 23235</p>
          <a
            href="https://www.instagram.com/newflowsalon/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={instagramLogo}
              alt="Instagram Logo"
              className="instagram-logo"
            />
          </a>
        </div>
      </section>
    );
  };

  export default ContactSection;