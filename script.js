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

const addBtn =
  document.getElementById("addBtn");

const list =
  document.getElementById("list");

const todayList =
  document.getElementById("todayList");

const filterMember =
  document.getElementById("filterMember");

const filterKind =
  document.getElementById("filterKind");

let reminders = [];

function fillSelect(select, items){

  items.forEach(item=>{

    const option =
      document.createElement("option");

    if(typeof item === "string"){
      option.value = item;
      option.textContent = item;
    }else{
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

fillSelect(filterMember,
  ["全員", ...MEMBERS]);

fillSelect(filterKind,
  ["すべて", ...KINDS]);

onSnapshot(
  query(remindersRef),
  snapshot => {

    reminders =
      snapshot.docs.map(doc=>({
        id:doc.id,
        ...doc.data()
      }));

    render();

  }
);

addBtn.addEventListener(
  "click",
  addReminder
);

filterMember.addEventListener(
  "change",
  render
);

filterKind.addEventListener(
  "change",
  render
);

async function addReminder(){

  const item = {

    title:title.value,
    date:date.value,
    time:time.value,
    member:member.value,
    kind:kind.value,
    category:category.value,
    priority:priority.value,
    repeat:repeat.value,
    memo:memo.value,
    url:url.value,
    done:false,
    createdAt:Date.now()

  };

  if(!item.title || !item.date){
    alert("予定名と日付を入れてね！");
    return;
  }

  await addDoc(
    remindersRef,
    item
  );

  clearForm();

}

function clearForm(){

  title.value = "";
  date.value = "";
  time.value = "";
  memo.value = "";
  url.value = "";

}

function render(){

  list.innerHTML = "";
  todayList.innerHTML = "";

  const filtered =
    reminders
      .filter(item => {

        const memberOk =
          filterMember.value === "全員"
          || item.member === filterMember.value;

        const kindOk =
          filterKind.value === "すべて"
          || item.kind === filterKind.value;

        return memberOk && kindOk;

      })
      .sort((a,b)=>
        (a.date+a.time)
        .localeCompare(b.date+b.time)
      );

  filtered.forEach(item=>{

    const html =
      createCard(item);

    list.innerHTML += html;

    if(
      item.kind === "事務"
      && daysLeft(item.date) <= 1
      && !item.done
    ){
      todayList.innerHTML += html;
    }

  });

}

function createCard(item){

  return `
  <div class="card ${item.priority} ${item.done ? "done" : ""}">

    <h3>${item.title}</h3>

    <span class="badge">${item.member}</span>

    <span class="badge">${item.kind}</span>

    <span class="badge">${item.category}</span>

    <p>
      ${item.date}
      ${item.time || ""}
      / ${labelDays(item.date)}
    </p>

    ${
      item.memo
      ? `<p>${item.memo}</p>`
      : ""
    }

    <div class="links">

      ${
        item.url
        ? `
        <a
          href="${item.url}"
          target="_blank"
        >
          公式サイト
        </a>
        `
        : ""
      }

    </div>

    <button
      onclick="toggleDone('${item.id}', ${item.done})"
    >
      ${
        item.done
        ? "未処理"
        : "処理済み"
      }
    </button>

    <button
      onclick="deleteReminder('${item.id}')"
    >
      削除
    </button>

  </div>
  `;

}

function daysLeft(dateStr){

  const today =
    new Date();

  today.setHours(0,0,0,0);

  const target =
    new Date(dateStr);

  target.setHours(0,0,0,0);

  return Math.ceil(
    (target - today)
    / 86400000
  );

}

function labelDays(dateStr){

  const d =
    daysLeft(dateStr);

  if(d < 0){
    return `${Math.abs(d)}日前`;
  }

  if(d === 0){
    return "今日";
  }

  if(d === 1){
    return "明日";
  }

  return `あと${d}日`;

}

window.deleteReminder =
async function(id){

  await deleteDoc(
    doc(
      remindersRef,
      id
    )
  );

};

window.toggleDone =
async function(id, done){

  await updateDoc(
    doc(remindersRef, id),
    {
      done:!done
    }
  );

};
