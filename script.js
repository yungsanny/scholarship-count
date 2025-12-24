// --- FIREBASE IMPORTS (Using CDN for GitHub Pages) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- YOUR SPECIFIC CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDLEKard3uXZLKTeEfLFX4HM1L5LyBP5g0",
  authDomain: "scholarship-tracker69.firebaseapp.com",
  projectId: "scholarship-tracker69",
  storageBucket: "scholarship-tracker69.firebasestorage.app",
  messagingSenderId: "565273717330",
  appId: "1:565273717330:web:4d9ad1981e9f9ea2520d8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const dbCollection = collection(db, "scholarships");

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
// Start listening to the database immediately
setupRealtimeListener();
setupEventListeners();

// --- CORE FUNCTIONS ---

// 1. LISTEN FOR CHANGES (Realtime!)
function setupRealtimeListener() {
    const q = query(dbCollection, orderBy("amount", "desc"));
    
    onSnapshot(q, (snapshot) => {
        scholars = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        render(); // Update screen instantly
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
        const inputGroup = document.querySelector('.input-group');
        inputGroup.style.borderColor = '#ef4444';
        setTimeout(() => inputGroup.style.borderColor = '', 500);
        return;
    }

    elements.addBtn.disabled = true;
    elements.addBtn.innerText = "...";

    try {
        await addDoc(dbCollection, {
            name: name,
            amount: amount,
            timestamp: Date.now()
        });
        playSound('success');
        
        elements.nameIn.value = '';
        elements.amtIn.value = '';
        elements.nameIn.focus();
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Error saving. Check console.");
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
    const total = scholars.reduce((sum, s) => sum + s.amount, 0);
    const percentage = (total / TARGET) * 100;

    elements.totalDisplay.innerText = '$' + total.toLocaleString();
    elements.percentDisplay.innerText = `${percentage.toFixed(1)}% of Goal`;

    const visualHeight = Math.min(percentage, 100);
    elements.liquidFill.style.height = `${visualHeight}%`;

    if (total >= TARGET && !isGoalReached) {
        triggerCelebration();
        elements.percentDisplay.innerText = `GOAL REACHED! (${percentage.toFixed(1)}%)`;
    } else if (total < TARGET) {
        isGoalReached = false;
        elements.appContainer.classList.remove('goal-reached');
    }

    elements.list.innerHTML = '';
    
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
