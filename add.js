import {
  MEMBERS,
  KINDS,
  CATEGORIES,
  PRIORITIES,
  REPEATS
} from "./data.js";

import {
  remindersRef,
  addDoc
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

fillSelect(member, MEMBERS);
fillSelect(kind, KINDS);
fillSelect(category, CATEGORIES);
fillSelect(priority, PRIORITIES);
fillSelect(repeat, REPEATS);

addBtn.addEventListener("click", addReminder);

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

  alert("追加したよ！");
  location.href = "index.html";
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

const templates = {
  tv: {
    kind: "メディア",
    category: "TV",
    priority: "normal"
  },
  tver: {
    kind: "事務",
    category: "TVer",
    priority: "high",
    memo: "見逃し配信期限"
  },
  live: {
    kind: "現場",
    category: "ライブ",
    priority: "high"
  },
  payment: {
    kind: "事務",
    category: "入金期限",
    priority: "high",
    memo: "忘れずに入金"
  },
  lottery: {
    kind: "事務",
    category: "当落",
    priority: "high",
    memo: "当落確認"
  },
  magazine: {
    kind: "メディア",
    category: "雑誌",
    priority: "normal"
  }
};

document.querySelectorAll(".template-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const template = templates[button.dataset.template];

    document.getElementById("kind").value = template.kind;
    document.getElementById("category").value = template.category;
    document.getElementById("priority").value = template.priority;

    if (template.memo) {
      document.getElementById("memo").value = template.memo;
    }
  });
});
