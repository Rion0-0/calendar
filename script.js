import {
  MEMBERS,
  KINDS,
  CATEGORIES,
  PRIORITIES,
  REPEATS
} from "./data.js";

import {
  remindersRef,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query
} from "./firebase.js";

const title = document.getElementById("title");
const date = document.getElementById("date");
const time = document.getElementById("time");
const member = document.getElementById("member");
const kind = document.getElementById("kind");
const category = document.getElementById("category");
const priority = document.getElementById("priority");
const repeat = document.getElementById("repeat");
const memo = document.getElementById("memo");
const url = document.getElementById("url");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");
const todayList = document.getElementById("todayList");
const filterMember = document.getElementById("filterMember");
const filterKind = document.getElementById("filterKind");
const memberToggleArea = document.getElementById("memberToggleArea");

let reminders = [];
let visibleMembers = [...MEMBERS];

function fillSelect(select, items) {
  select.innerHTML = "";

  items.forEach((item) => {
    const option = document.createElement("option");

    if (typeof item === "string") {
      option.value = item;
      option.textContent = item;
    } else {
      option.value = item.value;
      option.textContent = item.label;
    }

    select.appendChild(option);
  });
}

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

fillSelect(member, MEMBERS);
fillSelect(kind, KINDS);
fillSelect(category, CATEGORIES);
fillSelect(priority, PRIORITIES);
fillSelect(repeat, REPEATS);
fillSelect(filterMember, ["全員", ...MEMBERS]);
fillSelect(filterKind, ["すべて", ...KINDS]);
setupMemberToggles();

onSnapshot(query(remindersRef), (snapshot) => {
  reminders = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));

  render();
});

addBtn.addEventListener("click", addReminder);
filterMember.addEventListener("change", render);
filterKind.addEventListener("change", render);

async function addReminder() {
  const item = {
    title: title.value.trim(),
    date: date.value,
    time: time.value,
    member: member.value,
    kind: kind.value,
    category: category.value,
    priority: priority.value,
    repeat: repeat.value,
    memo: memo.value.trim(),
    url: url.value.trim(),
    done: false,
    createdAt: Date.now()
  };

  if (!item.title || !item.date) {
    alert("予定名と日付を入れてね！");
    return;
  }

  await addDoc(remindersRef, item);

  if (item.repeat !== "none") {
    await createRepeats(item);
  }

  clearForm();
}

async function createRepeats(base) {
  const baseDate = new Date(base.date);

  for (let i = 1; i <= 12; i++) {
    const nextDate = new Date(baseDate);

    if (base.repeat === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7 * i);
    }

    if (base.repeat === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + i);
    }

    await addDoc(remindersRef, {
      ...base,
      title: `${base.title}（定期）`,
      date: nextDate.toISOString().slice(0, 10),
      createdAt: Date.now()
    });
  }
}

function clearForm() {
  title.value = "";
  date.value = "";
  time.value = "";
  memo.value = "";
  url.value = "";
}

function render() {
  list.innerHTML = "";
  todayList.innerHTML = "";

  const filtered = reminders
    .filter((item) => visibleMembers.includes(item.member))
    .filter((item) => {
      const memberOk =
        filterMember.value === "全員" ||
        item.member === filterMember.value;

      const kindOk =
        filterKind.value === "すべて" ||
        item.kind === filterKind.value;

      return memberOk && kindOk;
    })
    .sort((a, b) =>
      `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`)
    );

  filtered.forEach((item) => {
    const html = createCard(item);

    list.innerHTML += html;

    if (
      item.kind === "事務" &&
      daysLeft(item.date) <= 1 &&
      !item.done
    ) {
      todayList.innerHTML += html;
    }
  });

  if (!todayList.innerHTML) {
    todayList.innerHTML =
      `<p class="small">今日急ぎの事務タスクはなさそう🫶</p>`;
  }

  if (!list.innerHTML) {
    list.innerHTML =
      `<p class="small">表示できる予定がまだないよ！</p>`;
  }
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
