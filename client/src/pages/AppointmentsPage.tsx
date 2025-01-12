import { useEffect, useState } from "react";
// import HeroBanner from "../components/HeroBanner";
// import ContactSection from "../components/ContactSection";
import axios from "axios";

const PageTitle = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState(null);
  // const [error, setError] = useState(null);
  // const [error, setError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState([]);

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
      const response = await axios.get('http://localhost:3001/event-types', {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Include Authorization header
        },
      });
      setEventTypes(response.data.collection); // Event types are in the "collection" key
    } catch (err) {
      console.error(err);
      // setError('Error fetching event types.');
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEventTypes();
    }
  }, [accessToken]);

  const handleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token");

    if (!token) {
      // setError("Access token is missing.");
      return;
    }

    setAccessToken(token);
  };

  // const fetchUserData = async (token: any) => {
  //   try {
  //     const response = await axios.get("http://localhost:3001/user-data", {
  //       params: { access_token: token },
  //     });
  //     setUserData(response.data);
  //   } catch {
  //     // setError("Error fetching user data.");
  //   }
  // };

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
            marginTop: "50px", // Add space above the h2
            textAlign: "center", // Center the text horizontally
            fontSize: "1.5rem", // Adjust font size
          }}
        >
          Select your service type to view available appointment times
        </h2>

        {!accessToken ? (
          <button
            style={buttonStyles}
            onClick={() => (window.location.href = "http://localhost:3001/auth")}
            {...hoverHandlers}
          >
            Login with Calendly
          </button>
        ) : (
          <>
            {eventTypes.length > 0 ?
              eventTypes.map((item: any) => {
                return <div className="p-2 m-4">
                  <div className="m-2">{item.name}</div>
                  <div>
                    <a href={item.scheduling_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button style={buttonStyles} {...hoverHandlers}>
                        Schedule
                      </button>
                    </a>
                  </div>
                </div>
              })
              : <></>

            }
            {/* <button onClick={() => fetchUserData(accessToken)}>
            Fetch User Data
          </button> */}
          </>
        )}
        {/* {error && <p style={{ color: "red" }}>{error}</p>} */}
        {userData && (
          <div>
            <h2>User Data:</h2>
            <pre>{JSON.stringify(userData, null, 2)}</pre>
          </div>
        )}
        <p className="light-text">Call or schedule online to make an appointment!</p>
      </div>
    </header>
  );
};

const AppointmentsPage = () => {
  return (
    <div className="d-flex flex-column w-100">
      {/* <HeroBanner /> */}
      <main className="container-fluid">
        <div>
          <PageTitle />
          {/* <ContactSection /> */}
        </div>
      </main>
    </div>
  );
};

export default AppointmentsPage;
