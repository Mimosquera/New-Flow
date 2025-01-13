// src/api/postAPI.ts
const getPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      return data;
    } catch (err) {
      console.error('Error fetching posts:', err);
      return [];
    }
  };
  
  interface PostData {
    title: string;
    content: string;
    // add other fields as necessary
  }

  const createPost = async (postData: PostData) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('id_token')}`,
        },
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      return data;
    } catch (err) {
      console.error('Error creating post:', err);
      return null;
    }
  };
  
  export { getPosts, createPost };  