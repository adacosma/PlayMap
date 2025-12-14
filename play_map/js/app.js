const firebaseConfig = {
  apiKey: "AIzaSyCwE9lOkqXNqnyrjPYQaacVlj-P0uzKn2c",
  authDomain: "playmap-fe9f8.firebaseapp.com",
  projectId: "playmap-fe9f8",
  storageBucket: "playmap-fe9f8.firebasestorage.app",
  messagingSenderId: "875429366064",
  appId: "1:875429366064:web:b119d2311d61d51d1aa0f5",
  measurementId: "G-Q0VWD8003D"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const authSection = document.getElementById("auth-section");
const authError = document.getElementById("auth-error");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const btnLogin = document.getElementById("btn-login");
const btnRegister = document.getElementById("btn-register");
const btnLogout = document.getElementById("btn-logout");
const userEmailSpan = document.getElementById("user-email");

const filterFacilitiesInput = document.getElementById("filter-facilities");
const btnApplyFilter = document.getElementById("btn-apply-filter");
const btnClearFilter = document.getElementById("btn-clear-filter");

const radiusValueInput = document.getElementById("radius-value");
const btnRadiusSearch = document.getElementById("btn-radius-search");

const selectedPlaygroundLabel = document.getElementById("selected-playground");
const ratingValueInput = document.getElementById("rating-value");
const btnSaveRating = document.getElementById("btn-save-rating");

const btnAddFavorite = document.getElementById("btn-add-favorite");
const btnShowFavorites = document.getElementById("btn-show-favorites");

const messageModal = document.getElementById("message-modal");
const messageText = document.getElementById("message-text");
const messageOk = document.getElementById("message-ok");
const messageClose = document.querySelector(".modal-close");

const confirmModal = document.getElementById("confirm-modal");
const confirmText = document.getElementById("confirm-text");
const confirmOk = document.getElementById("confirm-ok");
const confirmCancel = document.getElementById("confirm-cancel");

const promptModal = document.getElementById("prompt-modal");
const promptText = document.getElementById("prompt-text");
const promptInput = document.getElementById("prompt-input");
const promptOk = document.getElementById("prompt-ok");
const promptCancel = document.getElementById("prompt-cancel");

let currentUser = null;
let currentFeature = null;
let favoritesOnly = false;

// Funcție pentru afișarea modalului de mesaj
function showMessage(text) {
  if (messageModal && messageText) {
    messageText.textContent = text;
    messageModal.style.display = "flex";
    messageModal.classList.add("show");
  } else {
    // Fallback la alert dacă modalul nu există
    alert(text);
  }
}

// Funcție pentru închiderea modalului
function closeMessage() {
  if (messageModal) {
    messageModal.classList.remove("show");
    messageModal.style.display = "none";
  }
}

// Funcții pentru confirm și prompt custom
function customConfirm(message) {
  return new Promise((resolve) => {
    confirmText.textContent = message;
    confirmModal.style.display = "flex";
    confirmModal.classList.add("show");

    const handleOk = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      confirmModal.classList.remove("show");
      confirmModal.style.display = "none";
      confirmOk.removeEventListener("click", handleOk);
      confirmCancel.removeEventListener("click", handleCancel);
    };

    confirmOk.addEventListener("click", handleOk);
    confirmCancel.addEventListener("click", handleCancel);
  });
}

function customPrompt(message, defaultValue = "") {
  return new Promise((resolve) => {
    promptText.textContent = message;
    promptInput.value = defaultValue;
    promptModal.style.display = "flex";
    promptModal.classList.add("show");
    
    setTimeout(() => {
      promptInput.focus();
      promptInput.select();
    }, 100);

    // cand se apasa enter, se rezolva promisa cu valoarea introdusa
    const handleOk = () => {
      const value = promptInput.value;
      cleanup();
      resolve(value);
    };

    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        handleOk();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    };

    const cleanup = () => {
      promptModal.classList.remove("show");
      promptModal.style.display = "none";
      promptOk.removeEventListener("click", handleOk);
      promptCancel.removeEventListener("click", handleCancel);
      promptInput.removeEventListener("keypress", handleKeyPress);
    };

    promptOk.addEventListener("click", handleOk);
    promptCancel.addEventListener("click", handleCancel);
    promptInput.addEventListener("keypress", handleKeyPress);
  });
}

// Event listeners pentru închiderea modalului
messageOk.addEventListener("click", closeMessage);
messageClose.addEventListener("click", closeMessage);
messageModal.addEventListener("click", (e) => {
  if (e.target === messageModal) {
    closeMessage();
  }
});


// partea de autentificare
btnLogin.addEventListener("click", async () => {
  authError.textContent = "";
  try {
    await auth.signInWithEmailAndPassword(
      loginEmail.value,
      loginPassword.value
    );
  } catch (e) {
    authError.textContent = e.message;
  }
});

// partea de inregistrare
btnRegister.addEventListener("click", async () => {
  authError.textContent = "";
  try {
    const cred = await auth.createUserWithEmailAndPassword(
      loginEmail.value,
      loginPassword.value
    );

    // creează profil basic în colecția users
    await db.collection("users").doc(cred.user.uid).set({
      email: cred.user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    authError.textContent = e.message;
  }
});

btnLogout.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged((user) => {
  currentUser = user;

  if (user) {
    authSection.style.display = "none";
    btnLogout.classList.remove("hidden");
    userEmailSpan.textContent = user.email;
  } else {
    authSection.style.display = "flex";
    btnLogout.classList.add("hidden");
    userEmailSpan.textContent = "";
  }
});


require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/widgets/Search",
  "esri/widgets/Legend",
  "esri/geometry/geometryEngine",
  "esri/rest/route",
  "esri/rest/support/RouteParameters",
  "esri/rest/support/FeatureSet"
], function (
  esriConfig,
  Map,
  MapView,
  FeatureLayer,
  GraphicsLayer,
  Graphic,
  Search,
  Legend,
  geometryEngine,
  route,
  RouteParameters,
  FeatureSet
) {

  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurOgtxgzxlHb8F0u9i5DHCMPWp9Tc672JmnDD804qss5hYqsN9MtEKpPLwsqGgjFz5Q9MaKhhx8XJLLsUk160F-srk7w47Z1-BvDVhp1_joNyxhxtqtdzQWjpmu7h1VvR3goLK-9S4Ny613QXgZVEqYaIVA8jfsrzhprr3FCWJUoXFOnUzz06hw4QKqWfqBmxBfcRRfp3xYNnls0vE6mTf2E.AT1_nJHZklhn";

  const FEATURE_LAYER_URL = "https://services7.arcgis.com/rzHdRKKfmFVc4zkp/arcgis/rest/services/Feature_Layer/FeatureServer/0"; // Hosted Feature Layer cu locuri de joacă

  const map = new Map({
    basemap: "arcgis-navigation"
  });

  const view = new MapView({
    container: "viewDiv",
    map,
    center: [26.1, 44.43],
    zoom: 12
  });

  const playgroundLayer = new FeatureLayer({
    url: FEATURE_LAYER_URL,
    outFields: ["*"],
    popupEnabled: true
  });

  // adaugarea locurilor in functie de raza
  const highlightLayer = new GraphicsLayer();
  // adaugarea rutelor in functie de locul selectat
  const routeLayer = new GraphicsLayer();

  map.addMany([playgroundLayer, highlightLayer, routeLayer]);

  // adaugarea locurilor in functie de raza
  playgroundLayer.popupTemplate = {
    title: "{Nume}",
    content: `
      <b>Descriere:</b> {Descriere}<br>
      <b>Facilitati:</b> {Facilitati}<br>
      <b>Rating:</b> {Ratings}
    `
  };

  const searchWidget = new Search({
    view,
    allPlaceholder: "Caută pe hartă..."
  });
  view.ui.add(searchWidget, "top-right");

  // legenda
  const legend = new Legend({
    view
  });
  view.ui.add(legend, "bottom-left");

// selectie de loc si adaugare de loc nou
  view.on("click", async (event) => {
    const hit = await view.hitTest(event);
    const result = hit.results.find(r => r.graphic.layer === playgroundLayer);

    if (result) {
      currentFeature = result.graphic;
      const attrs = currentFeature.attributes;
      selectedPlaygroundLabel.textContent = `Selectat: ${attrs.Nume} (id: ${attrs.OBJECTID})`;
    } else {
      // daca se face click pe harta, nu pe un loc existent, se propune adaugarea unui loc nou
      const add = await customConfirm("Vrei să adaugi un loc de joaca aici?");
      if (!add || !currentUser) return;

      const name = await customPrompt("Numele locului de joaca:");
      if (!name) return;

      const description = await customPrompt("Descriere:", "");
      const facilities = await customPrompt("Facilitati (ex: leagane, tobogane):", "");

      const point = event.mapPoint;

      const newGraphic = new Graphic({
        geometry: point,
        attributes: {
          name,
          description: description || "",
          facilities: facilities || "",
          rating: 0,
          creator: currentUser.uid
        }
      });

      playgroundLayer.applyEdits({
        addFeatures: [newGraphic]
      }).then(async (editRes) => {
        const added = editRes.addFeatureResults[0];
        const objectId = added.objectId;

        // salvam locul in firestore in colectia playgrounds
        await db.collection("playgrounds").doc(String(objectId)).set({
          objectId,
          name,
          description: description || "",
          facilities: facilities || "",
          rating: 0,
          creator: currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage("Loc de joaca adaugat cu succes!");
      }).catch((err) => {
        console.error(err);
        showMessage("Eroare la adaugare");
      });
    }
  });

  // filtrarea locurilor in functie de facilitati
  btnApplyFilter.addEventListener("click", () => {
    const text = filterFacilitiesInput.value.trim();
    if (!text) return;
    playgroundLayer.definitionExpression = `facilities LIKE '%${text}%'`;
  });

  btnClearFilter.addEventListener("click", () => {
    playgroundLayer.definitionExpression = "1=1";
    filterFacilitiesInput.value = "";
  });

  // cautarea locurilor in functie de raza
  btnRadiusSearch.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Trebuie să fii logat.");
      return;
    }

    // luam locatia curenta a utilizatorului (navigator.geolocation)
    if (!navigator.geolocation) {
      alert("Browserul nu suportă geolocalizare.");
      return;
    }

    const radiusMeters = Number(radiusValueInput.value) || 500;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const point = {
        type: "point",
        longitude: pos.coords.longitude,
        latitude: pos.coords.latitude
      };

      const bufferGeom = geometryEngine.buffer(point, radiusMeters, "meters");

      const query = playgroundLayer.createQuery();
      query.geometry = bufferGeom;
      query.spatialRelationship = "intersects";
      query.returnGeometry = true;
      query.outFields = ["*"];

      const result = await playgroundLayer.queryFeatures(query);

      highlightLayer.removeAll();

      result.features.forEach((feat) => {
        const g = new Graphic({
          geometry: feat.geometry,
          symbol: {
            type: "simple-marker",
            style: "circle",
            size: 10,
            color: [255, 0, 0, 0.7],
            outline: {
              color: [255, 255, 255],
              width: 1
            }
          }
        });
        highlightLayer.add(g);
      });

      view.goTo(bufferGeom);
    }, (err) => {
      alert("Nu am putut obține locația.");
      console.error(err);
    });
  });

  // salvarea ratingului pentru un loc
  btnSaveRating.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Trebuie să fii logat.");
      return;
    }
    if (!currentFeature) {
      alert("Selectează mai întâi un loc (click pe hartă).");
      return;
    }

    const rating = Number(ratingValueInput.value);
    if (rating < 1 || rating > 5) {
      alert("Rating între 1 și 5.");
      return;
    }

    const objectId = currentFeature.attributes.OBJECTID;

    await db.collection("reviews").add({
      playgroundId: objectId,
      userId: currentUser.uid,
      rating,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Rating salvat! (poti face ulterior un script care calculeaza media si o scrie in campul rating din FeatureLayer / Firestore)");
  });

  // adaugarea locului in favorite
  btnAddFavorite.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Trebuie să fii logat.");
      return;
    }
    if (!currentFeature) {
      alert("Selectează un loc.");
      return;
    }

    const objectId = currentFeature.attributes.OBJECTID;

    await db.collection("favorites").doc(`${currentUser.uid}_${objectId}`).set({
      playgroundId: objectId,
      userId: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Adăugat la favorite.");
  });

  btnShowFavorites.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Trebuie să fii logat.");
      return;
    }

    favoritesOnly = !favoritesOnly;
    btnShowFavorites.textContent = favoritesOnly
      ? "Arată toate locurile"
      : "Arată doar favoritele mele";

    if (!favoritesOnly) {
      playgroundLayer.definitionExpression = "1=1";
      return;
    }

        // luam favoritele din firestore
    const snap = await db.collection("favorites")
      .where("userId", "==", currentUser.uid)
      .get();

    if (snap.empty) {
      alert("Nu ai favorite.");
      return;
    }

    const ids = snap.docs.map(d => d.data().playgroundId);
    const list = ids.join(",");
    playgroundLayer.definitionExpression = `OBJECTID IN (${list})`;
  });

  // calcularea rutelor intre locuri
  const routeUrl =
    "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

  // de fiecare data cand deschidem un popup, oferim optiunea de ruta
  view.on("popup-trigger-action", function (event) {
  if (event.action.id === "route-to-here") {
    const geom = view.popup.selectedFeature.geometry;
    getRouteTo(geom);
  }
});

  view.when(() => {
    // adaugam un buton in popup
    view.popup.actions = [{
      title: "Rutează până aici",
      id: "route-to-here",
      className: "esri-icon-directions"
    }];
  });

  async function getRouteTo(destinationGeom) {
    if (!navigator.geolocation) {
      alert("Browserul nu suportă geolocalizare.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const start = new Graphic({
        geometry: {
          type: "point",
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude
        }
      });

      const stop1 = start;
      const stop2 = new Graphic({
        geometry: destinationGeom
      });

      const routeParams = new RouteParameters({
        stops: new FeatureSet({
          features: [stop1, stop2]
        }),
        returnDirections: true
      });

      try {
        const res = await route.solve(routeUrl, routeParams);
        routeLayer.removeAll();

        const routeResult = res.routeResults[0].route;
        routeResult.symbol = {
          type: "simple-line",
          width: 4,
          color: [0, 0, 255, 0.7]
        };

        routeLayer.add(routeResult);
        view.goTo(routeResult.geometry.extent);
      } catch (e) {
        console.error(e);
        alert("Nu s-a putut calcula ruta (verifică API key / credențiale).");
      }
    }, (err) => {
      console.error(err);
      alert("Nu am putut obține locația utilizatorului.");
    });
  }
});