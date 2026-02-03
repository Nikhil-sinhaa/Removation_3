// Removation.ai Chrome Extension Background Service Worker

const API_BASE = 'https://removation.ai';
// const API_BASE = 'http://localhost:3000'; // For development

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for images
  chrome.contextMenus.create({
    id: 'removation-transform',
    title: 'Transform with Removation.ai',
    contexts: ['image']
  });
  
  chrome.contextMenus.create({
    id: 'removation-vastu',
    title: 'Check Vastu Score',
    contexts: ['image']
  });
  
  chrome.contextMenus.create({
    id: 'removation-cost',
    title: 'Estimate Renovation Cost',
    contexts: ['image']
  });
  
  // Separator
  chrome.contextMenus.create({
    id: 'removation-separator',
    type: 'separator',
    contexts: ['image']
  });
  
  // Quick styles submenu
  chrome.contextMenus.create({
    id: 'removation-styles',
    title: 'Quick Transform',
    contexts: ['image']
  });
  
  const quickStyles = ['Modern', 'Minimalist', 'Scandinavian', 'Industrial', 'Bohemian'];
  quickStyles.forEach(style => {
    chrome.contextMenus.create({
      id: `removation-style-${style.toLowerCase()}`,
      parentId: 'removation-styles',
      title: style,
      contexts: ['image']
    });
  });
  
  console.log('Removation.ai extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const imageUrl = info.srcUrl;
  
  if (info.menuItemId === 'removation-transform') {
    await handleTransform(imageUrl, tab);
  } else if (info.menuItemId === 'removation-vastu') {
    await handleVastu(imageUrl, tab);
  } else if (info.menuItemId === 'removation-cost') {
    await handleCostEstimate(imageUrl, tab);
  } else if (info.menuItemId.startsWith('removation-style-')) {
    const style = info.menuItemId.replace('removation-style-', '');
    await handleQuickTransform(imageUrl, style, tab);
  }
});

// Handle transform request
async function handleTransform(imageUrl, tab) {
  // Store image URL and open popup
  await chrome.storage.local.set({ selectedImage: imageUrl });
  
  // Open popup
  chrome.action.openPopup();
}

// Handle Vastu check
async function handleVastu(imageUrl, tab) {
  // Check if authenticated
  const auth = await chrome.storage.local.get(['authToken']);
  
  if (!auth.authToken) {
    chrome.tabs.create({ url: `${API_BASE}/sign-in?redirect=/dashboard&mode=vastu` });
    return;
  }
  
  // Show loading notification
  chrome.notifications.create('vastu-loading', {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: 'Analyzing Vastu...',
    message: 'Checking Vastu compliance of your room'
  });
  
  try {
    // Fetch and convert image
    const imageData = await fetchImageAsBase64(imageUrl);
    
    // Upload image
    const uploadResponse = await fetch(`${API_BASE}/api/uploadthing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.authToken}`
      },
      body: JSON.stringify({ image: imageData })
    });
    
    if (!uploadResponse.ok) throw new Error('Upload failed');
    
    const { url } = await uploadResponse.json();
    
    // Analyze Vastu
    const vastuResponse = await fetch(`${API_BASE}/api/vastu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.authToken}`
      },
      body: JSON.stringify({ imageUrl: url })
    });
    
    if (!vastuResponse.ok) throw new Error('Vastu analysis failed');
    
    const result = await vastuResponse.json();
    
    // Clear loading notification
    chrome.notifications.clear('vastu-loading');
    
    // Show result notification
    chrome.notifications.create('vastu-result', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: `Vastu Score: ${result.score}/100`,
      message: result.summary || 'Click to view detailed analysis',
      buttons: [
        { title: 'View Details' },
        { title: 'Fix Issues' }
      ]
    });
    
    // Store result for later
    await chrome.storage.local.set({ 
      lastVastuResult: result,
      lastVastuImage: url 
    });
    
  } catch (error) {
    console.error('Vastu check failed:', error);
    chrome.notifications.clear('vastu-loading');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Error',
      message: 'Failed to analyze Vastu. Please try again.'
    });
  }
}

// Handle cost estimate
async function handleCostEstimate(imageUrl, tab) {
  const auth = await chrome.storage.local.get(['authToken']);
  
  if (!auth.authToken) {
    chrome.tabs.create({ url: `${API_BASE}/sign-in?redirect=/dashboard&mode=cost` });
    return;
  }
  
  // Show loading
  chrome.notifications.create('cost-loading', {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: 'Estimating Cost...',
    message: 'Analyzing room for renovation cost estimate'
  });
  
  try {
    const imageData = await fetchImageAsBase64(imageUrl);
    
    const uploadResponse = await fetch(`${API_BASE}/api/uploadthing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.authToken}`
      },
      body: JSON.stringify({ image: imageData })
    });
    
    if (!uploadResponse.ok) throw new Error('Upload failed');
    
    const { url } = await uploadResponse.json();
    
    const costResponse = await fetch(`${API_BASE}/api/cost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.authToken}`
      },
      body: JSON.stringify({ 
        imageUrl: url,
        currency: 'INR',
        city: 'Mumbai'
      })
    });
    
    if (!costResponse.ok) throw new Error('Cost estimation failed');
    
    const result = await costResponse.json();
    
    chrome.notifications.clear('cost-loading');
    
    // Format cost
    const formattedCost = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(result.totalCost);
    
    chrome.notifications.create('cost-result', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: `Estimated Cost: ${formattedCost}`,
      message: `Materials: ₹${result.materials?.toLocaleString()} | Labor: ₹${result.labor?.toLocaleString()}`,
      buttons: [
        { title: 'View Breakdown' }
      ]
    });
    
    await chrome.storage.local.set({ 
      lastCostResult: result,
      lastCostImage: url 
    });
    
  } catch (error) {
    console.error('Cost estimate failed:', error);
    chrome.notifications.clear('cost-loading');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Error',
      message: 'Failed to estimate cost. Please try again.'
    });
  }
}

// Handle quick transform with specific style
async function handleQuickTransform(imageUrl, style, tab) {
  const auth = await chrome.storage.local.get(['authToken']);
  
  if (!auth.authToken) {
    chrome.tabs.create({ url: `${API_BASE}/sign-in` });
    return;
  }
  
  // Show notification
  const notificationId = `transform-${Date.now()}`;
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: 'Transforming Room...',
    message: `Applying ${style} style to your room`
  });
  
  try {
    const imageData = await fetchImageAsBase64(imageUrl);
    
    // Upload
    const uploadResponse = await fetch(`${API_BASE}/api/uploadthing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.authToken}`
      },
      body: JSON.stringify({ image: imageData })
    });
    
    if (!uploadResponse.ok) throw new Error('Upload failed');
    
    const { url } = await uploadResponse.json();
    
    // Generate
    const generateResponse = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.authToken}`
      },
      body: JSON.stringify({
        imageUrl: url,
        style: style.toLowerCase(),
        roomType: 'auto',
        mode: 'redesign'
      })
    });
    
    if (!generateResponse.ok) throw new Error('Generation failed');
    
    const result = await generateResponse.json();
    
    // Poll for completion
    const render = await pollForCompletion(result.id, auth.authToken);
    
    chrome.notifications.clear(notificationId);
    
    // Show completion notification with image
    chrome.notifications.create({
      type: 'image',
      iconUrl: 'icons/icon-128.png',
      title: 'Transformation Complete!',
      message: `Your ${style} room design is ready.`,
      imageUrl: render.outputUrl,
      buttons: [
        { title: 'View in Editor' },
        { title: 'Download' }
      ]
    });
    
    // Store render ID
    await chrome.storage.local.set({ lastRenderId: result.id });
    
  } catch (error) {
    console.error('Quick transform failed:', error);
    chrome.notifications.clear(notificationId);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Error',
      message: 'Transformation failed. Please try again.'
    });
  }
}

// Poll for render completion
async function pollForCompletion(renderId, authToken) {
  let attempts = 0;
  const maxAttempts = 60;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`${API_BASE}/api/renders/${renderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'completed') {
        return data;
      } else if (data.status === 'failed') {
        throw new Error('Generation failed');
      }
    }
    
    attempts++;
    await new Promise(r => setTimeout(r, 2000));
  }
  
  throw new Error('Timeout');
}

// Fetch image and convert to base64
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // If direct fetch fails, try through content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'FETCH_IMAGE', 
        url 
      }, response => {
        if (response?.data) {
          resolve(response.data);
        } else {
          reject(new Error('Failed to fetch image'));
        }
      });
    });
  }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === 'vastu-result') {
    if (buttonIndex === 0) {
      // View Details
      const { lastVastuImage } = await chrome.storage.local.get(['lastVastuImage']);
      chrome.tabs.create({ 
        url: `${API_BASE}/dashboard?mode=vastu&image=${encodeURIComponent(lastVastuImage)}` 
      });
    } else {
      // Fix Issues
      const { lastVastuImage, lastVastuResult } = await chrome.storage.local.get([
        'lastVastuImage', 
        'lastVastuResult'
      ]);
      chrome.tabs.create({ 
        url: `${API_BASE}/editor?image=${encodeURIComponent(lastVastuImage)}&vastu-fix=true` 
      });
    }
  }
  
  if (notificationId === 'cost-result') {
    if (buttonIndex === 0) {
      // View Breakdown
      const { lastCostImage } = await chrome.storage.local.get(['lastCostImage']);
      chrome.tabs.create({ 
        url: `${API_BASE}/dashboard?mode=cost&image=${encodeURIComponent(lastCostImage)}` 
      });
    }
  }
  
  if (notificationId.startsWith('transform-') || notificationId === 'vastu-result') {
    const { lastRenderId } = await chrome.storage.local.get(['lastRenderId']);
    if (lastRenderId) {
      if (buttonIndex === 0) {
        chrome.tabs.create({ url: `${API_BASE}/editor?render=${lastRenderId}` });
      } else {
        // Download - open in new tab for download
        chrome.tabs.create({ url: `${API_BASE}/api/renders/${lastRenderId}/download` });
      }
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_TOKEN') {
    // Store auth token from website
    chrome.storage.local.set({ 
      authToken: message.token,
      user: message.user 
    });
    
    // Notify popup
    chrome.runtime.sendMessage({ 
      type: 'AUTH_UPDATE',
      isAuthenticated: true,
      user: message.user
    });
  }
  
  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['authToken', 'user'], (result) => {
      sendResponse(result);
    });
    return true;
  }
});

// Handle commands (keyboard shortcuts)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-transform') {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Try to get selected image from page
    chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTED_IMAGE' }, async (response) => {
      if (response?.imageUrl) {
        await chrome.storage.local.set({ selectedImage: response.imageUrl });
        chrome.action.openPopup();
      }
    });
  }
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('Extension alive');
  }
});

console.log('Removation.ai background service worker loaded');