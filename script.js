// --- FIREBASE IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- CONFIGURATION ---
// 🔴 PASTE YOUR FIREBASE CONFIG INSIDE THESE BRACKETS 🔴
const firebaseConfig = {
  // It will look something like this:
  // apiKey: "AIzaSyB...",
  // authDomain: "scholarship-tracker...",
  // projectId: "scholarship-tracker...",
  // storageBucket: "...",
  // messagingSenderId: "...",
  // appId: "..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const dbCollection = collection(db, "scholarships"); // This creates a "folder" in cloud called scholarships

const TARGET = 500000;

// --- STATE ---
let scholars = [];
let isGoalReached = false;

// --- DOM ELEMENTS ---
const elements = {
    nameIn: document.getElementById('nameIn'),
    amtIn: document.getElementById('amtIn'),
    addBtn: document.getElementById('addBtn'),
    list: document.getElementById('list'),
    totalDisplay: document.getElementById('totalDisplay'),
    percentDisplay: document.getElementById('percentDisplay'),
    liquidFill: document.getElementById('liquidFill'),
    appContainer: document.querySelector('.app-container'),
    confettiContainer: document.getElementById('confetti-container'),
    sounds: {
        click: document.getElementById('clickSound'),
        success: document.getElementById('successSound'),
        celebrate: document.getElementById('celebrateSound')
    }
};

// --- INITIALIZATION ---
// Instead of window.onload, we listen to the database immediately
setupRealtimeListener();
setupEventListeners();


// --- CORE FUNCTIONS ---

// 1. LISTEN FOR CHANGES (Realtime!)
function setupRealtimeListener() {
    // This function runs AUTOMATICALLY every time someone adds data anywhere in the world
    const q = query(dbCollection, orderBy("amount", "desc"));
    
    onSnapshot(q, (snapshot) => {
        scholars = snapshot.docs.map(doc => ({
            id: doc.id, // Firestore gives every entry a unique ID
            ...doc.data()
        }));
        
        render(); // Update the screen immediately
    });
}

function setupEventListeners() {
    elements.addBtn.addEventListener('click', addScholar);
    elements.amtIn.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') addScholar();
    });
}

function playSound(soundName) {
    const sound = elements.sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.warn('Sound blocked:', e));
    }
}

// 2. ADD DATA TO CLOUD
async function addScholar() {
    playSound('click');
    
    const name = elements.nameIn.value.trim();
    const amount = parseInt(elements.amtIn.value);

    if (!name || isNaN(amount) || amount <= 0) {
        // Shake animation
        elements.input-group.style.borderColor = '#ef4444';
        setTimeout(() => elements.input-group.style.borderColor = '', 500);
        return;
    }

    // Disable button while saving
    elements.addBtn.disabled = true;
    elements.addBtn.innerText = "...";

    try {
        // Send to Firebase
        await addDoc(dbCollection, {
            name: name,
            amount: amount,
            timestamp: Date.now()
        });

        playSound('success');
        
        // Clear inputs
        elements.nameIn.value = '';
        elements.amtIn.value = '';
        elements.nameIn.focus();
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Error saving data. Check console.");
    }

    elements.addBtn.disabled = false;
    elements.addBtn.innerText = "Add";
}

// 3. DELETE DATA FROM CLOUD
async function removeScholar(id) {
    playSound('click');
    if (confirm("Delete this entry for everyone?")) {
        await deleteDoc(doc(db, "scholarships", id));
    }
}

function triggerCelebration() {
    if (isGoalReached) return;
    isGoalReached = true;

    playSound('celebrate');
    elements.appContainer.classList.add('goal-reached');

    for (let i = 0; i < 100; i++) {
        createConfetti();
    }
}

function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = ['#ffeb3b', '#ff9f1c', '#ffffff'][Math.floor(Math.random() * 3)];
    confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
    elements.confettiContainer.appendChild(confetti);
    setTimeout(() => confetti.remove(), 5000);
}

function render() {
    // 1. Calculate Stats
    const total = scholars.reduce((sum, s) => sum + s.amount, 0);
    const percentage = (total / TARGET) * 100;

    // 2. Update Visuals
    elements.totalDisplay.innerText = '$' + total.toLocaleString();
    elements.percentDisplay.innerText = `${percentage.toFixed(1)}% of Goal`;

    const visualHeight = Math.min(percentage, 100);
    elements.liquidFill.style.height = `${visualHeight}%`;

    // 3. Check Goal
    if (total >= TARGET && !isGoalReached) {
        triggerCelebration();
        elements.percentDisplay.innerText = `GOAL REACHED! (${percentage.toFixed(1)}%)`;
    } else if (total < TARGET) {
        isGoalReached = false;
        elements.appContainer.classList.remove('goal-reached');
    }

    // 4. Render List
    elements.list.innerHTML = '';
    // Sorting is handled by Firestore query now, but safe to keep here too
    // scholars.sort((a, b) => b.amount - a.amount);

    scholars.forEach((s, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="name-side">
                <span class="rank">#${index + 1}</span>
                <span>${s.name}</span>
            </div>
            <div class="money-side">
                <span>$${s.amount.toLocaleString()}</span>
                <button class="del-btn">&times;</button>
            </div>
        `;
        item.querySelector('.del-btn').addEventListener('click', () => removeScholar(s.id));
        elements.list.appendChild(item);
    });
}
