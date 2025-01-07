import React from "react";
import heroVideo from "../assets/videos/hero-banner-video.mp4";

const HeroBanner = () => {
  return (
    <div className="homepage">
      {/* Hero Banner */}
      <div className="hero-banner">
        <video
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay"></div>
      </div>
    </div>
  );
};

const PageTitle = () => {
  return (
    <header className="header container-fluid">
      <div>
        <h2>Welcome!</h2>
        <p className="light-text">We're here to help you find the New You!</p>
      </div>
    </header>
  );
};

const NewsUpdates = ({ loggedIn }) => {
  const samplePosts = [
    {
      id: 1,
      title: "Grand Opening Celebration!",
      content: "Join us for our grand opening celebration with special discounts on services.",
      date: "2025-01-01",
    },
    {
      id: 2,
      title: "New Year, New Look!",
      content: "Check out our new styles and services for the new year.",
      date: "2025-01-05",
    },
  ];

  return (
    <section className="news-updates container-fluid">
      <h3 className="text-center mb-4">News & Updates</h3>
      {loggedIn && (
        <div className="text-center mb-3">
          <button className="btn btn-primary">Create Post</button>
        </div>
      )}
      <div className="posts">
        {samplePosts.map((post) => (
          <div key={post.id} className="post card mb-3">
            <div className="card-body">
              <h5 className="card-title">{post.title}</h5>
              <h6 className="card-subtitle mb-2 text-muted">{post.date}</h6>
              <p className="card-text">{post.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const HomePage = () => {
  return (
    <div className="d-flex flex-column w-100">
      <HeroBanner />
      <main className="container-fluid">
        <PageTitle />
        <NewsUpdates />
      </main>
    </div>
  );
};

export default HomePage;
