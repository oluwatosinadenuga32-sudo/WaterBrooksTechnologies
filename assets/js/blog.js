// WaterBrooks Blog — a no-code content system for the founder.
// Posts live in the browser's localStorage under the key below.
// To let more than one person publish from different computers,
// this would need a small backend later — for now it's built so
// ANY page open on this site, on this device, always shows the
// same posts without touching a line of code.
(function(){
  "use strict";
 
  var STORE_KEY = "waterbrooks_blog_posts_v1";
  // Change this passcode to whatever you like — it's a light lock,
  // not real security, just enough to stop a stranger from editing.
  var EDIT_PASSCODE = "waterbrooks2026";
  // Admin sign-in is remembered for this browser tab only (sessionStorage),
  // so closing the tab or opening the site elsewhere requires logging in again.
  var ADMIN_SESSION_KEY = "waterbrooks_admin_session";
 
  var CATEGORIES = ["Field Notes","Technology","Community","Impact","Announcements"];
 
  var SEED_POSTS = [
    {
      id: "seed-4",
      title: "Closing the last mile: why we now handle farm-to-market transportation",
      category: "Announcements",
      author: "WaterBrooks Team",
      date: "2026-08-01",
      cover: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&q=80",
      excerpt: "A cold room can buy a farmer 21 days of shelf life — but only if the produce doesn't lose it again on a hot, slow journey to market.",
      content: "We kept hearing the same thing from farmers and cooperatives: the storage unit works, but the trip afterwards can undo a lot of what it protected.\n\nProduce that spends hours in an uncovered truck or waits too long for transport loses freshness fast, no matter how well it was stored beforehand. So we've started coordinating farm-to-market transportation directly — moving produce from our cold storage units straight to local markets and traders, on a schedule built around when the produce is actually ready to sell.\n\nThis isn't a replacement for the cold storage itself; it's the missing link that makes sure the extra 16 days of shelf life we create in storage actually reaches the point of sale. Early routes are running in Oyo State, and we're using the same IoT monitoring approach to track conditions in transit, not just in storage.\n\nIf you're a transporter, cooperative, or market association interested in working with us on this, reach out — we're actively building out this network."
    },
    {
      id: "seed-1",
      title: "Inside Akinyele Market: what a feasibility study taught us",
      category: "Field Notes",
      author: "WaterBrooks Team",
      date: "2026-06-14",
      cover: "https://images.unsplash.com/photo-1595855759920-86582396756c?w=1200&q=80",
      excerpt: "What Southwest Nigeria's largest market told us about how produce really moves — and exactly where it's lost along the way.",
      content: "Akinyele Market is the largest market in Southwest Nigeria, and it's exactly the kind of place where post-harvest loss becomes visible in a single afternoon.\n\nOur feasibility study there confirmed what the FAO and WHO data already suggested: produce spoils fastest in the hours between arrival and sale, when it's sitting in open air with no way to regulate temperature.\n\nTalking to traders and farmers on the ground reshaped how we think about deployment. It's not enough to build a cold room — it has to sit exactly where the bottleneck is, close enough that using it costs less time than not using it.\n\nThat's the insight that's now shaping where we place our next units."
    },
    {
      id: "seed-2",
      title: "From 5 days to 21: how solar cold storage changes the math for farmers",
      category: "Technology",
      author: "WaterBrooks Team",
      date: "2026-05-28",
      cover: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80",
      excerpt: "A look at the engineering behind our units, and the real difference three extra weeks of shelf life makes to a farmer's income.",
      content: "Unrefrigerated produce in tropical heat has an average shelf life of about 5 days. Inside a WaterBrooks unit, that stretches to as long as 21 — a four-fold increase that changes the entire economics of a harvest.\n\nThe unit itself runs entirely on solar power, so it works in communities with no reliable grid connection. IoT sensors track temperature and humidity continuously, and that data feeds into an AI layer that tells farmers and cooperatives when conditions are optimal to store, move, or sell.\n\nThe result we've measured so far: a 60–65% reduction in spoilage. For a smallholder farmer, that's the difference between selling in a rush at a loss, and selling on their own terms."
    },
    {
      id: "seed-3",
      title: "Why we train before we install",
      category: "Community",
      author: "WaterBrooks Team",
      date: "2026-05-09",
      cover: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=1200&q=80",
      excerpt: "The TEN model in practice — what our education and nutrition workshops actually look like on the ground.",
      content: "Technology, Education, Nutrition — the TEN model isn't a slogan, it's the order operations actually happen in.\n\nBefore a single cold storage unit is installed, we run workshops with the community it's meant to serve. Farmers learn how the unit works, how to read the monitoring dashboard, and how storage decisions affect what they can sell and when.\n\nWe've found that this sequencing matters more than the hardware itself. A cold room that nobody trusts, or nobody knows how to use well, doesn't reduce spoilage — it just becomes an expensive shed. Training first means adoption that lasts."
    }
  ];
 
  function loadPosts(){
    try{
      var raw = localStorage.getItem(STORE_KEY);
      if(!raw){
        localStorage.setItem(STORE_KEY, JSON.stringify(SEED_POSTS));
        return SEED_POSTS.slice();
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED_POSTS.slice();
    }catch(e){
      return SEED_POSTS.slice();
    }
  }
 
  function savePosts(posts){
    localStorage.setItem(STORE_KEY, JSON.stringify(posts));
  }
 
  function uid(){ return 'post-' + Date.now() + '-' + Math.random().toString(36).slice(2,7); }
 
  function fmtDate(iso){
    var d = new Date(iso + 'T12:00:00');
    if(isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  }
 
  function readingTime(text){
    var words = (text||'').trim().split(/\s+/).length;
    return Math.max(1, Math.round(words/200));
  }
 
  function escapeHtml(str){
    return String(str||'').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
 
  /* ---------------- app state ---------------- */
  var state = { posts: loadPosts(), category: 'All', query: '', isAdmin: sessionStorage.getItem(ADMIN_SESSION_KEY) === '1' };
 
  var els = {};
 
  function setAdminMode(on){
    state.isAdmin = on;
    if(on) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    else sessionStorage.removeItem(ADMIN_SESSION_KEY);
    document.body.classList.toggle('admin-mode', on);
    var fab = document.getElementById('adminFloat');
    if(fab) fab.classList.toggle('active', on);
  }
 
  function openAdminModal(){
    var modal = document.getElementById('adminModal');
    document.getElementById('adminError').classList.remove('show');
    document.getElementById('adminPass').value = '';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function(){ document.getElementById('adminPass').focus(); }, 50);
  }
  function closeAdminModal(){
    document.getElementById('adminModal').classList.remove('open');
    document.body.style.overflow = '';
  }
 
  function initAdmin(){
    setAdminMode(state.isAdmin);
    var fab = document.getElementById('adminFloat');
    if(fab){
      fab.addEventListener('click', function(){
        if(state.isAdmin){
          if(confirm("Log out of admin mode?")) setAdminMode(false);
        } else {
          openAdminModal();
        }
      });
    }
    var closeBtn = document.getElementById('closeAdminModal');
    if(closeBtn) closeBtn.addEventListener('click', closeAdminModal);
    var backdrop = document.getElementById('adminModal');
    if(backdrop) backdrop.addEventListener('click', function(e){ if(e.target === backdrop) closeAdminModal(); });
    var form = document.getElementById('adminLoginForm');
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        var val = document.getElementById('adminPass').value;
        if(val === EDIT_PASSCODE){
          setAdminMode(true);
          closeAdminModal();
        } else {
          document.getElementById('adminError').classList.add('show');
        }
      });
    }
    var logout = document.getElementById('logoutAdmin');
    if(logout) logout.addEventListener('click', function(){ setAdminMode(false); });
  }
 
  function init(){
    els.grid = document.getElementById('blogGrid');
    els.featured = document.getElementById('featuredPost');
    els.chips = document.getElementById('categoryChips');
    els.search = document.getElementById('blogSearch');
    els.empty = document.getElementById('blogEmpty');
    els.newBtn = document.getElementById('newPostBtn');
    els.modal = document.getElementById('postModal');
    els.form = document.getElementById('postForm');
    els.modalTitle = document.getElementById('modalTitle');
    els.closeModal = document.getElementById('closeModal');
    els.cancelModal = document.getElementById('cancelModal');
    els.deleteBtn = document.getElementById('deletePostBtn');
    els.readModal = document.getElementById('readModal');
    els.readBody = document.getElementById('readBody');
    els.closeRead = document.getElementById('closeRead');
    els.editFromRead = document.getElementById('editFromRead');
 
    buildChips();
    render();
 
    if(els.search){
      els.search.addEventListener('input', function(){
        state.query = this.value.toLowerCase();
        render();
      });
    }
    if(els.newBtn){
      els.newBtn.addEventListener('click', function(){ openEditor(null); });
    }
    if(els.closeModal) els.closeModal.addEventListener('click', closeEditor);
    if(els.cancelModal) els.cancelModal.addEventListener('click', closeEditor);
    if(els.modal) els.modal.addEventListener('click', function(e){ if(e.target === els.modal) closeEditor(); });
    if(els.form) els.form.addEventListener('submit', handleSave);
    if(els.deleteBtn) els.deleteBtn.addEventListener('click', handleDelete);
    if(els.closeRead) els.closeRead.addEventListener('click', closeReader);
    if(els.readModal) els.readModal.addEventListener('click', function(e){ if(e.target === els.readModal) closeReader(); });
 
    var coverFile = document.getElementById('fCoverFile');
    if(coverFile){
      coverFile.addEventListener('change', function(){
        var file = this.files[0];
        if(!file) return;
        var reader = new FileReader();
        reader.onload = function(e){
          document.getElementById('fCoverUrl').value = e.target.result;
          document.getElementById('coverPreview').src = e.target.result;
          document.getElementById('coverPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
      });
    }
    var coverUrl = document.getElementById('fCoverUrl');
    if(coverUrl){
      coverUrl.addEventListener('input', function(){
        if(this.value){ document.getElementById('coverPreview').src = this.value; document.getElementById('coverPreview').style.display='block'; }
      });
    }
  }
 
  function buildChips(){
    if(!els.chips) return;
    var cats = ['All'].concat(CATEGORIES);
    els.chips.innerHTML = cats.map(function(c){
      return '<button type="button" class="chip' + (c===state.category?' active':'') + '" data-cat="' + c + '">' + c + '</button>';
    }).join('');
    els.chips.querySelectorAll('.chip').forEach(function(btn){
      btn.addEventListener('click', function(){
        state.category = btn.getAttribute('data-cat');
        buildChips();
        render();
      });
    });
  }
 
  function filteredPosts(){
    return state.posts
      .slice()
      .sort(function(a,b){ return new Date(b.date) - new Date(a.date); })
      .filter(function(p){
        var matchCat = state.category === 'All' || p.category === state.category;
        var q = state.query;
        var matchQ = !q || (p.title.toLowerCase().indexOf(q) > -1) || (p.excerpt.toLowerCase().indexOf(q) > -1);
        return matchCat && matchQ;
      });
  }
 
  function render(){
    var posts = filteredPosts();
    if(els.empty) els.empty.style.display = posts.length ? 'none' : 'block';
 
    if(els.featured){
      if(posts.length){
        var f = posts[0];
        els.featured.style.display = '';
        els.featured.innerHTML = featuredHTML(f);
      } else {
        els.featured.style.display = 'none';
      }
    }
 
    var rest = posts.slice(els.featured ? 1 : 0);
    if(els.grid){
      els.grid.innerHTML = rest.map(cardHTML).join('') || '';
    }
 
    document.querySelectorAll('[data-open]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.preventDefault();
        openReader(el.getAttribute('data-open'));
      });
    });
    document.querySelectorAll('[data-edit]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        if(!state.isAdmin) return;
        openEditor(el.getAttribute('data-edit'));
      });
    });
  }
 
  function featuredHTML(p){
    return '' +
      '<div class="feat-media"><img src="' + escapeHtml(p.cover) + '" alt="' + escapeHtml(p.title) + '"></div>' +
      '<div class="feat-body">' +
        '<span class="pill">' + escapeHtml(p.category) + '</span>' +
        '<h2 style="margin-top:14px;">' + escapeHtml(p.title) + '</h2>' +
        '<p style="margin-top:12px; color:var(--ink-soft); line-height:1.7;">' + escapeHtml(p.excerpt) + '</p>' +
        '<div class="post-meta" style="margin-top:18px;">' + fmtDate(p.date) + ' · ' + readingTime(p.content) + ' min read · ' + escapeHtml(p.author) + '</div>' +
        '<div style="display:flex; gap:10px; margin-top:20px;">' +
          '<a href="#" class="btn btn-primary" data-open="' + p.id + '">Read story</a>' +
          '<button type="button" class="btn btn-ghost admin-only" data-edit="' + p.id + '">Edit</button>' +
        '</div>' +
      '</div>';
  }
 
  function cardHTML(p){
    return '' +
      '<article class="bp-card">' +
        '<a href="#" data-open="' + p.id + '"><img src="' + escapeHtml(p.cover) + '" alt="' + escapeHtml(p.title) + '"></a>' +
        '<div class="bp-body">' +
          '<span class="pill">' + escapeHtml(p.category) + '</span>' +
          '<h3><a href="#" data-open="' + p.id + '" style="color:inherit;">' + escapeHtml(p.title) + '</a></h3>' +
          '<p>' + escapeHtml(p.excerpt) + '</p>' +
          '<div class="meta">' + fmtDate(p.date) + ' · ' + readingTime(p.content) + ' min read</div>' +
          '<div class="admin-only" style="margin-top:14px;"><button type="button" class="btn btn-ghost" style="padding:8px 16px; font-size:.82rem;" data-edit="' + p.id + '">Edit / delete</button></div>' +
        '</div>' +
      '</article>';
  }
 
  /* -------- editor modal (admin only) -------- */
  var editingId = null;
  function openEditor(id){
    if(!state.isAdmin) return;
    editingId = id;
    var p = id ? state.posts.find(function(x){ return x.id === id; }) : null;
    els.modalTitle.textContent = p ? "Edit post" : "Write a new post";
    els.deleteBtn.style.display = p ? 'inline-flex' : 'none';
    document.getElementById('fTitle').value = p ? p.title : '';
    document.getElementById('fCategory').value = p ? p.category : CATEGORIES[0];
    document.getElementById('fAuthor').value = p ? p.author : 'WaterBrooks Team';
    document.getElementById('fCoverUrl').value = p ? p.cover : '';
    document.getElementById('fExcerpt').value = p ? p.excerpt : '';
    document.getElementById('fContent').value = p ? p.content : '';
    var prev = document.getElementById('coverPreview');
    if(p && p.cover){ prev.src = p.cover; prev.style.display = 'block'; } else { prev.style.display = 'none'; }
    els.modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeEditor(){
    els.modal.classList.remove('open');
    document.body.style.overflow = '';
    editingId = null;
  }
  function handleSave(e){
    e.preventDefault();
    if(!state.isAdmin) return;
    var title = document.getElementById('fTitle').value.trim();
    var excerpt = document.getElementById('fExcerpt').value.trim();
    var content = document.getElementById('fContent').value.trim();
    if(!title || !excerpt || !content){ return; }
    var data = {
      title: title,
      category: document.getElementById('fCategory').value,
      author: document.getElementById('fAuthor').value.trim() || 'WaterBrooks Team',
      cover: document.getElementById('fCoverUrl').value.trim() || 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1200&q=80',
      excerpt: excerpt,
      content: content
    };
    if(editingId){
      state.posts = state.posts.map(function(p){ return p.id === editingId ? Object.assign({}, p, data) : p; });
    } else {
      data.id = uid();
      data.date = new Date().toISOString().slice(0,10);
      state.posts.unshift(data);
    }
    savePosts(state.posts);
    closeEditor();
    buildChips();
    render();
  }
  function handleDelete(){
    if(!state.isAdmin || !editingId) return;
    if(!confirm("Delete this post? This can't be undone.")) return;
    state.posts = state.posts.filter(function(p){ return p.id !== editingId; });
    savePosts(state.posts);
    closeEditor();
    render();
  }
 
  /* -------- reader modal -------- */
  function openReader(id){
    var p = state.posts.find(function(x){ return x.id === id; });
    if(!p) return;
    var paragraphs = p.content.split(/\n\s*\n/).map(function(par){ return '<p>' + escapeHtml(par).replace(/\n/g,'<br>') + '</p>'; }).join('');
    els.readBody.innerHTML = '' +
      '<img src="' + escapeHtml(p.cover) + '" alt="' + escapeHtml(p.title) + '" class="read-cover">' +
      '<span class="pill">' + escapeHtml(p.category) + '</span>' +
      '<h2 style="margin-top:16px;">' + escapeHtml(p.title) + '</h2>' +
      '<div class="post-meta" style="margin-top:10px;">' + fmtDate(p.date) + ' · ' + readingTime(p.content) + ' min read · ' + escapeHtml(p.author) + '</div>' +
      '<div class="read-content">' + paragraphs + '</div>';
    els.editFromRead.setAttribute('data-edit-id', p.id);
    els.readModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeReader(){
    els.readModal.classList.remove('open');
    document.body.style.overflow = '';
  }
 
  document.addEventListener('DOMContentLoaded', function(){
    init();
    initAdmin();
    var editFromRead = document.getElementById('editFromRead');
    if(editFromRead){
      editFromRead.addEventListener('click', function(){
        if(!state.isAdmin) return;
        var id = this.getAttribute('data-edit-id');
        closeReader();
        openEditor(id);
      });
    }
  });
})();