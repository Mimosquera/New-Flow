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
  const baseUrl = (import.meta as any).env.VITE_BASE_URL || "http://localhost:3001"
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
          <button className="btn btn-primary w-100 my-4" 
            onClick={() => (window.location.href = `${baseUrl}/auth`) }
          >
            Login with Calendly
          </button>
        ) : (
          <>
            {eventTypes.length > 0 ?
              eventTypes.map((item: any) => {
                return <div className="p-2 m-4">
                  <div className="m-2">{item.name}</div>
                  <div><a href={item.scheduling_url} target="_blank" rel="noopener noreferrer"><button className="btn btn-primary w-100">Schedule</button></a></div>
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
