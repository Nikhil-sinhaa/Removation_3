// Removation.ai Chrome Extension Content Script

(function() {
  'use strict';
  
  const API_BASE = 'https://removation.ai';
  // const API_BASE = 'http://localhost:3000';
  
  // Track selected/hovered image
  let lastHoveredImage = null;
  let lastSelectedImage = null;
  
  // Listen for image hover
  document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'IMG') {
      lastHoveredImage = e.target.src;
    }
  });
  
  // Listen for image selection
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
      lastSelectedImage = e.target.src;
    }
  });
  
  // Handle messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_SELECTED_IMAGE') {
      sendResponse({ imageUrl: lastSelectedImage || lastHoveredImage });
    }
    
    if (message.type === 'FETCH_IMAGE') {
      fetchImageAsDataUrl(message.url)
        .then(data => sendResponse({ data }))
        .catch(err => sendResponse({ error: err.message }));
      return true; // Keep channel open for async response
    }
  });
  
  // Fetch image and convert to data URL
  async function fetchImageAsDataUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  // Pass auth token from Removation.ai website to extension
  if (window.location.hostname.includes('removation.ai')) {
    // Wait for page load
    window.addEventListener('load', () => {
      // Try to get auth info from page
      const authData = window.__REMOVATION_AUTH__;
      
      if (authData) {
        chrome.runtime.sendMessage({
          type: 'AUTH_TOKEN',
          token: authData.token,
          user: authData.user
        });
      }
      
      // Listen for auth changes
      window.addEventListener('removation-auth-change', (e) => {
        chrome.runtime.sendMessage({
          type: 'AUTH_TOKEN',
          token: e.detail.token,
          user: e.detail.user
        });
      });
    });
  }
  
  // Add floating button for images (optional feature)
  function addFloatingButton(img) {
    // Don't add to small images
    if (img.naturalWidth < 200 || img.naturalHeight < 200) return;
    
    // Check if button already exists
    if (img.dataset.removationBtn) return;
    img.dataset.removationBtn = 'true';
    
    const container = document.createElement('div');
    container.className = 'removation-btn-container';
    container.innerHTML = `
      <button class="removation-float-btn" title="Transform with Removation.ai">
        <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4L4 16V36H36V16L20 4Z" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <path d="M14 22L20 16L26 22M20 16V30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    
    // Position container
    const rect = img.getBoundingClientRect();
    container.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY + 8}px;
      right: ${window.innerWidth - rect.right + 8}px;
      z-index: 999999;
    `;
    
    // Handle click
    container.querySelector('.removation-float-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      chrome.storage.local.set({ selectedImage: img.src }, () => {
        chrome.runtime.sendMessage({ 
          type: 'TRANSFORM_IMAGE',
          imageUrl: img.src
        });
      });
    });
    
    document.body.appendChild(container);
    
    // Remove button when image scrolls out of view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          container.remove();
          img.dataset.removationBtn = '';
          observer.disconnect();
        }
      });
    });
    
    observer.observe(img);
  }
  
  // Add styles for floating button
  const styles = document.createElement('style');
  styles.textContent = `
    .removation-btn-container {
      pointer-events: auto;
    }
    
    .removation-float-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #9333ea);
      border: none;
      cursor: pointer;
      color: white;
      box-shadow: 0 2px 10px rgba(124, 58, 237, 0.4);
      transition: all 0.2s ease;
      opacity: 0.9;
    }
    
    .removation-float-btn:hover {
      transform: scale(1.1);
      opacity: 1;
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.6);
    }
  `;
  document.head.appendChild(styles);
  
  // Optional: Enable floating buttons on hover
  // Uncomment to enable
  /*
  document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'IMG') {
      addFloatingButton(e.target);
    }
  });
  */
  
  console.log('Removation.ai content script loaded');
})();