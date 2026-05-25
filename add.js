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
const form = document.getElementById("addForm");

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
    title: "",
    category: "📺 TV",
    kind: "メディア",
    priority: "normal"
  },
  tver: {
    title: "",
    category: "📱 TVer期限",
    kind: "メディア",
    priority: "high"
  },
  live: {
    title: "",
    category: "🎤 ライブ",
    kind: "現場",
    priority: "high"
  },
  payment: {
    title: "",
    category: "💸 入金期限",
    kind: "事務",
    priority: "high"
  },
  result: {
    title: "",
    category: "🎯 当落",
    kind: "事務",
    priority: "high"
  },
  magazine: {
    title: "",
    category: "📚 雑誌",
    kind: "メディア",
    priority: "normal"
  }
};

document.querySelectorAll("[data-template]").forEach((button) => {
  button.addEventListener("click", () => {
    const template = templates[button.dataset.template];
    if (!template) return;

    category.value = template.category;
    kind.value = template.kind;
    priority.value = template.priority;

    title.focus();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!title.value.trim() || !date.value) {
    alert("タイトルと日付は入れてね！");
    return;
  }

  const reminder = {
    title: title.value.trim(),
    date: date.value,
    time: time.value || "",
    member: member.value,
    kind: kind.value,
    category: category.value,
    priority: priority.value,
    repeat: repeat.value,
    memo: memo.value.trim(),
    url: url.value.trim(),
    done: false,
    createdAt: new Date()
  };

  try {
    await addDoc(remindersRef, reminder);
    alert("予定を追加したよ！");
    window.location.href = "./index.html";
  } catch (error) {
    console.error("追加エラー:", error);
    alert("追加できなかった…Consoleを見てね！");
  }
});
