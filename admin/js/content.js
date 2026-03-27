/**
 * TMR Content Manager
 * Loads content.json, provides CRUD operations, persists to localStorage.
 * On first load, seeds from content.json. After that, localStorage is the source of truth.
 */

var TMRContent = (function() {
  var STORAGE_KEY = 'tmr_content';
  var data = null;

  // Deep clone helper
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  // Generate a unique ID from title
  function slugify(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
  }

  return {
    // Initialize: load from localStorage, try fetch, or use embedded seed
    init: async function() {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          data = JSON.parse(stored);
          return data;
        } catch (e) { /* fall through */ }
      }
      // Try fetching content.json (works on http://, fails on file://)
      try {
        var resp = await fetch('../content.json');
        if (resp.ok) {
          data = await resp.json();
          this.save();
          return data;
        }
      } catch (e) { /* file:// protocol, fall through to seed */ }
      // Fallback: use embedded seed data (loaded from content-seed.js)
      if (typeof TMR_SEED !== 'undefined') {
        data = JSON.parse(JSON.stringify(TMR_SEED));
      } else {
        data = { meta: { version: '1.0', lastUpdated: new Date().toISOString(), updatedBy: 'system' }, posts: [], categories: [], sections: [] };
      }
      this.save();
      return data;
    },

    // Persist to localStorage
    save: function() {
      if (!data) return;
      data.meta.lastUpdated = new Date().toISOString();
      data.meta.updatedBy = 'admin';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    // Get all posts
    getPosts: function() {
      return data ? clone(data.posts) : [];
    },

    // Get single post by ID
    getPost: function(id) {
      if (!data) return null;
      var post = data.posts.find(function(p) { return p.id === id; });
      return post ? clone(post) : null;
    },

    // Create a new post
    createPost: function(postData) {
      if (!data) return null;
      var now = new Date().toISOString();
      var post = {
        id: postData.slug || slugify(postData.title || 'untitled'),
        title: postData.title || 'Untitled Post',
        slug: postData.slug || slugify(postData.title || 'untitled'),
        status: postData.status || 'draft',
        type: postData.type || 'post',
        section: postData.section || 'front9',
        category: postData.category || 'pro-tour',
        tags: postData.tags || [],
        flag: postData.flag || null,
        excerpt: postData.excerpt || '',
        body: postData.body || '',
        source: postData.source || 'TMR Editorial',
        sourceUrl: postData.sourceUrl || '',
        author: postData.author || 'TMR Editorial',
        publishedAt: postData.status === 'published' ? now : null,
        scheduledAt: postData.scheduledAt || null,
        createdAt: now,
        updatedAt: now
      };
      // Ensure unique ID
      var base = post.id;
      var counter = 1;
      while (data.posts.some(function(p) { return p.id === post.id; })) {
        post.id = base + '-' + counter;
        post.slug = post.id;
        counter++;
      }
      data.posts.unshift(post);
      this.save();
      return clone(post);
    },

    // Update an existing post
    updatePost: function(id, updates) {
      if (!data) return null;
      var idx = data.posts.findIndex(function(p) { return p.id === id; });
      if (idx === -1) return null;
      var post = data.posts[idx];
      Object.keys(updates).forEach(function(key) {
        if (key !== 'id' && key !== 'createdAt') {
          post[key] = updates[key];
        }
      });
      post.updatedAt = new Date().toISOString();
      if (updates.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date().toISOString();
      }
      this.save();
      return clone(post);
    },

    // Delete a post (moves to trash status first, second call removes)
    deletePost: function(id, force) {
      if (!data) return false;
      var idx = data.posts.findIndex(function(p) { return p.id === id; });
      if (idx === -1) return false;
      if (force || data.posts[idx].status === 'trash') {
        data.posts.splice(idx, 1);
      } else {
        data.posts[idx].status = 'trash';
        data.posts[idx].updatedAt = new Date().toISOString();
      }
      this.save();
      return true;
    },

    // Restore from trash
    restorePost: function(id) {
      return this.updatePost(id, { status: 'draft' });
    },

    // Get categories
    getCategories: function() {
      return data ? clone(data.categories) : [];
    },

    // Get sections
    getSections: function() {
      return data ? clone(data.sections) : [];
    },

    // Get stats
    getStats: function() {
      if (!data) return {};
      var posts = data.posts;
      return {
        total: posts.length,
        published: posts.filter(function(p) { return p.status === 'published'; }).length,
        draft: posts.filter(function(p) { return p.status === 'draft'; }).length,
        scheduled: posts.filter(function(p) { return p.status === 'scheduled'; }).length,
        trash: posts.filter(function(p) { return p.status === 'trash'; }).length
      };
    },

    // Export content as JSON (for saving to file)
    exportJSON: function() {
      return data ? JSON.stringify(data, null, 2) : '{}';
    },

    // Reset to content.json (re-seed)
    reset: async function() {
      localStorage.removeItem(STORAGE_KEY);
      return this.init();
    }
  };
})();
