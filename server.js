const express = require("express");
const axios = require("axios");
const atob = require("atob");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Servir les fichiers statiques (comme index.html)
app.use(express.static(path.join(__dirname, "public")));

// Liste des préfixes opérateurs
const operatorPrefixes = ["38", "34", "32", "33"];

// Générer un numéro malgache valide
function generateMalagasyNumber() {
  const operator = operatorPrefixes[Math.floor(Math.random() * operatorPrefixes.length)];
  const randomPart = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 chiffres
  const fullNumber = `${operator}${randomPart}`;
  return { fullNumber, fullNumberWithCode: `+261${fullNumber}` };
}

// Générer une adresse email temporaire
async function generateEmail() {
  const url = "https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1";
  const response = await axios.get(url);
  return response.data[0];
}

// Associer le numéro au mail temporaire
async function createTemporaryNumber() {
  const email = await generateEmail();
  const number = generateMalagasyNumber();
  return { ...number, email };
}

// Décoder l'email et récupérer les messages
async function getMessages(email) {
  const [login, domain] = email.split("@");
  const url = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;
  const response = await axios.get(url);
  return response.data;
}

// Endpoint pour générer un numéro temporaire
app.get("/generate", async (req, res) => {
  try {
    const { fullNumberWithCode, email } = await createTemporaryNumber();
    res.json({ number: fullNumberWithCode, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour récupérer les messages d'un email temporaire
app.get("/messages", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "email parameter is required" });
  }
  try {
    const messages = await getMessages(email);
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
