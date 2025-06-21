// kudos-feedback.js

// Configuration for the Firebase project dedicated to feedback
const feedbackQuickClickConfig = { 
  apiKey: "AIzaSyBmTJhm4NkTonmUZg5KYicwlwmh8ke_N9Y",
  authDomain: "portfolio-feedback-70d70.firebaseapp.com",
  projectId: "portfolio-feedback-70d70",
  storageBucket: "portfolio-feedback-70d70.appspot.com",
  messagingSenderId: "464131761478",
  appId: "1:464131761478:web:cde4614a3ba1a981a57147"
};

let feedbackQuickClickApp;
let feedbackQuickClickDb;
const feedbackQuickClickAppName = "quickClickFeedbackAppUmaSankar";

try {
  if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
    throw new Error("Firebase SDKs (app and firestore) are not loaded. Kudos feature cannot initialize.");
  }
  const existingApp = firebase.apps.find(app => app.name === feedbackQuickClickAppName);
  if (existingApp) {
    feedbackQuickClickApp = existingApp;
  } else {
    feedbackQuickClickApp = firebase.initializeApp(feedbackQuickClickConfig, feedbackQuickClickAppName); 
  }
  feedbackQuickClickDb = feedbackQuickClickApp.firestore();
  console.log(`Kudos Firestore ("${feedbackQuickClickAppName}") initialized.`);
} catch (error) {
  console.error(`Error initializing Kudos Firestore ("${feedbackQuickClickAppName}"): `, error);
}

document.addEventListener('DOMContentLoaded', function () {
  console.log("Kudos Script: DOMContentLoaded event fired.");

  // TARGET THESE IDs CAREFULLY - THEY MUST MATCH YOUR HTML
  const buttonsContainer = document.getElementById('quickClickFeedbackButtonsContainer');
  const messageElement = document.getElementById('quickClickFeedbackMessageDisplay');
  const recentKudosContainer = document.getElementById('actualRecentKudosListContainer'); // For the list of items
  const loadingMsgElement = document.getElementById('loadingRecentKudosMsg'); // The "Loading..." p tag
  
  const QUICK_CLICK_COOLDOWN_MS = 120000; 
  const QUICK_CLICK_OPTIONS = [ "Excellent Work Uma!", "Superb Portfolio!", "Inspiring!", "Good!" ];
  const QUICK_CLICK_STORAGE_KEY = 'lastQuickKudosClickTime_v8_Uma'; // Incremented key for fresh test

  // Check if all essential HTML elements are found
  if (!buttonsContainer || !messageElement || !recentKudosContainer || !loadingMsgElement) {
    console.error("Quick Kudos ERROR: Not all required HTML elements were found. Check IDs:\n",
      `quickClickFeedbackButtonsContainer: ${!!buttonsContainer}`,
      `quickClickFeedbackMessageDisplay: ${!!messageElement}`,
      `actualRecentKudosListContainer: ${!!recentKudosContainer}`,
      `loadingRecentKudosMsg: ${!!loadingMsgElement}`
    );
    // Optionally hide the entire section if elements are missing
    const kudosSection = document.getElementById('quickKudosSection');
    if (kudosSection) kudosSection.style.display = 'none'; 
    return; // Stop execution of this feature if elements are missing
  } else {
    console.log("All Quick Kudos HTML elements found successfully.");
  }

  if (typeof feedbackQuickClickDb !== 'undefined' && feedbackQuickClickDb) {
      console.log("feedbackQuickClickDb is available. Setting up Quick Kudos UI.");
      const feedbackCollection = feedbackQuickClickDb.collection('portfolio-feedback');

      // 1. Populate Quick Feedback Buttons
      buttonsContainer.innerHTML = ''; 
      QUICK_CLICK_OPTIONS.forEach(text => {
          const button = document.createElement('button');
          button.className = 'btn btn-quick-click-kudos';
          button.type = 'button';
          button.textContent = text;
          button.dataset.feedbackText = text;
          
          button.addEventListener('click', async function() { /* ... (rest of click listener logic from previous correct answer) ... */
              const feedbackTextValue = this.dataset.feedbackText;
              const lastClickTime = parseInt(localStorage.getItem(QUICK_CLICK_STORAGE_KEY) || '0');

              if (Date.now() - lastClickTime < QUICK_CLICK_COOLDOWN_MS) {
                  if(messageElement) {
                      messageElement.textContent = 'Thanks! Please wait to send another.';
                      messageElement.className = 'quick-feedback-message text-center text-warning';
                  }
                  document.querySelectorAll('#quickClickFeedbackButtonsContainer .btn-quick-click-kudos').forEach(btn => btn.disabled = true);
                  setTimeout(() => {
                        document.querySelectorAll('#quickClickFeedbackButtonsContainer .btn-quick-click-kudos').forEach(btn => btn.disabled = false);
                        if(messageElement && messageElement.textContent.includes('Thanks! Please wait')) messageElement.textContent = '';
                  }, QUICK_CLICK_COOLDOWN_MS - (Date.now() - lastClickTime) + 300);
                  return;
              }
              
              this.disabled = true;
              const originalButtonText = this.textContent;
              this.innerHTML = `<span class="spinner-border spinner-border-sm" style="width:0.7em; height:0.7em;" role="status" aria-hidden="true"></span>`;

              try {
                  await feedbackCollection.add({
                      text: feedbackTextValue,
                      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                      isApproved: true 
                  });
                  if(messageElement) {
                      messageElement.textContent = `"${feedbackTextValue}" Sent. Thank you!`;
                      messageElement.className = 'quick-feedback-message text-center text-success';
                  }
                  localStorage.setItem(QUICK_CLICK_STORAGE_KEY, Date.now().toString());
                  
                  setTimeout(() => { 
                      this.innerHTML = originalButtonText;
                      const timeSinceLastGlobalSubmit = Date.now() - (parseInt(localStorage.getItem(QUICK_CLICK_STORAGE_KEY) || '0'));
                      const remainingCooldownForAll = QUICK_CLICK_COOLDOWN_MS - timeSinceLastGlobalSubmit;
                      const buttonsToReEnable = document.querySelectorAll('#quickClickFeedbackButtonsContainer .btn-quick-click-kudos');
                      
                      buttonsToReEnable.forEach(btn => btn.disabled = true);

                      if (remainingCooldownForAll > 0) {
                        setTimeout(() => {
                            buttonsToReEnable.forEach(btn => btn.disabled = false);
                            if(messageElement && messageElement.textContent.includes("Sent. Thank you!")) messageElement.textContent = '';
                        }, remainingCooldownForAll + 300); 
                      } else {
                          buttonsToReEnable.forEach(btn => btn.disabled = false);
                          if(messageElement && messageElement.textContent.includes("Sent. Thank you!")) messageElement.textContent = '';
                      }
                  }, 1200);

              } catch (error) {
                  console.error("Error adding quick click kudos: ", error);
                  if(messageElement) {
                      messageElement.textContent = 'Error sending. Please try again.';
                      messageElement.className = 'quick-feedback-message text-center text-danger';
                  }
                  this.disabled = false; 
                  this.innerHTML = originalButtonText;
              }
          });
          buttonsContainer.appendChild(button);
      });
      
      const lastClickTimeOnLoad = parseInt(localStorage.getItem(QUICK_CLICK_STORAGE_KEY) || '0');
      if (Date.now() - lastClickTimeOnLoad < QUICK_CLICK_COOLDOWN_MS) {
          if(buttonsContainer) buttonsContainer.querySelectorAll('.btn-quick-click-kudos').forEach(btn => btn.disabled = true);
          setTimeout(() => {
              if(buttonsContainer) buttonsContainer.querySelectorAll('.btn-quick-click-kudos').forEach(btn => btn.disabled = false);
          }, QUICK_CLICK_COOLDOWN_MS - (Date.now() - lastClickTimeOnLoad) + 300 );
      }


      // 2. Fetch and Display Recent Approved Kudos (History)
      if (recentKudosContainer) { // Changed from recentKudosListElement to recentKudosContainer
          feedbackCollection.where("isApproved", "==", true)
                                   .orderBy("timestamp", "desc")
                                   .limit(3) 
                                   .onSnapshot(snapshot => {
              if (loadingMsgElement) loadingMsgElement.style.display = 'none';
              recentKudosContainer.innerHTML = ''; // Clear previous
              if (snapshot.empty) {
                  recentKudosContainer.innerHTML = '<p class="text-center text-muted small fst-italic" style="margin-bottom:0;">No feedback yet.</p>';
                  return;
              }
              const fragment = document.createDocumentFragment();
              snapshot.forEach(doc => {
                  const kudos = doc.data();
                  const itemDiv = document.createElement('div');
                  itemDiv.className = 'recent-kudos-item-compact';
                  
                  const textSpan = document.createElement('span');
                  textSpan.className = 'kudos-text-compact'; textSpan.textContent = `"${kudos.text}"`;
                  
                  const timeSpan = document.createElement('span');
                  timeSpan.className = 'kudos-timestamp-compact';
                  if (kudos.timestamp && kudos.timestamp.toDate) {
                      const date = kudos.timestamp.toDate(); const now = new Date();
                      const diffMs = now - date; const diffMins = Math.round(diffMs / 60000);
                      const diffHours = Math.round(diffMins / 60); const diffDays = Math.round(diffHours / 24);
                      if (diffMins < 2) timeSpan.textContent = 'now';
                      else if (diffMins < 60) timeSpan.textContent = `${diffMins}m`;
                      else if (diffHours < 24) timeSpan.textContent = `${diffHours}h`;
                      else if (diffDays < 2) timeSpan.textContent = `1d`;
                      else timeSpan.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  } else { timeSpan.textContent = '-'; }
                  
                  itemDiv.appendChild(textSpan); itemDiv.appendChild(timeSpan);
                  fragment.appendChild(itemDiv);
              });
              recentKudosContainer.appendChild(fragment);
              Array.from(recentKudosContainer.children).forEach((el, index) => {
                  setTimeout(() => { el.classList.add('visible-kudos'); }, index * 100);
              });

          }, error => {
              console.error("Error fetching recent quick kudos: ", error);
              if (loadingMsgElement) loadingMsgElement.style.display = 'none';
              recentKudosContainer.innerHTML = '<p class="text-center text-danger small">Error loading feedback.</p>';
          });
      } else { console.warn("#actualRecentKudosListContainer element not found for history display."); }

  } else {
      console.warn("Firestore 'feedbackQuickClickDb' for Quick Kudos is not available. Feature disabled.");
      if (buttonsContainer) buttonsContainer.innerHTML = '<p class="text-center text-muted small">Feedback system unavailable.</p>';
      if (recentKudosContainer) recentKudosContainer.style.display = 'none';
      if (messageElement) messageElement.style.display = 'none';
  }
  
}); // End of DOMContentLoaded
