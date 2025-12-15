// ==================== FIREBASE CONFIG ====================
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

console.log("✅ Firebase initialized");

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

// register modal elements
const registerModal = document.getElementById("register-modal");
const registerClose = document.getElementById("register-close");
const registerCancel = document.getElementById("register-cancel");
const registerSubmit = document.getElementById("register-submit");
const registerError = document.getElementById("register-error");
const regFirstName = document.getElementById("reg-first-name");
const regLastName = document.getElementById("reg-last-name");
const regUsername = document.getElementById("reg-username");
const regEmail = document.getElementById("reg-email");
const regPassword = document.getElementById("reg-password");

let currentUser = null;
let currentFeature = null;
let favoritesOnly = false;

function showMessage(text) {
  if (messageModal && messageText) {
    messageText.textContent = text;
    messageModal.style.display = "flex";
    messageModal.classList.add("show");
  } else {
    alert(text);
  }
}

function closeMessage() {
  if (messageModal) {
    messageModal.classList.remove("show");
    messageModal.style.display = "none";
  }
}

function customConfirm(message) {
  return new Promise((resolve) => {
    if (!confirmModal || !confirmText) {
      resolve(confirm(message));
      return;
    }
    
    confirmText.textContent = message;
    confirmModal.style.display = "flex";
    confirmModal.classList.add("show");

    const handleOk = () => { cleanup(); resolve(true); };
    const handleCancel = () => { cleanup(); resolve(false); };
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
    if (!promptModal || !promptText || !promptInput) {
      resolve(prompt(message, defaultValue));
      return;
    }
    
    promptText.textContent = message;
    promptInput.value = defaultValue;
    promptModal.style.display = "flex";
    promptModal.classList.add("show");
    setTimeout(() => { promptInput.focus(); promptInput.select(); }, 100);

    const handleOk = () => { cleanup(); resolve(promptInput.value); };
    const handleCancel = () => { cleanup(); resolve(null); };
    const handleKeyPress = (e) => {
      if (e.key === "Enter") handleOk();
      else if (e.key === "Escape") handleCancel();
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

// Modal event listeners
if (messageOk) messageOk.addEventListener("click", closeMessage);
if (messageClose) messageClose.addEventListener("click", closeMessage);
if (messageModal) {
  messageModal.addEventListener("click", (e) => {
    if (e.target === messageModal) closeMessage();
  });
}

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


function openRegisterModal() {
  if (!registerModal) return;
  registerError.textContent = "";
  regFirstName.value = "";
  regLastName.value = "";
  regUsername.value = "";
  regEmail.value = loginEmail.value || "";
  regPassword.value = "";
  registerModal.style.display = "flex";
  registerModal.classList.add("show");
}

function closeRegisterModal() {
  if (!registerModal) return;
  registerModal.classList.remove("show");
  registerModal.style.display = "none";
}

btnRegister.addEventListener("click", () => {
  authError.textContent = "";
  openRegisterModal();
});

if (registerClose) registerClose.addEventListener("click", closeRegisterModal);
if (registerCancel) registerCancel.addEventListener("click", closeRegisterModal);
if (registerModal) {
  registerModal.addEventListener("click", (e) => {
    if (e.target === registerModal) closeRegisterModal();
  });
}

// salvare cont nou
if (registerSubmit) {
  registerSubmit.addEventListener("click", async () => {
    registerError.textContent = "";

    const firstName = regFirstName.value.trim();
    const lastName = regLastName.value.trim();
    const username = regUsername.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;

    if (!firstName || !lastName || !username || !email || !password) {
      registerError.textContent = "Completează toate câmpurile.";
      return;
    }

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection("users").doc(cred.user.uid).set({
        email,
        firstName,
        lastName,
        username,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      closeRegisterModal();
      showMessage("Cont creat cu succes! Ești autentificat.");
    } catch (e) {
      registerError.textContent = e.message;
    }
  });
}

// logout simplu
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
  console.log("✅ ArcGIS modules loaded");

  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurOgtxgzxlHb8F0u9i5DHCMPWp9Tc672JmnDD804qss5hYqsN9MtEKpPLwsqGgjFz5Q9MaKhhx8XJLLsUk160F-srk7w47Z1-BvDVhp1_joNyxhxtqtdzQWjpmu7h1VvR3goLK-9S4Ny613QXgZVEqYaIVA8jfsrzhprr3FCWJUoXFOnUzz06hw4QKqWfqBmxBfcRRfp3xYNnls0vE6mTf2E.AT1_nJHZklhn";

  const FEATURE_LAYER_URL = "https://services7.arcgis.com/rzHdRKKfmFVc4zkp/arcgis/rest/services/Feature_Layer/FeatureServer/0";

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

  const highlightLayer = new GraphicsLayer();
  const routeLayer = new GraphicsLayer();

  map.addMany([playgroundLayer, highlightLayer, routeLayer]);

  playgroundLayer.popupTemplate = {
    title: "{Nume}",
    content: `
      <b>Descriere:</b> {Descriere}<br>
      <b>Facilități:</b> {Facilitati}<br>
      <b>Rating:</b> {Ratings}
    `
  };

  view.on("click", async (event) => {
    const response = await view.hitTest(event);
    const graphic = response.results.find(r => r.graphic.layer === playgroundLayer)?.graphic;

    if (graphic) {
      currentFeature = graphic;
      if (selectedPlaygroundLabel) {
        selectedPlaygroundLabel.textContent = graphic.attributes.Nume || graphic.attributes.name || "Loc selectat";
      }
    } else {
      const add = await customConfirm("Adaugi un loc de joaca aici?");
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

  if (btnApplyFilter) {
    btnApplyFilter.addEventListener("click", () => {
      const text = filterFacilitiesInput ? filterFacilitiesInput.value.trim() : "";
      if (!text) return;
      playgroundLayer.definitionExpression = `facilities LIKE '%${text}%'`;
    });
  }

  if (btnClearFilter) {
    btnClearFilter.addEventListener("click", () => {
      playgroundLayer.definitionExpression = "1=1";
      if (filterFacilitiesInput) filterFacilitiesInput.value = "";
    });
  }

  if (btnRadiusSearch) {
    btnRadiusSearch.addEventListener("click", async () => {
      if (!currentUser) {
        showMessage("Trebuie să fii logat.");
        return;
      }

      if (!navigator.geolocation) {
        showMessage("Browserul nu suportă geolocalizare.");
        return;
      }

      const radiusMeters = Number(radiusValueInput?.value) || 500;

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
              outline: { color: [255, 255, 255], width: 1 }
            }
          });
          highlightLayer.add(g);
        });

        view.goTo(bufferGeom);
      }, (err) => {
        showMessage("Nu am putut obține locația.");
        console.error(err);
      });
    });
  }

  if (btnSaveRating) {
    btnSaveRating.addEventListener("click", async () => {
      if (!currentUser) {
        showMessage("Trebuie să fii logat.");
        return;
      }
      if (!currentFeature) {
        showMessage("Selectează mai întâi un loc (click pe hartă).");
        return;
      }

      const rating = Number(ratingValueInput?.value);
      if (rating < 1 || rating > 5) {
        showMessage("Rating între 1 și 5.");
        return;
      }

      const objectId = currentFeature.attributes.OBJECTID;

      await db.collection("reviews").add({
        playgroundId: objectId,
        userId: currentUser.uid,
        rating,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showMessage("Rating salvat!");
    });
  }

  if (btnAddFavorite) {
    btnAddFavorite.addEventListener("click", async () => {
      if (!currentUser) {
        showMessage("Trebuie să fii logat.");
        return;
      }
      if (!currentFeature) {
        showMessage("Selectează un loc.");
        return;
      }

      const objectId = currentFeature.attributes.OBJECTID;

      await db.collection("favorites").doc(`${currentUser.uid}_${objectId}`).set({
        playgroundId: objectId,
        userId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showMessage("Adăugat la favorite.");
    });
  }

  if (btnShowFavorites) {
    btnShowFavorites.addEventListener("click", async () => {
      if (!currentUser) {
        showMessage("Trebuie să fii logat.");
        return;
      }

      favoritesOnly = !favoritesOnly;
      btnShowFavorites.textContent = favoritesOnly ? "Arată toate locurile" : "Arată doar favoritele mele";

      if (!favoritesOnly) {
        playgroundLayer.definitionExpression = "1=1";
        return;
      }

      const snap = await db.collection("favorites")
        .where("userId", "==", currentUser.uid)
        .get();

      if (snap.empty) {
        showMessage("Nu ai favorite.");
        return;
      }

      const ids = snap.docs.map(d => d.data().playgroundId);
      playgroundLayer.definitionExpression = `OBJECTID IN (${ids.join(",")})`;
    });
  }

  const routeUrl = "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

  view.on("popup-trigger-action", function (event) {
    if (event.action.id === "route-to-here") {
      const geom = view.popup.selectedFeature.geometry;
      getRouteTo(geom);
    }
  });

  view.when(() => {
    view.popup.actions = [{
      title: "Rutează până aici",
      id: "route-to-here",
      className: "esri-icon-directions"
    }];
    console.log("Map view ready");
  });

  async function getRouteTo(destinationGeom) {
    if (!navigator.geolocation) {
      showMessage("Browserul nu suportă geolocalizare.");
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

      const routeParams = new RouteParameters({
        stops: new FeatureSet({
          features: [start, new Graphic({ geometry: destinationGeom })]
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
        showMessage("Nu s-a putut calcula ruta.");
      }
    }, (err) => {
      console.error(err);
      showMessage("Nu am putut obține locația.");
    });
  }
});

console.log("✅ Script loaded completely");