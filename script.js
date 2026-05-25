import { MEMBERS } from "./data.js";

import {
  remindersRef,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query
} from "./firebase.js";

import { MEMBER_COLORS } from "./data.js";

const monthTitle = document.getElementById("monthTitle");
const calendar = document.getElementById("calendar");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const selectedList = document.getElementById("selectedList");
const todayList = document.getElementById("todayList");
const memberToggleArea = document.getElementById("memberToggleArea");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

let reminders = [];
let visibleMembers = [...MEMBERS];

let currentYear = 2026;
let currentMonth = 4; // 5月
let selectedDate = "2026-05-01";

setupMemberToggles();

onSnapshot(query(remindersRef), (snapshot) => {
  reminders = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));

  render();
});

prevMonth.addEventListener("click", () => {
  currentMonth--;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  selectedDate = makeDateString(currentYear, currentMonth, 1);
  render();
});

nextMonth.addEventListener("click", () => {
  currentMonth++;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  selectedDate = makeDateString(currentYear, currentMonth, 1);
  render();
});

function setupMemberToggles() {
  memberToggleArea.innerHTML = "";

  MEMBERS.forEach((name) => {
    const label = document.createElement("label");
    label.className = "member-chip";

    label.innerHTML = `
      <input type="checkbox" value="${name}" checked />
      ${name}
    `;

    const checkbox = label.querySelector("input");

    checkbox.addEventListener("change", () => {
      visibleMembers = [
        ...memberToggleArea.querySelectorAll("input:checked")
      ].map((input) => input.value);

      render();
    });

    memberToggleArea.appendChild(label);
  });
}

function render() {
  const filtered = reminders
    .filter((item) => visibleMembers.includes(item.member))
    .sort((a, b) =>
      `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`)
    );

  renderCalendar(filtered);
  renderSelectedList(filtered);
  renderTodayTasks(filtered);
}

function renderCalendar(items) {
  calendar.innerHTML = "";

  monthTitle.textContent = `${currentYear}年 ${currentMonth + 1}月`;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const startWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  for (let i = 0; i < startWeekDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = makeDateString(currentYear, currentMonth, day);

    const dayItems = items.filter((item) => item.date === dateStr);

    const cell = document.createElement("div");
    cell.className = "day";

    if (dateStr === todayString()) {
      cell.classList.add("today");
    }

    if (dateStr === selectedDate) {
      cell.classList.add("selected");
    }

    cell.innerHTML = `
      <div class="day-number">${day}</div>
      <div class="dots">
        ${dayItems.map((item) => dotHTML(item)).join("")}
      </div>
    `;

    cell.addEventListener("click", () => {
      selectedDate = dateStr;
      render();
    });

    calendar.appendChild(cell);
  }
}

function dotHTML(item) {
  if (item.priority === "high") {
    return `<span class="dot urgent"></span>`;
  }

  if (item.kind === "事務") {
    return `<span class="dot task"></span>`;
  }

  return `<span class="dot work"></span>`;
}

function renderSelectedList(items) {
  selectedDateTitle.textContent = `${formatDate(selectedDate)} の予定`;
  selectedList.innerHTML = "";

  const selectedItems = items.filter((item) => item.date === selectedDate);

  if (selectedItems.length === 0) {
    selectedList.innerHTML = `<p class="small">この日の予定はまだないよ🫶</p>`;
    return;
  }

  selectedItems.forEach((item) => {
    selectedList.innerHTML += createCard(item);
  });
}

function renderTodayTasks(items) {
  todayList.innerHTML = "";

  const taskItems = items.filter((item) => {
    return (
      item.kind === "事務" &&
      daysLeft(item.date) <= 1 &&
      !item.done
    );
  });

  if (taskItems.length === 0) {
    todayList.innerHTML =
      `<p class="small">今日急ぎの事務タスクはなさそう🫶</p>`;
    return;
  }

  taskItems.forEach((item) => {
    todayList.innerHTML += createCard(item);
  });
}

function createCard(item) {
  return `
    <div class="card ${item.priority} ${item.done ? "done" : ""}">
      <h3>${escapeHTML(item.title)}</h3>

      <span class="badge">${escapeHTML(item.member)}</span>
      <span class="badge">${escapeHTML(item.kind)}</span>
      <span class="badge">${escapeHTML(item.category)}</span>

      <p>
        <b>${escapeHTML(item.date)}</b>
        ${item.time ? escapeHTML(item.time) : ""}
        / ${labelDays(item.date)}
      </p>

      ${item.memo ? `<p>${escapeHTML(item.memo)}</p>` : ""}

      <div class="links">
        ${
          item.url
            ? `<a href="${escapeHTML(item.url)}" target="_blank">公式サイト</a>`
            : ""
        }
      </div>

      <button onclick="toggleDone('${item.id}', ${item.done})">
        ${item.done ? "未処理に戻す" : "処理済みにする"}
      </button>

      <button onclick="deleteReminder('${item.id}')">
        削除
      </button>
    </div>
  `;
}

function makeDateString(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  return `${year}-${mm}-${dd}`;
}

function todayString() {
  const today = new Date();

  return makeDateString(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"];

  return `${date.getMonth() + 1}月${date.getDate()}日（${week[date.getDay()]}）`;
}

function daysLeft(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / 86400000);
}

function labelDays(dateStr) {
  const d = daysLeft(dateStr);

  if (d < 0) return `${Math.abs(d)}日前`;
  if (d === 0) return "今日";
  if (d === 1) return "明日";

  return `あと${d}日`;
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.deleteReminder = async function(id) {
  if (!confirm("削除する？")) return;

  await deleteDoc(doc(remindersRef, id));
};

window.toggleDone = async function(id, done) {
  await updateDoc(doc(remindersRef, id), {
    done: !done
  });
};
