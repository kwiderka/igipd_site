const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 4200;
app.listen(PORT, console.log(`Server started on port ${PORT}`));

const { MongoClient, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://kwidera:zaq12wsx@cluster0.pkyobnf.mongodb.net/test";
const dbName = "test";
const collectionName = "tescik";
let data;
let db;

app.use(bodyParser.urlencoded({ extended: true }));

async function connectToDatabase() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    db = client.db(dbName);
    await getData(db);
  } catch (error) {
    console.error("Błąd", error);
  }
}

async function getData(db) {
  const collection = db.collection(collectionName);
  const cursor = collection.find();
  const documents = await cursor.toArray();
  data = documents;
}

// ZADANIE 1: Odczytanie wszystkich danych z MongoDB
app.get("/", (req, res) => {
  let htmlCode = `<a href="/dodaj">Dodaj dokument </a>  </br> <a href="/Kategoria">Kategorie </a> <br> <h1>Lista</h1>`;
  htmlCode += "<table>";
  htmlCode +=
    "<tr><th>Index</th><th>Zespol</th><th>Typ</th><th>Cena</th><th></th></tr>";
  data.forEach((cena) => {
    htmlCode += `<tr>`;
    htmlCode += `<td>${cena.Index}</td>`;
    htmlCode += `<td>${cena.Zespol}</td>`;
    htmlCode += `<td>${cena.typ}</td>`;
    htmlCode += `<td>${cena.cena}</td>`;
    htmlCode += `<td><a href='/usun?id=${cena._id}'>Usuń</a></td>`;
    htmlCode += `</tr>`;
  });
  htmlCode += "</table>";
  res.send(`${htmlCode}`);
  res.end();
});

// ZADANIE 2: Wyświetlanie dokumentów z określonej kategorii
app.get("/kategoria", (req, res) => {
  res.send(`
    <form method="GET" action="/kategoria/wyniki">
      <label for="kategoria">Kategoria:</label>
      <select id="kategoria" name="kategoria">
        <option value="CD">CD</option>
        <option value="Vinyl">Vinyl</option>
        <option value="Kaseta">Kaseta</option>
      </select>
      <button type="submit">Pokaż dokumenty</button>
    </form>
  `);
});

app.get("/kategoria/wyniki", async (req, res) => {
  const kategoria = req.query.kategoria;
  const filteredData = data.filter((cena) => cena.typ === kategoria);

  let htmlCode = `
    <a href="/dodaj">Dodaj dokument</a>
    <a href="/kategoria">Kategorie</a>
    <br>
    <h1>Lista</h1>
    <table>
      <tr>
        <th>Index</th>
        <th>Zespol</th>
        <th>Typ</th>
        <th>Cena</th>
        <th></th>
      </tr>`;

  filteredData.forEach((cena) => {
    htmlCode += `<tr>`;
    htmlCode += `<td>${cena.Index}</td>`;
    htmlCode += `<td>${cena.Zespol}</td>`;
    htmlCode += `<td>${cena.typ}</td>`;
    htmlCode += `<td>${cena.cena}</td>`;
    htmlCode += `<td><a href='/usun?id=${cena._id}'>Usuń</a></td>`;
    htmlCode += `</tr>`;
  });

  htmlCode += "</table>";
  res.send(`${htmlCode}`);
});


// ZADANIE 3: Usuwanie dokumentu na podstawie przesłanego parametru
app.get("/usun", (req, res) => {
  removeDocumentById(req.query.id, res);
});

async function removeDocumentById(id, res) {
  try {
    const collection = db.collection(collectionName);
    await collection.deleteOne({ _id: new ObjectId(id) });
    await getData(db);
    res.redirect("/");
  } catch (e) {
    console.log(e);
    res.status(500).send("Błąd serwera");
  }
}

connectToDatabase();
