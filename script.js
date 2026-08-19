// Script.js

// State Management
let schedules = JSON.parse(localStorage.getItem('unimanage_schedules')) || [];
let jadwalMingguan = JSON.parse(localStorage.getItem('unimanage_jadwal_mingguan')) || [];
let tasks = JSON.parse(localStorage.getItem('unimanage_tasks')) || [];
let notes = JSON.parse(localStorage.getItem('unimanage_notes')) || [];

// DOM Elements
const sections = document.querySelectorAll('.page-section');
const navItems = document.querySelectorAll('.nav-item');

const APP_VERSION = 'v1.0.0';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAppVersion();
    updateDateAndGreeting();
    setupNavigation();
    setupJadwal();
    setupTugas();
    setupCatatan();
    updateDashboard();
});

function checkAppVersion() {
    const lastVersion = localStorage.getItem('unimanage_version');
    if (lastVersion !== APP_VERSION) {
        // Show update modal
        const updateModal = document.getElementById('update-modal');
        updateModal.classList.remove('hidden');

        document.getElementById('btn-close-update').addEventListener('click', () => {
            updateModal.classList.add('hidden');
            localStorage.setItem('unimanage_version', APP_VERSION);
        }, { once: true });
    }
}

// Navigation Logic
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            // Add active to clicked
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Update dashboard if navigating to it
            if (targetId === 'dashboard-section') updateDashboard();
        });
    });
}

function updateDateAndGreeting() {
    const dateElement = document.getElementById('current-date');
    const greetingElement = document.getElementById('greeting-text');

    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('id-ID', options);

    const hour = now.getHours();
    let greeting = 'Selamat Pagi';
    if (hour >= 12 && hour < 15) greeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
    else if (hour >= 18) greeting = 'Selamat Malam';

    greetingElement.textContent = `${greeting}, Mahasiswa!`;
}

// ==========================================
// JADWAL LOGIC
// ==========================================
function setupJadwal() {
    const btnAdd = document.getElementById('btn-add-jadwal');
    const btnCancelKuliah = document.getElementById('btn-cancel-jadwal');
    const formContainerKuliah = document.getElementById('jadwal-form-container');
    const formKuliah = document.getElementById('jadwal-form');
    const dayTabs = document.querySelectorAll('.day-tab');

    // Sub-tabs
    const tabKuliah = document.getElementById('tab-jadwal-kuliah');
    const tabMingguan = document.getElementById('tab-jadwal-mingguan');
    const viewKuliah = document.getElementById('view-jadwal-kuliah');
    const viewMingguan = document.getElementById('view-jadwal-mingguan');
    let activeTab = 'kuliah';

    tabKuliah.addEventListener('click', () => {
        tabKuliah.classList.add('active');
        tabMingguan.classList.remove('active');
        viewKuliah.classList.remove('hidden');
        viewMingguan.classList.add('hidden');
        activeTab = 'kuliah';
        formContainerKuliah.classList.add('hidden');
        document.getElementById('jadwal-mingguan-form-container').classList.add('hidden');
    });

    tabMingguan.addEventListener('click', () => {
        tabMingguan.classList.add('active');
        tabKuliah.classList.remove('active');
        viewMingguan.classList.remove('hidden');
        viewKuliah.classList.add('hidden');
        activeTab = 'mingguan';
        formContainerKuliah.classList.add('hidden');
        document.getElementById('jadwal-mingguan-form-container').classList.add('hidden');
    });

    let currentDayFilter = 'Senin';

    btnAdd.addEventListener('click', () => {
        if (activeTab === 'kuliah') {
            formContainerKuliah.classList.remove('hidden');
        } else {
            document.getElementById('jadwal-mingguan-form-container').classList.remove('hidden');
        }
    });

    btnCancelKuliah.addEventListener('click', () => {
        formContainerKuliah.classList.add('hidden');
        formKuliah.reset();
    });

    formKuliah.addEventListener('submit', (e) => {
        e.preventDefault();
        const matkul = document.getElementById('jadwal-mata-kuliah').value;
        const hari = document.getElementById('jadwal-hari').value;
        const mulai = document.getElementById('jadwal-waktu').value;
        const selesai = document.getElementById('jadwal-waktu-selesai').value;
        const ruangan = document.getElementById('jadwal-ruangan').value;

        const newJadwal = {
            id: Date.now().toString(),
            matkul, hari, mulai, selesai, ruangan
        };

        schedules.push(newJadwal);
        saveData('schedules', schedules);
        formKuliah.reset();
        formContainerKuliah.classList.add('hidden');
        renderJadwal(currentDayFilter);
        updateDashboard();
        showToast('Jadwal ditambahkan!');
    });

    dayTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dayTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDayFilter = tab.getAttribute('data-day');
            renderJadwal(currentDayFilter);
        });
    });

    renderJadwal(currentDayFilter);
    setupJadwalMingguan();
}

function setupJadwalMingguan() {
    const formContainer = document.getElementById('jadwal-mingguan-form-container');
    const form = document.getElementById('jadwal-mingguan-form');
    const btnCancel = document.getElementById('btn-cancel-jm');

    btnCancel.addEventListener('click', () => {
        formContainer.classList.add('hidden');
        form.reset();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nama = document.getElementById('jm-nama').value;
        const tanggal = document.getElementById('jm-tanggal').value;
        const waktu = document.getElementById('jm-waktu').value;
        const lokasi = document.getElementById('jm-lokasi').value;

        const newEvent = {
            id: Date.now().toString(),
            nama, tanggal, waktu, lokasi
        };

        jadwalMingguan.push(newEvent);
        saveData('jadwalMingguan', jadwalMingguan);
        form.reset();
        formContainer.classList.add('hidden');
        renderJadwalMingguan();
        showToast('Jadwal Mingguan ditambahkan!');
    });

    renderJadwalMingguan();
}

function renderJadwalMingguan() {
    const container = document.getElementById('jadwal-mingguan-list');
    container.innerHTML = '';

    const now = new Date();

    // Filter out past schedules and sort by nearest date/time
    const validSchedules = jadwalMingguan.filter(a => new Date(`${a.tanggal}T${a.waktu}`) >= now);
    const sorted = [...validSchedules].sort((a, b) => new Date(`${a.tanggal}T${a.waktu}`) - new Date(`${b.tanggal}T${b.waktu}`));

    if (sorted.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Tidak ada jadwal khusus minggu ini.</p>';
        return;
    }

    sorted.forEach(s => {
        const div = document.createElement('div');
        div.className = 'schedule-item';
        div.innerHTML = `
            <div class="schedule-info">
                <h3>${s.nama}</h3>
                <p><i class='bx bx-calendar'></i> ${formatDate(s.tanggal)} &nbsp;|&nbsp; <i class='bx bx-time'></i> ${s.waktu}</p>
                <p><i class='bx bx-map'></i> ${s.lokasi || 'Tidak ditentukan'}</p>
            </div>
            <div class="item-actions">
                <button class="icon-btn delete" onclick="deleteJadwalMingguan('${s.id}')"><i class='bx bx-trash'></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.deleteJadwalMingguan = function (id) {
    showConfirmModal('Hapus kegiatan ini?', () => {
        jadwalMingguan = jadwalMingguan.filter(s => s.id !== id);
        saveData('jadwalMingguan', jadwalMingguan);
        renderJadwalMingguan();
        showToast('Kegiatan dihapus!');
    });
}

function renderJadwal(dayFilter) {
    const container = document.getElementById('jadwal-list');
    container.innerHTML = '';

    const filtered = schedules.filter(s => s.hari === dayFilter);
    // Sort by time
    filtered.sort((a, b) => a.mulai.localeCompare(b.mulai));

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Tidak ada jadwal di hari ini.</p>';
        return;
    }

    filtered.forEach(s => {
        const div = document.createElement('div');
        div.className = 'schedule-item';
        div.innerHTML = `
            <div class="schedule-info">
                <h3>${s.matkul}</h3>
                <p><i class='bx bx-time'></i> ${s.mulai} - ${s.selesai} &nbsp;|&nbsp; <i class='bx bx-map'></i> ${s.ruangan || 'Tidak ditentukan'}</p>
            </div>
            <div class="item-actions">
                <button class="icon-btn delete" onclick="deleteJadwal('${s.id}', '${dayFilter}')"><i class='bx bx-trash'></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.deleteJadwal = function (id, dayFilter) {
    showConfirmModal('Hapus jadwal ini?', () => {
        schedules = schedules.filter(s => s.id !== id);
        saveData('schedules', schedules);
        renderJadwal(dayFilter);
        updateDashboard();
        showToast('Jadwal dihapus!');
    });
}


// ==========================================
// TUGAS LOGIC
// ==========================================
function setupTugas() {
    const btnAdd = document.getElementById('btn-add-tugas');
    const btnCancel = document.getElementById('btn-cancel-tugas');
    const formContainer = document.getElementById('tugas-form-container');
    const form = document.getElementById('tugas-form');
    const filters = document.querySelectorAll('.filter-btn');

    let currentFilter = 'all';

    btnAdd.addEventListener('click', () => {
        formContainer.classList.remove('hidden');
    });

    btnCancel.addEventListener('click', () => {
        formContainer.classList.add('hidden');
        form.reset();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const judul = document.getElementById('tugas-judul').value;
        const matkul = document.getElementById('tugas-matkul').value;
        const date = document.getElementById('tugas-deadline-date').value;
        const time = document.getElementById('tugas-deadline-time').value;

        const newTask = {
            id: Date.now().toString(),
            judul, matkul, date, time,
            completed: false
        };

        tasks.push(newTask);
        saveData('tasks', tasks);
        form.reset();
        formContainer.classList.add('hidden');
        renderTugas(currentFilter);
        updateDashboard();
        showToast('Tugas ditambahkan!');
    });

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTugas(currentFilter);
        });
    });

    renderTugas(currentFilter);
}

function renderTugas(filterType) {
    const container = document.getElementById('tugas-list');
    container.innerHTML = '';

    let filtered = tasks;
    if (filterType === 'pending') filtered = tasks.filter(t => !t.completed);
    if (filterType === 'completed') filtered = tasks.filter(t => t.completed);

    // Sort by nearest deadline
    filtered.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Tidak ada tugas.</p>';
        return;
    }

    filtered.forEach(t => {
        const isUrgent = !t.completed && isTaskUrgent(t.date);
        const badge = t.completed ? '<span class="badge success">Selesai</span>' :
            (isUrgent ? '<span class="badge danger">Mendesak</span>' : '<span class="badge primary">Belum</span>');

        const div = document.createElement('div');
        div.className = `tugas-item ${t.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="tugas-info">
                <h3>${t.judul} ${badge}</h3>
                <p>${t.matkul} &nbsp;|&nbsp; <i class='bx bx-calendar'></i> ${formatDate(t.date)} <i class='bx bx-time'></i> ${t.time}</p>
            </div>
            <div class="item-actions">
                <button class="icon-btn complete" onclick="toggleTask('${t.id}')"><i class='bx ${t.completed ? 'bx-x' : 'bx-check'}'></i></button>
                <button class="icon-btn delete" onclick="deleteTask('${t.id}')"><i class='bx bx-trash'></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}

function isTaskUrgent(dateStr) {
    const today = new Date();
    const taskDate = new Date(dateStr);
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
}

window.toggleTask = function (id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData('tasks', tasks);
        const currentFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        renderTugas(currentFilter);
        updateDashboard();
    }
}

window.deleteTask = function (id) {
    showConfirmModal('Hapus tugas ini?', () => {
        tasks = tasks.filter(t => t.id !== id);
        saveData('tasks', tasks);
        const currentFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        renderTugas(currentFilter);
        updateDashboard();
        showToast('Tugas dihapus!');
    });
}

// ==========================================
// CATATAN LOGIC
// ==========================================
let editingNoteId = null;

function setupCatatan() {
    const btnAdd = document.getElementById('btn-add-catatan');
    const btnCancel = document.getElementById('btn-cancel-catatan');
    const formContainer = document.getElementById('catatan-form-container');
    const form = document.getElementById('catatan-form');

    btnAdd.addEventListener('click', () => {
        editingNoteId = null;
        form.reset();
        formContainer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });

    btnCancel.addEventListener('click', () => {
        formContainer.classList.add('hidden');
        form.reset();
        editingNoteId = null;
        document.body.style.overflow = '';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const judul = document.getElementById('catatan-judul').value;
        const isi = document.getElementById('catatan-isi').value;

        if (editingNoteId) {
            const noteIndex = notes.findIndex(n => n.id === editingNoteId);
            if (noteIndex > -1) {
                notes[noteIndex].judul = judul;
                notes[noteIndex].isi = isi;
                notes[noteIndex].date = new Date().toISOString();
            }
            editingNoteId = null;
            showToast('Catatan diperbarui!');
        } else {
            const newNote = {
                id: Date.now().toString(),
                judul, isi,
                date: new Date().toISOString()
            };
            notes.push(newNote);
            showToast('Catatan disimpan!');
        }

        saveData('notes', notes);
        form.reset();
        formContainer.classList.add('hidden');
        document.body.style.overflow = '';
        renderCatatan();
        updateDashboard();
    });

    renderCatatan();
}

function renderCatatan() {
    const container = document.getElementById('catatan-list');
    container.innerHTML = '';

    // Sort newest first
    const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedNotes.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">Belum ada catatan.</p>';
        return;
    }

    sortedNotes.forEach(n => {
        const div = document.createElement('div');
        div.className = 'note-card';
        div.innerHTML = `
            <div class="note-header">
                <h3>${n.judul}</h3>
                <div style="display: flex; gap: 4px;">
                    <button class="icon-btn complete" onclick="editNote('${n.id}')" style="width: 28px; height: 28px;"><i class='bx bx-edit'></i></button>
                    <button class="icon-btn delete" onclick="deleteNote('${n.id}')" style="width: 28px; height: 28px;"><i class='bx bx-trash'></i></button>
                </div>
            </div>
            <div class="note-date">${formatDate(n.date)}</div>
            <div class="note-body">${n.isi}</div>
        `;
        container.appendChild(div);
    });
}

window.deleteNote = function (id) {
    showConfirmModal('Hapus catatan ini?', () => {
        notes = notes.filter(n => n.id !== id);
        saveData('notes', notes);
        renderCatatan();
        updateDashboard();
        showToast('Catatan dihapus!');
    });
}

window.editNote = function (id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    editingNoteId = id;
    document.getElementById('catatan-judul').value = note.judul;
    document.getElementById('catatan-isi').value = note.isi;

    document.getElementById('catatan-form-container').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('catatan-judul').focus();
}


// ==========================================
// DASHBOARD LOGIC
// ==========================================
function updateDashboard() {
    // Counts
    document.getElementById('dash-tugas-count').textContent = tasks.filter(t => !t.completed).length;

    const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayStr = hariMap[new Date().getDay()];
    document.getElementById('dash-jadwal-count').textContent = schedules.filter(s => s.hari === todayStr).length;

    document.getElementById('dash-catatan-count').textContent = notes.length;

    // Upcoming Tasks Widget
    const upcomingTasksList = document.getElementById('dash-upcoming-tasks');
    upcomingTasksList.innerHTML = '';
    const pendingTasks = tasks.filter(t => !t.completed)
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
        .slice(0, 3);

    if (pendingTasks.length === 0) {
        upcomingTasksList.innerHTML = '<li><span class="info"><p>Tidak ada tugas tertunda.</p></span></li>';
    } else {
        pendingTasks.forEach(t => {
            const badgeClass = isTaskUrgent(t.date) ? 'danger' : 'primary';
            upcomingTasksList.innerHTML += `
                <li>
                    <div class="info">
                        <h4>${t.judul}</h4>
                        <p>${t.matkul}</p>
                    </div>
                    <span class="badge ${badgeClass}">${formatDate(t.date)}</span>
                </li>
            `;
        });
    }

    // Today's Schedule Widget
    const scheduleList = document.getElementById('dash-upcoming-schedule');
    scheduleList.innerHTML = '';
    const todaySchedules = schedules.filter(s => s.hari === todayStr)
        .sort((a, b) => a.mulai.localeCompare(b.mulai))
        .slice(0, 3);

    if (todaySchedules.length === 0) {
        scheduleList.innerHTML = '<li><span class="info"><p>Tidak ada jadwal hari ini.</p></span></li>';
    } else {
        todaySchedules.forEach(s => {
            scheduleList.innerHTML += `
                <li>
                    <div class="info">
                        <h4>${s.matkul}</h4>
                        <p><i class='bx bx-map'></i> ${s.ruangan || '-'}</p>
                    </div>
                    <span class="badge warning">${s.mulai}</span>
                </li>
            `;
        });
    }

    // Agenda Mingguan Widget (next 3 days)
    const mingguanList = document.getElementById('dash-upcoming-mingguan');
    mingguanList.innerHTML = '';

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(todayDate);
    threeDaysLater.setDate(todayDate.getDate() + 3);
    const nowDateTime = new Date();

    const upcomingMingguan = jadwalMingguan.filter(s => {
        const itemDate = new Date(s.tanggal);
        itemDate.setHours(0, 0, 0, 0);
        const itemDateTime = new Date(`${s.tanggal}T${s.waktu}`);
        return itemDate >= todayDate && itemDate <= threeDaysLater && itemDateTime >= nowDateTime;
    })
        .sort((a, b) => new Date(`${a.tanggal}T${a.waktu}`) - new Date(`${b.tanggal}T${b.waktu}`))
        .slice(0, 3);

    if (upcomingMingguan.length === 0) {
        mingguanList.innerHTML = '<li><span class="info"><p>Tidak ada agenda khusus.</p></span></li>';
    } else {
        upcomingMingguan.forEach(s => {
            mingguanList.innerHTML += `
                <li>
                    <div class="info">
                        <h4>${s.nama}</h4>
                        <p><i class='bx bx-map'></i> ${s.lokasi || '-'}</p>
                    </div>
                    <span class="badge primary">${formatDate(s.tanggal)}</span>
                </li>
            `;
        });
    }
}

// ==========================================
// UTILS
// ==========================================
function saveData(key, data) {
    if (key === 'schedules') localStorage.setItem('unimanage_schedules', JSON.stringify(data));
    if (key === 'jadwalMingguan') localStorage.setItem('unimanage_jadwal_mingguan', JSON.stringify(data));
    if (key === 'tasks') localStorage.setItem('unimanage_tasks', JSON.stringify(data));
    if (key === 'notes') localStorage.setItem('unimanage_notes', JSON.stringify(data));
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// ==========================================
// CUSTOM UI
// ==========================================
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('custom-modal');
    const msgEl = document.getElementById('modal-message');
    const btnCancel = document.getElementById('btn-modal-cancel');
    const btnConfirm = document.getElementById('btn-modal-confirm');

    msgEl.textContent = message;
    modal.classList.remove('hidden');

    // Remove old listeners to prevent multiple triggers
    const newBtnCancel = btnCancel.cloneNode(true);
    const newBtnConfirm = btnConfirm.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

    newBtnCancel.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    newBtnConfirm.addEventListener('click', () => {
        modal.classList.add('hidden');
        onConfirm();
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'bx-check-circle' : 'bx-error-circle';
    toast.innerHTML = `<i class='bx ${icon}'></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (container.contains(toast)) container.removeChild(toast);
        }, 300); // Wait for fade out animation
    }, 3000); // Show for 3 seconds
}
