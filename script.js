/* ========================
   GLOBAL VARIABLES
   ======================== */
let modalFlag = false;
let removeFlag = false;

// Date State
let date = new Date();
let currYear = date.getFullYear();
let currMonth = date.getMonth();
// "currentSelectedDate" tracks which list we are looking at. Defaults to Today.
let currentSelectedDate = new Date().toISOString().split('T')[0]; 

const addBtn = document.querySelector(".add-btn");
const removeBtn = document.querySelector(".remove-btn");
const modalCont = document.querySelector(".modal-cont");
const modalTaskArea = document.querySelector(".textArea-cont");
const mainCont = document.querySelector(".main-cont");

const allPriorityColors = document.querySelectorAll(".priority-color");
const cutSound = document.getElementById("cut-sound");

// Sidebar & Calendar Elements
const calendarSidebar = document.querySelector(".calendar-sidebar");
const sidebarOverlay = document.querySelector(".sidebar-overlay");
const calendarBtn = document.querySelector(".calendar-toggle-btn");
const closeSidebarBtn = document.querySelector(".close-sidebar");
const calendarGrid = document.getElementById("calendar-grid");
const monthYearLabel = document.getElementById("current-month-year");
const showAllBtn = document.getElementById("show-all-btn");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

const colorsArray = ["lightpink", "lightgreen", "lightblue", "black"];
let ticketColor = "lightpink";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ========================
   INITIALIZATION
   ======================== */
renderCalendar();

/* ========================
   EVENT LISTENERS
   ======================== */

// MODAL TOGGLE
addBtn.addEventListener("click", () => {
    modalFlag = !modalFlag;
    modalCont.style.display = modalFlag ? "flex" : "none";
});

// DELETE MODE
removeBtn.addEventListener("click", () => {
    removeFlag = !removeFlag;
    removeBtn.style.color = removeFlag ? "red" : "black";
    if(removeFlag) alert("Delete Mode: Clicking a ticket will permanently remove it.");
});

// SIDEBAR TOGGLE
calendarBtn.addEventListener("click", toggleSidebar);
closeSidebarBtn.addEventListener("click", toggleSidebar);
sidebarOverlay.addEventListener("click", toggleSidebar);

function toggleSidebar() {
    calendarSidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("open");
}

// CALENDAR NAVIGATION
prevMonthBtn.addEventListener("click", () => {
    currMonth--;
    if(currMonth < 0) {
        currMonth = 11;
        currYear--;
    }
    renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
    currMonth++;
    if(currMonth > 11) {
        currMonth = 0;
        currYear++;
    }
    renderCalendar();
});

// SHOW ALL BUTTON
showAllBtn.addEventListener("click", () => {
    filterTasksByDate('ALL');
    // Remove active highlight from calendar
    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('active-date'));
});

// SHIFT TO CREATE TICKET
modalTaskArea.addEventListener("keydown", (e) => {
    if (e.key === "Shift") {
        e.preventDefault(); // Prevents typing the char
        const task = modalTaskArea.value.trim();
        
        // Assign the task to the CURRENTLY SELECTED date (or today if none selected)
        const dateToAssign = currentSelectedDate;

        if (!task) return;

        createTicket(task, ticketColor, dateToAssign);

        modalCont.style.display = "none";
        modalTaskArea.value = "";
        modalFlag = false;
        
        renderCalendar(); // Refresh dots
    }
});

// PRIORITY COLOR SELECTION
allPriorityColors.forEach((col) => {
    col.addEventListener("click", () => {
        allPriorityColors.forEach((c) => c.classList.remove("active"));
        col.classList.add("active");
        colorsArray.forEach((clr) => {
            if (col.classList.contains(clr)) ticketColor = clr;
        });
    });
});

/* ========================
   TICKET LOGIC
   ======================== */

function createTicket(task, color, dateString) {
    const id = Math.random().toString(36).substr(2, 6);
    const ticket = document.createElement("div");
    ticket.classList.add("ticket-cont");
    
    // Set Attributes for filtering
    ticket.setAttribute("data-date", dateString);
    ticket.setAttribute("data-status", "active"); 

    ticket.innerHTML = `
        <div class="ticket-done-btn">Done</div>
        <div class="ticket-color ${color}"></div>
        <div class="ticket-id">#${id}</div>
        <div class="task-area">${task}</div>
        <div class="ticket-lock"><i class="fa-solid fa-lock"></i></div>
    `;

    handleDone(ticket);
    handleLock(ticket);
    handleColor(ticket);
    handleRemoval(ticket);

    mainCont.appendChild(ticket);
}

// "DONE" LOGIC: Visual strikethrough + Hide
function handleDone(ticket) {
    const btn = ticket.querySelector(".ticket-done-btn");
    btn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        
        ticket.classList.add("ticket-cut-animation");
        if (cutSound) {
            cutSound.currentTime = 0;
            cutSound.volume = 0.2;
            cutSound.play().catch(() => {});
        }

        setTimeout(() => {
            // Mark as completed but don't delete from DOM
            ticket.classList.remove("ticket-cut-animation");
            ticket.classList.add("completed-task");
            ticket.setAttribute("data-status", "completed");
            
            // Hide it immediately
            ticket.style.display = "none"; 
        }, 600);
    });
}

// DELETE LOGIC: Permanent Removal
function handleRemoval(ticket) {
    ticket.addEventListener("click", () => {
        if (removeFlag) {
            ticket.remove();
            renderCalendar(); // Update red dots
        }
    });
}

function handleLock(ticket) {
    const lockIcon = ticket.querySelector(".ticket-lock i");
    const taskArea = ticket.querySelector(".task-area");
    lockIcon.addEventListener("click", () => {
        if (lockIcon.classList.contains("fa-lock")) {
            lockIcon.classList.replace("fa-lock", "fa-lock-open");
            taskArea.contentEditable = true;
        } else {
            lockIcon.classList.replace("fa-lock-open", "fa-lock");
            taskArea.contentEditable = false;
        }
    });
}

function handleColor(ticket) {
    const band = ticket.querySelector(".ticket-color");
    band.addEventListener("click", () => {
        let current = colorsArray.find((c) => band.classList.contains(c));
        let idx = colorsArray.indexOf(current);
        let next = colorsArray[(idx + 1) % colorsArray.length];
        band.classList.remove(current);
        band.classList.add(next);
    });
}

/* ========================
   CALENDAR LOGIC
   ======================== */

function renderCalendar() {
    // 1. Set Header
    monthYearLabel.innerText = `${months[currMonth]} ${currYear}`;
    
    // 2. Clear Grid
    calendarGrid.innerHTML = "";
    
    // 3. Calculate Days
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(); // 0-6
    let lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(); // 28-31

    // 4. Fill Previous Month Gaps
    for (let i = 0; i < firstDayofMonth; i++) {
        const li = document.createElement("div");
        calendarGrid.appendChild(li);
    }

    // 5. Fill Current Month Days
    for (let i = 1; i <= lastDateofMonth; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("cal-day");
        dayDiv.innerText = i;
        
        // Create YYYY-MM-DD string
        const m = (currMonth + 1) < 10 ? `0${currMonth + 1}` : (currMonth + 1);
        const d = i < 10 ? `0${i}` : i;
        const fullDate = `${currYear}-${m}-${d}`;
        
        dayDiv.setAttribute("data-cal-date", fullDate);

        // Highlight selected date
        if(fullDate === currentSelectedDate) {
            dayDiv.classList.add("active-date");
        }

        // Add "Has Task" Red Dot
        // Check if ANY ticket exists for this date (Active OR Completed)
        const tasksOnDay = document.querySelectorAll(`.ticket-cont[data-date="${fullDate}"]`);
        if(tasksOnDay.length > 0) {
            dayDiv.classList.add("has-task");
        }

        // Click Event: Filter
        dayDiv.addEventListener("click", () => {
            // Update UI
            document.querySelectorAll('.cal-day').forEach(el => el.classList.remove("active-date"));
            dayDiv.classList.add("active-date");
            
            // Update State
            currentSelectedDate = fullDate;
            
            // Filter
            filterTasksByDate(fullDate);
        });

        calendarGrid.appendChild(dayDiv);
    }
}

function filterTasksByDate(dateStr) {
    const allTickets = document.querySelectorAll(".ticket-cont");
    
    allTickets.forEach(ticket => {
        const tDate = ticket.getAttribute("data-date");
        const tStatus = ticket.getAttribute("data-status");

        if(dateStr === 'ALL') {
            // Show only active tasks, hide completed
            if(tStatus === 'active') ticket.style.display = "flex";
            else ticket.style.display = "none";
        } else {
            // Specific Date: Show ALL tasks (History View)
            // This shows both Active AND Completed tasks for that date
            if (tDate === dateStr) {
                ticket.style.display = "flex";
            } else {
                ticket.style.display = "none";
            }
        }
    });
}

// Audio fix
window.addEventListener("click", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });
function unlockAudio() {
    if (!cutSound) return;
    cutSound.volume = 0.01;
    cutSound.play().then(() => {
        cutSound.pause();
        cutSound.currentTime = 0;
        cutSound.volume = 1;
    }).catch(() => {});
}