const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Activer CORS
app.use(cors({
  origin: 'https://348b238c-180f-4111-994a-5cd53d6e50db.filesusr.com',
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer : fichiers max 10 Mo, bloquer les extensions dangereuses
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const forbidden = /\.(exe|bat|sh|cmd|js)$/i;
    if (forbidden.test(file.originalname)) {
      return cb(new Error("Type de fichier non autorisé."), false);
    }
    cb(null, true);
  }
});

// SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Formate les données dans un tableau HTML clair
function generateHtml(data) {
  const labels = {
    email: "Adresse e-mail",
    fournisseur: "Fournisseur de Réappro",
    ean: "EAN",
    cai: "CAI",
    adherence: "Adhérence sol mouillé",
    conso: "Consommation carburant",
    sonore: "Niveau sonore",
    classe: "Classe de performance",
    designation: "Désignation Pneu",
    prixBF: "Prix BF",
    prixAchat: "Prix d'achat"
  };

  const rows = Object.entries(labels).map(([key, label]) => `
    <tr>
      <td style="padding:8px; border:1px solid #ccc; font-weight:bold; background:#f8f8f8;">${label}</td>
      <td style="padding:8px; border:1px solid #ccc;">${data[key] || '<em>(non renseigné)</em>'}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif; max-width:700px; margin:auto;">
      <h2 style="color:#007bff; text-align:center;">📩 Formulaire Pneus</h2>
      <table style="width:100%; border-collapse:collapse; margin-top:20px;">
        ${rows}
      </table>
      <p style="margin-top:20px;">📎 Fichiers joints inclus si ajoutés dans le formulaire.</p>
    </div>
  `;
}

// Route principale POST
app.post("/submit-form", upload.array("fichiers[]"), async (req, res) => {
  const formData = req.body;
  const attachments = req.files.map(file => ({
    filename: file.originalname,
    path: file.path
  }));

  const mailOptions = {
    from: `"Formulaire création" <${process.env.EMAIL_USER}>`,
    to: process.env.DEST_EMAIL,
    subject: "🧾Nouveau formulaire Pneumatique",
    html: generateHtml(formData),
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    req.files.forEach(file => fs.unlink(file.path, () => {})); // nettoyage
    res.status(200).send("Formulaire envoyé !");
  } catch (err) {
    console.error("Erreur :", err);
    res.status(500).send("Erreur serveur");
  }
});

app.get("/", (req, res) => {
  res.send("✅ Serveur en ligne pour formulaire pneus !");
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
