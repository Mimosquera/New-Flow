import React from "react";

const Footer = ({ onLanguageChange }) => {
  const handleLanguageChange = (event) => {
    onLanguageChange(event.target.value);
  };

  return (
    <footer className="text-center py-3 w-100">
      <p>&copy; {new Date().getFullYear()} New Flow. All rights reserved.</p>
      <div>
        <label htmlFor="language-select" style={{ marginRight: "8px" }}>
          Select Language:
        </label>
        <select
          id="language-select"
          onChange={handleLanguageChange}
          style={{
            border: "none",
            outline: "none",
            fontSize: "1rem",
            cursor: "pointer",
            appearance: "none",
          }}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
        </select>
      </div>
    </footer>
  );
};

export default Footer;