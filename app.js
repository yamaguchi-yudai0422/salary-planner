const STORAGE_KEY = "salary-planner-v1";
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const WORKPLACE_COLORS = ["amber", "sage", "sky", "rose", "violet", "teal"];

const state = {
  viewDate: new Date(),
  selectedDate: formatDateKey(new Date()),
  monthSummary: formatMonthInput(new Date()),
  yearSummary: new Date().getFullYear(),
  currentView: "calendar",
  data: loadState(),
};

const elements = {
  calendarView: document.getElementById("calendarView"),
  entryView: document.getElementById("entryView"),
  summaryView: document.getElementById("summaryView"),
  templateView: document.getElementById("templateView"),
  calendarTitle: document.getElementById("calendarTitle"),
  weekdayHeader: document.getElementById("weekdayHeader"),
  calendarGrid: document.getElementById("calendarGrid"),
  selectedDateQuickLabel: document.getElementById("selectedDateQuickLabel"),
  selectedDayPayValue: document.getElementById("selectedDayPayValue"),
  selectedDayHoursValue: document.getElementById("selectedDayHoursValue"),
  selectedDayBreakdown: document.getElementById("selectedDayBreakdown"),
  selectedDateLabel: document.getElementById("selectedDateLabel"),
  openEntryEditorBtn: document.getElementById("openEntryEditorBtn"),
  backToCalendarBtn: document.getElementById("backToCalendarBtn"),
  addEntryRowBtn: document.getElementById("addEntryRowBtn"),
  entryRows: document.getElementById("entryRows"),
  dailyPayPreview: document.getElementById("dailyPayPreview"),
  monthSummaryInput: document.getElementById("monthSummaryInput"),
  monthlyPayValue: document.getElementById("monthlyPayValue"),
  monthlyHoursValue: document.getElementById("monthlyHoursValue"),
  monthlyShiftCountValue: document.getElementById("monthlyShiftCountValue"),
  workplaceMonthlySummary: document.getElementById("workplaceMonthlySummary"),
  yearSummarySelect: document.getElementById("yearSummarySelect"),
  yearlyPayValue: document.getElementById("yearlyPayValue"),
  yearlyHoursValue: document.getElementById("yearlyHoursValue"),
  heroMonthlyPay: document.getElementById("heroMonthlyPay"),
  heroYearlyPay: document.getElementById("heroYearlyPay"),
  entryForm: document.getElementById("entryForm"),
  resetEntryBtn: document.getElementById("resetEntryBtn"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  todayBtn: document.getElementById("todayBtn"),
  navCalendarBtn: document.getElementById("navCalendarBtn"),
  navSummaryBtn: document.getElementById("navSummaryBtn"),
  navTemplateBtn: document.getElementById("navTemplateBtn"),
  backToCalendarFromTemplateBtn: document.getElementById("backToCalendarFromTemplateBtn"),
  templateForm: document.getElementById("templateForm"),
  templateIdInput: document.getElementById("templateIdInput"),
  templateNameInput: document.getElementById("templateNameInput"),
  templateWageInput: document.getElementById("templateWageInput"),
  templateHoursInput: document.getElementById("templateHoursInput"),
  weekdayCheckboxes: document.getElementById("weekdayCheckboxes"),
  cancelTemplateEditBtn: document.getElementById("cancelTemplateEditBtn"),
  templateList: document.getElementById("templateList"),
};

init();

function init() {
  renderWeekdayHeader();
  renderWeekdayCheckboxes();
  bindEvents();
  refreshAll();
}

function bindEvents() {
  elements.prevMonthBtn.addEventListener("click", () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
    refreshAll();
  });

  elements.nextMonthBtn.addEventListener("click", () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
    refreshAll();
  });

  elements.todayBtn.addEventListener("click", () => {
    const now = new Date();
    state.viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    state.selectedDate = formatDateKey(now);
    refreshAll();
  });

  elements.openEntryEditorBtn.addEventListener("click", () => setView("entry"));
  elements.backToCalendarBtn.addEventListener("click", () => setView("calendar"));
  elements.navCalendarBtn.addEventListener("click", () => setView("calendar"));
  elements.navSummaryBtn.addEventListener("click", () => setView("summary"));
  elements.navTemplateBtn.addEventListener("click", () => setView("template"));

  elements.addEntryRowBtn.addEventListener("click", () => {
    const items = getDraftEntryItems();
    items.push(createEntryItemDraft());
    renderEntryRows(items);
    updateDailyPreview();
  });

  elements.entryRows.addEventListener("change", handleEntryRowsChange);
  elements.entryRows.addEventListener("input", handleEntryRowsChange);
  elements.entryRows.addEventListener("click", handleEntryRowsClick);
  elements.monthSummaryInput.addEventListener("change", (event) => {
    state.monthSummary = event.target.value;
    renderSummaries();
  });
  elements.yearSummarySelect.addEventListener("change", (event) => {
    state.yearSummary = Number(event.target.value);
    renderSummaries();
  });

  elements.entryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSelectedEntry();
  });

  elements.resetEntryBtn.addEventListener("click", () => {
    delete state.data.entries[state.selectedDate];
    persist();
    refreshAll();
  });

  elements.backToCalendarFromTemplateBtn.addEventListener("click", () => setView("calendar"));
  elements.cancelTemplateEditBtn.addEventListener("click", resetTemplateForm);

  elements.templateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTemplate();
  });
}

function refreshAll() {
  renderCalendar();
  renderTemplateOptions();
  renderEntryForm();
  renderSelectedDaySummary();
  renderYearOptions();
  renderSummaries();
  renderTemplateList();
  setView(state.currentView);
}

function renderWeekdayHeader() {
  elements.weekdayHeader.innerHTML = WEEKDAYS.map((day) => `<span>${day}</span>`).join("");
}

function renderWeekdayCheckboxes() {
  elements.weekdayCheckboxes.innerHTML = WEEKDAYS.map((day, index) => `
    <label class="weekday-option">
      <input type="checkbox" value="${index}">
      <span>${day}</span>
    </label>
  `).join("");
}

function renderCalendar() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  elements.calendarTitle.textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  const todayKey = formatDateKey(new Date());
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + index);
    const dateKey = formatDateKey(cellDate);
    const effective = getEffectiveEntry(dateKey);
    const isSelected = dateKey === state.selectedDate;
    const isOutside = cellDate.getMonth() !== month;
    const isToday = dateKey === todayKey;

    cells.push(`
      <button class="calendar-day ${isSelected ? "selected" : ""} ${isOutside ? "outside" : ""} ${isToday ? "today" : ""}" type="button" data-date="${dateKey}">
        <div class="day-topline">
          <span class="day-number">${cellDate.getDate()}</span>
          ${effective?.items?.length ? `<span class="day-count">${effective.items.length}件</span>` : ""}
        </div>
        <div class="day-meta compact">
          ${effective ? `<span class="pay-chip ${getWorkplaceAccentClass(effective.items)}">¥${formatNumber(effective.pay)}</span>` : `<span class="empty-text">入力なし</span>`}
        </div>
      </button>
    `);
  }

  elements.calendarGrid.innerHTML = cells.join("");
  elements.calendarGrid.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDate = button.dataset.date;
      const picked = parseDateKey(state.selectedDate);
      state.viewDate = new Date(picked.getFullYear(), picked.getMonth(), 1);
      refreshAll();
    });
  });
}

function renderEntryForm() {
  const selected = parseDateKey(state.selectedDate);
  const label = `${selected.getFullYear()}年${selected.getMonth() + 1}月${selected.getDate()}日`;
  elements.selectedDateLabel.textContent = label;
  elements.selectedDateQuickLabel.textContent = label;

  const effective = getEffectiveEntry(state.selectedDate);
  const items = effective?.items?.length ? effective.items : [createEntryItemDraft()];
  renderEntryRows(items);
  updateDailyPreview();
}

function renderSelectedDaySummary() {
  const effective = getEffectiveEntry(state.selectedDate);
  if (!effective) {
    elements.selectedDayPayValue.textContent = "¥0";
    elements.selectedDayHoursValue.textContent = "合計 0 時間 / 0 件";
    elements.selectedDayBreakdown.innerHTML = '<p class="selected-day-empty">まだ明細がありません</p>';
    return;
  }

  elements.selectedDayPayValue.textContent = `¥${formatNumber(effective.pay)}`;
  elements.selectedDayHoursValue.textContent = `合計 ${trimNumber(effective.hours)} 時間 / ${effective.items.length} 件`;
  elements.selectedDayBreakdown.innerHTML = effective.items.map((item, index) => `
    <div class="selected-day-line ${getWorkplaceAccentClass([item])}">
      <span>${escapeHtml(item.workplaceName || `${index + 1}件目`)}</span>
      <strong>¥${formatNumber(item.hourlyWage * item.hours)}</strong>
      <small>${item.startTime && item.endTime ? `${item.startTime} - ${item.endTime} / ` : ""}¥${formatNumber(item.hourlyWage)} / ${trimNumber(item.hours)}時間</small>
      ${item.memo ? `<small class="selected-day-note">${escapeHtml(item.memo)}</small>` : ""}
    </div>
  `).join("");
}

function renderTemplateOptions() {
  if (elements.entryRows.children.length > 0) {
    renderEntryRows(getDraftEntryItems());
  }
}

function renderSummaries() {
  const monthly = calculateMonthSummary(state.monthSummary);
  const yearly = calculateYearSummary(state.yearSummary);
  const currentMonth = calculateMonthSummary(formatMonthInput(state.viewDate));
  const currentYear = calculateYearSummary(state.viewDate.getFullYear());

  elements.monthlyPayValue.textContent = `¥${formatNumber(monthly.pay)}`;
  elements.monthlyHoursValue.textContent = `合計 ${trimNumber(monthly.hours)} 時間`;
  elements.monthlyShiftCountValue.textContent = `${monthly.shiftCount}回`;
  elements.yearlyPayValue.textContent = `¥${formatNumber(yearly.pay)}`;
  elements.yearlyHoursValue.textContent = `合計 ${trimNumber(yearly.hours)} 時間`;
  elements.heroMonthlyPay.textContent = `¥${formatNumber(currentMonth.pay)}`;
  elements.heroYearlyPay.textContent = `¥${formatNumber(currentYear.pay)}`;
  renderWorkplaceMonthlySummary(monthly.workplaces);
}

function renderYearOptions() {
  const years = new Set([new Date().getFullYear(), state.viewDate.getFullYear(), state.yearSummary]);

  Object.keys(state.data.entries).forEach((dateKey) => years.add(parseDateKey(dateKey).getFullYear()));
  state.data.templates.forEach(() => years.add(new Date().getFullYear()));

  const sortedYears = Array.from(years).sort((a, b) => a - b);
  elements.yearSummarySelect.innerHTML = sortedYears.map((year) => `<option value="${year}">${year}年</option>`).join("");
  elements.yearSummarySelect.value = String(state.yearSummary);
  elements.monthSummaryInput.value = state.monthSummary;
}

function renderTemplateList() {
  if (state.data.templates.length === 0) {
    elements.templateList.innerHTML = `<div class="template-item"><p class="template-name">テンプレはまだありません</p><div class="template-meta"><span>下のフォームから作成してください。</span></div></div>`;
    return;
  }

  elements.templateList.innerHTML = state.data.templates.map((template) => `
    <article class="template-item">
      <div class="template-item-header">
        <div>
          <p class="template-name">${escapeHtml(template.name)}</p>
          <div class="template-meta">
            <span>時給 ¥${formatNumber(template.hourlyWage)}</span>
            <span>労働時間 ${trimNumber(template.hours)} 時間</span>
            <span>曜日 ${template.weekdays.length ? template.weekdays.map((day) => WEEKDAYS[day]).join("・") : "指定なし"}</span>
          </div>
        </div>
        <div class="button-row">
          <button class="ghost-btn" type="button" data-edit-template="${template.id}">編集</button>
          <button class="ghost-btn" type="button" data-delete-template="${template.id}">削除</button>
        </div>
      </div>
    </article>
  `).join("");

  elements.templateList.querySelectorAll("[data-edit-template]").forEach((button) => {
    button.addEventListener("click", () => editTemplate(button.dataset.editTemplate));
  });

  elements.templateList.querySelectorAll("[data-delete-template]").forEach((button) => {
    button.addEventListener("click", () => deleteTemplate(button.dataset.deleteTemplate));
  });
}

function onTemplateSelectionChange() {
  updateDailyPreview();
}

function updateDailyPreview() {
  const totalPay = getDraftEntryItems().reduce((sum, item) => {
    const wage = Number(item.hourlyWage) || 0;
    const hours = Number(item.hours) || 0;
    return sum + wage * hours;
  }, 0);
  elements.dailyPayPreview.textContent = `¥${formatNumber(totalPay)}`;
}

function saveSelectedEntry() {
  const items = sanitizeEntryItems(getDraftEntryItems());
  if (items.length === 0) {
    return;
  }

  state.data.entries[state.selectedDate] = {
    date: state.selectedDate,
    items,
  };

  persist();
  refreshAll();
  setView("calendar");
}

function saveTemplate() {
  const name = elements.templateNameInput.value.trim();
  const hourlyWage = Number(elements.templateWageInput.value);
  const hours = Number(elements.templateHoursInput.value);
  const weekdays = Array.from(elements.weekdayCheckboxes.querySelectorAll("input:checked")).map((input) => Number(input.value));

  if (!name || !hourlyWage || !hours) {
    return;
  }

  const payload = {
    id: elements.templateIdInput.value || crypto.randomUUID(),
    name,
    hourlyWage,
    hours,
    weekdays,
  };

  const existingIndex = state.data.templates.findIndex((template) => template.id === payload.id);
  if (existingIndex >= 0) {
    state.data.templates[existingIndex] = payload;
  } else {
    state.data.templates.push(payload);
  }

  persist();
  resetTemplateForm();
  refreshAll();
}

function editTemplate(templateId) {
  const template = state.data.templates.find((item) => item.id === templateId);
  if (!template) {
    return;
  }

  elements.templateIdInput.value = template.id;
  elements.templateNameInput.value = template.name;
  elements.templateWageInput.value = template.hourlyWage;
  elements.templateHoursInput.value = template.hours;
  elements.weekdayCheckboxes.querySelectorAll("input").forEach((input) => {
    input.checked = template.weekdays.includes(Number(input.value));
  });
}

function deleteTemplate(templateId) {
  state.data.templates = state.data.templates.filter((template) => template.id !== templateId);

  Object.keys(state.data.entries).forEach((dateKey) => {
    const entry = state.data.entries[dateKey];
    if (!entry?.items) {
      return;
    }
    entry.items = entry.items.map((item) => ({
      ...item,
      templateId: item.templateId === templateId ? null : item.templateId,
    }));
  });

  persist();
  resetTemplateForm();
  refreshAll();
}

function resetTemplateForm() {
  elements.templateForm.reset();
  elements.templateIdInput.value = "";
}

function setView(view) {
  state.currentView = view;
  elements.calendarView.classList.toggle("active", view === "calendar");
  elements.entryView.classList.toggle("active", view === "entry");
  elements.summaryView.classList.toggle("active", view === "summary");
  elements.templateView.classList.toggle("active", view === "template");
  elements.navCalendarBtn.classList.toggle("active", view === "calendar" || view === "entry");
  elements.navSummaryBtn.classList.toggle("active", view === "summary");
  elements.navTemplateBtn.classList.toggle("active", view === "template");
}

function calculateMonthSummary(monthInput) {
  const [yearString, monthString] = monthInput.split("-");
  const year = Number(yearString);
  const month = Number(monthString) - 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  let pay = 0;
  let hours = 0;
  let shiftCount = 0;
  const workplaces = {};

  for (let day = 1; day <= lastDay; day += 1) {
    const key = formatDateKey(new Date(year, month, day));
    const effective = getEffectiveEntry(key);
    if (effective) {
      pay += effective.pay;
      hours += effective.hours;
      shiftCount += effective.items.length;
      effective.items.forEach((item) => {
        const workplaceName = item.workplaceName || "未設定";
        if (!workplaces[workplaceName]) {
          workplaces[workplaceName] = { pay: 0, hours: 0, count: 0 };
        }
        workplaces[workplaceName].pay += (Number(item.hourlyWage) || 0) * (Number(item.hours) || 0);
        workplaces[workplaceName].hours += Number(item.hours) || 0;
        workplaces[workplaceName].count += 1;
      });
    }
  }

  return { pay, hours, shiftCount, workplaces };
}

function calculateYearSummary(year) {
  let pay = 0;
  let hours = 0;

  for (let month = 0; month < 12; month += 1) {
    const monthly = calculateMonthSummary(`${year}-${String(month + 1).padStart(2, "0")}`);
    pay += monthly.pay;
    hours += monthly.hours;
  }

  return { pay, hours };
}

function renderWorkplaceMonthlySummary(workplaces) {
  const entries = Object.entries(workplaces || {}).sort((a, b) => b[1].pay - a[1].pay);
  if (entries.length === 0) {
    elements.workplaceMonthlySummary.innerHTML = '<p class="selected-day-empty">まだ勤務先別のデータがありません</p>';
    return;
  }

  elements.workplaceMonthlySummary.innerHTML = entries.map(([name, summary]) => `
    <div class="workplace-summary-item ${getWorkplaceAccentClass([{ workplaceName: name }])}">
      <span>${escapeHtml(name)}</span>
      <strong>¥${formatNumber(summary.pay)}</strong>
      <small>${trimNumber(summary.hours)}時間 / ${summary.count}回</small>
    </div>
  `).join("");
}

function getEffectiveEntry(dateKey) {
  const saved = state.data.entries[dateKey];
  if (saved) {
    const items = normalizeEntryItems(saved.items || [saved]);
    const summary = summarizeItems(items);
    return {
      items,
      hours: summary.hours,
      pay: summary.pay,
      source: "entry",
    };
  }

  const date = parseDateKey(dateKey);
  const templates = state.data.templates.filter((item) => item.weekdays.includes(date.getDay()));
  if (templates.length === 0) {
    return null;
  }

  const items = templates.map((template) => ({
    id: crypto.randomUUID(),
    workplaceName: template.name,
    templateId: template.id,
    hourlyWage: Number(template.hourlyWage) || 0,
    hours: Number(template.hours) || 0,
    label: template.name,
  }));
  const summary = summarizeItems(items);

  return {
    items,
    hours: summary.hours,
    pay: summary.pay,
    source: "template",
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      entries: parsed?.entries || {},
      templates: parsed?.templates || [],
    };
  } catch (error) {
    return { entries: {}, templates: [] };
  }
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ja-JP");
}

function trimNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function renderEntryRows(items) {
  elements.entryRows.innerHTML = items.map((item, index) => `
    <div class="entry-row" data-entry-row="${index}" data-item-id="${item.id || crypto.randomUUID()}">
      <span class="entry-row-index">${index + 1}件目</span>
      <div class="entry-row-grid">
        <label>
          勤務先名
          <input data-field="workplaceName" type="text" maxlength="40" placeholder="例: コンビニ" value="${escapeAttribute(item.workplaceName ?? "")}">
        </label>
        <label>
          テンプレ選択
          <select data-field="templateId">
            ${buildTemplateOptions(item.templateId)}
          </select>
        </label>
        <label>
          時給
          <input data-field="hourlyWage" type="number" min="0" step="1" placeholder="例: 1100" value="${item.hourlyWage ?? ""}">
        </label>
        <label>
          開始
          <input data-field="startTime" type="time" value="${item.startTime ?? ""}">
        </label>
        <label>
          終了
          <input data-field="endTime" type="time" value="${item.endTime ?? ""}">
        </label>
        <label>
          労働時間
          <input data-field="hours" type="number" min="0" step="0.25" placeholder="例: 6.5" value="${item.hours ?? ""}">
        </label>
        <button class="ghost-btn entry-row-delete" type="button" data-delete-row="${index}">削除</button>
      </div>
      <label>
        メモ
        <input data-field="memo" type="text" maxlength="120" placeholder="例: 交通費あり、ヘルプ出勤" value="${escapeAttribute(item.memo ?? "")}">
      </label>
    </div>
  `).join("");
}

function buildTemplateOptions(selectedTemplateId) {
  const options = [`<option value="">テンプレなし</option>`];
  state.data.templates.forEach((template) => {
    const selected = template.id === selectedTemplateId ? "selected" : "";
    options.push(`<option value="${template.id}" ${selected}>${escapeHtml(template.name)}</option>`);
  });
  return options.join("");
}

function handleEntryRowsChange(event) {
  const row = event.target.closest("[data-entry-row]");
  if (!row) {
    return;
  }

  if (event.target.dataset.field === "templateId") {
    const template = state.data.templates.find((item) => item.id === event.target.value);
    if (template) {
      row.querySelector('[data-field="hourlyWage"]').value = template.hourlyWage;
      row.querySelector('[data-field="hours"]').value = template.hours;
    }
  }

  if (event.target.dataset.field === "startTime" || event.target.dataset.field === "endTime") {
    syncHoursFromTimeRange(row);
  }

  updateDailyPreview();
}

function handleEntryRowsClick(event) {
  const deleteButton = event.target.closest("[data-delete-row]");
  if (!deleteButton) {
    return;
  }

  const index = Number(deleteButton.dataset.deleteRow);
  const items = getDraftEntryItems().filter((_, itemIndex) => itemIndex !== index);
  renderEntryRows(items.length > 0 ? items : [createEntryItemDraft()]);
  updateDailyPreview();
}

function getDraftEntryItems() {
  return Array.from(elements.entryRows.querySelectorAll("[data-entry-row]")).map((row) => ({
    id: row.dataset.itemId || crypto.randomUUID(),
    workplaceName: row.querySelector('[data-field="workplaceName"]').value.trim(),
    templateId: row.querySelector('[data-field="templateId"]').value || null,
    hourlyWage: row.querySelector('[data-field="hourlyWage"]').value,
    startTime: row.querySelector('[data-field="startTime"]').value || "",
    endTime: row.querySelector('[data-field="endTime"]').value || "",
    hours: row.querySelector('[data-field="hours"]').value,
    memo: row.querySelector('[data-field="memo"]').value.trim(),
  }));
}

function sanitizeEntryItems(items) {
  return items
    .map((item) => ({
      id: item.id || crypto.randomUUID(),
      workplaceName: item.workplaceName || "",
      templateId: item.templateId || null,
      hourlyWage: Number(item.hourlyWage),
      startTime: item.startTime || "",
      endTime: item.endTime || "",
      hours: Number(item.hours),
      memo: item.memo || "",
    }))
    .filter((item) => item.hourlyWage > 0 && item.hours > 0);
}

function normalizeEntryItems(items) {
  return items.map((item) => ({
    id: item.id || crypto.randomUUID(),
    workplaceName: item.workplaceName || item.label || "",
    templateId: item.templateId || null,
    hourlyWage: Number(item.hourlyWage) || 0,
    startTime: item.startTime || "",
    endTime: item.endTime || "",
    hours: Number(item.hours) || 0,
    memo: item.memo || "",
  })).filter((item) => item.hourlyWage > 0 && item.hours > 0);
}

function summarizeItems(items) {
  return items.reduce((summary, item) => {
    summary.hours += Number(item.hours) || 0;
    summary.pay += (Number(item.hourlyWage) || 0) * (Number(item.hours) || 0);
    return summary;
  }, { hours: 0, pay: 0 });
}

function createEntryItemDraft() {
  return {
    id: crypto.randomUUID(),
    workplaceName: "",
    templateId: null,
    hourlyWage: "",
    startTime: "",
    endTime: "",
    hours: "",
    memo: "",
  };
}

function getWorkplaceAccentClass(items) {
  const workplaceName = items.find((item) => item.workplaceName)?.workplaceName || "default";
  const colorIndex = getStableIndex(workplaceName, WORKPLACE_COLORS.length);
  return `accent-${WORKPLACE_COLORS[colorIndex]}`;
}

function getStableIndex(value, modulo) {
  let total = 0;
  for (const char of value) {
    total += char.charCodeAt(0);
  }
  return total % modulo;
}

function syncHoursFromTimeRange(row) {
  const startTime = row.querySelector('[data-field="startTime"]').value;
  const endTime = row.querySelector('[data-field="endTime"]').value;
  if (!startTime || !endTime) {
    return;
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    return;
  }

  const hours = (endMinutes - startMinutes) / 60;
  row.querySelector('[data-field="hours"]').value = trimNumber(hours);
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
