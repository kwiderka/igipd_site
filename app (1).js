const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 4200;
app.listen(PORT, console.log(`Server started on port ${PORT}`));

const { MongoClient, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://haken:5JdS6zUIlC9WJD3H@cluster0.cxlkfle.mongodb.net/test";
const dbName = "test";
const collectionName = "test";
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
  let htmlCode = `
  <a href="/dodaj">Dodaj dokument</a>
  </br>
  <a href="/Kategoria">Kategorie</a>
  <br>
  <a href="/srednia">Średnia</a>
  <br>
  <a href="/sortuj?sortowanie=rosnaco">Posortowane rosnąco</a>
  <br>
  <a href="/sortuj?sortowanie=malejaco">Posortowane malejaco</a>
  <br>
  <a href="/zmiana-ceny?sortowanie=malejaco">Zmiana ceny</a>
  <br>
  <h1>Lista</h1>`;
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
    <a href="/">Powrót</a>
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
    htmlCode += `<td><a href='/usun?id=${cena._id}'>Usuń</a></td>`;
    htmlCode += `</tr>`;
  });

  htmlCode += "</table>";
  res.send(`${htmlCode}`);
});

// Pozostała część kodu

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

// ZADANIE 4: Dodawanie nowego dokumentu do bazy danych
app.get("/dodaj", (req, res) => {
  res.send(`
    <form method="POST" action="/dodaj">
      <label for="Index">Index:</label>
      <input type="text" id="Index" name="Index" required><br>
      
      <label for="Zespol">Zespol:</label>
      <input type="text" id="Zespol" name="Zespol" required><br>
      
      <label for="typ">Typ:</label>
      <select id="typ" name="typ" required>
        <option value="Vinyl">Vinyl</option>
        <option value="CD">CD</option>
        <option value="Kaseta">Kaseta</option>
      </select><br>
      
      <label for="cena">Cena:</label>
      <input type="number" id="cena" name="cena" required><br>
      
      <button type="submit">Dodaj dokument</button>
    </form>
  `);
});

app.post("/dodaj", async (req, res) => {
  try {
    const { Index, Zespol, typ, cena } = req.body;
    const collection = db.collection(collectionName);

    if (parseInt(cena) <= 0) {
      throw new Error("Cena musi być liczbą większą od zera");
    }

    if (typ !== "Vinyl" && typ !== "CD" && typ !== "Kaseta") {
      throw new Error(
        "Nieprawidłowy typ. Dostępne wartości: Vinyl, CD, Kaseta"
      );
    }

    await collection.insertOne({
      Index: Index,
      Zespol: Zespol,
      typ: typ,
      cena: parseInt(cena),
    });

    await getData(db);
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("Błąd serwera");
  }
});

// ZADANIE 5: Obliczanie i wyświetlanie średniej ceny wszystkich dokumentów
app.get("/srednia", (req, res) => {
  calculateAveragePrice(res);
});

async function calculateAveragePrice(res) {
  try {
    const collection = db.collection(collectionName);
    const cursor = collection.find();
    const documents = await cursor.toArray();

    if (documents.length === 0) {
      throw new Error("Brak dokumentów w bazie danych");
    }

    const prices = documents.map((doc) => doc.cena);
    const sum = prices.reduce((a, b) => a + b);
    const average = sum / prices.length;

    res.send(`Średnia cena wszystkich dokumentów: ${average.toFixed(2)}`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Błąd serwera");
  }
}

// ZADANIE 6: Sortowanie dokumentów według ceny rosnąco lub malejąco
app.get("/sortuj", (req, res) => {
  const sortType = req.query.sortowanie;

  if (sortType === "rosnaco") {
    sortDocumentsByPrice(true, res);
  } else if (sortType === "malejaco") {
    sortDocumentsByPrice(false, res);
  } else {
    res.status(400).send("Nieprawidłowe sortowanie");
  }
});

async function sortDocumentsByPrice(ascending, res) {
  try {
    const collection = db.collection(collectionName);
    const sortOrder = ascending ? 1 : -1;
    const cursor = collection.find().sort({ cena: sortOrder });
    const documents = await cursor.toArray();

    let htmlCode = `
    <a href="/">Powrót</a>
      <br>
      <h1>Posortowane dokumenty według ceny</h1>
      <table>
        <tr>
          <th>Index</th>
          <th>Zespol</th>
          <th>Typ</th>
          <th>Cena</th>
          <th></th>
        </tr>`;

    documents.forEach((cena) => {
      htmlCode += `<tr>`;
      htmlCode += `<td>${cena.Index}</td>`;
      htmlCode += `<td>${cena.Zespol}</td>`;
      htmlCode += `<td>${cena.typ}</td>`;
      htmlCode += `<td>${cena.cena}</td>`;
      htmlCode += `<td><a href='/usun?id=${cena._id}'>Usuń</a></td>`;
      htmlCode += `</tr>`;
    });

    htmlCode += "</table>";
    res.send(htmlCode);
  } catch (error) {
    console.log(error);
    res.status(500).send("Błąd serwera");
  }
}

// ZADANIE 7: Zmiana ceny dla określonej kategorii (procentowo)
app.get("/zmiana-ceny", (req, res) => {
  res.send(`
    <form method="POST" action="/zmiana-ceny">
      <label for="kategoria">Kategoria:</label>
      <select id="kategoria" name="kategoria">
        <option value="CD">CD</option>
        <option value="Vinyl">Vinyl</option>
        <option value="Kaseta">Kaseta</option>
      </select><br>
      <label for="procent">Procent zmiany:</label>
      <input type="number" id="procent" name="procent" required><br>
      <button type="submit">Zmień cenę</button>
    </form>
  `);
});

app.post("/zmiana-ceny", async (req, res) => {
  try {
    const kategoria = req.body.kategoria;
    const procent = parseFloat(req.body.procent);

    if (isNaN(procent)) {
      throw new Error("Nieprawidłowa wartość procentowa zmiany ceny");
    }

    const collection = db.collection(collectionName);
    const documents = await collection.find({ typ: kategoria }).toArray();

    if (documents.length === 0) {
      throw new Error("Brak dokumentów dla wybranej kategorii");
    }

    await Promise.all(
      documents.map(async (doc) => {
        const updatedPrice = doc.cena * (1 + procent / 100);
        await collection.updateOne(
          { _id: doc._id },
          { $set: { cena: updatedPrice } }
        );
      })
    );

    await getData(db);
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("Błąd serwera");
  }
});

connectToDatabase();
