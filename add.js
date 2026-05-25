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
  if (!select) return;

  select.innerHTML = "";

  items.forEach(item => {
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
    category: "📺 TV",
    kind: "メディア",
    priority: "normal"
  },
  tver: {
    category: "📱 TVer期限",
    kind: "メディア",
    priority: "high"
  },
  live: {
    category: "🎤 ライブ",
    kind: "現場",
    priority: "high"
  },
  payment: {
    category: "💸 入金期限",
    kind: "事務",
    priority: "high"
  },
  result: {
    category: "🎯 当落",
    kind: "事務",
    priority: "high"
  },
  magazine: {
    category: "📚 雑誌",
    kind: "メディア",
    priority: "normal"
  }
};

document.querySelectorAll("[data-template]").forEach(button => {
  button.addEventListener("click", () => {
    const key = button.dataset.template;
    const template = templates[key];

    if (!template) return;

    category.value = template.category;
    kind.value = template.kind;
    priority.value = template.priority;
  });
});

form.addEventListener("submit", async e => {
  e.preventDefault();

  if (!title.value || !date.value) {
    alert("タイトルと日付は入れてね！");
    return;
  }

  const reminder = {
    title: title.value,
    date: date.value,
    time: time.value || "",
    member: member.value,
    kind: kind.value,
    category: category.value,
    priority: priority.value,
    repeat: repeat.value,
    memo: memo.value || "",
    url: url.value || "",
    done: false,
    createdAt: new Date()
  };

  try {
    await addDoc(remindersRef, reminder);
    alert("予定を追加したよ！");
    window.location.href = "./index.html";
  } catch (error) {
    console.error(error);
    alert("追加できなかった…！Console見てみて！");
  }
});
