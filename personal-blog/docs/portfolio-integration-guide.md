# Blog-Portfolio Integration Guide

This guide explains how to integrate your Next.js blog with your portfolio website using the public API endpoints.

## Available Endpoints

### 1. List Posts

**Endpoint:** `GET /api/public-posts`

Retrieves a paginated list of published blog posts.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of posts per page (default: 6)
- `search` (optional): Search term to filter posts by title or content

**Example Request:**

```
GET https://your-blog-domain.com/api/public-posts?page=1&limit=3&search=react
```

**Example Response:**

```json
{
  "posts": [
    {
      "id": "123",
      "title": "Getting Started with React",
      "slug": "getting-started-with-react",
      "excerpt": "React is a popular JavaScript library for building user interfaces...",
      "image_url": "https://example.com/images/react.jpg",
      "created_at": "2025-06-15T10:30:00Z",
      "updated_at": "2025-06-15T10:30:00Z",
      "content": "# Getting Started with React\n\nReact is a popular JavaScript library..."
    }
    // More posts...
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 3,
    "totalPages": 9
  }
}
```

### 2. Get Single Post

**Endpoint:** `GET /api/public-posts/[slug]`

Retrieves a single blog post by its slug.

**Path Parameters:**

- `slug`: The unique slug of the blog post

**Example Request:**

```
GET https://your-blog-domain.com/api/public-posts/getting-started-with-react
```

**Example Response:**

```json
{
  "post": {
    "id": "123",
    "title": "Getting Started with React",
    "slug": "getting-started-with-react",
    "content": "# Getting Started with React\n\nReact is a popular JavaScript library...",
    "image_url": "https://example.com/images/react.jpg",
    "created_at": "2025-06-15T10:30:00Z",
    "updated_at": "2025-06-15T10:30:00Z",
    "author_id": "user123",
    "published": true
  }
}
```

## React Integration Example

Here's how to integrate your blog posts into your React portfolio:

### Blog Posts Grid Component

```jsx
// BlogSection.jsx
import React, { useState, useEffect } from "react";
import "./BlogSection.css";

const BlogCard = ({ post }) => {
  return (
    <div className="blog-card">
      {post.image_url && (
        <div className="blog-card-image">
          <img src={post.image_url} alt={post.title} />
        </div>
      )}
      <div className="blog-card-content">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <a
          href={`https://your-blog-domain.com/posts/${post.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="read-more"
        >
          Read more →
        </a>
      </div>
    </div>
  );
};

const BlogSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://your-blog-domain.com/api/public-posts?page=${page}&limit=3`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError("Failed to load blog posts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  return (
    <section className="blog-section">
      <h2>Latest from My Blog</h2>

      {loading && <div className="loading-spinner">Loading posts...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <div className="blog-grid">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}

          <div className="blog-cta">
            <a
              href="https://your-blog-domain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="visit-blog-button"
            >
              Visit My Blog
            </a>
          </div>
        </>
      )}
    </section>
  );
};

export default BlogSection;
```

### CSS for the Blog Section

```css
/* BlogSection.css */
.blog-section {
  padding: 4rem 0;
  max-width: 1200px;
  margin: 0 auto;
}

.blog-section h2 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.blog-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  background-color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.blog-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.blog-card-image {
  height: 200px;
  overflow: hidden;
}

.blog-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.blog-card-content h3 {
  margin-top: 0;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.blog-card-content p {
  color: #666;
  margin-bottom: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.read-more {
  margin-top: auto;
  display: inline-block;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.read-more:hover {
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #4b5563;
}

.blog-cta {
  text-align: center;
}

.visit-blog-button {
  display: inline-block;
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s;
}

.visit-blog-button:hover {
  background-color: #2563eb;
}

.loading-spinner {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: #ef4444;
}
```

### Single Post Component (Optional)

If you want to display full blog posts in your portfolio:

```jsx
// BlogPostPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./BlogPostPage.css";

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://your-blog-domain.com/api/public-posts/${slug}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setPost(data.post);
      } catch (err) {
        console.error("Error fetching blog post:", err);
        setError("Failed to load blog post. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!post) {
    return <div className="not-found">Post not found</div>;
  }

  return (
    <article className="blog-post">
      <header>
        <h1>{post.title}</h1>
        <time dateTime={post.created_at}>
          {new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </header>

      {post.image_url && (
        <div className="featured-image">
          <img src={post.image_url} alt={post.title} />
        </div>
      )}

      <div className="post-content">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      <div className="back-link">
        <a href="/blog">← Back to all posts</a>
      </div>
    </article>
  );
};

export default BlogPostPage;
```

## Production Considerations

### 1. CORS Configuration

Before deploying to production, update the CORS headers in both API endpoints:

```typescript
'Access-Control-Allow-Origin': 'https://your-portfolio-domain.com',
```

### 2. Error Handling

Ensure your React components handle API errors gracefully:

- Connection errors
- Server errors
- Not found errors

### 3. Image URLs

Make sure image URLs work correctly in production by:

- Using absolute URLs
- Checking CORS settings for images
- Testing across different browsers

### 4. Caching

Consider implementing cache strategies:

- Use browser caching with appropriate Cache-Control headers
- Consider implementing server-side caching for frequently accessed posts

## Need Help?

If you encounter any issues with the API integration, check:

1. The network tab in your browser's developer tools
2. CORS configuration
3. URL formatting
4. Authentication settings (if applicable)
