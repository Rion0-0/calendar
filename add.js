async function addReminder() {
  addBtn.disabled = true;
  addBtn.textContent = "追加中...";

  try {
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
  } catch (error) {
    console.error(error);
    alert("追加に失敗した！Consoleの赤いエラー見て！");
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "追加";
  }
}
// add.js の末尾あたりに一旦追加
console.log("member options:", member.innerHTML);
console.log("kind options:", kind.innerHTML);
console.log("category options:", category.innerHTML);
