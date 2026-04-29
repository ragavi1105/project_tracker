const express = require('express');
const path = require('path');
const db = require('./db');
const multer = require('multer');

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
  cb(null, file.originalname); 

}
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Disposition', 'inline'); 
  }
}));

//  API: Project
app.get('/api/project/:id', (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT 
      id, 
      po_reference, 
      po_reference_name, 
      DATE_FORMAT(po_reference_date, '%Y-%m-%d') AS po_reference_date,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(customer_req_date, '%Y-%m-%d') AS customer_req_date,
      project_manager,
      quality_manager,
      project_engineer,
      engineer
    FROM purchase_orders
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.length === 0) return res.status(404).json({ error: 'Not found' });

    const row = result[0];

    res.json({
      projectId: row.po_reference,
      name: row.po_reference_name,
      createdAt: row.po_reference_date,
      startDate: row.start_date,         
      reqDate: row.customer_req_date, 

      projectManager: row.project_manager,
      qualityManager: row.quality_manager,
      projectEngineer: row.project_engineer,
      engineer: row.engineer,
      status: 'Active'
    });
  });
});

//date save 
app.post('/api/project/save-dates', (req, res) => {
  const { projectId, startDate, reqDate } = req.body;

  if (!projectId) {
    return res.status(400).json({ message: 'Missing projectId' });
  }

  db.query(
    'SELECT start_date, customer_req_date FROM purchase_orders WHERE id = ?',
    [projectId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (!result.length) return res.status(404).json({ message: 'Not found' });

      const row = result[0];

      let finalStartDate = row.start_date;
      let finalReqDate = row.customer_req_date;


      if (!row.start_date && startDate) {
        finalStartDate = startDate;
      }

      if (!row.customer_req_date && reqDate) {
        finalReqDate = reqDate;
      }

      const sql = `
        UPDATE purchase_orders
        SET start_date = ?, customer_req_date = ?
        WHERE id = ?
      `;

      db.query(sql, [finalStartDate, finalReqDate, projectId], (err2) => {
        if (err2) return res.status(500).json(err2);

        res.json({ message: 'Saved successfully' });
      });
    }
  );
});

//save id  project quality managers
app.post('/api/project/save-people', (req, res) => {
  const {
    projectId,
    projectManager,
    qualityManager,
    projectEngineer,
    engineer
  } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'Missing projectId' });
  }

 
  db.query(
    `SELECT 
      project_manager,
      quality_manager,
      project_engineer,
      engineer
     FROM purchase_orders
     WHERE id = ?`,
    [projectId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (!result.length) return res.status(404).json({ error: 'Not found' });

      const row = result[0];

  
      let finalPM = row.project_manager;
      let finalQM = row.quality_manager;
      let finalPE = row.project_engineer;
      let finalENG = row.engineer;

      if (!row.project_manager && projectManager) {
        finalPM = projectManager;
      }

      if (!row.quality_manager && qualityManager) {
        finalQM = qualityManager;
      }

      if (!row.project_engineer && projectEngineer) {
        finalPE = projectEngineer;
      }

      if (!row.engineer && engineer) {
        finalENG = engineer;
      }

      const sql = `
        UPDATE purchase_orders
        SET 
          project_manager = ?,
          quality_manager = ?,
          project_engineer = ?,
          engineer = ?
        WHERE id = ?
      `;

      db.query(
        sql,
        [finalPM, finalQM, finalPE, finalENG, projectId],
        (err2) => {
          if (err2) return res.status(500).json(err2);

          res.json({ success: true, message: 'Saved (locked individually)' });
        }
      );
    }
  );
});

//  API: Parts
app.get('/api/parts/:id', (req, res) => {
  const poId = req.params.id;

  db.query(
    `SELECT id, part_number, product_name, quantity 
     FROM products_po WHERE purchase_order_id = ?`,
    [poId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(result);
    }
  );
});


//  API: Single Part
app.get('/api/part/:partId', (req, res) => {
  db.query(
    `SELECT * FROM products_po WHERE id = ?`,
    [req.params.partId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (!result.length) return res.status(404).json({ error: 'Not found' });
      res.json(result[0]);
    }
  );
});


//  API: Users
app.get('/api/users', (req, res) => {
  db.query('SELECT user_id, name FROM users', (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});
app.post('/api/stages', (req, res) => {
  const stages = req.body.stages;

  const results = [];

  stages.forEach(stage => {

    const sql = `
      INSERT INTO project_stages
      (product_id, stage_name, section_title, stage_date, achieve_date,
       inward, outward, assigned_user_id, saved_by_user_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      stage.product_id,
      stage.stage_name,
      stage.section_title,
      stage.stage_date,
      stage.achieve_date,
      stage.inward,
      stage.outward,
      stage.assigned_user_id,
      stage.saved_by_user_id,
      stage.status
    ], (err, result) => {

      if (err) return res.status(500).json(err);

      const stageId = result.insertId;

      // 🔥 INSERT COMMENT IF EXISTS
      if (stage.comment_text) {

        const commentSql = `
          INSERT INTO stage_comments (stage_id, comment_text, user_id)
          VALUES (?, ?, ?)
        `;

        db.query(commentSql, [
          stageId,
          stage.comment_text,
          stage.saved_by_user_id
        ]);
      }

      results.push(stageId);

      if (results.length === stages.length) {
        res.json({ success: true, ids: results });
      }

    });

  });
});
app.get('/api/stages/:productId', (req, res) => {
  const productId = req.params.productId;

  const sql = `
    SELECT *
    FROM project_stages
    WHERE product_id = ?
  `;

  db.query(sql, [productId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }

    res.json(result);
  });
});

//Parts file upload
app.post('/api/upload-file', upload.single('file'), (req, res) => {

  const product_id = req.body.product_id;
  const remarks = req.body.remarks;

  const user_id = 5; 

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const sql = `
    INSERT INTO project_files
    (product_id, user_id, stored_name, original_name, file_type, remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      product_id,
      user_id,
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      remarks ? remarks : ''
    ],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({ success: true });
    }
  );
});



//getting files for a part

app.get('/api/files/:productId', (req, res) => {
  const productId = req.params.productId;

  const sql = `
    SELECT 
      id,
      original_name,
      file_type,
      remarks,
      uploaded_at,
      CONCAT('/uploads/', stored_name) AS file_url
    FROM project_files
    WHERE product_id = ?
    ORDER BY uploaded_at DESC
  `;

  db.query(sql, [productId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json(result);
  });
});

//part file count

async function updatePartFileCount() {
  const { partId } = getParamsFromUrl();

  if (!partId) return;

  try {
    const res = await fetch(`/api/files/${partId}`);
    const files = await res.json();

    const countSpan = document.querySelector('.part-files-text .file-count');
    if (countSpan) {
      countSpan.textContent = files.length; // ✅ DB count
    }

  } catch (err) {
    console.error("Count fetch error:", err);
  }
}

//get stages verifiers
app.get('/api/stage-users', (req, res) => {
  const sql = `SELECT user_id, name FROM users`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    res.json(result); // ✅ returns array
  });
});

//post upload for stages

app.post('/api/upload-stage-file', upload.single('file'), (req, res) => {

  const { stage_id, user_id } = req.body;

  if (!req.file || !stage_id) {
    return res.status(400).json({ error: 'Missing file or stage_id' });
  }

  const filename = req.file.filename;

  const sql = `
    INSERT INTO stage_files (stage_id, user_id, filename, created_at)
    VALUES (?, ?, ?, NOW())
  `;

  db.query(sql, [stage_id, user_id || 1, filename], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({ success: true });
  });
});

app.get('/api/stage-files/:stageId', (req, res) => {
  const stageId = req.params.stageId;

  const sql = `
    SELECT 
      id,
      filename,
      created_at,
      CONCAT('/uploads/', filename) AS file_url
    FROM stage_files
    WHERE stage_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [stageId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

//stage files for  document
app.get('/api/stage-files-by-part/:productId', (req, res) => {
  const productId = req.params.productId;

  const sql = `
    SELECT 
      sf.id,
      sf.filename AS original_name,
       sf.created_at AS uploaded_at,
      ps.stage_name,
      CONCAT('/uploads/', sf.filename) AS file_url
    FROM stage_files sf
    JOIN project_stages ps ON ps.id = sf.stage_id
    WHERE ps.product_id = ?
    ORDER BY sf.created_at DESC
  `;

  db.query(sql, [productId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(result);
  });
});



//section close
app.post('/api/close-section', (req, res) => {
  const { product_id, section_title } = req.body;

  const sql = `
    UPDATE project_stages
    SET status = 'closed'
    WHERE product_id = ? AND section_title = ?
  `;

  db.query(sql, [product_id, section_title], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});


app.post('/api/stage-comments', (req, res) => {
  const { stage_id, comment_text, user_id } = req.body;

  
  if (!stage_id || !comment_text) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const sql = `
    INSERT INTO stage_comments (stage_id, comment_text, user_id)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [stage_id, comment_text, user_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }

    res.json({
      success: true,
      id: result.insertId
    });
  });
});

app.get('/api/stage-comments/:stageId', (req, res) => {
  const stageId = req.params.stageId;

  const sql = `
    SELECT 
      sc.comment_text,
      sc.created_at,
      u.name AS user_name
    FROM stage_comments sc
    LEFT JOIN users u ON sc.user_id = u.user_id
    WHERE sc.stage_id = ?
    ORDER BY sc.created_at DESC
  `;

  db.query(sql, [stageId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }

    res.json(result);
  });
});


//  ROUTES
app.get('/project-tracker/:poId/:partId', (req, res) => {
  res.render('project-tracker');
});

app.get('/project-tracker/:poId', (req, res) => {
  res.render('project-tracker');
});

app.get('/', (req, res) => {
  res.redirect('/project-tracker/1');
});


// START
app.listen(5000, () => {
  console.log('Server running at http://localhost:5000');
});