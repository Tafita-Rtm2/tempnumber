const express = require("express");
const axios = require("axios");
const atob = require("atob");
const btoa = require("btoa");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Servir les fichiers statiques (comme index.html)
app.use(express.static(path.join(__dirname, "public")));

// Générer une adresse email temporaire
async function generateEmail() {
  const url = "https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1";
  const response = await axios.get(url);
  return response.data[0];
}

// Chiffrer l'email en un "numéro temporaire"
function encryptEmail(email) {
  const encoded = btoa(email);
  const tempNumber = "+261" + encoded.replace(/[^0-9]/g, "").slice(0, 9);
  return { tempNumber, encoded };
}

// Décoder l'email et récupérer les messages
async function getMessages(encodedEmail) {
  const email = atob(encodedEmail);
  const [login, domain] = email.split("@");
  const url = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;
  const response = await axios.get(url);
  return response.data;
}

// Endpoint pour générer un numéro temporaire
app.get("/generate", async (req, res) => {
  try {
    const email = await generateEmail();
    const { tempNumber, encoded } = encryptEmail(email);
    res.json({ tempNumber, encodedEmail: encoded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour récupérer les messages d'un email temporaire
app.get("/messages", async (req, res) => {
  const { encodedEmail } = req.query;
  if (!encodedEmail) {
    return res.status(400).json({ error: "encodedEmail parameter is required" });
  }
  try {
    const messages = await getMessages(encodedEmail);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rediriger toutes les autres routes vers index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
