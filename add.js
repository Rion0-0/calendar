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

const templates = {
  tv: {
    kind: "仕事",
    category: "📺 TV",
    priority: "normal",
    memo: ""
  },
  tver: {
    kind: "仕事",
    category: "📱 TVer期限",
    priority: "high",
    memo: "見逃し配信期限"
  },
  live: {
    kind: "仕事",
    category: "🎤 ライブ",
    priority: "high",
    memo: ""
  },
  payment: {
    kind: "仕事",
    category: "💸 入金期限",
    priority: "high",
    memo: "忘れずに入金"
  },
  lottery: {
    kind: "仕事",
    category: "🎯 当落",
    priority: "high",
    memo: "当落確認"
  },
  magazine: {
    kind: "仕事",
    category: "📚 雑誌",
    priority: "normal",
    memo: ""
  }
};

function setSelectValue(select, value) {
  const option = [...select.options].find((opt) => {
    return opt.value === value || opt.textContent === value;
  });

  if (option) {
    select.value = option.value;
  }
}

document.querySelectorAll(".template-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const template = templates[button.dataset.template];

    if (!template) return;

    setSelectValue(kind, template.kind);
    setSelectValue(category, template.category);
    setSelectValue(priority, template.priority);

    memo.value = template.memo || "";
  });
});

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
