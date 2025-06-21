// Your Firebase config - no changes here
const firebaseConfig = {
  apiKey: "AIzaSyAvYOfMz20mLwiOzYUAdyrwacVZADWb6WU",
  authDomain: "portfolio-627b7.firebaseapp.com",
  projectId: "portfolio-627b7",
  storageBucket: "portfolio-627b7.appspot.com",
  messagingSenderId: "502449247663",
  appId: "1:502449247663:web:7b193220b9e7922603cb5a",
  measurementId: "G-E74GZZ1JMM"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let detailModalInstance, confirmDeleteModalInstance; // To store modal instances

function saveEntry(entry) {
  return db.collection("learning-journal").add(entry);
}

function updateEntry(docId, entry) {
  return db.collection("learning-journal").doc(docId).update(entry);
}

function deleteEntryFirebase(docId) {
  return db.collection("learning-journal").doc(docId).delete();
}

function getEntries() {
  return db.collection("learning-journal").orderBy("timestamp", "desc").get();
}

// Handle form submit on index.html (for new entries)
const journalForm = document.getElementById("journalForm");
if (journalForm) {
  journalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title");
    const date = document.getElementById("date");
    const topics = document.getElementById("topics");
    const code = document.getElementById("code");
    const resources = document.getElementById("resources");
    const image = document.getElementById("image");

    const entry = {
      title: title.value.trim(),
      date: date.value,
      topics: topics.value.trim(),
      code: code.value.trim(),
      resources: resources.value.trim(),
      image: image.value.trim(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    saveEntry(entry)
      .then(() => {
        alert("Entry saved!");
        journalForm.reset();
        // If on a page that also displays entries, you might want to reload them
        // if (typeof loadAndRenderEntries === 'function') loadAndRenderEntries();
      })
      .catch((err) => alert("Error saving entry: " + err.message));
  });
}

// Display entries on journal.html
const entriesContainer = document.getElementById("entries");
const searchInput = document.getElementById("searchInput");
const noEntriesMessage = document.getElementById("noEntriesMessage");

if (entriesContainer) {
  // Initialize modal instances once
  document.addEventListener('DOMContentLoaded', () => {
    const detailModalEl = document.getElementById('detailModal');
    if (detailModalEl) detailModalInstance = new bootstrap.Modal(detailModalEl);
    
    const confirmDeleteModalEl = document.getElementById('confirmDeleteModal');
    if (confirmDeleteModalEl) confirmDeleteModalInstance = new bootstrap.Modal(confirmDeleteModalEl);

    // Edit form submission
    const editEntryForm = document.getElementById('editEntryForm');
    if (editEntryForm) {
        editEntryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const docId = this.dataset.docId;
            if (!docId) {
                alert('Error: Document ID not found for editing.');
                return;
            }
            const updatedEntry = {
                title: document.getElementById('modalEditTitle').value.trim(),
                date: document.getElementById('modalEditDate').value,
                topics: document.getElementById('modalEditTopics').value.trim(),
                code: document.getElementById('modalEditCode').value.trim(),
                resources: document.getElementById('modalEditResources').value.trim(),
                image: document.getElementById('modalEditImage').value.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Update timestamp
            };
            
            const saveChangesButton = document.getElementById('saveChangesButton');
            saveChangesButton.disabled = true;
            saveChangesButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

            updateEntry(docId, updatedEntry)
                .then(() => {
                    detailModalInstance.hide();
                    loadAndRenderEntries(); // Refresh the list
                    alert('Entry updated successfully!');
                })
                .catch(err => {
                    console.error("Error updating entry:", err);
                    alert('Error updating entry: ' + err.message);
                })
                .finally(() => {
                    saveChangesButton.disabled = false;
                    saveChangesButton.innerHTML = 'Save Changes';
                });
        });
    }
  });

  function renderEntries(snapshot) {
    entriesContainer.innerHTML = ""; 
    if (snapshot.empty) {
      if (noEntriesMessage) noEntriesMessage.classList.remove('d-none');
      return;
    }
    if (noEntriesMessage) noEntriesMessage.classList.add('d-none');

    snapshot.forEach((doc, index) => {
      const entry = doc.data();
      const docId = doc.id;
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 d-flex";
      col.setAttribute('data-aos', 'fade-up'); // Changed animation for a smoother feel
      col.setAttribute('data-aos-delay', (index % 3) * 100 + 50);
      col.innerHTML = `
        <div class="card journal-entry-card h-100" data-id="${docId}">
          ${entry.image ? `<div class="card-img-container"><img src="${entry.image}" class="card-img-top journal-entry-image" alt="${entry.title}"></div>` : '<div class="card-img-placeholder"></div>'}
          <div class="card-body">
            <div class="entry-meta mb-2">
                <small class="text-muted entry-date"><i class="fas fa-calendar-alt me-1"></i>${entry.date}</small>
            </div>
            <h5 class="card-title">${entry.title}</h5>
            <div class="entry-topics mb-3">
                ${entry.topics ? entry.topics.split(',').map(topic => `<span class="badge topic-badge">${topic.trim()}</span>`).join('') : '<span class="badge topic-badge-empty">No topics</span>'}
            </div>
            <p class="card-text entry-summary">${entry.code ? entry.code.substring(0, 70) + (entry.code.length > 70 ? '...' : '') : 'No code snippet preview.'}</p>
          </div>
          <div class="card-footer-actions">
              <button class="btn btn-sm btn-view-details" title="View Details"><i class="fas fa-eye"></i> View</button>
              <button class="btn btn-sm btn-edit-entry" title="Edit Entry"><i class="fas fa-edit"></i> Edit</button>
              <button class="btn btn-sm btn-delete-entry" title="Delete Entry"><i class="fas fa-trash-alt"></i> Delete</button>
          </div>
        </div>
      `;

      // Event Listeners for card actions
      col.querySelector(".btn-view-details").addEventListener("click", () => openViewModal(entry));
      col.querySelector(".btn-edit-entry").addEventListener("click", () => openEditModal(docId, entry));
      col.querySelector(".btn-delete-entry").addEventListener("click", () => confirmDelete(docId, entry.title));
      
      entriesContainer.appendChild(col);
    });
    if (typeof AOS !== 'undefined') AOS.refreshHard(); // Refresh AOS for new elements
  }
  
  function openViewModal(entry) {
    // Set modal for VIEW mode
    document.getElementById('detailModalLabel').textContent = 'View Entry Details';
    
    // Show view elements, hide edit inputs
    document.getElementById('modalViewContent').classList.remove('d-none');
    document.getElementById('modalEditContent').classList.add('d-none');
    document.getElementById('saveChangesButton').classList.add('d-none');
    document.getElementById('closeViewButton').classList.remove('d-none');


    document.getElementById("modalTitleView").innerText = entry.title;
    document.getElementById("modalDateView").innerText = entry.date;
    document.getElementById("modalTopicsView").innerText = entry.topics || "Not specified";
    document.getElementById("modalCodeView").textContent = entry.code || "No code snippet provided.";
    
    const modalResourcesLinkView = document.getElementById("modalResourcesLinkView");
    const modalResourcesTextView = document.getElementById("modalResourcesTextView");
    if (entry.resources) {
      modalResourcesLinkView.href = entry.resources;
      modalResourcesLinkView.classList.remove("d-none");
      modalResourcesTextView.classList.add("d-none");
    } else {
      modalResourcesLinkView.classList.add("d-none");
      modalResourcesTextView.classList.remove("d-none");
    }

    const modalImageView = document.getElementById("modalImageView");
    if (entry.image) {
      modalImageView.src = entry.image;
      modalImageView.alt = entry.title;
      modalImageView.classList.remove("d-none");
    } else {
      modalImageView.classList.add("d-none");
    }
    if (detailModalInstance) detailModalInstance.show();
  }

  function openEditModal(docId, entry) {
    // Set modal for EDIT mode
    document.getElementById('detailModalLabel').textContent = 'Edit Journal Entry';
    document.getElementById('editEntryForm').dataset.docId = docId;

    // Show edit inputs, hide view elements
    document.getElementById('modalViewContent').classList.add('d-none');
    document.getElementById('modalEditContent').classList.remove('d-none');
    document.getElementById('saveChangesButton').classList.remove('d-none');
    document.getElementById('closeViewButton').classList.add('d-none');


    // Populate form fields for editing
    document.getElementById('modalEditTitle').value = entry.title || '';
    document.getElementById('modalEditDate').value = entry.date || '';
    document.getElementById('modalEditTopics').value = entry.topics || '';
    document.getElementById('modalEditCode').value = entry.code || '';
    document.getElementById('modalEditResources').value = entry.resources || '';
    document.getElementById('modalEditImage').value = entry.image || '';
    
    if (detailModalInstance) detailModalInstance.show();
  }

  function confirmDelete(docId, entryTitle) {
    document.getElementById('entryNameToDelete').textContent = entryTitle;
    const confirmDeleteBtn = document.getElementById('confirmDeleteButton');
    confirmDeleteBtn.dataset.docId = docId; // Store docId on the button
    
    if (confirmDeleteModalInstance) confirmDeleteModalInstance.show();
  }

  // Attach listener to the actual delete button in the confirmation modal
  const confirmDeleteButton = document.getElementById('confirmDeleteButton');
  if (confirmDeleteButton) {
      confirmDeleteButton.addEventListener('click', function() {
          const docId = this.dataset.docId;
          if (docId) {
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            deleteEntryFirebase(docId)
              .then(() => {
                confirmDeleteModalInstance.hide();
                loadAndRenderEntries(); // Refresh list
                alert('Entry deleted successfully.');
              })
              .catch(err => {
                console.error("Error deleting entry:", err);
                alert('Error deleting entry: ' + err.message);
              })
              .finally(() => {
                this.disabled = false;
                this.innerHTML = 'Yes, Delete';
              });
          }
      });
  }

  function loadAndRenderEntries() {
    getEntries().then(renderEntries).catch(err => {
        console.error("Error loading entries:", err);
        if (noEntriesMessage) {
            noEntriesMessage.innerHTML = '<p class="text-danger">Could not load entries. Please try again later.</p>';
            noEntriesMessage.classList.remove('d-none');
        }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      getEntries().then((snapshot) => {
        if (!query) {
            renderEntries(snapshot);
            return;
        }
        const filteredDocs = snapshot.docs.filter(doc => {
          const { title = "", topics = "" } = doc.data();
          return title.toLowerCase().includes(query) || topics.toLowerCase().includes(query);
        });
        const filteredSnapshot = {
            empty: filteredDocs.length === 0,
            docs: filteredDocs,
            forEach: function(callback) { this.docs.forEach(callback); }
        };
        renderEntries(filteredSnapshot);
      });
    });
  }

  loadAndRenderEntries();
}