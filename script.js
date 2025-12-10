// ====== CONFIG: PUT YOUR SUPABASE DETAILS HERE ======
const SUPABASE_URL = "https://tnzfjnhsonnawkxjqlhq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuemZqbmhzb25uYXdreGpxbGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzM1MDUsImV4cCI6MjA4MDkwOTUwNX0.Z1ZVdpca64Qcj6uNnsirjkscRCUiQgpKk7t8ONF1ZLE";
const SUPABASE_TABLE = "attendance";
// ===================================================

const classSelect = document.getElementById("classSelect");
const studentsList = document.getElementById("studentsList");
const presentCount = document.getElementById("presentCount");
const classInfo = document.getElementById("classInfo");

const modalBack = document.getElementById("modalBack");
const countdownEl = document.getElementById("countdown");
const cancelSave = document.getElementById("cancelSave");
const forceSave = document.getElementById("forceSave");

const markAllPresent = document.getElementById("markAllPresent");
const markAllAbsent = document.getElementById("markAllAbsent");
const submitBtn = document.getElementById("submitBtn");
const dateInput = document.getElementById("date");

// set today's date
dateInput.valueAsDate = new Date();

// updated students data
const studentsData = {
    "9th": [
        "Memoona Naz",
        "Maheen Usman",
        "Maleeha",
        "Fariha Parvaiz",
        "Ayesha Iman",
        "Aleeza Waheed",
        "Sania",
        "Bisma Parvaiz",
        "Kahaful-Wara",
        "Munifa",
        "Tanisha",
        "Muqaddas",
        "Iram",
        "Maryam",
        "M. Rayyan",
        "Asad Ameen",
        "Anas Saleem",
        "Hamza Shakeel",
        "Hamza Shahzad",
        "Ali Hassan",
        "Rehan Aslam",
        "M. Faizan",
        "Subhan Yaqoob",
        "Asif Jahangir",
        "Yousaf Jahangir",
        "Farhan Mirza",
        "Daniyal Khokhar",
        "Haroon",
        "Mohsin",
        "Nadeen Ahmed",
        "Salman Abbasi",
        "Hadi",
        "Faizan",
        "Tahir",
        "Hanan Shah",
        "Ayyan"
    ],
    "10th": [
        "Munazza",
        "Sania",
        "Dua",
        "Laiba Batool",
        "Amna Zahid",
        "Maham Maqsood",
        "Hira Saeed",
        "Zimmal",
        "Amna Batool",
        "Areeba",
        "Iqra waheed",
        "Iqra Umer farooq",
        "Maham Ashfaq",
        "Arman Raiz",
        "Sahil",
        "Samiullah",
        "Talha",
        "Tayyab",
        "Hammad Amanat",
        "Majid sandhu",
        "Jahanzaib",
        "Moeed"
    ]
};

let attendance = [];
let countdown = null;
let timeout = null;

// Load students on class change
classSelect.addEventListener("change", () => {
    const cls = classSelect.value;
    loadStudents(cls);
});

function loadStudents(cls) {
  studentsList.innerHTML = "";
  attendance = [];

  if (!studentsData[cls]) {
    studentsList.classList.add("empty-state");
    studentsList.innerHTML = "<p>No class selected yet.</p>";
    presentCount.textContent = "Present: 0";
    classInfo.textContent = "Choose a class to load students";
    return;
  }

  studentsList.classList.remove("empty-state");

  // Assign starting roll numbers
  let startRoll = cls === "9th" ? 901 : 1001;

  classInfo.textContent = `Loaded ${studentsData[cls].length} students for class ${cls}.`;

  studentsData[cls].forEach((name, index) => {
    const rollNumber = startRoll + index;

    const row = document.createElement("div");
    row.className = "student-row";

    row.innerHTML = `
      <span class="roll-number">${rollNumber}</span>
      <span class="student-name">${name}</span>
      <div class="student-row-actions">
        <button class="btn btn-status btn-neutral" data-type="p">P</button>
        <button class="btn btn-status btn-neutral" data-type="a">A</button>
      </div>
    `;

    studentsList.appendChild(row);

    attendance.push({
      roll: rollNumber,
      name,
      status: "none"
    });

    const pBtn = row.querySelector('[data-type="p"]');
    const aBtn = row.querySelector('[data-type="a"]');

    pBtn.onclick = () => setStatus(name, "present", pBtn, aBtn);
    aBtn.onclick = () => setStatus(name, "absent", pBtn, aBtn);
  });

  updatePresentCount();
}


function setStatus(name, status, pBtn, aBtn) {
    const student = attendance.find((s) => s.name === name);
    if (!student) return;

    student.status = status;

    // reset both
    pBtn.classList.remove("btn-p", "btn-neutral");
    aBtn.classList.remove("btn-a", "btn-neutral");

    pBtn.classList.add("btn-neutral");
    aBtn.classList.add("btn-neutral");

    if (status === "present") {
        pBtn.classList.remove("btn-neutral");
        pBtn.classList.add("btn-p");
    } else if (status === "absent") {
        aBtn.classList.remove("btn-neutral");
        aBtn.classList.add("btn-a");
    }

    updatePresentCount();
}

function updatePresentCount() {
    const count = attendance.filter((s) => s.status === "present").length;
    presentCount.textContent = `Present: ${count}`;
}

// Mark all helpers

markAllPresent.onclick = () => {
    document.querySelectorAll(".student-row").forEach((row) => {
        const name = row.querySelector(".student-name").textContent.trim();
        const pBtn = row.querySelector('[data-type="p"]');
        const aBtn = row.querySelector('[data-type="a"]');
        setStatus(name, "present", pBtn, aBtn);
    });
};

markAllAbsent.onclick = () => {
    document.querySelectorAll(".student-row").forEach((row) => {
        const name = row.querySelector(".student-name").textContent.trim();
        const pBtn = row.querySelector('[data-type="p"]');
        const aBtn = row.querySelector('[data-type="a"]');
        setStatus(name, "absent", pBtn, aBtn);
    });
};

// Submit logic with modal timer
submitBtn.onclick = () => {
    if (!classSelect.value) return alert("Please select a class first.");
    if (!dateInput.value) return alert("Please select a date.");
    if (!attendance.length) return alert("No students loaded.");

    const unmarked = attendance.filter((s) => s.status === "none").length;
    if (unmarked > 0) {
        const proceed = confirm(
            `There are ${unmarked} students without a status.\n\nDo you still want to submit?`
        );
        if (!proceed) return;
    }

    modalBack.style.display = "flex";
    let seconds = 7;
    countdownEl.textContent = seconds;

    countdown = setInterval(() => {
        seconds--;
        countdownEl.textContent = seconds;
        if (seconds <= 0) clearInterval(countdown);
    }, 1000);

    timeout = setTimeout(() => {
        modalBack.style.display = "none";
        saveAttendance();
    }, 7000);
};

cancelSave.onclick = () => {
    clearInterval(countdown);
    clearTimeout(timeout);
    modalBack.style.display = "none";
    alert("Attendance cancelled.");
};

forceSave.onclick = () => {
    clearInterval(countdown);
    clearTimeout(timeout);
    modalBack.style.display = "none";
    saveAttendance();
};

// Save to Supabase
async function saveAttendance() {
    const cls = classSelect.value;
    const dateValue = dateInput.value;

    const recordsToSave = attendance.map((s) => ({
        date: dateValue,
        class: cls,
        student_name: s.name,
        status: s.status === "none" ? null : s.status
    }));

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Prefer: "return=minimal"
            },
            body: JSON.stringify(recordsToSave)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(errorText);
            alert("❌ Failed to save attendance. Check console for details.");
            return;
        }

        alert("✅ Attendance saved to Supabase successfully.");
    } catch (err) {
        console.error(err);
        alert("❌ Network error: " + err.message);
    }
}
