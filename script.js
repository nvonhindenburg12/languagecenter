// Global variables
let currentWeek = 0;
let sessions = {};
let currentEditingSlot = null;

const timeSlots = ['8:00-8:45', '10:00-10:45', '12:00-12:45', '3:15-4:00'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Initialize the calendar structure
function initializeCalendar() {
    const grid = document.getElementById('calendarGrid');
    
    // Create header
    let html = '<div class="days-header"><div></div>';
    days.forEach(day => {
        html += `<div class="day-header">${day}</div>`;
    });
    html += '</div>';
    
    // Create time slots
    timeSlots.forEach((time, timeIndex) => {
        html += '<div class="time-slot-row">';
        html += `<div class="time-label">${time}</div>`;
        
        days.forEach((day, dayIndex) => {
            html += `
                <div class="session-slot" id="slot_${timeIndex}_${dayIndex}" onclick="openModal(${timeIndex}, ${dayIndex})">
                    <button class="add-session-btn" onclick="event.stopPropagation(); openModal(${timeIndex}, ${dayIndex})">+</button>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    grid.innerHTML = html;
}

// Get the start of the week
function getWeekStart(weekOffset = 0) {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setDate(monday.getDate() + (weekOffset * 7));
    return monday;
}

// Format week display
function formatWeekDisplay(weekOffset) {
    const weekStart = getWeekStart(weekOffset);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return `Week of ${weekStart.toLocaleDateString('en-US', options)}`;
}

// Change week
function changeWeek(direction) {
    currentWeek += direction;
    document.getElementById('weekDisplay').textContent = formatWeekDisplay(currentWeek);
    loadWeekSessions();
}

// Open modal
function openModal(timeSlot, day) {
    console.log('Opening modal for slot:', timeSlot, day);
    
    currentEditingSlot = { timeSlot, day };
    const modal = document.getElementById('sessionModal');
    modal.classList.add('active');
    
    // Clear form
    document.getElementById('language').value = '';
    document.getElementById('mentorName').value = '';
    document.getElementById('mentorGrade').value = '';
    document.getElementById('mentorTeacher').value = '';
    document.getElementById('menteeName').value = '';
    document.getElementById('menteeGrade').value = '';
    document.getElementById('menteeTeacher').value = '';
    document.getElementById('sessionNotes').value = '';
    
    // Check if editing existing session
    const sessionKey = `${currentWeek}_${timeSlot}_${day}`;
    const deleteBtn = document.getElementById('deleteBtn');
    const modalTitle = document.getElementById('modalTitle');
    
    if (sessions[sessionKey]) {
        const session = sessions[sessionKey];
        document.getElementById('language').value = session.language;
        document.getElementById('mentorName').value = session.mentorName;
        document.getElementById('mentorGrade').value = session.mentorGrade;
        document.getElementById('menteeName').value = session.menteeName;
        document.getElementById('menteeGrade').value = session.menteeGrade;
        document.getElementById('sessionNotes').value = session.notes;
        deleteBtn.style.display = 'inline-block';
        modalTitle.textContent = 'Edit Mentoring Session';
    } else {
        deleteBtn.style.display = 'none';
        modalTitle.textContent = 'Log Mentoring Session';
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('sessionModal');
    modal.classList.remove('active');
    currentEditingSlot = null;
}

// Save session
function saveSession() {
    console.log('Save button clicked');
    
    if (!currentEditingSlot) {
        console.error('No slot selected');
        return;
    }
    
    // Get form values
    const language = document.getElementById('language').value;
    const mentorName = document.getElementById('mentorName').value;
    const mentorGrade = document.getElementById('mentorGrade').value;
    const menteeName = document.getElementById('menteeName').value;
    const menteeGrade = document.getElementById('menteeGrade').value;
    const notes = document.getElementById('sessionNotes').value;
    
    // Validate
    if (!language || !mentorName || !menteeName) {
        alert('Please fill in at least the language, mentor name, and mentee name.');
        return;
    }
    
    // Create session data
    const sessionData = {
        language: language,
        mentorName: mentorName,
        mentorGrade: mentorGrade,
        menteeName: menteeName,
        menteeGrade: menteeGrade,
        notes: notes,
        timeSlot: timeSlots[currentEditingSlot.timeSlot],
        day: days[currentEditingSlot.day],
        week: currentWeek
    };
    
    // Store session
    const sessionKey = `${currentWeek}_${currentEditingSlot.timeSlot}_${currentEditingSlot.day}`;
    sessions[sessionKey] = sessionData;
    
    console.log('Session saved:', sessionKey, sessionData);
    
    // Save to localStorage
    try {
        localStorage.setItem('mentorSessions', JSON.stringify(sessions));
    } catch (e) {
        console.error('Could not save to localStorage:', e);
    }
    
    // Update the display
    updateSlotDisplay(currentEditingSlot.timeSlot, currentEditingSlot.day, sessionData);
    
    // Update summary
    updateSummary();
    
    // Close modal
    closeModal();
    
    // Show success message
    showSuccessMessage('Session saved successfully!');
}

// Delete session
function deleteSession() {
    if (!currentEditingSlot) return;
    
    const sessionKey = `${currentWeek}_${currentEditingSlot.timeSlot}_${currentEditingSlot.day}`;
    delete sessions[sessionKey];
    
    try {
        localStorage.setItem('mentorSessions', JSON.stringify(sessions));
    } catch (e) {
        console.error('Could not save to localStorage:', e);
    }
    
    // Clear the slot display
    const slot = document.getElementById(`slot_${currentEditingSlot.timeSlot}_${currentEditingSlot.day}`);
    if (slot) {
        slot.classList.remove('has-session');
        slot.innerHTML = `<button class="add-session-btn" onclick="event.stopPropagation(); openModal(${currentEditingSlot.timeSlot}, ${currentEditingSlot.day})">+</button>`;
    }
    
    updateSummary();
    closeModal();
    showSuccessMessage('Session deleted successfully!');
}

// Update slot display
function updateSlotDisplay(timeSlot, day, sessionData) {
    const slot = document.getElementById(`slot_${timeSlot}_${day}`);
    if (!slot) {
        console.error('Slot not found:', timeSlot, day);
        return;
    }
    
    if (sessionData) {
        slot.classList.add('has-session');
        slot.innerHTML = `
            <div class="session-info">
                <strong>${sessionData.language}</strong>
                <div>Mentor: ${sessionData.mentorName}</div>
                <div>Mentee: ${sessionData.menteeName}</div>
                <div>Topic: ${sessionData.notes ? sessionData.notes.substring(0, 30) + (sessionData.notes.length > 30 ? '...' : '') : 'No notes'}</div>
            </div>
        `;
    } else {
        slot.classList.remove('has-session');
        slot.innerHTML = `<button class="add-session-btn" onclick="event.stopPropagation(); openModal(${timeSlot}, ${day})">+</button>`;
    }
}

// Load week sessions
function loadWeekSessions() {
    // Clear all slots
    timeSlots.forEach((time, timeIndex) => {
        days.forEach((day, dayIndex) => {
            updateSlotDisplay(timeIndex, dayIndex, null);
        });
    });
    
    // Load sessions for current week
    Object.keys(sessions).forEach(key => {
        const [week, timeSlot, day] = key.split('_').map(Number);
        if (week === currentWeek) {
            updateSlotDisplay(timeSlot, day, sessions[key]);
        }
    });
    
    updateSummary();
}

// Update summary
function updateSummary() {
    let totalSessions = 0;
    let languages = new Set();
    let mentors = new Set();
    
    Object.keys(sessions).forEach(key => {
        const [week] = key.split('_').map(Number);
        if (week === currentWeek) {
            totalSessions++;
            const session = sessions[key];
            if (session.language) languages.add(session.language);
            if (session.mentorName) mentors.add(session.mentorName);
        }
    });
    
    document.getElementById('summaryStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalSessions}</div>
            <div class="stat-label">Total Sessions</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${languages.size}</div>
            <div class="stat-label">Languages Covered</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${mentors.size}</div>
            <div class="stat-label">Active Mentors</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalSessions * 45}</div>
            <div class="stat-label">Minutes Tutored</div>
        </div>
    `;
}

// Show success message
function showSuccessMessage(message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'success-message';
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

// Initialize everything when page loads
window.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Initialize calendar
    initializeCalendar();
    
    // Load saved sessions
    try {
        const savedSessions = localStorage.getItem('mentorSessions');
        if (savedSessions) {
            sessions = JSON.parse(savedSessions);
            console.log('Loaded sessions from storage:', sessions);
        }
    } catch (e) {
        console.error('Could not load from localStorage:', e);
    }
    
    // Add sample data if no sessions exist
    if (Object.keys(sessions).length === 0) {

        
        
        try {
            localStorage.setItem('mentorSessions', JSON.stringify(sessions));
        } catch (e) {
            console.error('Could not save sample data:', e);
        }
    }
    
    // Load current week
    loadWeekSessions();
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('sessionModal');
    if (event.target === modal) {
        closeModal();
    }
});