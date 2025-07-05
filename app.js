const form = document.getElementById("entryForm");
const list = document.getElementById("entryList");

let entries = JSON.parse(localStorage.getItem("entries")) || [];

function saveEntries() {
  localStorage.setItem("entries", JSON.stringify(entries));
}

function renderEntries(filtered = entries) {
  list.innerHTML = "";
  let cashTotal = 0;
  let dueTotal = 0;

  filtered.forEach((entry, index) => {
    const amount = parseFloat(entry.amount);
    if (entry.type === "cash") cashTotal += amount;
    else if (entry.type === "due") dueTotal += amount;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${entry.name}</strong> ➡️ Tk ${entry.amount}
      <br><small>${entry.note || ""}</small><br>
      📅 <small>${entry.date}</small> | 🏷️ <em>${entry.type === "cash" ? "নগদ" : "বাকি"}</em>
      <button onclick="editEntry(${index})">✏️</button>
      <button onclick="deleteEntry(${index})">✖</button>
    `;

    li.style.backgroundColor = entry.type === "cash" ? "#d6ffd6" : "#ffd6d6";
    list.appendChild(li);
  });

document.getElementById("cashTotal").innerText = `৳${cashTotal.toFixed(2)}`;
document.getElementById("dueTotal").innerText = `৳${dueTotal.toFixed(2)}`;
document.getElementById("grandTotal").innerText = `৳${(cashTotal + dueTotal).toFixed(2)}`;

  updateCustomerFilterOptions();
}

function deleteEntry(index) {
  if (!confirm('আপনি কি এই লেনদেন মুছে ফেলতে চান?')) return;
  entries.splice(index, 1);
  saveEntries();
  renderEntries();
}

function editEntry(index) {
  const entry = entries[index];
  document.getElementById("name").value = entry.name;
  document.getElementById("amount").value = entry.amount;
  document.getElementById("note").value = entry.note;
  document.getElementById("type").value = entry.type;
  entries.splice(index, 1);
  saveEntries();
  renderEntries();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;
  const note = document.getElementById("note").value;
  const type = document.getElementById("type").value;
  const date = new Date().toISOString().split("T")[0];

  entries.push({ name, amount, note, date, type });
  saveEntries();
  renderEntries();
  form.reset();
});

function filterByDate() {
  const selectedDate = document.getElementById("filterDate").value;
  if (!selectedDate) {
    renderEntries();
    return;
  }
  const filtered = entries.filter(entry => entry.date === selectedDate);
  renderEntries(filtered);
}

function updateCustomerFilterOptions() {
  const select = document.getElementById("filterCustomer");
  const customers = [...new Set(entries.map(e => e.name))].sort();
  select.innerHTML = '<option value="">-- কাস্টমার ফিল্টার --</option>';
  customers.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function filterByCustomer() {
  const selectedName = document.getElementById("filterCustomer").value;
  if (!selectedName) {
    renderEntries();
    return;
  }
  const filtered = entries.filter(e => e.name === selectedName);
  renderEntries(filtered);
}

async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("hisebkhata852@gmail.com", 14, 15);

  const tableData = entries.map((entry, i) => [
    i + 1,
    entry.name,
    `Tk ${entry.amount}`,
    entry.type === "cash" ? "cash" : "due",
    entry.note || '',
    entry.date
  ]);

  doc.autoTable({
    head: [["#", "name", "tk", "type", "explain", "date"]],
    body: tableData,
    startY: 25,
    styles: { font: "helvetica", fontSize: 10 },
    headStyles: { fillColor: [40, 167, 69] },
  });

  doc.save("hishab_report.pdf");
}

function exportBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "hishab_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importBackup() {
  document.getElementById('importFile').click();
}

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedEntries = JSON.parse(e.target.result);
      if (Array.isArray(importedEntries)) {
        entries = importedEntries;
        saveEntries();
        renderEntries();
        alert("ব্যাকআপ সফলভাবে ইমপোর্ট করা হয়েছে!");
      } else {
        alert("অবৈধ ফাইল ফরম্যাট।");
      }
    } catch {
      alert("ফাইল পড়তে সমস্যা হয়েছে।");
    }
  };
  reader.readAsText(file);
}

function generateMonthlyReport() {
  const monthlyTotals = {};

  entries.forEach(entry => {
    const [year, month] = entry.date.split("-");
    const key = `${year}-${month}`;
    if (!monthlyTotals[key]) {
      monthlyTotals[key] = { cash: 0, due: 0 };
    }
    const amount = parseFloat(entry.amount);
    if (entry.type === "cash") {
      monthlyTotals[key].cash += amount;
    } else if (entry.type === "due") {
      monthlyTotals[key].due += amount;
    }
  });

  let reportText = "📅 মাসিক রিপোর্ট:\n\n";
  Object.keys(monthlyTotals).sort().forEach(month => {
    const data = monthlyTotals[month];
    const total = data.cash + data.due;
    reportText += `🗓️ ${month}: নগদ = ৳${data.cash.toFixed(2)}, বাকি = ৳${data.due.toFixed(2)}, মোট = ৳${total.toFixed(2)}\n`;
  });

  alert(reportText);
}


async function generateMonthlyPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const monthlyTotals = {};
  entries.forEach(entry => {
    const [year, month] = entry.date.split("-");
    const key = `${year}-${month}`;
    if (!monthlyTotals[key]) {
      monthlyTotals[key] = { cash: 0, due: 0 };
    }
    const amount = parseFloat(entry.amount);
    if (entry.type === "cash") monthlyTotals[key].cash += amount;
    else if (entry.type === "due") monthlyTotals[key].due += amount;
  });

  const tableData = Object.keys(monthlyTotals).sort().map(month => {
    const cash = monthlyTotals[month].cash.toFixed(2);
    const due = monthlyTotals[month].due.toFixed(2);
    const total = (parseFloat(cash) + parseFloat(due)).toFixed(2);
    return [month, `${cash}`, `${due}`, `${total}`];
  });

  doc.setFontSize(16);
  doc.text("monthly hisebkhata report", 14, 15);

  doc.autoTable({
    head: [["month", "cash", "due", "total"]],
    body: tableData,
    startY: 25,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 167, 69] },
  });

  doc.save("monthly_hishab_report.pdf");
}

document.getElementById("searchInput").addEventListener("input", function () {
  const query = this.value.toLowerCase();
  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(query) ||
    (e.note && e.note.toLowerCase().includes(query))
  );
  renderEntries(filtered);
});

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

// পেজ লোড হলে ডার্ক মোড চালু থাকলে সেট করো
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
});

function updateReports() {
  const today = new Date().toISOString().split("T")[0];
  const todayCash = entries
    .filter(e => e.date === today && e.type === "cash")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyTotal = entries
    .filter(e => new Date(e.date) >= oneWeekAgo)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  document.getElementById("todayCash").innerText = `৳${todayCash.toFixed(2)}`;
  document.getElementById("weeklyTotal").innerText = `৳${weeklyTotal.toFixed(2)}`;
}

renderEntries();
updateReports();