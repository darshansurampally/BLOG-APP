const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/blogapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Blog Post Schema
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Blog = mongoose.model('Blog', blogSchema);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes

// Home page - Display all blog posts
app.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.render('index', { blogs });
  } catch (error) {
    res.status(500).send('Error fetching blogs');
  }
});

// Show form to create new blog post
app.get('/new', (req, res) => {
  res.render('new');
});

// Create new blog post
app.post('/blogs', async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    const newBlog = new Blog({
      title,
      content,
      author,
      tags: tagArray
    });


    await newBlog.save();
    res.redirect('/');
  } catch (error) {
    res.status(500).send('Error creating blog post');
  }
});

// Show individual blog post
app.get('/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog post not found');
    }
    res.render('show', { blog });
  } catch (error) {
    res.status(500).send('Error fetching blog post');
  }
});

// Show edit form
app.get('/blogs/:id/edit', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog post not found');
    }
    res.render('edit', { blog });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).send('Invalid blog ID');
    }
    res.status(500).send('Error fetching blog post');
  }
});

// Update blog post
app.put('/blogs/:id', async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    await Blog.findByIdAndUpdate(req.params.id, {
      title,
      content,
      author,
      tags: tagArray,
      updatedAt: Date.now()
    });
    
    res.redirect(`/blogs/${req.params.id}`);
  } catch (error) {
    res.status(500).send('Error updating blog post');
  }
});

// Delete blog post
app.delete('/blogs/:id', async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (error) {
    res.status(500).send('Error deleting blog post');
  }
});

// Search blogs
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.redirect('/');
    }
    
    const blogs = await Blog.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    }).sort({ createdAt: -1 });
    
    res.render('search', { blogs, query: q });
  } catch (error) {
    res.status(500).send('Error searching blogs');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});