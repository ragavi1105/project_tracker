const express = require('express');
const path = require('path');
const db = require('./db');
const multer = require('multer');
const fs = require('fs');


const nodemailer = require('nodemailer');
const transporter =
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hanavdigital@gmail.com',
      pass: 'zlfakbacdqqfsqln'
    }
});

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/project_files';
    if (
  req.originalUrl.includes('upload-stage-file')
    ) {
      folder = 'uploads/stage_files';
    }
    else if (req.body.file_type === 'variant') {
      folder = 'uploads/variant_files';
    }
    // Create folder if not exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
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

app.get('/project-management', (req, res) => {
  res.redirect('/project-management/dashboard');
});

app.get('/project-management/:section', (req, res) => {

  const validSections = [
    'dashboard',
    'products',
    'inventory'
  ];

  const section = req.params.section;

  if (!validSections.includes(section)) {
    return res.redirect('/project-management/dashboard');
  }

  res.render('project-management', {
    currentSection: section
  });
});


app.get('/search-project', (req, res) => {

  res.render('search-project', {
    user: null
  });

});

app.get('/routecard/:poId/:partId', (req, res) => {
  res.render('routecard');
});

app.get('/api/project/search', (req, res) => {
  const q = req.query.q?.trim();
  if (!q) {
    return res.json({ results: [] });
  }
  const sql = `
    SELECT
      id,
      po_reference,
      po_reference_name,
      DATE_FORMAT(po_reference_date, '%d-%m-%Y') AS created_at
    FROM purchase_orders
    WHERE
      po_reference LIKE ?
      OR po_reference_name LIKE ?
    ORDER BY id DESC
  `;
  const search = `%${q}%`;
  db.query(sql, [search, search], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        results: []
      });
    }
    res.json({
      results: result.map(row => ({
        id: row.id,
        poReference: row.po_reference,
        customer: row.po_reference_name,
        createdAt: row.created_at,
        status: 'Active'
      }))
    });
  });
});

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
      projectId: row.po_reference_name || row.po_reference,
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
  [
    finalPM,
    finalQM,
    finalPE,
    finalENG,
    projectId
  ],

  (err2) => {

    if (err2)
      return res.status(500).json(err2);

    // GET PO DETAILS
    db.query(

      `
        SELECT
          po_reference,
          po_reference_name
        FROM purchase_orders
        WHERE id = ?
      `,

      [projectId],

      (poErr, poResult) => {

        if (poErr) {

          console.error(poErr);

          return res.json({
            success: true
          });
        }
        const po =
          poResult[0];
        // USERS TO MAIL
        const userIds = [];

if (!row.project_manager && finalPM) {
    userIds.push(finalPM);
}

if (!row.quality_manager && finalQM) {
    userIds.push(finalQM);
}

if (!row.project_engineer && finalPE) {
    userIds.push(finalPE);
}
        if (!userIds.length) {
          return res.json({
            success: true
          });
        }
        // GET USER DETAILS
        db.query(
          `
            SELECT
              id,
              name,
              email
            FROM users
            WHERE id IN (?)
          `,
          [userIds],
          (userErr, users) => {
            if (userErr) {
              console.error(userErr);
              return res.json({
                success: true
              });
            }
            users.forEach(user => {
              let role = '';
              if (
                Number(user.id) ===
                Number(finalPM)
              ) {
                role =
                  'Project Manager';
              }
              else if (
                Number(user.id) ===
                Number(finalQM)
              ) {
                role =
                  'Quality Manager';
              }
              else if (
                Number(user.id) ===
                Number(finalPE)
              ) {
                role =
                  'Development Manager';
              }
              if (!user.email)
                return;
              console.log(
  'Sending mail to:',
  user.email
);
   const projectLink =
  `http://hanav.tech/project-tracker/${projectId}`;

              transporter.sendMail({

                from:
                  'yourmail@gmail.com',

                to:
                  user.email,

                subject:
                  'Project Allocation Notification',
  
html: `

<div style="
  font-family: Arial, sans-serif;
  padding: 15px;
  border-radius: 10px;
  margin: auto;
">

  <h2 style="
    color: #37d83cff;
  ">
    Hello ${user.name},
  </h2>

  <p style="
    font-size: 16px;
  ">
    You have been assigned as the
    <b>${role}</b>
    for a new Purchase Order.
  </p>
  <p style="
    font-size: 16px;
  ">
    Please log in to the system
    to review the details and
    manage your tasks.

  </p>

  <p style="
    font-size: 16px;
    margin: 10px 0;
  ">

    <b>
      Project ID :
      ${po.po_reference_name}
    </b>

  </p>

  <br>

  <a
    href="${projectLink}"

    style="
      background-color:#4CAF50;
      color:white;
      padding:10px 20px;
      text-decoration:none;
      border-radius:5px;
      display:inline-block;
    "
  >

    View Project Tracker

  </a>

  <br><br>

  <p style="
    font-size:14px;
    color:#888;
  ">

    This is an automated email
    from Hanav ERP Management
    System.

  </p>

  <p style="
    font-size:12px;
    color:#888;
  ">

    Do not reply to this email.

  </p>

</div>

`
              }, (mailErr) => {

                if (mailErr) {

                  console.error(
                    'Mail Error:',
                    mailErr
                  );
                }
              });
            });
            res.json({
              success: true,
              message:
                'Saved & Mail Sent'
            });
          }
        );
      }
    );
  }
);
    });
});

//  API: Parts
app.get('/api/parts/:id', (req, res) => {
  const poId = req.params.id;
  const sql = `
    -- ORIGINAL PARTS
    SELECT
      po.id AS po_id,
      ppo.id,
      ppo.part_number,
      ppo.product_name,
      ppo.quantity,
      ppo.is_service,
      COALESCE(im.current_stock,0) AS current_stock,
COALESCE(im.dispatch_quantity,0) AS dispatch_quantity,
      
      COALESCE(inv.invoiced_qty,0) AS invoiced_qty,
      ppo.required_date,
      'Batch A' AS batch,
     CASE

  WHEN ppo.status = 'On-Hold'
    THEN 'On-Hold'

  WHEN ppo.status = 'Completed'
    THEN 'Completed'

  WHEN latest_stage.section_title = 'Dispatch'
    THEN 'Dispatched'

  WHEN latest_stage.stage_name IS NOT NULL
    THEN 'In Progress'

  ELSE 'Pending'

END AS status,

  COALESCE(
    latest_stage.section_title,
    '-'
  ) AS section,

  0 AS is_split
    FROM products_po ppo
    JOIN purchase_orders po
      ON po.id = ppo.purchase_order_id
      LEFT JOIN inventory_master im
  ON im.product_id = ppo.id
      LEFT JOIN (
  SELECT
    product_id,
    SUM(quantity) AS invoiced_qty
  FROM project_invoices
  GROUP BY product_id
) inv
  ON inv.product_id = ppo.id
    LEFT JOIN (
      SELECT
        ps1.product_id,
        ps1.stage_name,
        ps1.section_title
      FROM project_stages ps1
      INNER JOIN (
  SELECT
    ps.product_id,
    MAX(ps.id) AS max_id
  FROM project_stages ps
  LEFT JOIN stage_verifications sv
    ON sv.stage_id = ps.id
  WHERE
    ps.outward > 0
    OR sv.stage_id IS NOT NULL
  GROUP BY ps.product_id
) latest  
        ON latest.max_id = ps1.id
    ) latest_stage
      ON latest_stage.product_id = ppo.id
    WHERE ppo.purchase_order_id = ?
    AND NOT EXISTS (
      SELECT 1
      FROM split_parts sp
      WHERE sp.parent_part_id = ppo.id

    )

    UNION ALL

    -- SPLIT PARTS
    SELECT
      po.id AS po_id,
      CONCAT('split_', sp.id) AS id,
      sp.split_name AS part_number,
      ppo.product_name,
      sp.quantity,
      sp.is_service,
      COALESCE(im.current_stock,0) AS current_stock,
COALESCE(im.dispatch_quantity,0) AS dispatch_quantity,
      COALESCE(inv.invoiced_qty,0) AS invoiced_qty,
      sp.required_date,
      CASE

  WHEN (
    sp.id -
    (
      SELECT MIN(id)
      FROM split_parts sp2
      WHERE sp2.parent_part_id = ppo.id
    )
  ) = 0
  THEN 'Batch A'
  WHEN (
    sp.id -
    (
      SELECT MIN(id)
      FROM split_parts sp2
      WHERE sp2.parent_part_id = ppo.id
    )
  ) = 1

  THEN 'Batch B'

  WHEN (
    sp.id -
    (
      SELECT MIN(id)
      FROM split_parts sp2
      WHERE sp2.parent_part_id = ppo.id
    )
  ) = 2

  THEN 'Batch C'

  ELSE 'Batch D'

END AS batch,

 CASE

  WHEN sp.status = 'On-Hold'
    THEN 'On-Hold'

  WHEN sp.status = 'Completed'
    THEN 'Completed'

  WHEN latest_stage.section_title = 'Dispatch'
    THEN 'Dispatched'

  WHEN latest_stage.stage_name IS NOT NULL
    THEN 'In Progress'

  ELSE 'Pending'

END AS status,

COALESCE(
  latest_stage.section_title,
  '-'
) AS section,

1 AS is_split
    FROM split_parts sp
    JOIN products_po ppo
      ON ppo.id = sp.parent_part_id
    JOIN purchase_orders po
      ON po.id = ppo.purchase_order_id
      LEFT JOIN inventory_master im
  ON im.split_part_id = sp.id
      LEFT JOIN (
  SELECT
    split_product_id,
    SUM(quantity) AS invoiced_qty
  FROM project_invoices
  GROUP BY split_product_id
) inv
  ON inv.split_product_id = sp.id
    LEFT JOIN (
      SELECT
        ps1.split_part_id,
        ps1.stage_name,
        ps1.section_title
      FROM project_stages ps1
      INNER JOIN (
  SELECT
    ps.split_part_id,
    MAX(ps.id) AS max_id
  FROM project_stages ps
  LEFT JOIN stage_verifications sv
    ON sv.stage_id = ps.id
  WHERE
    (
      ps.outward > 0
      OR sv.stage_id IS NOT NULL
    )
    AND ps.split_part_id IS NOT NULL
  GROUP BY ps.split_part_id
) latest
        ON latest.max_id = ps1.id
    ) latest_stage
      ON latest_stage.split_part_id = sp.id
    WHERE ppo.purchase_order_id = ?
    ORDER BY part_number
  `;
  db.query(sql, [poId, poId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'DB error'
      });
    }
    res.json(result);
  });
});

// API: Single Part
app.get('/api/part/:partId', (req, res) => {

    const partId = req.params.partId;

    // ================= SPLIT PART =================
    if (String(partId).startsWith('split_')) {

        const splitId = partId.replace('split_', '');

        const sql = `
            SELECT
                sp.id,
                sp.split_name AS part_number,
                ppo.product_name,
                sp.quantity,
                sp.required_date,
                sp.warehouse_name,

                CASE
                    WHEN sp.status = 'On-Hold'
                        THEN 'On-Hold'

                    WHEN (
                        SELECT IFNULL(MAX(outward),0)
                        FROM project_stages
                        WHERE split_part_id = sp.id
                          AND section_title = 'Dispatch'
                    ) >= sp.quantity
                        THEN 'Completed'

                    ELSE 'Active'
                END AS status

            FROM split_parts sp
            JOIN products_po ppo
                ON ppo.id = sp.parent_part_id
            WHERE sp.id = ?
        `;
        db.query(sql, [splitId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            if (!result.length) {
                return res.status(404).json({
                    error: 'Not found'
                });
            }
            res.json(result[0]);
        });
    }

    // ================= NORMAL PART =================
    else {
        const sql = `
            SELECT
                ppo.*,

                CASE
                    WHEN ppo.status = 'On-Hold'
                        THEN 'On-Hold'

                    WHEN (
                        SELECT IFNULL(MAX(outward),0)
                        FROM project_stages
                        WHERE product_id = ppo.id
                          AND section_title = 'Dispatch'
                    ) >= ppo.quantity
                        THEN 'Completed'
                    ELSE 'Active'
                END AS status
            FROM products_po ppo
            WHERE ppo.id = ?
        `;
        db.query(sql, [partId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            if (!result.length) {
                return res.status(404).json({
                    error: 'Not found'
                });
            }
            res.json(result[0]);
        });
    }
});

//  API: Users
app.get('/api/users', (req, res) => {
  const sql = `
    SELECT
      id,
      name,
      roles
    FROM users
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

function updateInventory(stage, userId) {
  // ── RM STAGE ──
  if (
    stage.section_title === 'RM Stage' &&
    Number(stage.inward) > 0
  ) {
    db.query(
      `SELECT part_number FROM products_po WHERE id = ?`,
      [stage.product_id],
      (err, result) => {
        if (err || !result.length) return;
        const partNumber = result[0].part_number;
        db.query(
          `INSERT INTO inventory_master
          (user_id, product_id, split_part_id, part_number, approved_quantity)
          VALUES (?, ?, ?, ?, ?)`,
          [userId, stage.product_id, null, partNumber, stage.inward]
        );
      }
    );
  }

  // ── INSPECTION — update stock only, no transaction log ──
  if (
    stage.section_title === 'Inspection' &&
    Number(stage.outward) > 0
  ) {
    db.query(
      `UPDATE inventory_master
       SET current_stock = ?
       WHERE product_id = ?
         OR split_part_id = ?`,
      [
        stage.outward,
        stage.product_id,
        stage.split_part_id || null
      ]
    );
    // ❌ Removed: wrong inventory_transactions insert was here
  }

  // ── DISPATCH — update stock AND log transaction ──
  if (
    stage.section_title === 'Dispatch' &&
    Number(stage.outward) > 0
  ) {
    const checkSql = stage.split_part_id
      ? `SELECT current_stock, part_number FROM inventory_master WHERE split_part_id = ?`
      : `SELECT current_stock, part_number FROM inventory_master WHERE product_id = ? AND split_part_id IS NULL`;

    const checkId = stage.split_part_id || stage.product_id;

    db.query(checkSql, [checkId], (err, result) => {
      if (err || !result.length) return;

      const oldStock   = result[0].current_stock || 0;
      const partNumber = result[0].part_number;
      const newStock   = Math.max(0, oldStock - Number(stage.outward));

      // UPDATE inventory_master
      db.query(
        `UPDATE inventory_master
         SET
           dispatch_quantity = ?,
           current_stock = ?
         WHERE product_id = ?
            OR split_part_id = ?`,
        [
          Number(stage.outward),
          newStock,
          stage.product_id,
          stage.split_part_id || null
        ]
      );

      // LOG correct dispatch transaction
      db.query(
        `INSERT INTO inventory_transactions
        (user_id, product_id, split_part_id, part_number, transaction_type, reason, old_stock, new_stock, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          stage.split_part_id ? null : stage.product_id,
          stage.split_part_id || null,
          partNumber,
          'Dispatch',
          null,
          oldStock,   // real stock before dispatch
          newStock,   // real stock after dispatch
          null
        ]
      );
    });
  }
}

app.post('/api/stages', (req, res) => {
  const userId = 5;
  const stages = req.body.stages;

  if (!stages || !stages.length) {
    return res.status(400).json({ error: 'No stages provided' });
  }

  const results = [];
  let completed = 0;

  function finish(id) {
    results.push(id);
    completed++;
    if (completed === stages.length) {
      res.json({ success: true, ids: results });
    }
  }

  stages.forEach(stage => {

    const checkSql = `
      SELECT id
      FROM project_stages
      WHERE
        product_id = ?
        AND IFNULL(split_part_id, 0) = IFNULL(?, 0)
        AND stage_name = ?
        AND section_title = ?
    `;

    // ✅ Exactly 4 values for 4 placeholders
    db.query(
      checkSql,
      [
        stage.product_id,
        stage.split_part_id ?? null,
        stage.stage_name,
        stage.section_title
      ],
      (checkErr, checkResult) => {

        if (checkErr) {
          console.error('Check error:', checkErr);
          return res.status(500).json({ error: checkErr.message });
        }

        if (checkResult.length > 0) {
          // ── UPDATE existing row ──
          const existingId = checkResult[0].id;

          const updateSql = `
            UPDATE project_stages
            SET
              stage_date        = ?,
              achieve_date      = ?,
              inward            = ?,
              outward           = ?,
              assigned_user_id  = ?
              
            WHERE id = ?
          `;

          db.query(
            updateSql,
            [
              stage.stage_date      || null,
              stage.achieve_date    || null,
              stage.inward          || null,
              stage.outward         || null,
              stage.assigned_user_id|| null,              
              existingId
            ],
            (updateErr) => {
              if (updateErr) {
                console.error('Update error:', updateErr);
                return res.status(500).json({ error: updateErr.message });
              }
              updateInventory(stage, userId);
              finish(existingId);
            }
          );

        } else {
          // ── INSERT new row ──
          const insertSql = `
            INSERT INTO project_stages
            (
              product_id,
              split_part_id,
              stage_name,
              section_title,
              stage_date,
              achieve_date,
              inward,
              outward,
              assigned_user_id,
              saved_by_user_id
              
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            insertSql,
            [
              stage.product_id,
              stage.split_part_id    ?? null,
              stage.stage_name,
              stage.section_title,
              stage.stage_date       || null,
              stage.achieve_date     || null,
              stage.inward           || null,
              stage.outward          || null,
              stage.assigned_user_id || null,
              userId,
              stage.status           || 'active'
            ],
            (insertErr, insertResult) => {
              if (insertErr) {
                console.error('Insert error:', insertErr);
                return res.status(500).json({ error: insertErr.message });
              }

              const stageId = insertResult.insertId;
              updateInventory(stage, userId);

              // Save inline comment if present
              if (stage.comment_text) {
                db.query(
                  `INSERT INTO stage_comments (stage_id, comment_text, user_id) VALUES (?, ?, ?)`,
                  [stageId, stage.comment_text, userId]
                );
              }

              finish(stageId);
            }
          );
        }
      }
    );
  });
});

app.get('/api/stages/:productId', (req, res) => {

  let productId = req.params.productId;

  const isSplit =
    String(productId).startsWith('split_');

  let sql = '';
  let queryValue = '';

  // =========================
  // SPLIT PART
  // =========================
  if (isSplit) {

    const splitId =
      String(productId).replace('split_', '');

    queryValue = splitId;

    sql = `
      SELECT
          ps.id,
    ps.product_id,
    ps.split_part_id,
    ps.stage_name,
    ps.section_title,

    DATE_FORMAT(ps.stage_date, '%Y-%m-%d') AS stage_date,
    DATE_FORMAT(ps.achieve_date, '%Y-%m-%d') AS achieve_date,

    ps.inward,
    ps.outward,
    ps.assigned_user_id,
        sv.approver_id,
        sv.remarks AS verifier_remarks,
        sv.verified_at,
        u.name AS verifier_name
      FROM project_stages ps
      LEFT JOIN stage_verifications sv
        ON sv.stage_id = ps.id
      LEFT JOIN users u
        ON u.id = sv.approver_id
      WHERE ps.split_part_id = ?
      ORDER BY
        CASE
          WHEN ps.stage_name = 'DFM Submission' THEN 1
          WHEN ps.stage_name = 'DFM Approval' THEN 2
          ELSE 3
        END,
        ps.id ASC
    `;

  }
  // =========================
  // MAIN PART
  // =========================
  else {
    queryValue = productId;

    sql = `
      SELECT
          ps.id,
    ps.product_id,
    ps.split_part_id,
    ps.stage_name,
    ps.section_title,

    DATE_FORMAT(ps.stage_date, '%Y-%m-%d') AS stage_date,
    DATE_FORMAT(ps.achieve_date, '%Y-%m-%d') AS achieve_date,

    ps.inward,
    ps.outward,
    ps.assigned_user_id,
        sv.approver_id,
        sv.remarks AS verifier_remarks,
        sv.verified_at,
        u.name AS verifier_name
      FROM project_stages ps
      LEFT JOIN stage_verifications sv
        ON sv.stage_id = ps.id
      LEFT JOIN users u
        ON u.id = sv.approver_id
      WHERE
        ps.product_id = ?
        AND ps.split_part_id IS NULL
      ORDER BY
        CASE
          WHEN ps.stage_name = 'DFM Submission' THEN 1
          WHEN ps.stage_name = 'DFM Approval' THEN 2
          ELSE 3
        END,
        ps.id ASC `;
  }
  db.query(sql, [queryValue], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'DB error'
      });
    }
    res.json(result);
  });
});

//Parts file upload
app.post('/api/upload-file', upload.single('file'), (req, res) => {

  console.log("BODY:", req.body);

  let product_id = null;
  let split_part_id = null;

  if (req.body.product_id) {
    product_id = Number(req.body.product_id);
  }

  if (req.body.split_part_id) {
    split_part_id = Number(req.body.split_part_id);
  }

  const remarks = req.body.remarks || "";
  const user_id = 5;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const sql = `
    INSERT INTO project_files
    (
      product_id,
      split_part_id,
      user_id,
      stored_name,
      original_name,
      file_type,
      remarks
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    product_id,
    split_part_id,
    user_id,
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    remarks
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({ success: true });
  });
});

//getting files for a part
app.get('/api/files/:id', (req, res) => {

  const id = req.params.id;

  let sql;
  let value;

  if (String(id).startsWith("split_")) {

    value = String(id).replace("split_", "");

    sql = `
      SELECT
        id,
        original_name,
        file_type,
        remarks,
        uploaded_at,
        CONCAT('/uploads/project_files/', stored_name) AS file_url
      FROM project_files
      WHERE split_part_id = ?
      ORDER BY uploaded_at DESC
    `;

  } else {

    value = id;

    sql = `
      SELECT
        id,
        original_name,
        file_type,
        remarks,
        uploaded_at,
        CONCAT('/uploads/project_files/', stored_name) AS file_url
      FROM project_files
      WHERE product_id = ?
      ORDER BY uploaded_at DESC
    `;

  }

  db.query(sql, [value], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        error: "DB error"
      });
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
      countSpan.textContent = files.length; 
    }
  } catch (err) {
    console.error("Count fetch error:", err);
  }
}

//get stages verifiers
app.get('/api/stage-users', (req, res) => {

  const sql = `
    SELECT
      id,
      name
    FROM users
    WHERE FIND_IN_SET(
      'stage-verifier',
      REPLACE(roles, ' ', '')
    ) > 0
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message
      });
    }
    res.json(result);
  });
});

//post upload for stages
app.post('/api/upload-stage-file', upload.single('file'), (req, res) => {

  const {
    stage_id,
    user_id,
    variant_name,
    pr_number
  } = req.body;

  if (!stage_id) {
    return res.status(400).json({
      error: 'Missing stage_id'
    });
  }

  const filename =
    req.file?.filename || null;

  const sql = `
    INSERT INTO stage_files
    (
      stage_id,
      user_id,
      filename,
      variant_name,
      pr_number,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    sql,
    [
      stage_id,
      user_id || 1,
      filename,
      variant_name || null,
      pr_number || null
    ],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json({ success: true });

    }
  );
});

app.get('/api/stage-files/:stageId', (req, res) => {
  const stageId = req.params.stageId;
  const sql = `
    SELECT 
      id,
      filename,
      variant_name,
      pr_number,
      created_at,
      CONCAT('/uploads/stage_files/', filename) AS file_url
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

  let productId = req.params.productId;

  const isSplit =
    String(productId).startsWith('split_');

  let sql = '';
  let value = '';

  if (isSplit) {
    value =
      String(productId)
        .replace('split_', '');
    sql = `
      SELECT
        sf.id,
        sf.filename AS original_name,
        sf.variant_name AS variant_name,
        sf.pr_number,
        sf.created_at AS uploaded_at,
        ps.stage_name,
        ps.section_title,
        CONCAT('/uploads/stage_files/', sf.filename) AS file_url
      FROM stage_files sf
      LEFT JOIN project_stages ps
        ON ps.id = sf.stage_id
      WHERE ps.split_part_id = ?
      ORDER BY sf.created_at DESC
    `;
  }
  else {
    value = productId;
    sql = `
      SELECT
        sf.id,
        sf.filename AS original_name,
        sf.variant_name AS variant_name,
          sf.pr_number,
        sf.created_at AS uploaded_at,
        ps.stage_name,
        ps.section_title,
        CONCAT('/uploads/stage_files/', sf.filename) AS file_url
      FROM stage_files sf
      LEFT JOIN project_stages ps
        ON ps.id = sf.stage_id
      WHERE
        ps.product_id = ?
        AND ps.split_part_id IS NULL
      ORDER BY sf.created_at DESC
    `;
  }
  db.query(sql, [value], (err, result) => {
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
  const user_id = 5;
  const {
    stage_id,
    comment_text
  } = req.body;
  if (!stage_id || !comment_text) {
    return res.status(400).json({
      error: 'Missing data'
    });
  }
  const sql = `
    INSERT INTO stage_comments
    (
      stage_id,
      comment_text,
      user_id
    )
    VALUES (?, ?, ?)
  `;
  db.query(
    sql,
    [
      stage_id,
      comment_text,
      user_id
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: 'DB error'
        });
      }
      res.json({
        success: true,
        id: result.insertId
      });
    }
  );
});

app.get('/api/stage-comments/:stageId', (req, res) => {
  const stageId = req.params.stageId;
 const sql = `
  SELECT 
    sc.comment_text,
    sc.created_at,
    u.name AS user_name
  FROM stage_comments sc
  LEFT JOIN users u ON sc.user_id = u.id
  WHERE sc.stage_id = ?
  ORDER BY sc.created_at ASC
`;

  db.query(sql, [stageId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }
    res.json(result);
  });
});

//  ROUTES
app.get('/project-tracker', (req, res) => {
  res.render('project-tracker');
});

app.get('/', (req, res) => {
  res.render('project-management');
});


app.get('/project-tracker/:poId/:partId', (req, res) => {
  res.render('project-tracker');
});

app.get('/project-tracker/:poId', (req, res) => {
  res.render('project-tracker');
});

app.get('/search-project', (req, res) => {
  res.render('search-project');
});

// GET mfg files
app.get('/api/mfg-files/:poId', async (req, res) => {
  try {
    console.log("poId received:", req.params.poId);

    db.query(
      `SELECT * FROM stage_varients WHERE products_po_id = ? ORDER BY created_at DESC`,
      [req.params.poId],
      (err, rows) => {                    
        if (err) {
          console.error(err);
          return res.status(500).json({ error: err.message });
        }
        console.log("rows found:", rows.length);
        res.json(rows);
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload mfg file
app.post('/api/upload-mfg-file', upload.single('file'), async (req, res) => {
  try {
    const { user_id, stage_varient, product_id } = req.body;
    const file_name = req.file.originalname;
    const file_type = req.file.originalname.split('.').pop().toUpperCase();

    console.log("Saving with products_po_id:", product_id);

    await db.query(
      `INSERT INTO stage_varients (user_id, products_po_id, stage_varient, file_name, file_type, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [user_id, product_id, stage_varient, file_name, file_type]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// SAVE REQUIRED DATE
app.post('/api/part/save-required-date', (req, res) => {

  const {
    partId,
    required_date
  } = req.body;

  if (!partId) {

    return res.status(400).json({
      error: 'Missing partId'
    });

  }

  const isSplit =
    String(partId).startsWith('split_');

  let sql = '';
  let value = '';

  // =========================
  // SPLIT PART
  // =========================
  if (isSplit) {

    value =
      String(partId)
        .replace('split_', '');

    sql = `
      UPDATE split_parts
      SET required_date = ?
      WHERE id = ?
    `;

  }

  // =========================
  // MAIN PART
  // =========================
  else {

    value = partId;

    sql = `
      UPDATE products_po
      SET required_date = ?
      WHERE id = ?
    `;

  }

  db.query(
    sql,
    [
      required_date || null,
      value
    ],
    (err, result) => {

      if (err) {

        console.error(err);

        return res.status(500).json({
          error: 'DB error'
        });

      }

      res.json({
        success: true
      });

    }
  );

});

//verifications
app.post('/api/save-stage-verification', (req, res) => {
  const {
    stage_id,
    remarks
  } = req.body;
  // ✅ USER ID FROM BACKEND
  const approver_id = 5;
  console.log({
    stage_id,
    approver_id,
    remarks
  });
  if (!stage_id) {
    return res.status(400).json({
      error: 'stage_id missing'
    });
  }
  const sql = `
    INSERT INTO stage_verifications
    (
      stage_id,
      approver_id,
      remarks,
      verified_at
    )
    VALUES (?, ?, ?, NOW())
  `;
  db.query(
    sql,
    [
      Number(stage_id),
      approver_id,
      remarks || ''
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json({
        success: true
      });
    }
  );
});

app.post('/api/generate-route-card', (req, res) => {

    const { partId } = req.body;

    const isSplit = String(partId).startsWith('split_');
    const id = isSplit ? partId.replace('split_', '') : partId;

    if (isSplit) {

        const sql = `
        SELECT
            sp.id,
            sp.rc_no,
            sp.parent_part_id,

            ppo.part_number,

            po.po_reference_name,

            CASE
                WHEN (
                    sp.id -
                    (
                        SELECT MIN(id)
                        FROM split_parts s2
                        WHERE s2.parent_part_id = ppo.id
                    )
                ) = 0 THEN 'A'

                WHEN (
                    sp.id -
                    (
                        SELECT MIN(id)
                        FROM split_parts s2
                        WHERE s2.parent_part_id = ppo.id
                    )
                ) = 1 THEN 'B'

                WHEN (
                    sp.id -
                    (
                        SELECT MIN(id)
                        FROM split_parts s2
                        WHERE s2.parent_part_id = ppo.id
                    )
                ) = 2 THEN 'C'

                WHEN (
                    sp.id -
                    (
                        SELECT MIN(id)
                        FROM split_parts s2
                        WHERE s2.parent_part_id = ppo.id
                    )
                ) = 3 THEN 'D'

                ELSE 'Z'
            END AS batch_letter

        FROM split_parts sp

        JOIN products_po ppo
            ON ppo.id = sp.parent_part_id

        JOIN purchase_orders po
            ON po.id = ppo.purchase_order_id

        WHERE sp.id = ?
        `;

        db.query(sql, [id], (err, rows) => {

            if (err)
                return res.status(500).json(err);

            if (!rows.length)
                return res.status(404).json({ success: false });

            const row = rows[0];

            // Already generated
            if (row.rc_no) {
                return res.json({
                    success: true,
                    rc_no: row.rc_no
                });
            }

            const now = new Date();

            const year =
                String(now.getFullYear()).slice(-2);

            const month =
                String(now.getMonth() + 1).padStart(2, '0');

            const dateCode = year + month;

            const last4 =
                row.part_number.slice(-4);

            const rcNo =
                `HV/${row.po_reference_name}/${dateCode}/${last4}-${row.batch_letter}01`;

            db.query(
                `UPDATE split_parts
                 SET rc_no = ?
                 WHERE id = ?`,
                [rcNo, id],
                (err2) => {

                    if (err2)
                        return res.status(500).json(err2);

                    res.json({
                        success: true,
                        rc_no: rcNo
                    });

                }
            );

        });

    }

    else {

        const sql = `
        SELECT
            ppo.id,
            ppo.rc_no,
            ppo.part_number,
            po.po_reference_name

        FROM products_po ppo

        JOIN purchase_orders po
            ON po.id = ppo.purchase_order_id

        WHERE ppo.id = ?
        `;

        db.query(sql, [id], (err, rows) => {

            if (err)
                return res.status(500).json(err);

            if (!rows.length)
                return res.status(404).json({ success: false });

            const row = rows[0];

            // Already generated
            if (row.rc_no) {
                return res.json({
                    success: true,
                    rc_no: row.rc_no
                });
            }

            const now = new Date();

            const year =
                String(now.getFullYear()).slice(-2);

            const month =
                String(now.getMonth() + 1).padStart(2, '0');

            const dateCode = year + month;

            const last4 =
                row.part_number.slice(-4);

            const rcNo =
                `HV/${row.po_reference_name}/${dateCode}/${last4}-A01`;

            db.query(
                `UPDATE products_po
                 SET rc_no = ?
                 WHERE id = ?`,
                [rcNo, id],
                (err2) => {

                    if (err2)
                        return res.status(500).json(err2);

                    res.json({
                        success: true,
                        rc_no: rcNo
                    });

                }
            );

        });

    }

});

app.get('/api/route-card/:partId', (req, res) => {

  const partId = req.params.partId;

  const isSplit =
    String(partId).startsWith('split_');

  const handleResult = (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'DB error'
      });
    }

    if (!result.length) {
      return res.status(404).json({
        error: 'No data found'
      });
    }

    res.json(result);

  };

  if (isSplit) {

    const splitId =
      String(partId).replace('split_', '');

    const sql = `
      SELECT
         sp.rc_no,
        p.id AS part_id,
        sp.rc_no,
        po.id AS po_id,

        sp.split_name AS part_number,

        p.product_name,

        sp.quantity,
        sp.required_date,

        po.po_reference,
        po.po_reference_name,
        po.po_reference_date,

        qm.name AS quality_manager_name,
pm.name AS project_manager_name,
po.engineer AS engineer_name,
pe.name AS project_engineer_name,

        '-' AS material_spec,
        '-' AS mtc_no,

        ps.stage_name,
ps.section_title,
ps.stage_date,
ps.achieve_date,
ps.inward,
ps.outward

      FROM split_parts sp

      LEFT JOIN products_po p
        ON p.id = sp.parent_part_id

      LEFT JOIN purchase_orders po
        ON po.id = p.purchase_order_id

      LEFT JOIN users qm
        ON qm.id = po.quality_manager

      LEFT JOIN users pm
        ON pm.id = po.project_manager

      LEFT JOIN users pe
        ON pe.id = po.project_engineer

      LEFT JOIN project_stages ps
        ON ps.split_part_id = sp.id
        AND ps.stage_name NOT IN ('DFM Submission', 'DFM Approval')

      WHERE sp.id = ?

      ORDER BY
        CASE
          WHEN ps.section_title = 'RM Stage' THEN 1
          WHEN ps.section_title = 'Manufacturing' THEN 2
          WHEN ps.section_title = 'Inspection' THEN 3
          WHEN ps.section_title = 'Dispatch' THEN 4
          ELSE 5
        END,
        ps.id ASC
    `;

    db.query(
      sql,
      [splitId],
      handleResult
    );

  } else {

    const sql = `
      SELECT
        p.rc_no,
        p.id AS part_id,
        p.rc_no,
        po.id AS po_id,

        p.part_number,
        p.product_name,

        p.quantity,
        p.required_date,

        po.po_reference,
        po.po_reference_name,
        po.po_reference_date,

        qm.name AS quality_manager_name,
        pm.name AS project_manager_name,
        po.engineer AS engineer_name,
        pe.name AS project_engineer_name,

        '-' AS material_spec,
        '-' AS mtc_no,

        ps.stage_name,
ps.section_title,
ps.stage_date,
ps.achieve_date,
ps.inward,
ps.outward

      FROM products_po p

      LEFT JOIN purchase_orders po
        ON po.id = p.purchase_order_id

      LEFT JOIN users qm
        ON qm.id = po.quality_manager

      LEFT JOIN users pm
        ON pm.id = po.project_manager
      
      LEFT JOIN users pe
  ON pe.id = po.project_engineer

  
    

      INNER JOIN project_stages ps
        ON ps.product_id = p.id
       AND ps.split_part_id IS NULL
        AND ps.stage_name NOT IN ('DFM Submission', 'DFM Approval')

      WHERE p.id = ?

      ORDER BY
        CASE
          WHEN ps.section_title = 'RM Stage' THEN 1
          WHEN ps.section_title = 'Manufacturing' THEN 2
          WHEN ps.section_title = 'Inspection' THEN 3
          WHEN ps.section_title = 'Dispatch' THEN 4
          ELSE 5
        END,
        ps.id ASC
    `;

    db.query(
      sql,
      [partId],
      handleResult
    );
  }

});

app.post('/api/split-part', (req, res) => {
  const { partId, splits } = req.body;
  if (!partId || !splits?.length) {
    return res.status(400).json({
      error: 'Invalid data'
    });
  }
  const sql = `
    INSERT INTO split_parts
    (
      parent_part_id,
      split_name,
      warehouse_name,
      quantity,
      required_date,
      split_code
    ) VALUES ?`;
  const values = splits.map((s, index) => [
    partId,
    s.split_name,
    s.warehouse_name,
    s.quantity,
    s.required_date || null,
    `SPLIT-${partId}-${index + 1}`
  ]);
db.query(sql, [values], (err) => {
  if (err) {console.error(err);
    return res.status(500).json({
      error: 'DB error'
    });
  }
  // UPDATE SPLIT STATUS
  db.query( `UPDATE products_po SET is_split = 1 WHERE id = ?`, [partId],
    (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({
          error: 'Split saved but update failed'
        });
      }
      res.json({
        success: true
      });
    }
  );
});
});

app.get('/api/split-stages/:splitId', (req, res) => {

  const splitId = req.params.splitId;

  const sql = `
    SELECT
      ps.*,
      sv.approver_id,
      sv.remarks AS verifier_remarks,
      sv.verified_at,
      u.name AS verifier_name
    FROM project_stages ps
    LEFT JOIN stage_verifications sv
      ON sv.stage_id = ps.id
    LEFT JOIN users u
      ON u.id = sv.approver_id
    WHERE ps.split_part_id = ?
    ORDER BY ps.id ASC
  `;
  db.query(sql, [splitId], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

app.get('/api/split-parent/:splitId', (req, res) => {
  const splitId = req.params.splitId;
  const sql = `
    SELECT parent_part_id
    FROM split_parts
    WHERE id = ?
  `;
  db.query(sql, [splitId], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (!result.length) {
      return res.status(404).json({
        error: 'Split not found'
      });
    }

    res.json(result[0]);

  });

});

app.get('/api/project-management/products', (req, res) => {

  const sql = `
SELECT
    po.id AS purchase_order_id,
    po.po_reference,
    po.po_reference_name,
    po.po_reference_date,
    pm.name AS project_manager,
qm.name AS quality_manager,
dm.name AS development_manager,
po.engineer AS engineer,
    c.client_code,
    COALESCE(q.total_quantity,0) AS quantity,
   CASE
    WHEN NOT EXISTS (

        SELECT 1
        FROM products_po p

        LEFT JOIN (
            SELECT
                product_id,
                MAX(outward) AS dispatch_qty
            FROM project_stages
            WHERE section_title = 'Dispatch'
            GROUP BY product_id
        ) d
        ON d.product_id = p.id

        WHERE p.purchase_order_id = po.id
          AND IFNULL(d.dispatch_qty,0) < p.quantity

    )

    THEN DATEDIFF(

        (
            SELECT MAX(updated_at)
            FROM products_po p2
            WHERE p2.purchase_order_id = po.id
        ),

        po.po_reference_date

    )

    ELSE DATEDIFF(CURDATE(), po.po_reference_date)

END AS aging,

    CASE

      /* Some parts not started */
      WHEN COUNT(DISTINCT ap.part_key)
           >
           COUNT(DISTINCT lp.part_key)
      THEN 'Pending'

      /* All parts completed */
      WHEN MIN(
        CASE

          WHEN lp.section_title = 'Dispatch'
               AND lp.outward >= lp.part_qty
          THEN 6

          WHEN lp.section_title = 'Dispatch'
          THEN 5

          WHEN lp.section_title = 'Inspection'
          THEN 4

          WHEN lp.section_title = 'Manufacturing'
          THEN 3

          WHEN lp.section_title IN ('DFM Checking','RM Stage')
          THEN 2

          ELSE 1

        END
      ) = 6
      THEN 'Completed'

      WHEN MIN(
        CASE

          WHEN lp.section_title = 'Dispatch'
               AND lp.outward >= lp.part_qty
          THEN 6

          WHEN lp.section_title = 'Dispatch'
          THEN 5

          WHEN lp.section_title = 'Inspection'
          THEN 4

          WHEN lp.section_title = 'Manufacturing'
          THEN 3

          WHEN lp.section_title IN ('DFM Checking','RM Stage')
          THEN 2

          ELSE 1

        END
      ) = 5
      THEN 'Dispatch'

      WHEN MIN(
        CASE

          WHEN lp.section_title = 'Dispatch'
               AND lp.outward >= lp.part_qty
          THEN 6

          WHEN lp.section_title = 'Dispatch'
          THEN 5

          WHEN lp.section_title = 'Inspection'
          THEN 4

          WHEN lp.section_title = 'Manufacturing'
          THEN 3

          WHEN lp.section_title IN ('DFM Checking','RM Stage')
          THEN 2

          ELSE 1

        END
      ) = 4
      THEN 'Inspection'

      WHEN MIN(
        CASE

          WHEN lp.section_title = 'Dispatch'
               AND lp.outward >= lp.part_qty
          THEN 6

          WHEN lp.section_title = 'Dispatch'
          THEN 5

          WHEN lp.section_title = 'Inspection'
          THEN 4

          WHEN lp.section_title = 'Manufacturing'
          THEN 3

          WHEN lp.section_title IN ('DFM Checking','RM Stage')
          THEN 2

          ELSE 1

        END
      ) = 3
      THEN 'Manufacturing'

      WHEN MIN(
        CASE

          WHEN lp.section_title = 'Dispatch'
               AND lp.outward >= lp.part_qty
          THEN 6

          WHEN lp.section_title = 'Dispatch'
          THEN 5

          WHEN lp.section_title = 'Inspection'
          THEN 4

          WHEN lp.section_title = 'Manufacturing'
          THEN 3

          WHEN lp.section_title IN ('DFM Checking','RM Stage')
          THEN 2

          ELSE 1

        END
      ) = 2
      THEN 'RM Stage'

      ELSE 'Pending'

    END AS status

FROM purchase_orders po

LEFT JOIN users pm
  ON pm.id = po.project_manager

LEFT JOIN users qm
  ON qm.id = po.quality_manager

LEFT JOIN users dm
  ON dm.id = po.project_engineer



LEFT JOIN clients c
  ON c.id = po.client_id

LEFT JOIN (
  SELECT
      purchase_order_id,
      SUM(quantity) total_quantity
  FROM products_po
WHERE IFNULL(is_service,0)=0
GROUP BY purchase_order_id
) q
ON q.purchase_order_id = po.id

/* All Parts */
LEFT JOIN (
    SELECT
        id AS part_key,
        purchase_order_id
    FROM products_po
    WHERE IFNULL(is_service,0)=0

    UNION ALL

    SELECT
        CONCAT('split_',sp.id),
        ppo.purchase_order_id
    FROM split_parts sp
    JOIN products_po ppo
      ON ppo.id = sp.parent_part_id
      WHERE IFNULL(sp.is_service,0)=0
) ap
ON ap.purchase_order_id = po.id

/* Latest Stage Per Part */
LEFT JOIN (

    /* Main Parts */
    SELECT
        ppo.purchase_order_id,
        ppo.id AS part_key,
        ppo.quantity AS part_qty,
        ps.section_title,
        COALESCE(ps.outward,0) outward

    FROM products_po ppo

    LEFT JOIN (
        SELECT ps1.*
        FROM project_stages ps1
        INNER JOIN (
            SELECT
                product_id,
                MAX(id) max_id
            FROM project_stages
            WHERE product_id IS NOT NULL
            GROUP BY product_id
        ) x
        ON x.max_id = ps1.id
    ) ps
    ON ps.product_id = ppo.id
  
WHERE IFNULL(ppo.is_service,0)=0

    UNION ALL

    /* Split Parts */
    SELECT
        ppo.purchase_order_id,
        CONCAT('split_',sp.id) AS part_key,
        sp.quantity AS part_qty,
        ps.section_title,
        COALESCE(ps.outward,0) outward

    FROM split_parts sp

    JOIN products_po ppo
      ON ppo.id = sp.parent_part_id
      

    LEFT JOIN (
        SELECT ps1.*
        FROM project_stages ps1
        INNER JOIN (
            SELECT
                split_part_id,
                MAX(id) max_id
            FROM project_stages
            WHERE split_part_id IS NOT NULL
            GROUP BY split_part_id
        ) x
        ON x.max_id = ps1.id
    ) ps
    ON ps.split_part_id = sp.id
    WHERE IFNULL(sp.is_service,0)=0

) lp
ON lp.purchase_order_id = po.id

WHERE IFNULL(po.pt_show,0) = 0

GROUP BY po.id
ORDER BY po.id DESC
`;

  db.query(sql, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Database error'
      });
    }

    res.json(result);

  });

});

app.post('/api/save-part-status', (req, res) => {

  const { partId } = req.body;
  const isSplit =
    String(partId).startsWith('split_');
  let id = partId;
  if (isSplit) {
    id = String(partId).replace('split_', '');

    const sql = `
      SELECT
        sp.quantity AS order_qty,
        COALESCE(
          (
            SELECT MAX(outward)
            FROM project_stages
            WHERE split_part_id = ?
              AND section_title = 'Dispatch'
          ),
          0
        ) AS dispatch_qty
      FROM split_parts sp
      WHERE sp.id = ?
    `;

    db.query(sql, [id, id], (err, rows) => {

      if (err)
        return res.status(500).json({ success: false });

      const orderQty =
        Number(rows[0]?.order_qty || 0);

      const dispatchQty =
        Number(rows[0]?.dispatch_qty || 0);

      const status =
        dispatchQty >= orderQty
          ? 'Completed'
          : 'Active';

      db.query(
        `
        UPDATE split_parts
        SET status = ?
        WHERE id = ?
        `,
        [status, id],
        err2 => {

          if (err2)
            return res.status(500).json({ success: false });

          res.json({
            success: true,
            status
          });

        }
      );

    });

  } else {

    const sql = `
      SELECT
        ppo.quantity AS order_qty,
        COALESCE(
          (
            SELECT MAX(outward)
            FROM project_stages
            WHERE product_id = ?
              AND section_title = 'Dispatch'
          ),
          0
        ) AS dispatch_qty
      FROM products_po ppo
      WHERE ppo.id = ?
    `;

    db.query(sql, [id, id], (err, rows) => {

      if (err)
        return res.status(500).json({ success: false });

      const orderQty =
        Number(rows[0]?.order_qty || 0);

      const dispatchQty =
        Number(rows[0]?.dispatch_qty || 0);

      const status =
        dispatchQty >= orderQty
          ? 'Completed'
          : 'Active';

      db.query(
        `
        UPDATE products_po
        SET status = ?
        WHERE id = ?
        `,
        [status, id],
        err2 => {

          if (err2)
            return res.status(500).json({ success: false });

          res.json({
            success: true,
            status
          });
        }
      );
    });
  }
});

// DASHBOARD COUNTS
app.get('/api/dashboard-counts', (req, res) => {

  const sql = `
SELECT
    (
        SELECT COUNT(*)
        FROM purchase_orders
        WHERE IFNULL(pt_show,0)=0
    ) AS totalPOs,

    (
        SELECT COUNT(*)
        FROM products_po
        WHERE IFNULL(is_service,0)=0
    ) AS totalParts
`;
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'DB error'
      });
    }
    res.json(result[0]);
  });

});

app.get('/api/dashboard/next-week-dispatch', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

  if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const filterClause =
    where.length
      ? ` AND ${where.join(' AND ')}`
      : '';

  const sql = `

    SELECT
      po.id AS purchase_order_id,
      po.po_reference_name AS project_id,
      ppo.part_number,
      ppo.quantity,
      ppo.required_date AS dispatch_date,
      DATEDIFF(ppo.required_date, CURDATE()) AS days_left

    FROM products_po ppo

    JOIN purchase_orders po
      ON po.id = ppo.purchase_order_id

   LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    LEFT JOIN (
      SELECT
        product_id,
        SUM(IFNULL(outward,0)) AS dispatch_qty
      FROM project_stages
      WHERE stage_name = 'Dispatch'
      GROUP BY product_id
    ) d
      ON d.product_id = ppo.id

    WHERE
    IFNULL(ppo.is_service,0)=0
      AND IFNULL(po.pt_show,0)=0
     AND ppo.required_date IS NOT NULL

      AND ppo.required_date BETWEEN
        DATE_ADD(
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
          INTERVAL 7 DAY
        )
        AND
        DATE_ADD(
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
          INTERVAL 12 DAY
        )

      AND IFNULL(d.dispatch_qty,0) < ppo.quantity
      AND IFNULL(ppo.status,'Active') <> 'Completed'
      ${filterClause}

    UNION ALL

    SELECT
      po.id AS purchase_order_id,
      po.po_reference_name AS project_id,
      sp.split_name AS part_number,
      sp.quantity,
      sp.required_date AS dispatch_date,
      DATEDIFF(sp.required_date, CURDATE()) AS days_left

    FROM split_parts sp

    JOIN products_po ppo
      ON ppo.id = sp.parent_part_id

    JOIN purchase_orders po
      ON po.id = ppo.purchase_order_id

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    LEFT JOIN (
      SELECT
        split_part_id,
        SUM(IFNULL(outward,0)) AS dispatch_qty
      FROM project_stages
      WHERE stage_name = 'Dispatch'
      GROUP BY split_part_id
    ) d
      ON d.split_part_id = sp.id

    WHERE
       IFNULL(sp.is_service,0)=0
         AND IFNULL(po.pt_show,0)=0
      AND sp.required_date IS NOT NULL

      AND sp.required_date BETWEEN
        DATE_ADD(
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
          INTERVAL 7 DAY
        )
        AND
        DATE_ADD(
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
          INTERVAL 12 DAY
        )

      AND IFNULL(d.dispatch_qty,0) < sp.quantity
      AND IFNULL(sp.status,'Active') <> 'Completed'
      ${filterClause}

    ORDER BY dispatch_date ASC

  `;

  db.query(
    sql,
    [...params, ...params],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json(result);

    }
  );

});

 app.get('/api/dashboard/weekly-dispatch-due', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

  if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const filterClause =
    where.length
      ? ` AND ${where.join(' AND ')}`
      : '';

  const sql = `

    SELECT
      po.id AS purchase_order_id,
      po.po_reference_name AS project_id,
      ppo.part_number,
      ppo.quantity,
      ppo.required_date AS dispatch_date,
      DATEDIFF(ppo.required_date, CURDATE()) AS days_left

    FROM products_po ppo

    JOIN purchase_orders po
      ON po.id = ppo.purchase_order_id

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    LEFT JOIN (
      SELECT
        product_id,
        SUM(IFNULL(outward,0)) AS dispatch_qty
      FROM project_stages
      WHERE stage_name = 'Dispatch'
      GROUP BY product_id
    ) d
      ON d.product_id = ppo.id

    WHERE
     IFNULL(ppo.is_service,0)=0
      AND IFNULL(po.pt_show,0)=0
      AND ppo.required_date IS NOT NULL

      AND ppo.required_date BETWEEN
        DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND DATE_ADD(
              DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
              INTERVAL 5 DAY
            )

      AND IFNULL(d.dispatch_qty,0) < ppo.quantity
      AND IFNULL(ppo.status,'Active') <> 'Completed'
      ${filterClause}

    UNION ALL

    SELECT
      po.id AS purchase_order_id,
      po.po_reference_name AS project_id,
      sp.split_name AS part_number,
      sp.quantity,
      sp.required_date AS dispatch_date,
      DATEDIFF(sp.required_date, CURDATE()) AS days_left

    FROM split_parts sp

    JOIN products_po ppo
      ON ppo.id = sp.parent_part_id

    JOIN purchase_orders po
      ON po.id = ppo.purchase_order_id

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    LEFT JOIN (
      SELECT
        split_part_id,
        SUM(IFNULL(outward,0)) AS dispatch_qty
      FROM project_stages
      WHERE stage_name = 'Dispatch'
      GROUP BY split_part_id
    ) d
      ON d.split_part_id = sp.id

    WHERE
    IFNULL(sp.is_service,0)=0
     AND IFNULL(po.pt_show,0)=0
      AND sp.required_date IS NOT NULL

      AND sp.required_date BETWEEN
        DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND DATE_ADD(
              DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
              INTERVAL 5 DAY
            )

      AND IFNULL(d.dispatch_qty,0) < sp.quantity
      AND IFNULL(sp.status,'Active') <> 'Completed'
      ${filterClause}

    ORDER BY dispatch_date ASC

  `;

  db.query(
    sql,
    [...params, ...params],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json(result);

    }
  );

});

app.get('/api/dashboard/critical-projects', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

  if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const filterClause =
    where.length
      ? ` AND ${where.join(' AND ')}`
      : '';

  const sql = `

    SELECT
      po.id AS purchase_order_id,
      po.po_reference_name AS project_id,
      ppo.part_number,
      ppo.quantity,
      ppo.required_date,
      DATEDIFF(CURDATE(), ppo.required_date) AS overdue_days

    FROM products_po ppo

    JOIN purchase_orders po
      ON po.id = ppo.purchase_order_id

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    LEFT JOIN (
      SELECT
        product_id,
        SUM(IFNULL(outward,0)) AS dispatch_qty
      FROM project_stages
      WHERE stage_name = 'Dispatch'
      GROUP BY product_id
    ) d
      ON d.product_id = ppo.id

    WHERE
     IFNULL(ppo.is_service,0)=0
       AND IFNULL(po.pt_show,0)=0
      AND ppo.required_date IS NOT NULL
      AND ppo.required_date < CURDATE()
      AND IFNULL(d.dispatch_qty,0) < ppo.quantity
      AND IFNULL(ppo.status,'Active') <> 'Completed'
      ${filterClause}

    UNION ALL

    SELECT
      po.id AS purchase_order_id,
      po.po_reference_name AS project_id,
      sp.split_name AS part_number,
      sp.quantity,
      sp.required_date,
      DATEDIFF(CURDATE(), sp.required_date) AS overdue_days

    FROM split_parts sp

    JOIN products_po ppo
      ON ppo.id = sp.parent_part_id

    JOIN purchase_orders po
      ON po.id = ppo.purchase_order_id

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    LEFT JOIN (
      SELECT
        split_part_id,
        SUM(IFNULL(outward,0)) AS dispatch_qty
      FROM project_stages
      WHERE stage_name = 'Dispatch'
      GROUP BY split_part_id
    ) d
      ON d.split_part_id = sp.id

    WHERE
     IFNULL(sp.is_service,0)=0
       AND IFNULL(po.pt_show,0)=0
      AND sp.required_date IS NOT NULL
      AND sp.required_date < CURDATE()
      AND IFNULL(d.dispatch_qty,0) < sp.quantity
      AND IFNULL(sp.status,'Active') <> 'Completed'
      ${filterClause}

    ORDER BY required_date ASC
  `;

  db.query(
    sql,
    [...params, ...params],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json(result);

    }
  );

});

app.get('/api/products-po-count/:poId', (req, res) => {

  const { poId } = req.params;

  db.query(
    `
      SELECT
        COUNT(*) AS partCount,
        COALESCE(SUM(quantity),0) AS totalQty
      FROM products_po
      WHERE purchase_order_id = ?
      AND IFNULL(is_service,0)=0
    `,
    [poId],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json(result[0]);
    }
  );
});

app.get('/api/dashboard/stage-summary', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];
if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}
  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const filterClause =
    where.length
      ? `AND ${where.join(' AND ')}`
      : '';

  const sql = `

    WITH all_parts AS (

      SELECT
        CONCAT('P-', ppo.id) AS part_key

      FROM products_po ppo

      JOIN purchase_orders po
        ON po.id = ppo.purchase_order_id

      LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

      LEFT JOIN clients c
        ON c.id = po.client_id
      WHERE IFNULL(ppo.is_service,0)=0
      AND IFNULL(po.pt_show,0)=0

      ${filterClause}

      UNION ALL

      SELECT
        CONCAT('S-', sp.id) AS part_key

      FROM split_parts sp
      JOIN products_po ppo
        ON ppo.id = sp.parent_part_id

      JOIN purchase_orders po
        ON po.id = ppo.purchase_order_id

      LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

      LEFT JOIN clients c
        ON c.id = po.client_id
      WHERE IFNULL(sp.is_service,0)=0
      AND IFNULL(po.pt_show,0)=0

      ${filterClause}

    ),

    section_list AS (

      SELECT 'DFM Checking' AS section_title
      UNION ALL SELECT 'RM Stage'
      UNION ALL SELECT 'Manufacturing'
      UNION ALL SELECT 'Inspection'
      UNION ALL SELECT 'Dispatch'

    ),

    part_sections AS (

      SELECT
        ap.part_key,
        sl.section_title

      FROM all_parts ap
      CROSS JOIN section_list sl

    ),

    stage_summary AS (

      SELECT

        ps.part_key,
        ps.section_title,

        COUNT(st.id) AS total_rows,

        SUM(
          CASE

            WHEN ps.section_title = 'DFM Checking'
                 AND st.achieve_date IS NOT NULL
                 AND st.achieve_date <> '0000-00-00'
            THEN 1

            WHEN ps.section_title <> 'DFM Checking'
                 AND IFNULL(st.inward,0) > 0
                 AND IFNULL(st.outward,0) >= IFNULL(st.inward,0)
            THEN 1

            ELSE 0

          END
        ) AS completed_rows,

        SUM(
          CASE

            WHEN ps.section_title = 'DFM Checking'
                 AND (
                      st.stage_date IS NOT NULL
                      OR st.achieve_date IS NOT NULL
                 )
            THEN 1

            WHEN ps.section_title <> 'DFM Checking'
                 AND (
                      IFNULL(st.inward,0) > 0
                      OR IFNULL(st.outward,0) > 0
                 )
            THEN 1

            ELSE 0

          END
        ) AS progress_rows

      FROM part_sections ps

      LEFT JOIN (

        SELECT

          CASE
            WHEN product_id IS NOT NULL
            THEN CONCAT('P-', product_id)
            ELSE CONCAT('S-', split_part_id)
          END AS part_key,

          section_title,
          inward,
          outward,
          achieve_date,
          stage_date,
          id

        FROM project_stages

      ) st

        ON st.part_key = ps.part_key
       AND st.section_title = ps.section_title

      GROUP BY
        ps.part_key,
        ps.section_title

    )

    SELECT

      section_title,

      SUM(
        CASE
          WHEN total_rows = 0
          THEN 1
          ELSE 0
        END
      ) AS pending,

      SUM(
        CASE
          WHEN total_rows > 0
               AND completed_rows < total_rows
          THEN 1
          ELSE 0
        END
      ) AS in_progress,

      SUM(
        CASE
          WHEN total_rows > 0
               AND completed_rows = total_rows
          THEN 1
          ELSE 0
        END
      ) AS completed

    FROM stage_summary

    GROUP BY section_title

    ORDER BY FIELD(
      section_title,
      'DFM Checking',
      'RM Stage',
      'Manufacturing',
      'Inspection',
      'Dispatch'
    )

  `;

  db.query(
    sql,
    [...params, ...params],
    (err, result) => {

      if (err) {
        console.error('Stage Summary Error:', err);
        return res.status(500).json(err);
      }

      res.json(result);

    }
  );

});

app.post('/api/inventory/adjustment', (req, res) => {

   console.log('REQ BODY:', req.body);

  const {
    product_id,
    old_stock,
    new_stock,
    reason,
    remarks
  } = req.body;

  const user_id = 5;

  const isSplit =
    String(product_id).startsWith('split_');

  const id =
    isSplit
      ? product_id.replace('split_', '')  
      : product_id;

  const partSql = isSplit
    ? `SELECT split_name AS part_number FROM split_parts WHERE id = ?`
    : `SELECT part_number FROM products_po WHERE id = ?`;

  db.query(partSql, [id], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }

    if (!result.length) {
      return res.status(404).json({ success: false, error: `Part not found for ID ${product_id}` });
    }

    const partNumber = result[0].part_number;

    // STEP 1: INSERT TRANSACTION LOG
    db.query(
      `
      INSERT INTO inventory_transactions
      (user_id, product_id, split_part_id, part_number, transaction_type, reason, old_stock, new_stock, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user_id,
        isSplit ? null : id,
        isSplit ? id  : null,
        partNumber,
        'Manual Adjustment',
        reason,
        old_stock,
        new_stock,
        remarks || null
      ],
      (insertErr) => {

        if (insertErr) {
          console.error(insertErr);
          return res.status(500).json({ success: false, error: insertErr.message });
        }

        // STEP 2: CHECK IF inventory_master ROW EXISTS
        const checkSql = isSplit
          ? `SELECT id FROM inventory_master WHERE split_part_id = ?`
          : `SELECT id FROM inventory_master WHERE product_id = ? AND split_part_id IS NULL`;

        db.query(checkSql, [id], (checkErr, checkResult) => {

          if (checkErr) {
            console.error(checkErr);
            return res.status(500).json({ success: false, error: checkErr.message });
          }

          let stockSql, stockParams;

          if (checkResult.length > 0) {
            // ROW EXISTS — UPDATE current_stock
            stockSql = isSplit
              ? `UPDATE inventory_master SET current_stock = ? WHERE split_part_id = ?`
              : `UPDATE inventory_master SET current_stock = ? WHERE product_id = ? AND split_part_id IS NULL`;
            stockParams = [new_stock, id];

          } else {
            // ROW MISSING — INSERT new row
            stockSql = isSplit
              ? `INSERT INTO inventory_master (user_id, split_part_id, part_number, current_stock) VALUES (?, ?, ?, ?)`
              : `INSERT INTO inventory_master (user_id, product_id, part_number, current_stock) VALUES (?, ?, ?, ?)`;
            stockParams = [user_id, id, partNumber, new_stock];
          }

          // STEP 3: RUN UPDATE OR INSERT
          db.query(stockSql, stockParams, (stockErr) => {

            if (stockErr) {
              console.error(stockErr);
              return res.status(500).json({ success: false, error: stockErr.message });
            }

            res.json({
              success: true,
              message: 'Inventory adjusted successfully'
            });

          });
        });
      }
    );
  });
});

// TOTAL PROJECTS COUNT
app.get('/api/dashboard/total-projects-count', (req, res) => {

  const {
    manager,
    clientCode,
    months
  } = req.query;

  let where = [];
  let params = [];

  if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const sql = `
    SELECT COUNT(DISTINCT po.id) AS count
    FROM purchase_orders po
    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer
    LEFT JOIN clients c
      ON c.id = po.client_id
      WHERE IFNULL(po.pt_show,0)=0
    ${where.length
      ? 'AND ' + where.join(' AND ')
      : ''}
  `;

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      count: result[0].count
    });
  });

});

app.get('/api/dashboard/live-projects-count', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

 if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  // Additional filters only
  const whereClause =
    where.length
      ? `AND ${where.join(' AND ')}`
      : '';

  const sql = `
    SELECT COUNT(*) AS count
    FROM (

      SELECT
        po.id,

        CASE

          WHEN NOT EXISTS (
            SELECT 1
            FROM products_po p
            WHERE p.purchase_order_id = po.id
              AND IFNULL(p.status,'') <> 'Completed'
          )
          THEN 'Completed'

          WHEN EXISTS (
            SELECT 1
            FROM products_po p
            JOIN project_stages ps
              ON ps.product_id = p.id
            WHERE p.purchase_order_id = po.id
          )
          THEN 'Live'

          ELSE 'Pending'

        END AS project_status

      FROM purchase_orders po

      LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

      LEFT JOIN clients c
        ON c.id = po.client_id

      WHERE IFNULL(po.pt_show,0)=0

      ${whereClause}

    ) x

    WHERE project_status = 'Live'
  `;

  db.query(sql, params, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({
      count: result[0].count
    });

  });

});

// COMPLETED PROJECTS COUNT
app.get('/api/dashboard/completed-projects-count', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

 if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const whereClause =
    where.length
      ? `AND ${where.join(' AND ')}`
      : '';

  const sql = `
    SELECT COUNT(DISTINCT po.id) AS count

    FROM purchase_orders po

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id


    WHERE
       IFNULL(po.pt_show,0)=0
      AND NOT EXISTS (
        SELECT 1
        FROM products_po ppo
        WHERE ppo.purchase_order_id = po.id
          AND IFNULL(ppo.status,'') <> 'Completed'
      )

      AND EXISTS (
        SELECT 1
        FROM products_po ppo2
        WHERE ppo2.purchase_order_id = po.id
      )

      ${whereClause}
  `;

  db.query(sql, params, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({
      count: result[0].count
    });

  });

});

// PENDING PROJECTS COUNT
app.get('/api/dashboard/pending-projects-count', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

  if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  // Additional filters only
  const whereClause =
    where.length
      ? `AND ${where.join(' AND ')}`
      : '';

  const sql = `
    SELECT COUNT(*) AS count
    FROM (

      SELECT
        po.id,

        CASE

          WHEN NOT EXISTS (
            SELECT 1
            FROM products_po p
            WHERE p.purchase_order_id = po.id
              AND IFNULL(p.status,'') <> 'Completed'
          )
          THEN 'Completed'

          WHEN EXISTS (
            SELECT 1
            FROM products_po p
            JOIN project_stages ps
              ON ps.product_id = p.id
            WHERE p.purchase_order_id = po.id
          )
          THEN 'Live'

          ELSE 'Pending'

        END AS project_status

      FROM purchase_orders po

      LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

      LEFT JOIN clients c
        ON c.id = po.client_id

      WHERE IFNULL(po.pt_show,0)=0

      ${whereClause}

    ) x

    WHERE project_status = 'Pending'
  `;

  db.query(sql, params, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({
      count: result[0].count
    });

  });

});

// ── GET all inventory items ──
app.get('/api/inventory', (req, res) => {

  const search = req.query.search || '';
  const page   = parseInt(req.query.page  || 1);
  const limit  = parseInt(req.query.limit || 250);
  const offset = (page - 1) * limit;
  const searchParam = `%${search}%`;

  // ── COUNT query ──
  const countSql = `
    SELECT COUNT(*) AS total
    FROM (

      -- NORMAL PARTS
      SELECT ppo.id AS row_id
      FROM products_po ppo
      JOIN purchase_orders po ON po.id = ppo.purchase_order_id
      LEFT JOIN inventory_master im
        ON im.product_id = ppo.id AND im.split_part_id IS NULL
      WHERE NOT EXISTS (SELECT 1 FROM split_parts sp WHERE sp.parent_part_id = ppo.id)
        AND COALESCE(im.current_stock, 0) > 0
        AND (
          ppo.part_number      LIKE ? OR
          ppo.product_name     LIKE ? OR
          po.po_reference_name LIKE ?
        )
      UNION ALL

      -- SPLIT PARTS
      SELECT CONCAT('split_', sp.id) AS row_id
      FROM split_parts sp
      JOIN products_po ppo ON ppo.id = sp.parent_part_id
      JOIN purchase_orders po ON po.id = ppo.purchase_order_id
      LEFT JOIN inventory_master im ON im.split_part_id = sp.id
      WHERE COALESCE(im.current_stock, 0) > 0
        AND (
          sp.split_name        LIKE ? OR
          ppo.product_name     LIKE ? OR
          po.po_reference_name LIKE ?
        )

    ) AS combined
  `;

  // ── DATA query ──
  const dataSql = `
    SELECT
      part_number,
      product_name,
      type,
      po_reference_name AS project_id,
      purchase_order_id,
      inventory_qty,
      part_id
    FROM (

      -- NORMAL PARTS
      SELECT
        ppo.part_number,
        ppo.product_name,
        COALESCE(last_txn.transaction_type, 'Dispatch') AS type,
        po.po_reference_name,
        po.id                         AS purchase_order_id,
        COALESCE(im.current_stock, 0) AS inventory_qty,
        CAST(ppo.id AS CHAR)          AS part_id,
        ppo.part_number               AS sort_key
      FROM products_po ppo
      JOIN purchase_orders po ON po.id = ppo.purchase_order_id
      LEFT JOIN inventory_master im
        ON im.product_id = ppo.id AND im.split_part_id IS NULL
      LEFT JOIN (
        SELECT it.product_id, it.transaction_type
        FROM inventory_transactions it
        WHERE it.split_part_id IS NULL
          AND it.id = (
            SELECT MAX(it2.id)
            FROM inventory_transactions it2
            WHERE it2.product_id = it.product_id
              AND it2.split_part_id IS NULL
          )
      ) last_txn ON last_txn.product_id = ppo.id
      WHERE NOT EXISTS (SELECT 1 FROM split_parts sp WHERE sp.parent_part_id = ppo.id)
        AND COALESCE(im.current_stock, 0) > 0
        AND (
          ppo.part_number      LIKE ? OR
          ppo.product_name     LIKE ? OR
          po.po_reference_name LIKE ?
        )

      UNION ALL

      -- SPLIT PARTS
      SELECT
        sp.split_name                 AS part_number,
        ppo.product_name,
        COALESCE(last_txn.transaction_type, 'Dispatch') AS type,
        po.po_reference_name,
        po.id                         AS purchase_order_id,
        COALESCE(im.current_stock, 0) AS inventory_qty,
        CONCAT('split_', sp.id)       AS part_id,
        sp.split_name                 AS sort_key
      FROM split_parts sp
      JOIN products_po ppo ON ppo.id = sp.parent_part_id
      JOIN purchase_orders po ON po.id = ppo.purchase_order_id
      LEFT JOIN inventory_master im ON im.split_part_id = sp.id
      LEFT JOIN (
        SELECT it.split_part_id, it.transaction_type
        FROM inventory_transactions it
        WHERE it.split_part_id IS NOT NULL
          AND it.id = (
            SELECT MAX(it2.id)
            FROM inventory_transactions it2
            WHERE it2.split_part_id = it.split_part_id
          )
      ) last_txn ON last_txn.split_part_id = sp.id
      WHERE COALESCE(im.current_stock, 0) > 0
        AND (
          sp.split_name        LIKE ? OR
          ppo.product_name     LIKE ? OR
          po.po_reference_name LIKE ?
        )

    ) AS combined
    ORDER BY sort_key ASC
    LIMIT ? OFFSET ?
  `;

  db.query(
    countSql,
    [searchParam, searchParam, searchParam,
     searchParam, searchParam, searchParam],
    (countErr, countResult) => {

      if (countErr) {
        console.error('Inventory count error:', countErr);
        return res.status(500).json({ error: countErr.message });
      }

      const total = countResult[0].total;

      db.query(
        dataSql,
        [
          searchParam, searchParam, searchParam,
          searchParam, searchParam, searchParam,
          limit, offset
        ],
        (dataErr, rows) => {

          if (dataErr) {
            console.error('Inventory data error:', dataErr);
            return res.status(500).json({ error: dataErr.message });
          }

          res.json({ total, rows });
        }
      );
    }
  );
});

// ── GET inventory transaction history for one part ──
app.get('/api/inventory/transactions/:productId', (req, res) => {
  const { productId } = req.params;
  const isSplit = String(productId).startsWith('split_');
  const id = isSplit ? productId.replace('split_', '') : productId;

  const sql = isSplit
    ? `
        SELECT
          it.*,
          u.name AS user_name
        FROM inventory_transactions it
        LEFT JOIN users u ON u.id = it.user_id
        WHERE it.split_part_id = ?
        ORDER BY it.created_at DESC
      `
    : `
        SELECT
          it.*,
          u.name AS user_name
        FROM inventory_transactions it
        LEFT JOIN users u ON u.id = it.user_id
        WHERE it.product_id = ?
          AND it.split_part_id IS NULL
        ORDER BY it.created_at DESC
      `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Transaction fetch error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

// ── GET inventory summary counts for dashboard ──
app.get('/api/inventory/summary', (req, res) => {
  const sql = `
    SELECT
      COUNT(*)                                         AS total_items,
      SUM(COALESCE(current_stock, 0))                  AS total_stock,
      SUM(COALESCE(dispatch_quantity, 0))              AS total_dispatched,
      SUM(CASE WHEN COALESCE(current_stock,0) = 0
               THEN 1 ELSE 0 END)                      AS out_of_stock,
      SUM(CASE WHEN COALESCE(current_stock,0) > 0
               AND COALESCE(current_stock,0) <= 5
               THEN 1 ELSE 0 END)                      AS low_stock
    FROM inventory_master
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Inventory summary error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result[0]);
  });
});

app.get('/api/inventory-stock/:partId', (req, res) => {

  const partId = req.params.partId;

  db.query(
    `
    SELECT
      COALESCE(current_stock,0) AS current_stock
    FROM inventory_master
    WHERE product_id = ?
    `,
    [partId],
    (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        stock: result.length
          ? result[0].current_stock
          : 0
      });

    }
  );

});

app.get('/api/dashboard/client-codes', (req, res) => {

  const sql = `
    SELECT DISTINCT
      c.client_code
    FROM clients c
    INNER JOIN purchase_orders po
      ON po.client_id = c.id
    WHERE
      c.client_code IS NOT NULL
      AND c.client_code <> ''
    ORDER BY c.client_code
  `;

  db.query(sql, (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(rows);

  });

});

app.get('/api/dashboard/all-projects', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

  // Manager Filter
  if (manager) {
    where.push(`
      (
        pm.name = ?
        OR qm.name = ?
        OR dm.name = ?
      )
    `);

    params.push(manager, manager, manager);
  }

  // Client Filter
  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  // Month Filter
  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  // WHERE clause
  const whereClause = `
    WHERE IFNULL(po.pt_show,0)=0
    ${where.length ? 'AND ' + where.join(' AND ') : ''}
  `;

  const sql = `
    SELECT
      po.id AS purchase_order_id,
      po.po_reference,
      po.po_reference_name,
      po.po_reference_date,
      COALESCE(SUM(ppo.quantity),0) AS quantity

    FROM purchase_orders po

    LEFT JOIN products_po ppo
      ON ppo.purchase_order_id = po.id

    LEFT JOIN users pm
      ON pm.id = po.project_manager

    LEFT JOIN users qm
      ON qm.id = po.quality_manager

    LEFT JOIN users dm
      ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    ${whereClause}

    GROUP BY
      po.id,
      po.po_reference,
      po.po_reference_name,
      po.po_reference_date

    ORDER BY po.id DESC
  `;

  db.query(sql, params, (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(rows);

  });

});

app.get('/api/dashboard/live-projects', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

  if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const whereClause =
    where.length
      ? ` AND ${where.join(' AND ')}`
      : '';

  const sql = `
    SELECT
      po.id AS purchase_order_id,
      po.po_reference,
      po.po_reference_name,
      po.po_reference_date,
      COALESCE(SUM(ppo.quantity),0) AS quantity

    FROM purchase_orders po

    LEFT JOIN products_po ppo
      ON ppo.purchase_order_id = po.id

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    WHERE IFNULL(po.pt_show,0)=0

AND EXISTS (
      SELECT 1
      FROM products_po p
      JOIN project_stages ps
        ON ps.product_id = p.id
      WHERE p.purchase_order_id = po.id
    )

    AND EXISTS (
      SELECT 1
      FROM products_po p
      WHERE p.purchase_order_id = po.id
        AND IFNULL(p.status,'') <> 'Completed'
    )

    ${whereClause}

    GROUP BY
      po.id,
      po.po_reference,
      po.po_reference_name,
      po.po_reference_date

    ORDER BY po.id DESC
  `;

  db.query(sql, params, (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(rows);

  });

});

app.get('/api/dashboard/completed-projects', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];

if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const filterClause =
    where.length
      ? ` AND ${where.join(' AND ')}`
      : '';

  const sql = `
    SELECT
      po.id AS purchase_order_id,
      po.po_reference,
      po.po_reference_name,
      po.po_reference_date,
      COALESCE(SUM(ppo.quantity),0) AS quantity

    FROM purchase_orders po

    LEFT JOIN products_po ppo
      ON ppo.purchase_order_id = po.id

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    WHERE NOT EXISTS (
      SELECT 1
      FROM products_po p
      WHERE p.purchase_order_id = po.id
        AND IFNULL(p.status,'') <> 'Completed'
    )

    ${filterClause}

    GROUP BY
      po.id,
      po.po_reference,
      po.po_reference_name,
      po.po_reference_date

    ORDER BY po.id DESC
  `;

  db.query(sql, params, (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(rows);

  });

});

app.get('/api/dashboard/pending-projects', (req, res) => {

  const {
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let where = [];
  let params = [];
if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);
  }

  const filterClause =
    where.length
      ? ` AND ${where.join(' AND ')}`
      : '';

  const sql = `
    SELECT
      po.id AS purchase_order_id,
      po.po_reference,
      po.po_reference_name,
      po.po_reference_date,
      COALESCE(SUM(ppo.quantity),0) AS quantity

    FROM purchase_orders po

    LEFT JOIN products_po ppo
      ON ppo.purchase_order_id = po.id

   LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer

    LEFT JOIN clients c
      ON c.id = po.client_id

    WHERE NOT EXISTS (
      SELECT 1
      FROM products_po p
      JOIN project_stages ps
        ON ps.product_id = p.id
      WHERE p.purchase_order_id = po.id
    )

    AND EXISTS (
      SELECT 1
      FROM products_po p
      WHERE p.purchase_order_id = po.id
        AND IFNULL(p.status,'') <> 'Completed'
    )

    ${filterClause}

    GROUP BY
      po.id,
      po.po_reference,
      po.po_reference_name,
      po.po_reference_date

    ORDER BY po.id DESC
  `;

  db.query(sql, params, (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(rows);

  });

});

app.get('/api/dashboard/stage-details', (req, res) => {

  const {
    section,
    type,
    manager = '',
    clientCode = '',
    months = ''
  } = req.query;

  let dateCondition = '';

  if (type === 'overdue') {

    dateCondition = `
      DATE(ps.stage_date) < CURDATE()
    `;

  } else {

    dateCondition = `
      DATE(ps.stage_date)
      BETWEEN CURDATE()
      AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `;

  }

  let where = [];
  let params = [section];

  if (manager) {
    where.push(`
        (
            pm.name = ?
            OR qm.name = ?
            OR dm.name = ?
        )
    `);

    params.push(manager, manager, manager);
}

  if (clientCode) {
    where.push('c.client_code = ?');
    params.push(clientCode);
  }

  if (months) {

    const monthList = months.split(',');

    where.push(
      `MONTH(po.po_reference_date)
       IN (${monthList.map(() => '?').join(',')})`
    );

    params.push(...monthList);

  }

  const filterClause =
    where.length
      ? ` AND ${where.join(' AND ')}`
      : '';

  const sql = `
    SELECT

      po.id AS purchase_order_id,
      po.po_reference_name AS project_id,

      COALESCE(ppo.part_number, sp.split_name) AS part_number,
      COALESCE(ppo.quantity, sp.quantity) AS quantity,

      ps.stage_date

    FROM project_stages ps

    LEFT JOIN products_po ppo
      ON ppo.id = ps.product_id

    LEFT JOIN split_parts sp
      ON sp.id = ps.split_part_id

    LEFT JOIN purchase_orders po
      ON po.id = COALESCE(
        ppo.purchase_order_id,
        (
          SELECT purchase_order_id
          FROM products_po
          WHERE id = sp.parent_part_id
        )
      )

    LEFT JOIN users pm
ON pm.id = po.project_manager

LEFT JOIN users qm
ON qm.id = po.quality_manager

LEFT JOIN users dm
ON dm.id = po.project_engineer



    LEFT JOIN clients c
      ON c.id = po.client_id

    WHERE

      ps.section_title = ?
      AND IFNULL(po.pt_show,0)=0

      AND ps.stage_date IS NOT NULL

      AND ${dateCondition}

      AND (
            (ps.product_id IS NOT NULL AND IFNULL(ppo.is_service,0)=0)
         OR (ps.split_part_id IS NOT NULL AND IFNULL(sp.is_service,0)=0)
      )

      AND NOT (
        IFNULL(ps.outward,0)
        >=
        IFNULL(ps.inward,0)

        AND
        IFNULL(ps.inward,0) > 0
      )

      ${filterClause}

    ORDER BY ps.stage_date ASC
  `;

  db.query(sql, params, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(result);

  });

});

app.get('/api/duplicate-stages/:partNumber', (req, res) => {
const sql = `
    SELECT
        ps.stage_name,
        ps.section_title
    FROM products_po ppo
    INNER JOIN project_stages ps
        ON ps.product_id = ppo.id
    WHERE
        ppo.part_number = ?
        AND ps.section_title IN ('Manufacturing','Inspection')
    ORDER BY ps.id
`;

  db.query(sql, [req.params.partNumber], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(result);

  });

});


app.post('/api/parts/mark-service', (req, res) => {

    const { parts } = req.body;

    if (!parts || !parts.length) {
        return res.status(400).json({
            success: false,
            message: "No parts selected"
        });
    }

    const normalIds = [];
    const splitIds = [];

    parts.forEach(p => {

        if (Number(p.is_split) === 1) {

            // remove split_ prefix
            splitIds.push(String(p.id).replace("split_", ""));

        } else {

            normalIds.push(p.id);

        }

    });

    const queries = [];

    if (normalIds.length) {
        queries.push(new Promise((resolve, reject) => {

            db.query(
                `UPDATE products_po
                 SET is_service = 1
                 WHERE id IN (${normalIds.map(() => '?').join(',')})`,
                normalIds,
                err => err ? reject(err) : resolve()
            );

        }));
    }

    if (splitIds.length) {
        queries.push(new Promise((resolve, reject) => {

            db.query(
                `UPDATE split_parts
                 SET is_service = 1
                 WHERE id IN (${splitIds.map(() => '?').join(',')})`,
                splitIds,
                err => err ? reject(err) : resolve()
            );

        }));
    }

    Promise.all(queries)
        .then(() => {

            res.json({
                success: true,
                message: "Updated Successfully"
            });

        })
        .catch(err => {

            console.error(err);

            res.status(500).json(err);

        });

});

// START
app.listen(5000, () => {
  console.log('Server running at http://localhost:5000');
});

   