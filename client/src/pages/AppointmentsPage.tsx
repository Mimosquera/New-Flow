import { useEffect, useState } from "react";
// import ContactSection from "../components/ContactSection";
import axios from "axios";

const PageTitle = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [eventTypes, setEventTypes] = useState([]);
  const baseUrl = (import.meta as any).env.VITE_BASE_URL || "http://localhost:3001";

  const buttonStyles = {
    backgroundColor: "#007bff", // Bootstrap primary color
    color: "#fff", // White text
    padding: "10px 20px", // Add padding for size
    fontSize: "1rem", // Adjust font size
    border: "none", // Remove default border
    borderRadius: "5px", // Rounded corners
    cursor: "pointer", // Pointer cursor on hover
    transition: "background-color 0.3s ease", // Smooth hover effect
    width: "100%", // Full width
  };

  const hoverHandlers = {
    onMouseOver: (e: React.MouseEvent<HTMLButtonElement>) =>
      (e.currentTarget.style.backgroundColor = "#0056b3"), // Darken on hover
    onMouseOut: (e: React.MouseEvent<HTMLButtonElement>) =>
      (e.currentTarget.style.backgroundColor = "#007bff"), // Reset on mouse out
  };

  useEffect(() => {
    console.log("eventTypes:", eventTypes);
  }, [eventTypes]);

  useEffect(() => {
    console.log("accessToken:", accessToken);
  }, [accessToken]);

  const fetchEventTypes = async () => {
    if (!accessToken) return;

    try {
      const response = await axios.get(`${baseUrl}/event-types`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setEventTypes(response.data.collection);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserData = async () => {
    if (!accessToken) return;

    try {
      const response = await axios.get(`${baseUrl}/user-data`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUserData(response.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEventTypes();
      fetchUserData();
    }
  }, [accessToken]);

  const handleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token");

    if (!token) return;

    setAccessToken(token);
  };

  useEffect(() => {
    if (window.location.search.includes("access_token=")) {
      handleCallback();
    }
  }, []);

  return (
    <header className="header container-fluid">
      <div>
        <h2
          style={{
            marginTop: "50px",
            textAlign: "center",
            fontSize: "1.5rem",
          }}
        >
          Select your service type to view available appointment times
        </h2>

        {!accessToken ? (
          <button
            className="btn btn-primary w-100 my-4"
            onClick={() => (window.location.href = `${baseUrl}/auth`)}
          >
            Login with Calendly
          </button>
        ) : (
          <>
            {eventTypes.length > 0 ? (
              eventTypes.map((item: any) => (
                <div className="p-2 m-4" key={item.id}>
                  <div className="m-2">{item.name}</div>
                  <div>
                    <a href={item.scheduling_url} target="_blank" rel="noopener noreferrer">
                      <button style={buttonStyles} {...hoverHandlers}>
                        Schedule
                      </button>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p>Loading event types...</p>
            )}

            {userData && (
              <div>
                <h3>User Information</h3>
                <pre>{JSON.stringify(userData, null, 2)}</pre>
              </div>
            )}
          </>
        )}

        <p className="light-text">Call or schedule online to make an appointment!</p>
      </div>
    </header>
  );
};

const AppointmentsPage = () => {
  return (
    <div className="d-flex flex-column w-100">
      <main className="container-fluid">
        <div>
          <PageTitle />
        </div>
      </main>
    </div>
  );
};

export default AppointmentsPage;