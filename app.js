const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Static files (from public)
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory store (temporary DB) ──
const projects = {
  'AM110-AP': {
    projectId: 'AM110-AP',
    status: 'Active',
    createdAt: '14 April 2026',
    startDate: '2026-04-14',
    reqDate: '2026-04-30',
    projectManager: { name: 'Arun Kumar', initials: 'AK' },
    qualityManager: { name: 'Sneha Priya', initials: 'SP' },
    projectEngineer: { name: 'Karthik R', initials: 'KR' },
    user: { name: 'Divya Dharshini', initials: 'DD' }
  }
};

// ✅ API routes
app.get('/api/project/:id', (req, res) => {
  const project = projects[req.params.id];
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

app.post('/api/project/save-dates', (req, res) => {
  const { projectId, startDate, reqDate } = req.body;

  if (!projects[projectId]) {
    return res.status(404).json({ error: 'Project not found' });
  }

  projects[projectId].startDate = startDate;
  projects[projectId].reqDate = reqDate;

  res.json({ success: true });
});

app.post('/api/project/update-team', (req, res) => {
  const { projectId, role, name, initials } = req.body;

  const roleMap = {
    pm: 'projectManager',
    qm: 'qualityManager',
    pe: 'projectEngineer'
  };

  if (!projects[projectId]) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (roleMap[role]) {
    projects[projectId][roleMap[role]] = { name, initials };
    return res.json({ success: true });
  }

  res.status(400).json({ error: 'Invalid role' });
});

// ✅ MAIN PAGE (clean URL)
app.get('/project-tracker', (req, res) => {
  res.render('project-tracker');
});

// ✅ Redirect root → project tracker
app.get('/', (req, res) => {
  res.redirect('/project-tracker');
});

// ✅ START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});