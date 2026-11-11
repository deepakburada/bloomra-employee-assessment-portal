const EMPLOYEE_PASSWORD = "123";
const ADMIN_USERNAME = "bloomara";
const ADMIN_PASSWORD = "000";
const RESULTS_KEY = "bloomraEmployeeResults_v2";
const ATTEMPTS_KEY = "bloomraEmployeeAttempts_v2";
const $ = id => document.getElementById(id);
const views = ["loginView", "examView", "resultView", "adminView"];
let activeDepartment = "", activeEmployee = "", answers = {};

function normalize(value) { return String(value || "").trim().toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " "); }
function show(viewId) { views.forEach(id => $(id).classList.toggle("hidden", id !== viewId)); window.scrollTo(0, 0); }
function getResults() { try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || "[]"); } catch { return []; } }
function getAttempts() { try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "{}"); } catch { return {}; } }
function employeeIdentity(raw) {
  const value = raw.trim();
  const dept = Object.keys(EXAM_DATA).sort((a,b) => b.length-a.length).find(name => normalize(value).endsWith(" - " + normalize(name)));
  if (!dept) return null;
  const name = value.slice(0, value.length - dept.length - 3).trim().replace(/\s+/g, " ");
  if (name.length < 2) return null;
  return { name, department: dept, key: normalize(name) + "::" + normalize(dept) };
}

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const username = $("username").value.trim(), password = $("password").value;
  $("loginError").textContent = "";
  if (normalize(username) === ADMIN_USERNAME && password === ADMIN_PASSWORD) { renderAdmin(); show("adminView"); return; }
  const identity = employeeIdentity(username);
  if (!identity || password !== EMPLOYEE_PASSWORD) {
    $("loginError").textContent = "Login not recognized. Use: Your Name - Department, with employee password 123."; return;
  }
  const attempts = getAttempts();
  if (attempts[identity.key] || getResults().some(r => r.employeeKey === identity.key)) {
    $("loginError").textContent = "An assessment has already been submitted for this employee in this browser."; return;
  }
  activeEmployee = identity.name; activeDepartment = identity.department; answers = {};
  $("departmentTitle").textContent = activeDepartment; $("employeeTitle").textContent = "Employee: " + activeEmployee;
  renderQuestions(); show("examView");
});

function renderQuestions() {
  const list = $("questions"); list.innerHTML = "";
  EXAM_DATA[activeDepartment].forEach(q => {
    const card = document.createElement("section"); card.className = "question-card";
    const top = document.createElement("div"); top.className = "question-top";
    const num = document.createElement("span"); num.className = "q-number"; num.textContent = `Q${q.id}`;
    const title = document.createElement("h3"); title.textContent = q.question; top.append(num, title); card.append(top);
    Object.entries(q.options).forEach(([letter, label]) => {
      const option = document.createElement("label"); option.className = "option";
      const radio = document.createElement("input"); radio.type = "radio"; radio.name = `q${q.id}`; radio.value = letter;
      radio.addEventListener("change", () => { answers[q.id] = letter; updateProgress(); });
      const text = document.createElement("span"); text.textContent = `${letter}. ${label}`; option.append(radio, text); card.append(option);
    }); list.append(card);
  }); updateProgress();
}
function updateProgress() {
  const total = EXAM_DATA[activeDepartment].length, count = Object.keys(answers).length;
  $("progressText").textContent = `${count} of ${total} answered`; $("answeredText").textContent = `${count}/${total}`;
  $("progressBar").style.width = `${count / total * 100}%`;
}

$("examForm").addEventListener("submit", event => {
  event.preventDefault();
  const qs = EXAM_DATA[activeDepartment], unanswered = qs.filter(q => !answers[q.id]);
  if (unanswered.length && !confirm(`${unanswered.length} question(s) are unanswered. Submit anyway?`)) return;
  const correct = qs.filter(q => answers[q.id] === q.answer).length;
  const result = { id: Date.now().toString(), employee: activeEmployee, employeeKey: normalize(activeEmployee) + "::" + normalize(activeDepartment), department: activeDepartment, answers: {...answers}, correct, total: qs.length, submittedAt: new Date().toISOString() };
  const results = getResults(); results.push(result); localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  const attempts = getAttempts(); attempts[result.employeeKey] = true; localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  showResults(result); show("resultView");
});
function showResults(result) {
  const qs = EXAM_DATA[result.department], pct = Math.round(result.correct / result.total * 100);
  $("resultIdentity").textContent = `${result.employee} · ${result.department}`; $("percentage").textContent = pct + "%";
  $("scoreRing").style.setProperty("--score", pct + "%"); $("correctCount").textContent = result.correct;
  $("wrongCount").textContent = result.total - result.correct; $("totalCount").textContent = result.total;
  const review = $("reviewList"); review.innerHTML = "";
  qs.forEach(q => {
    const chosen = result.answers[q.id] || "Not answered", isRight = chosen === q.answer;
    const item = document.createElement("article"); item.className = "review-item";
    const h = document.createElement("h4"); h.textContent = `Q${q.id}. ${q.question}`; item.append(h);
    const your = document.createElement("p"); your.className = "review-line"; your.textContent = `Your answer: ${chosen === "Not answered" ? chosen : chosen + ". " + q.options[chosen]}`; if (!isRight) your.classList.add("wrong-answer"); item.append(your);
    const correct = document.createElement("p"); correct.className = "review-line correct-answer"; correct.textContent = `Correct answer: ${q.answer}. ${q.options[q.answer]}`; item.append(correct);
    const status = document.createElement("p"); status.className = "review-line"; status.textContent = isRight ? "Result: Correct" : "Result: Incorrect"; item.append(status); review.append(item);
  });
}

function renderAdmin() {
  const results = getResults(); const avg = results.length ? Math.round(results.reduce((s,r)=>s + r.correct/r.total*100,0)/results.length) : 0;
  $("adminTotal").textContent = results.length; $("adminAverage").textContent = avg + "%";
  $("adminDepartments").textContent = new Set(results.map(r=>r.department)).size;
  const search = normalize($("resultSearch").value); const filtered = results.filter(r => normalize(r.employee + " " + r.department).includes(search)).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));
  const body = $("resultsBody"); body.innerHTML = ""; $("emptyResults").classList.toggle("hidden", filtered.length > 0);
  filtered.forEach(r => {
    const tr = document.createElement("tr"); const pct = Math.round(r.correct/r.total*100);
    [r.employee,r.department,`${r.correct}/${r.total}`,pct+"%",new Date(r.submittedAt).toLocaleString()].forEach(value=>{const td=document.createElement("td");td.textContent=value;tr.append(td);});
    const td=document.createElement("td"), btn=document.createElement("button");btn.className="table-button";btn.textContent="View";btn.addEventListener("click",()=>showAdminDetail(r));td.append(btn);tr.append(td);body.append(tr);
  });
}
function showAdminDetail(r) {
  const box=$("adminDetail");box.innerHTML="";box.classList.remove("hidden");
  const heading=document.createElement("h3");heading.textContent=`${r.employee} — ${r.department} — ${r.correct}/${r.total} (${Math.round(r.correct/r.total*100)}%)`;box.append(heading);
  EXAM_DATA[r.department].forEach(q=>{const p=document.createElement("p");const selected=r.answers[q.id]||"Not answered";p.textContent=`Q${q.id}: Employee: ${selected} | Correct: ${q.answer}`;box.append(p);});
  box.scrollIntoView({behavior:"smooth",block:"start"});
}
$("resultSearch").addEventListener("input",renderAdmin); $("refreshBtn").addEventListener("click",renderAdmin);
$("exportBtn").addEventListener("click",()=>{
  const rows=[["Employee","Department","Score","Total","Percentage","Submitted"]];
  getResults().forEach(r=>rows.push([r.employee,r.department,r.correct,r.total,Math.round(r.correct/r.total*100)+"%",new Date(r.submittedAt).toLocaleString()]));
  const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="bloomra-employee-results.csv";a.click();URL.revokeObjectURL(url);
});
function logout(){activeDepartment="";activeEmployee="";answers={};$("loginForm").reset();$("loginError").textContent="";show("loginView");}
$("logoutBtn").addEventListener("click",logout);$("adminLogoutBtn").addEventListener("click",logout);$("resultLogoutBtn").addEventListener("click",logout);
