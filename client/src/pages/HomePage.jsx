// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import HeroBanner from "../components/HeroBanner";
import ContactSection from "../components/ContactSection";
import { getPosts, createPost } from "../api/postAPI"; // Add this API call

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
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  // Fetch posts from the backend
  useEffect(() => {
    const fetchPosts = async () => {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    };
    fetchPosts();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (newPost.title.trim() && newPost.content.trim()) {
      const postData = {
        title: newPost.title,
        content: newPost.content,
      };

      const newPostObject = await createPost(postData); // Save new post
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
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    setLoggedIn(localStorage.getItem('id_token') ? true : false);
  }, []);

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