import React, { useState } from "react";
import HeroBanner from "../components/HeroBanner";
import ContactSection from "../components/ContactSection";

const PageTitle = () => {
  return (
    <header className="header container-fluid">
      <div>
        <h2>New Flow Beauty Salon & Barber Shop!</h2>
        <p className="light-text">We're here to help you find the New You!</p>
      </div>
    </header>
  );
};

const NewsUpdates = ({ loggedIn }) => {
  const [posts, setPosts] = useState([
    { id: 1, title: "Welcome to our salon!", content: "Check out our latest updates and offers.", date: "2024-12-24" },
    { id: 2, title: "New Barber in Town", content: "We’ve added a talented barber to our team!", date: "2025-01-05" },
  ]);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (newPost.title.trim() && newPost.content.trim()) {
      const newPostObject = {
        id: Date.now(),
        title: newPost.title,
        content: newPost.content,
        date: new Date().toLocaleDateString(),
      };
      setPosts([newPostObject, ...posts]); 
      setNewPost({ title: "", content: "" });
    }
  };

  return (
    <div className="news-updates container">
      <h2 className="header">Salon News & Updates</h2>
      {loggedIn && (
        <div className="create-post-form">
          <h3>Create a Post</h3>
          <form onSubmit={handlePostSubmit}>
            <div className="mb-3">
              <label htmlFor="post-title" className="form-label">Title</label>
              <input
                type="text"
                id="post-title"
                className="form-control"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="post-content" className="form-label">Content</label>
              <textarea
                id="post-content"
                className="form-control"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Post</button>
          </form>
        </div>
      )}

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post card my-3">
            <div className="card-body">
              <h4 className="card-title">{post.title}</h4>
              <h6 className="card-subtitle mb-2">{post.date}</h6>
              <p className="card-text">{post.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomePage = () => {
  // Replace this with your actual logic for determining if the user is logged in
  const [loggedIn] = useState(true);

  return (
    <div className="d-flex flex-column w-100">
      <HeroBanner />
      <main className="container-fluid">
        <PageTitle />
        <NewsUpdates loggedIn={loggedIn} />
        <ContactSection />
      </main>
    </div>
  );
};

export default HomePage;