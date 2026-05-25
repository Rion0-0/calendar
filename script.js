import { MEMBERS, MEMBER_COLORS } from "./data.js";

import {
  remindersRef,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query
} from "./firebase.js";

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
let currentMonth = 4;
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
      visibleMembers = [...memberToggleArea.querySelectorAll("input:checked")]
        .map((input) => input.value);

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
    const dayItems = items.filter((item) => isReminderOnDate(item, dateStr));

    const cell = document.createElement("div");
    cell.className = "day";

    if (dateStr === todayString()) cell.classList.add("today");
    if (dateStr === selectedDate) cell.classList.add("selected");

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

function isReminderOnDate(item, dateStr) {
  if (item.date === dateStr) return true;

  const original = new Date(item.date);
  const current = new Date(dateStr);

  original.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  if (current < original) return false;

  if (item.repeat === "weekly") {
    return original.getDay() === current.getDay();
  }

  if (item.repeat === "monthly") {
    return original.getDate() === current.getDate();
  }

  return false;
}

function dotHTML(item) {
  const color = MEMBER_COLORS[item.member] || "#f4b6c2";

  let extraClass = "";

  if (item.priority === "high") extraClass += " urgent";
  if (item.kind === "事務") extraClass += " task";
  if (item.category === "📱 TVer期限") extraClass += " tver";

  return `
    <span
      class="dot ${extraClass}"
      style="background:${color}"
      title="${escapeHTML(item.title)}"
    ></span>
  `;
}

function renderSelectedList(items) {
  selectedDateTitle.textContent = `${formatDate(selectedDate)} の予定`;
  selectedList.innerHTML = "";

  const selectedItems = items.filter((item) =>
    isReminderOnDate(item, selectedDate)
  );

  if (selectedItems.length === 0) {
    selectedList.innerHTML = `<p class="small">この日の予定はまだないよ🫶</p>`;
    return;
  }

  selectedItems.forEach((item) => {
    selectedList.innerHTML += createCard(item, selectedDate);
  });
}

function renderTodayTasks(items) {
  todayList.innerHTML = "";

  const today = todayString();

  const taskItems = items.filter((item) => {
    return (
      item.kind === "事務" &&
      isReminderOnDate(item, today) &&
      !item.done
    );
  });

  if (taskItems.length === 0) {
    todayList.innerHTML =
      `<p class="small">今日急ぎの事務タスクはなさそう🫶</p>`;
    return;
  }

  taskItems.forEach((item) => {
    todayList.innerHTML += createCard(item, today);
  });
}

function createCard(item, viewDate) {
  const isRepeat = item.repeat && item.repeat !== "none";

  return `
    <div class="card ${item.priority} ${item.done ? "done" : ""}">
      <h3>${escapeHTML(item.title)}</h3>

      <span class="badge">${escapeHTML(item.member)}</span>
      <span class="badge">${escapeHTML(item.kind)}</span>
      <span class="badge">${escapeHTML(item.category)}</span>
      ${isRepeat ? `<span class="badge">繰り返し</span>` : ""}

      <p>
        <b>${escapeHTML(viewDate)}</b>
        ${item.time ? escapeHTML(item.time) : ""}
        / ${labelDays(viewDate)}
      </p>

      ${isRepeat ? `<p class="small">初回登録日：${escapeHTML(item.date)}</p>` : ""}

      ${item.memo ? `<p>${escapeHTML(item.memo)}</p>` : ""}

      <div class="links">
        ${
          item.url
            ? `<a href="${escapeHTML(item.url)}" target="_blank">公式サイト</a>`
            : ""
        }
      </div>

      <button onclick="editReminder('${item.id}')">
        編集
      </button>

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

window.editReminder = async function(id) {
  const item = reminders.find((reminder) => reminder.id === id);

  if (!item) {
    alert("予定が見つからなかった…！");
    return;
  }

  const newTitle = prompt("タイトルを編集", item.title);
  if (newTitle === null) return;

  const newDate = prompt("初回日付を編集（例：2026-05-04）", item.date);
  if (newDate === null) return;

  const newTime = prompt("時間を編集（例：19:00 / 空欄OK）", item.time || "");
  if (newTime === null) return;

  const newMemo = prompt("メモを編集", item.memo || "");
  if (newMemo === null) return;

  const newUrl = prompt("URLを編集", item.url || "");
  if (newUrl === null) return;

  await updateDoc(doc(remindersRef, id), {
    title: newTitle.trim(),
    date: newDate.trim(),
    time: newTime.trim(),
    memo: newMemo.trim(),
    url: newUrl.trim()
  });

  alert("編集したよ！");
};
