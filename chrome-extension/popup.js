// Removation.ai Chrome Extension Popup (Senior-Stable Version)

// ========================== CONSTANTS ===============================

const API_BASE = "https://removation.ai";
// const API_BASE = "http://localhost:3000";

// ========================== STATE ===============================

let state = {
  isAuthenticated: false,
  user: null,
  authToken: null,
  selectedImage: null,
  selectedStyle: null,
  recentRenders: [],
  styles: []
};

// ========================== DOM UTIL ===============================

function $(id) {
  return document.getElementById(id) || null;
}

// Centralized DOM map (safe even if any element is missing)
const elements = {
  userSection: $("userSection"),
  authSection: $("authSection"),
  mainContent: $("mainContent"),
  signInBtn: $("signInBtn"),
  creditsCount: $("creditsCount"),
  rendersCount: $("rendersCount"),
  projectsCount: $("projectsCount"),
  recentGrid: $("recentGrid"),
  dropZone: $("dropZone"),
  fileInput: $("fileInput"),
  styleModal: $("styleModal"),
  styleGrid: $("styleGrid"),
  styleSearch: $("styleSearch"),
  processingModal: $("processingModal"),
  processingStatus: $("processingStatus"),
  progressFill: $("progressFill"),
  transformBtn: $("transformBtn"),
  vastuBtn: $("vastuBtn"),
  costBtn: $("costBtn"),
  projectsBtn: $("projectsBtn"),
  applyStyle: $("applyStyle"),
  closeStyleModal: $("closeStyleModal"),
  cancelStyle: $("cancelStyle"),
  dashboardLink: $("dashboardLink"),
  settingsLink: $("settingsLink"),
  helpLink: $("helpLink"),
  viewAllBtn: $("viewAllBtn")
};

// ========================== INITIALIZE ===============================

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    loadStyles();
    await checkAuth();
    setupEventListeners();

    chrome.storage.local.get(["selectedImage"], (res) => {
      if (res.selectedImage) {
        state.selectedImage = res.selectedImage;
        showStyleModal();
        chrome.storage.local.remove(["selectedImage"]);
      }
    });
  } catch (err) {
    console.error("Initialization failed:", err);
  }
}

// ========================== AUTH ===============================

async function checkAuth() {
  try {
    const result = await chrome.storage.local.get(["authToken", "user"]);

    if (result.authToken && result.user) {
      state.isAuthenticated = true;
      state.user = result.user;
      state.authToken = result.authToken;

      showAuthenticatedUI();
      await loadUserData();
      return;
    }

    // Fallback: get session from Removation.ai site
    const response = await fetch(`${API_BASE}/api/user/session`, {
      credentials: "include"
    });

    if (response.ok) {
      const data = await response.json();
      state.isAuthenticated = true;
      state.user = data.user;
      state.authToken = data.token;

      await chrome.storage.local.set({
        authToken: data.token,
        user: data.user
      });

      showAuthenticatedUI();
      await loadUserData();
    } else {
      showUnauthenticatedUI();
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    showUnauthenticatedUI();
  }
}

function showAuthenticatedUI() {
  if (!elements.authSection || !elements.mainContent) return;

  elements.authSection.style.display = "none";
  elements.mainContent.style.display = "block";

  const user = state.user;
  const initial = user?.name?.charAt(0) || user?.email?.charAt(0) || "U";

  if (elements.userSection) {
    elements.userSection.innerHTML = `
      <div class="user-avatar">
        ${
          user?.imageUrl
            ? `<img src="${user.imageUrl}" alt="${user.name}">`
            : initial.toUpperCase()
        }
      </div>`;
  }
}

function showUnauthenticatedUI() {
  if (!elements.authSection || !elements.mainContent) return;

  elements.authSection.style.display = "flex";
  elements.mainContent.style.display = "none";
  if (elements.userSection) elements.userSection.innerHTML = "";
}

// ========================== USER DATA ===============================

async function loadUserData() {
  try {
    const response = await fetch(`${API_BASE}/api/user/stats`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      if (elements.creditsCount) elements.creditsCount.textContent = data.credits || 0;
      if (elements.rendersCount) elements.rendersCount.textContent = data.renders || 0;
      if (elements.projectsCount) elements.projectsCount.textContent = data.projects || 0;
    }

    await loadRecentRenders();
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
}

async function loadRecentRenders() {
  try {
    const response = await fetch(`${API_BASE}/api/renders?limit=6`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) return;

    const data = await response.json();
    state.recentRenders = Array.isArray(data.renders) ? data.renders : [];

    renderRecentRenders();
  } catch (error) {
    console.error("Failed to load recent renders:", error);
  }
}

// ========================== RENDER GRID ===============================

function renderRecentRenders() {
  if (!elements.recentGrid) return;

  if (state.recentRenders.length === 0) {
    elements.recentGrid.innerHTML = `
      <div class="recent-placeholder">
        <svg width="40" height="40" ...></svg>
        <span>No renders yet</span>
      </div>`;
    return;
  }

  elements.recentGrid.innerHTML = state.recentRenders
    .map(
      (r) => `
      <div class="recent-item" data-id="${r.id}">
        <img src="${r.outputUrl}" alt="Render">
      </div>`
    )
    .join("");

  document.querySelectorAll(".recent-item").forEach((item) => {
    item.addEventListener("click", () => {
      openInDashboard(`/editor?render=${item.dataset.id}`);
    });
  });
}

// ========================== STYLES ===============================

function loadStyles() {
  state.styles = [
    { id: "modern", name: "Modern", image: "/images/styles/modern.jpg" },
    { id: "minimalist", name: "Minimalist", image: "/images/styles/minimalist.jpg" },
    { id: "scandinavian", name: "Scandinavian", image: "/images/styles/scandinavian.jpg" },
    { id: "industrial", name: "Industrial", image: "/images/styles/industrial.jpg" },
    { id: "bohemian", name: "Bohemian", image: "/images/styles/bohemian.jpg" },
    { id: "contemporary", name: "Contemporary", image: "/images/styles/contemporary.jpg" },
    { id: "traditional", name: "Traditional", image: "/images/styles/traditional.jpg" },
    { id: "rustic", name: "Rustic", image: "/images/styles/rustic.jpg" },
    { id: "mediterranean", name: "Mediterranean", image: "/images/styles/mediterranean.jpg" },
    { id: "mid-century-modern", name: "Mid-Century", image: "/images/styles/mid-century.jpg" },
    { id: "japanese", name: "Japanese Zen", image: "/images/styles/japanese.jpg" },
    { id: "tropical", name: "Tropical", image: "/images/styles/tropical.jpg" },
    { id: "art-deco", name: "Art Deco", image: "/images/styles/art-deco.jpg" },
    { id: "coastal", name: "Coastal", image: "/images/styles/coastal.jpg" },
    { id: "farmhouse", name: "Farmhouse", image: "/images/styles/farmhouse.jpg" }
  ];
}

function renderStyles(filter = "") {
  if (!elements.styleGrid) return;

  const list = state.styles.filter((s) =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  elements.styleGrid.innerHTML = list
    .map(
      (s) => `
      <div class="style-item ${
        state.selectedStyle === s.id ? "selected" : ""
      }" data-id="${s.id}">
        <img src="${API_BASE}${s.image}">
        <div class="style-name">${s.name}</div>
      </div>`
    )
    .join("");

  document.querySelectorAll(".style-item").forEach((item) => {
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".style-item")
        .forEach((i) => i.classList.remove("selected"));

      item.classList.add("selected");
      state.selectedStyle = item.dataset.id;

      if (elements.applyStyle) elements.applyStyle.disabled = false;
    });
  });
}

// ========================== EVENT LISTENERS ===============================

function setupEventListeners() {
  if (!elements.signInBtn) return;

  elements.signInBtn.onclick = () =>
    chrome.tabs.create({ url: `${API_BASE}/sign-in?ext=true` });

  // Drop zone
  if (elements.dropZone) {
    elements.dropZone.onclick = () => elements.fileInput?.click();
    elements.dropZone.ondragover = (e) => {
      e.preventDefault();
      elements.dropZone.classList.add("dragover");
    };
    elements.dropZone.ondragleave = () =>
      elements.dropZone.classList.remove("dragover");
    elements.dropZone.ondrop = handleDrop;
  }

  if (elements.fileInput) {
    elements.fileInput.onchange = handleFileSelect;
  }

  // Modal buttons
  if (elements.closeStyleModal) elements.closeStyleModal.onclick = hideStyleModal;
  if (elements.cancelStyle) elements.cancelStyle.onclick = hideStyleModal;
  if (elements.applyStyle) elements.applyStyle.onclick = startTransformation;
  if (elements.styleSearch)
    elements.styleSearch.oninput = (e) => renderStyles(e.target.value);

  // Footer actions
  if (elements.dashboardLink)
    elements.dashboardLink.onclick = (e) => {
      e.preventDefault();
      openInDashboard("/dashboard");
    };

  if (elements.settingsLink)
    elements.settingsLink.onclick = (e) => {
      e.preventDefault();
      openInDashboard("/settings");
    };

  if (elements.helpLink)
    elements.helpLink.onclick = (e) => {
      e.preventDefault();
      openInDashboard("/help");
    };

  if (elements.viewAllBtn)
    elements.viewAllBtn.onclick = (e) => {
      e.preventDefault();
      openInDashboard("/history");
    };
}

// ========================== IMAGE HANDLING ===============================

function handleDrop(e) {
  e.preventDefault();
  elements.dropZone?.classList.remove("dragover");

  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith("image/")) {
    handleImage(file);
  }
}

function handleFileSelect(e) {
  const file = e.target?.files?.[0];
  if (file) handleImage(file);
}

function handleImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    state.selectedImage = e.target.result;
    showStyleModal();
  };
  reader.readAsDataURL(file);
}

// ========================== STYLE MODAL ===============================

function showStyleModal() {
  renderStyles();
  if (elements.styleModal) elements.styleModal.style.display = "flex";
  if (elements.applyStyle)
    elements.applyStyle.disabled = !state.selectedStyle;
}

function hideStyleModal() {
  if (elements.styleModal) elements.styleModal.style.display = "none";
  state.selectedImage = null;
  state.selectedStyle = null;
  if (elements.fileInput) elements.fileInput.value = "";
}

// ========================== TRANSFORMATION ===============================

async function startTransformation() {
  if (!state.selectedImage || !state.selectedStyle) return;

  if (elements.styleModal) elements.styleModal.style.display = "none";
  if (elements.processingModal) elements.processingModal.style.display = "flex";

  try {
    updateProgress(12, "Uploading image…");

    const upload = await uploadImage(state.selectedImage);

    updateProgress(32, "Analyzing room…");

    const res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        imageUrl: upload.url,
        style: state.selectedStyle,
        roomType: "auto",
        mode: "redesign"
      })
    });

    if (!res.ok) throw new Error("Generation failed");

    const data = await res.json();

    updateProgress(48, "Generating design…");
    await pollForResult(data.id);
  } catch (err) {
    console.error("Transformation failed:", err);
    showError(err.message);
  } finally {
    if (elements.processingModal)
      elements.processingModal.style.display = "none";

    hideStyleModal();
  }
}

async function uploadImage(dataUrl) {
  const blob = dataURLtoBlob(dataUrl);
  const form = new FormData();
  form.append("file", blob, "room.jpg");

  const res = await fetch(`${API_BASE}/api/uploadthing`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form
  });

  if (!res.ok) throw new Error("Upload failed");

  return res.json();
}

async function pollForResult(renderId) {
  let attempts = 0;
  const max = 60;

  while (attempts < max) {
    const res = await fetch(`${API_BASE}/api/renders/${renderId}`, {
      headers: getAuthHeaders()
    });

    if (res.ok) {
      const data = await res.json();

      if (data.status === "completed") {
        updateProgress(100, "Complete!");

        // Notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon-128.png",
          title: "Render Complete!",
          message: "Your room transformation is ready!"
        });

        setTimeout(() => {
          openInDashboard(`/editor?render=${renderId}`);
        }, 800);

        return;
      }

      if (data.status === "failed") throw new Error("Generation failed");
    }

    attempts++;
    updateProgress(48 + attempts, "Generating design…");
    await wait(2000);
  }

  throw new Error("Timeout");
}

// ========================== HELPERS ===============================

function updateProgress(percent, text) {
  if (elements.progressFill)
    elements.progressFill.style.width = `${percent}%`;
  if (elements.processingStatus)
    elements.processingStatus.textContent = text;
}

function showError(msg) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: "Error",
    message: msg || "Something went wrong."
  });
}

function openInDashboard(path) {
  chrome.tabs.create({ url: `${API_BASE}${path}` });
}

function getAuthHeaders() {
  const h = {};
  if (state.authToken) h["Authorization"] = `Bearer ${state.authToken}`;
  return h;
}

function dataURLtoBlob(dataURL) {
  const [meta, content] = dataURL.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const binary = atob(content);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ================== RUNTIME MESSAGES FROM BACKGROUND ==================

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "AUTH_UPDATE") {
    state.isAuthenticated = msg.isAuthenticated;
    state.user = msg.user;
    state.authToken = msg.token;

    if (msg.isAuthenticated) {
      showAuthenticatedUI();
      loadUserData();
    } else {
      showUnauthenticatedUI();
    }
  }

  if (msg.type === "TRANSFORM_IMAGE") {
    state.selectedImage = msg.imageUrl;
    showStyleModal();
  }
});
