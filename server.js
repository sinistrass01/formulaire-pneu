const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://348b238c-180f-4111-994a-5cd53d6e50db.filesusr.com'
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer config
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
  fileFilter: (req, file, cb) => {
    const forbidden = /\.(exe|bat|sh|cmd|js)$/i;
    if (forbidden.test(file.originalname)) {
      return cb(new Error("Type de fichier non autorisé."), false);
    }
    cb(null, true);
  }
});

// Nodemailer config
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Génération du HTML de l'e-mail
function generateHtml(data) {
  return `
    <div style="font-family:Arial; padding:20px;">
      <h2 style="color:#007bff;">📝 Nouveau formulaire reçu</h2>
      <table style="border-collapse:collapse; width:100%;">
        ${Object.entries(data).map(([key, value]) => `
          <tr>
            <td style="padding:8px; font-weight:bold;">${key.replace(/([A-Z])/g, ' $1')}:</td>
            <td style="padding:8px;">${value}</td>
          </tr>`).join('')}
      </table>
      <p style="margin-top:20px;">📎 Des fichiers sont joints à ce message si fournis.</p>
    </div>
  `;
}

// Route POST
app.post("/submit-form", upload.array("fichiers[]"), async (req, res) => {
  const formData = req.body;
  const attachments = req.files.map(file => ({
    filename: file.originalname,
    path: file.path
  }));

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: "📩 Nouveau formulaire pneus",
    html: generateHtml(formData),
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    req.files.forEach(file => fs.unlink(file.path, () => {})); // supprimer fichiers temporaires
    res.status(200).send("Email envoyé !");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'envoi de l'e-mail.");
  }
});

app.get("/", (req, res) => {
  res.send("Serveur en ligne !");
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
