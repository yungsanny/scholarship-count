// --- CONFIGURATION ---
const TARGET = 500000;
const STORAGE_KEY = 'scholarship_data_v5'; // Increment version

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
    liquidFill: document.getElementById('liquidFill'), // Updated ID
    appContainer: document.querySelector('.app-container'),
    confettiContainer: document.getElementById('confetti-container'),
    sounds: {
        click: document.getElementById('clickSound'),
        success: document.getElementById('successSound'),
        celebrate: document.getElementById('celebrateSound')
    }
};

// --- INITIALIZATION ---
window.onload = () => {
    loadData();
    setupEventListeners();
    render();
};

// --- EVENT LISTENERS ---
function setupEventListeners() {
    elements.addBtn.addEventListener('click', addScholar);
    // Add entry on 'Enter' key in the amount input
    elements.amtIn.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') addScholar();
    });
}

// --- CORE FUNCTIONS ---

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        scholars = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scholars));
}

function playSound(soundName) {
    const sound = elements.sounds[soundName];
    if (sound) {
        sound.currentTime = 0; // Rewind to start
        sound.play().catch(e => console.warn('Sound blocked:', e));
    }
}

function addScholar() {
    playSound('click');
    
    const name = elements.nameIn.value.trim();
    const amount = parseInt(elements.amtIn.value);

    if (!name || isNaN(amount) || amount <= 0) {
        // Simple shake animation for invalid input
        elements.input-group.classList.add('shake');
        setTimeout(() => elements.input-group.classList.remove('shake'), 500);
        return;
    }

    const existingIndex = scholars.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingIndex > -1) {
        scholars[existingIndex].amount = amount;
    } else {
        scholars.push({ id: Date.now(), name: name, amount: amount });
    }

    playSound('success');
    saveData();
    render();

    // Clear inputs and focus
    elements.nameIn.value = '';
    elements.amtIn.value = '';
    elements.nameIn.focus();
}

function removeScholar(id) {
    playSound('click');
    if (confirm("Are you sure you want to delete this entry?")) {
        scholars = scholars.filter(s => s.id !== id);
        saveData();
        render();
    }
}

function triggerCelebration() {
    if (isGoalReached) return; // Already celebrated
    isGoalReached = true;

    playSound('celebrate');
    elements.appContainer.classList.add('goal-reached');

    // Create confetti
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

    // Remove confetti after animation
    setTimeout(() => confetti.remove(), 5000);
}

function render() {
    // 1. Calculate Stats
    const total = scholars.reduce((sum, s) => sum + s.amount, 0);
    const percentage = (total / TARGET) * 100;

    // 2. Update Visuals
    elements.totalDisplay.innerText = '$' + total.toLocaleString();
    elements.percentDisplay.innerText = `${percentage.toFixed(1)}% of Goal`;

    // Cap visual height at 100% for the jar
    const visualHeight = Math.min(percentage, 100);
    elements.liquidFill.style.height = `${visualHeight}%`;

    // 3. Check for Goal Reached Condition
    if (total >= TARGET && !isGoalReached) {
        triggerCelebration();
        elements.percentDisplay.innerText = `GOAL REACHED! (${percentage.toFixed(1)}%)`;
    } else if (total < TARGET) {
        isGoalReached = false;
        elements.appContainer.classList.remove('goal-reached');
    }

    // 4. Render List
    elements.list.innerHTML = '';
    scholars.sort((a, b) => b.amount - a.amount);

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
        // Add delete functionality
        item.querySelector('.del-btn').addEventListener('click', () => removeScholar(s.id));
        elements.list.appendChild(item);
    });
}