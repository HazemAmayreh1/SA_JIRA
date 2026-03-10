let conflictData = [];
let editIndex = -1;
let currentFilter = {
    type: 'none',
    value: 'all'
};
let filteredData = [];

// DOM Elements
const conflictForm = document.getElementById('conflictForm');
const tableBody = document.getElementById('tableBody');
const noDataMessage = document.getElementById('noDataMessage');
const noFilterDataMessage = document.getElementById('noFilterDataMessage');
const recordCount = document.getElementById('recordCount');
const filterStatus = document.getElementById('filterStatus');
const saveJsonBtn = document.getElementById('saveJsonBtn');
const loadJsonBtn = document.getElementById('loadJsonBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const jsonFileInput = document.getElementById('jsonFileInput');
const printAllBtn = document.getElementById('printAllBtn');
const printFilteredBtn = document.getElementById('printFilteredBtn');

// عناصر كشف الحضور
const printAttendanceBtn = document.getElementById('printAttendanceBtn');
const attendanceSessionSelect = document.getElementById('attendanceSession');
const attendanceDateInput = document.getElementById('attendanceDate');
const attendanceSupervisorInput = document.getElementById('attendanceSupervisor');

// Filter elements
const filterTypeRadios = document.querySelectorAll('input[name="filterType"]');
const sessionFilterSelect = document.getElementById('sessionFilterSelect');
const dateFilterSelect = document.getElementById('dateFilterSelect');
const supervisorFilterSelect = document.getElementById('supervisorFilterSelect');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// Statistic elements
const totalStudents = document.getElementById('totalStudents');
const totalConflicts = document.getElementById('totalConflicts');
const totalSessions = document.getElementById('totalSessions');
const filteredCount = document.getElementById('filteredCount');

// Initialize the application
function init() {
    loadData();
    renderTable();
    updateStats();
    updateFilterOptions();
    setupFilterListeners();
    setupAttendancePrint();
    updateAttendanceOptions();
    
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    attendanceDateInput.value = today;
}

// Setup filter event listeners
function setupFilterListeners() {
    // Filter type radio buttons
    filterTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            currentFilter.type = this.value;
            showFilterControl(this.value);
            
            // Reset filter value
            currentFilter.value = 'all';
            if (this.value === 'none') {
                applyFilter();
            }
        });
    });
    
    // Apply filter button
    applyFilterBtn.addEventListener('click', applyFilter);
    
    // Reset filters button
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Print buttons
    printAllBtn.addEventListener('click', function() {
        if (conflictData.length === 0) {
            alert('لا توجد بيانات لطباعتها');
            return;
        }
        preparePrint(conflictData, 'جميع البيانات', 'all');
    });
    
    printFilteredBtn.addEventListener('click', function() {
        if (filteredData.length === 0) {
            alert('لا توجد بيانات لطباعتها');
            return;
        }
        
        let title = 'البيانات المصفاة';
        if (currentFilter.value !== 'all') {
            switch(currentFilter.type) {
                case 'session':
                    title = `جلسة: ${currentFilter.value}`;
                    break;
                case 'date':
                    title = `يوم: ${formatDateForFilter(currentFilter.value)}`;
                    break;
                case 'supervisor':
                    title = `مراقب: ${currentFilter.value}`;
                    break;
            }
        }
        
        preparePrint(filteredData, title, 'filtered');
    });
}

// Show appropriate filter control based on selected type
function showFilterControl(filterType) {
    // Hide all filter controls first
    document.getElementById('sessionFilterControl').style.display = 'none';
    document.getElementById('dateFilterControl').style.display = 'none';
    document.getElementById('supervisorFilterControl').style.display = 'none';
    
    // Show the selected filter control
    switch(filterType) {
        case 'session':
            document.getElementById('sessionFilterControl').style.display = 'flex';
            break;
        case 'date':
            document.getElementById('dateFilterControl').style.display = 'flex';
            break;
        case 'supervisor':
            document.getElementById('supervisorFilterControl').style.display = 'flex';
            break;
    }
}

// Load data from localStorage
function loadData() {
    const storedData = localStorage.getItem('examConflictData');
    if (storedData) {
        try {
            conflictData = JSON.parse(storedData);
            filteredData = [...conflictData];
            console.log(`Loaded ${conflictData.length} records from localStorage`);
        } catch (error) {
            console.error('Error parsing data from localStorage:', error);
            conflictData = [];
            filteredData = [];
        }
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('examConflictData', JSON.stringify(conflictData));
    console.log(`Saved ${conflictData.length} records to localStorage`);
}

// Update filter dropdown options
function updateFilterOptions() {
    // Clear existing options
    sessionFilterSelect.innerHTML = '<option value="all">جميع الجلسات</option>';
    dateFilterSelect.innerHTML = '<option value="all">جميع الأيام</option>';
    supervisorFilterSelect.innerHTML = '<option value="all">جميع المراقبين</option>';
    
    if (conflictData.length === 0) return;
    
    // Get unique values for each filter
    const sessions = [...new Set(conflictData.map(item => item.session))];
    const dates = [...new Set(conflictData.map(item => item.date))];
    const supervisors = [...new Set(conflictData.map(item => item.supervisor))];
    
    // Add session options
    sessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session;
        option.textContent = session;
        sessionFilterSelect.appendChild(option);
    });
    
    // Add date options (formatted)
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDateForFilter(date);
        dateFilterSelect.appendChild(option);
    });
    
    // Add supervisor options
    supervisors.forEach(supervisor => {
        const option = document.createElement('option');
        option.value = supervisor;
        option.textContent = supervisor;
        supervisorFilterSelect.appendChild(option);
    });
}

// Format date for filter dropdown
function formatDateForFilter(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Apply filter based on current settings
function applyFilter() {
    if (currentFilter.type === 'none') {
        filteredData = [...conflictData];
        currentFilter.value = 'all';
        filterStatus.style.display = 'none';
    } else {
        // Get selected value based on filter type
        let selectedValue = 'all';
        switch(currentFilter.type) {
            case 'session':
                selectedValue = sessionFilterSelect.value;
                break;
            case 'date':
                selectedValue = dateFilterSelect.value;
                break;
            case 'supervisor':
                selectedValue = supervisorFilterSelect.value;
                break;
        }
        
        currentFilter.value = selectedValue;
        
        if (selectedValue === 'all') {
            filteredData = [...conflictData];
            filterStatus.textContent = 'عرض الكل';
        } else {
            filteredData = conflictData.filter(item => {
                switch(currentFilter.type) {
                    case 'session':
                        return item.session === selectedValue;
                    case 'date':
                        return item.date === selectedValue;
                    case 'supervisor':
                        return item.supervisor === selectedValue;
                    default:
                        return true;
                }
            });
            
            // Update filter status
            let filterText = '';
            switch(currentFilter.type) {
                case 'session':
                    filterText = `الجلسة: ${selectedValue}`;
                    break;
                case 'date':
                    filterText = `اليوم: ${formatDateForFilter(selectedValue)}`;
                    break;
                case 'supervisor':
                    filterText = `المراقب: ${selectedValue}`;
                    break;
            }
            filterStatus.textContent = filterText;
        }
        filterStatus.style.display = 'block';
    }
    
    renderTable();
    updateStats();
    updateAttendanceOptions(); // تحديث خيارات الحضور
    showToast('تم تطبيق الفلتر بنجاح', 'success');
}

// Reset all filters
function resetFilters() {
    // Reset radio buttons
    document.getElementById('filterNone').checked = true;
    
    // Reset filter type and value
    currentFilter.type = 'none';
    currentFilter.value = 'all';
    
    // Hide filter controls
    showFilterControl('none');
    
    // Reset dropdowns to "all"
    sessionFilterSelect.value = 'all';
    dateFilterSelect.value = 'all';
    supervisorFilterSelect.value = 'all';
    
    // Apply changes
    applyFilter();
    showToast('تم إعادة تعيين الفلترات', 'info');
}

// Update statistics display
function updateStats() {
    // Total students (unique student IDs from all data)
    const uniqueStudents = new Set(conflictData.map(item => item.studentId));
    totalStudents.textContent = uniqueStudents.size;
    
    // Total conflicts
    totalConflicts.textContent = conflictData.length;
    
    // Total sessions
    const uniqueSessions = new Set(conflictData.map(item => item.session));
    totalSessions.textContent = uniqueSessions.size;
    
    // Filtered count
    filteredCount.textContent = filteredData.length;
    
    // Update record count
    recordCount.textContent = `${filteredData.length} سجل`;
    
    // Show/hide no data message
    if (conflictData.length === 0) {
        noDataMessage.style.display = 'block';
        noFilterDataMessage.style.display = 'none';
    } else {
        noDataMessage.style.display = 'none';
        
        // Show/hide no filtered data message
        if (filteredData.length === 0 && currentFilter.value !== 'all') {
            noFilterDataMessage.style.display = 'block';
        } else {
            noFilterDataMessage.style.display = 'none';
        }
    }
}

// Render the data table
function renderTable() {
    // Clear table body
    tableBody.innerHTML = '';
    
    // Populate table with filtered data
    filteredData.forEach((item, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(item.date)}</td>
            <td>${item.session}</td>
            <td>${item.studentId}</td>
            <td>${item.studentName}</td>
            <td>${item.courseId}</td>
            <td>${item.courseName}</td>
            <td><span class="room-badge current-room">${item.currentRoom}</span></td>
            <td><span class="room-badge proposed-room">${item.proposedRoom}</span></td>
            <td>${item.supervisor}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editRecord('${item.date}', '${item.studentId}', '${item.courseId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteRecord('${item.date}', '${item.studentId}', '${item.courseId}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add room badge styling
    addRoomBadgeStyling();
}

// Find record index by unique identifier
function findRecordIndex(date, studentId, courseId) {
    return conflictData.findIndex(item => 
        item.date === date && 
        item.studentId === studentId &&
        item.courseId === courseId
    );
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Add styling for room badges
function addRoomBadgeStyling() {
    const style = document.createElement('style');
    style.textContent = `
        .room-badge {
            padding: 5px 10px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.85rem;
            display: inline-block;
        }
        .current-room {
            background-color: #ffeaa7;
            color: #d35400;
            border: 1px solid #fdcb6e;
        }
        .proposed-room {
            background-color: #a3e4d7;
            color: #0d6251;
            border: 1px solid #76d7c4;
        }
    `;
    
    const existingStyle = document.getElementById('roomBadgeStyle');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    style.id = 'roomBadgeStyle';
    document.head.appendChild(style);
}

// Handle form submission
conflictForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const record = {
        date: document.getElementById('date').value,
        session: document.getElementById('session').value.trim(),
        studentId: document.getElementById('studentId').value.trim(),
        studentName: document.getElementById('studentName').value.trim(),
        courseId: document.getElementById('courseId').value.trim(),
        courseName: document.getElementById('courseName').value.trim(),
        currentRoom: document.getElementById('currentRoom').value.trim(),
        proposedRoom: document.getElementById('proposedRoom').value.trim(),
        supervisor: document.getElementById('supervisor').value.trim()
    };
    
    // Validate required fields
    for (const key in record) {
        if (record[key] === '') {
            alert('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }
    }
    
    // Check if editing existing record
    if (editIndex > -1) {
        // Update existing record
        conflictData[editIndex] = record;
        editIndex = -1;
        
        // Change submit button text back to "إضافة"
        conflictForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> إضافة الحالة';
    } else {
        // Check for duplicate record
        const isDuplicate = conflictData.some(item => 
            item.date === record.date && 
            item.studentId === record.studentId &&
            item.courseId === record.courseId
        );
        
        if (isDuplicate) {
            if (!confirm('هذا السجل موجود بالفعل. هل تريد تحديثه؟')) {
                return;
            }
            
            // Find and update duplicate
            const duplicateIndex = findRecordIndex(record.date, record.studentId, record.courseId);
            conflictData[duplicateIndex] = record;
        } else {
            // Add new record
            conflictData.push(record);
        }
    }
    
    // Save data and update UI
    saveData();
    applyFilter(); // Re-apply current filter
    updateFilterOptions();
    updateAttendanceOptions();
    
    // Reset form
    // conflictForm.reset();
    
    // Set today's date again
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // Show success message
    showToast('تم حفظ البيانات بنجاح', 'success');
});

// Edit a record
function editRecord(date, studentId, courseId) {
    const index = findRecordIndex(date, studentId, courseId);
    if (index === -1) return;
    
    const record = conflictData[index];
    
    // Fill form with record data
    document.getElementById('date').value = record.date;
    document.getElementById('session').value = record.session;
    document.getElementById('studentId').value = record.studentId;
    document.getElementById('studentName').value = record.studentName;
    document.getElementById('courseId').value = record.courseId;
    document.getElementById('courseName').value = record.courseName;
    document.getElementById('currentRoom').value = record.currentRoom;
    document.getElementById('proposedRoom').value = record.proposedRoom;
    document.getElementById('supervisor').value = record.supervisor;
    
    // Set edit mode
    editIndex = index;
    
    // Change submit button text
    conflictForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> تحديث الحالة';
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    // Show info message
    showToast('تم تحميل البيانات للتعديل', 'info');
}

// Delete a record
function deleteRecord(date, studentId, courseId) {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    
    const index = findRecordIndex(date, studentId, courseId);
    if (index === -1) return;
    
    conflictData.splice(index, 1);
    saveData();
    applyFilter(); // Re-apply current filter
    updateFilterOptions();
    updateAttendanceOptions();
    
    showToast('تم حذف السجل بنجاح', 'warning');
}

// Clear all data
clearDataBtn.addEventListener('click', function() {
    if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    conflictData = [];
    filteredData = [];
    saveData();
    resetFilters();
    updateFilterOptions();
    updateAttendanceOptions();
    
    showToast('تم مسح جميع البيانات', 'danger');
});

// Save data as JSON file
saveJsonBtn.addEventListener('click', function() {
    if (conflictData.length === 0) {
        alert('لا توجد بيانات لحفظها');
        return;
    }
    
    const dataStr = JSON.stringify(conflictData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `تعارضات_الامتحانات_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('تم تنزيل ملف JSON بنجاح', 'success');
});

// Load data from JSON file
loadJsonBtn.addEventListener('click', function() {
    jsonFileInput.click();
});

jsonFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // Validate imported data structure
            if (!Array.isArray(importedData)) {
                throw new Error('الملف لا يحتوي على مصفوفة صالحة');
            }
            
            // Check if objects have required properties
            const requiredProps = ['date', 'session', 'studentId', 'studentName', 'courseId', 
                                  'courseName', 'currentRoom', 'proposedRoom', 'supervisor'];
            
            for (const item of importedData) {
                for (const prop of requiredProps) {
                    if (!item.hasOwnProperty(prop)) {
                        throw new Error('هيكلية البيانات غير صالحة');
                    }
                }
            }
            
            // Ask user how to handle imported data
            const importOption = confirm('هل تريد استبدال البيانات الحالية بالبيانات الجديدة؟\n\nموافق: استبدال الكل\nإلغاء: دمج البيانات');
            
            if (importOption) {
                // Replace all data
                conflictData = importedData;
            } else {
                // Merge data (avoid duplicates based on date, studentId, and courseId)
                const existingKeys = new Set(conflictData.map(item => 
                    `${item.date}-${item.studentId}-${item.courseId}`
                ));
                
                for (const newItem of importedData) {
                    const newKey = `${newItem.date}-${newItem.studentId}-${newItem.courseId}`;
                    if (!existingKeys.has(newKey)) {
                        conflictData.push(newItem);
                        existingKeys.add(newKey);
                    }
                }
            }
            
            saveData();
            resetFilters();
            updateFilterOptions();
            updateAttendanceOptions();
            
            showToast(`تم تحميل ${importedData.length} سجل بنجاح`, 'success');
        } catch (error) {
            alert(`خطأ في تحميل الملف: ${error.message}`);
            console.error('Error loading JSON file:', error);
        }
        
        // Reset file input
        jsonFileInput.value = '';
    };
    
    reader.readAsText(file);
});

// Prepare print page
function preparePrint(data, title, type) {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Create HTML content for printing
    const printContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>طباعة تعارضات قاعات الامتحان</title>
            <style>
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                    }
                    
                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #000;
                    }
                    
                    .print-title {
                        font-size: 24px;
                        color: #000;
                        margin-bottom: 10px;
                    }
                    
                    .print-subtitle {
                        font-size: 18px;
                        color: #333;
                        margin-bottom: 15px;
                    }
                    
                    .print-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        padding: 10px;
                        background: #f5f5f5;
                        border-radius: 5px;
                        font-size: 14px;
                    }
                    
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
                        margin-bottom: 30px;
                    }
                    
                    .print-table th {
                        background: #2C3E50;
                        color: white;
                        padding: 8px;
                        border: 1px solid #000;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .print-table td {
                        padding: 6px;
                        border: 1px solid #000;
                        text-align: center;
                    }
                    
                    .print-table tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    
                    .current-room-cell {
                        background: #FFF3CD !important;
                        font-weight: bold;
                    }
                    
                    .proposed-room-cell {
                        background: #D1ECF1 !important;
                        font-weight: bold;
                    }
                    
                    .print-footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 10px;
                        border-top: 1px solid #000;
                        font-size: 12px;
                        color: #666;
                    }
                    
                    .no-print {
                        display: none;
                    }
                    
                    .print-actions {
                        text-align: center;
                        margin: 20px 0;
                        padding: 20px;
                        background: #f5f5f5;
                    }
                    
                    .print-btn {
                        padding: 10px 20px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 0 10px;
                    }
                    
                    .print-btn:hover {
                        background: #2980b9;
                    }
                }
                
                @media screen {
                    body {
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                        padding: 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    
                    .print-header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 15px;
                        border-bottom: 3px solid #2C3E50;
                    }
                    
                    .print-title {
                        font-size: 28px;
                        color: #2C3E50;
                        margin-bottom: 15px;
                    }
                    
                    .print-subtitle {
                        font-size: 20px;
                        color: #3498DB;
                        margin-bottom: 20px;
                    }
                    
                    .print-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 25px;
                        padding: 15px;
                        background: #ECF0F1;
                        border-radius: 8px;
                        font-size: 16px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 14px;
                        margin-bottom: 40px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    
                    .print-table th {
                        background: #2C3E50;
                        color: white;
                        padding: 12px;
                        border: 1px solid #ddd;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .print-table td {
                        padding: 10px;
                        border: 1px solid #ddd;
                        text-align: center;
                    }
                    
                    .print-table tr:nth-child(even) {
                        background: #F8F9FA;
                    }
                    
                    .print-table tr:hover {
                        background: #E8F4F8;
                    }
                    
                    .current-room-cell {
                        background: #FFF3CD !important;
                        font-weight: bold;
                        color: #856404;
                    }
                    
                    .proposed-room-cell {
                        background: #D1ECF1 !important;
                        font-weight: bold;
                        color: #0C5460;
                    }
                    
                    .print-footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 15px;
                        border-top: 2px solid #ddd;
                        font-size: 14px;
                        color: #666;
                    }
                    
                    .print-actions {
                        text-align: center;
                        margin: 30px 0;
                        padding: 25px;
                        background: #F8F9FA;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .print-btn {
                        padding: 12px 25px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 0 10px;
                        transition: all 0.3s ease;
                    }
                    
                    .print-btn:hover {
                        background: #2980b9;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    
                    .print-btn:active {
                        transform: translateY(0);
                    }
                    
                    .back-btn {
                        background: #6c757d;
                    }
                    
                    .back-btn:hover {
                        background: #545b62;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1 class="print-title">نظام تعارضات قاعات الامتحان</h1>
                <h2 class="print-subtitle">تقرير حالات التعارض</h2>
                <h3 style="color: #2C3E50; background: #ECF0F1; padding: 10px; border-radius: 5px; display: inline-block;">${title}</h3>
            </div>
            
            <div class="print-info">
                <div>
                    <strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-SA')}
                </div>
                <div>
                    <strong>عدد الحالات:</strong> ${data.length}
                </div>
                <div>
                    <strong>وقت التقرير:</strong> ${new Date().toLocaleTimeString('ar-SA')}
                </div>
            </div>
            
            <table class="print-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>التاريخ</th>
                        <th>الجلسة</th>
                        <th>رقم الطالب</th>
                        <th>اسم الطالب</th>
                        <th>رقم المساق</th>
                        <th>اسم المساق</th>
                        <th>القاعة الحالية</th>
                        <th>القاعة المقترحة</th>
                        <th>المراقب</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${formatDateForFilter(item.date)}</td>
                            <td>${escapeHtml(item.session)}</td>
                            <td>${escapeHtml(item.studentId)}</td>
                            <td>${escapeHtml(item.studentName)}</td>
                            <td>${escapeHtml(item.courseId)}</td>
                            <td>${escapeHtml(item.courseName)}</td>
                            <td class="current-room-cell">${escapeHtml(item.currentRoom)}</td>
                            <td class="proposed-room-cell">${escapeHtml(item.proposedRoom)}</td>
                            <td>${escapeHtml(item.supervisor)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="print-footer">
                نظام تعارضات قاعات الامتحان - جميع الحقوق محفوظة<br>
                تم إنشاء التقرير في: ${new Date().toLocaleString('ar-SA')}
            </div>
            
            <div class="print-actions no-print">
                <button class="print-btn" onclick="window.print()">
                    <i class="fas fa-print"></i> طباعة التقرير
                </button>
                <button class="print-btn back-btn" onclick="window.close()">
                    <i class="fas fa-times"></i> إغلاق النافذة
                </button>
            </div>
            
            <script>
                // Function to escape HTML special characters
                function escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }
                
                // Auto print after 1 second (optional)
                setTimeout(() => {
                    console.log('جاهز للطباعة - اضغط Ctrl + P');
                }, 1000);
                
                // Add Font Awesome icons
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
                document.head.appendChild(link);
            </script>
        </body>
        </html>
    `;
    
    // Write content to new window
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Focus on the new window
    printWindow.focus();
    
    showToast('تم فتح صفحة الطباعة بنجاح', 'success');
}

// كشف الحضور - إعداد الخيارات
function updateAttendanceOptions() {
    // تحديث قائمة الجلسات
    attendanceSessionSelect.innerHTML = '<option value="">-- اختر الجلسة --</option>';
    
    if (conflictData.length === 0) return;
    
    // الحصول على الجلسات الفريدة
    const sessions = [...new Set(conflictData.map(item => item.session))];
    
    sessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session;
        option.textContent = session;
        attendanceSessionSelect.appendChild(option);
    });
    
    // تعيين تاريخ اليوم كافتراضي
    const today = new Date().toISOString().split('T')[0];
    attendanceDateInput.value = today;
}

// كشف الحضور - إعداد الطباعة
function setupAttendancePrint() {
    printAttendanceBtn.addEventListener('click', function() {
        const session = attendanceSessionSelect.value;
        const date = attendanceDateInput.value;
        const supervisor = attendanceSupervisorInput.value.trim();
        
        if (!session) {
            alert('الرجاء اختيار الجلسة');
            return;
        }
        
        if (!date) {
            alert('الرجاء اختيار التاريخ');
            return;
        }
        
        if (!supervisor) {
            alert('الرجاء إدخال اسم المراقب');
            return;
        }
        
        // فلترة الطلاب للجلسة المحددة
        const sessionStudents = conflictData.filter(item => 
            item.session === session
        );
        
        if (sessionStudents.length === 0) {
            alert('لا توجد بيانات للطلاب في هذه الجلسة');
            return;
        }
        
        // إنشاء كشف الحضور
        createAttendanceSheet(sessionStudents, session, date, supervisor);
    });
}

// كشف الحضور - إنشاء الورقة
function createAttendanceSheet(students, session, date, supervisor) {
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    
    // تجميع الطلاب الفريدين (قد يكون للطالب أكثر من مساق في نفس الجلسة)
    const uniqueStudents = [];
    const studentMap = new Map();
    
    students.forEach(student => {
        if (!studentMap.has(student.studentId)) {
            studentMap.set(student.studentId, student);
            uniqueStudents.push({
                ...student,
                courses: students.filter(s => s.studentId === student.studentId)
                               .map(s => ({courseId: s.courseId, courseName: s.courseName}))
            });
        }
    });
    
    // فرز الطلاب حسب رقم الطالب
    uniqueStudents.sort((a, b) => a.studentId.localeCompare(b.studentId));
    
    // إنشاء محتوى HTML لكشف الحضور
    const printContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>كشف الحضور والغياب - ${session}</title>
            <style>
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                        line-height: 1.6;
                        color: #000;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 3px double #000;
                    }
                    
                    .header h1 {
                        font-size: 24px;
                        margin: 10px 0;
                        color: #2C3E50;
                    }
                    
                    .header h2 {
                        font-size: 20px;
                        margin: 5px 0;
                        color: #3498DB;
                    }
                    
                    .info-box {
                        display: flex;
                        justify-content: space-between;
                        margin: 15px 0;
                        padding: 10px;
                        background: #f5f5f5;
                        border-radius: 5px;
                        font-size: 14px;
                    }
                    
                    .info-item {
                        text-align: center;
                        flex: 1;
                    }
                    
                    .info-item strong {
                        display: block;
                        margin-bottom: 5px;
                        color: #2C3E50;
                    }
                    
                    .attendance-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 12px;
                    }
                    
                    .attendance-table th {
                        background: #2C3E50;
                        color: white;
                        padding: 10px;
                        border: 1px solid #000;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .attendance-table td {
                        padding: 8px;
                        border: 1px solid #000;
                        text-align: center;
                        vertical-align: middle;
                    }
                    
                    .attendance-table tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    
                    .student-info {
                        text-align: right;
                        padding-right: 10px !important;
                    }
                    
                    .courses-list {
                        text-align: right;
                        font-size: 11px;
                        padding-right: 10px !important;
                    }
                    
                    .course-item {
                        margin: 3px 0;
                        padding: 2px;
                        border-bottom: 1px dotted #ddd;
                    }
                    
                    .course-item:last-child {
                        border-bottom: none;
                    }
                    
                    .attendance-cell {
                        width: 120px;
                    }
                    
                    .signature-cell {
                        height: 50px;
                        position: relative;
                    }
                    
                    .signature-line {
                        position: absolute;
                        bottom: 5px;
                        right: 10px;
                        left: 10px;
                        height: 1px;
                        background: #000;
                    }
                    
                    .notes-cell {
                        height: 40px;
                        font-size: 11px;
                        text-align: right;
                    }
                    
                    .footer {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 2px solid #000;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                    
                    .print-actions {
                        text-align: center;
                        margin: 20px 0;
                        padding: 20px;
                        background: #f5f5f5;
                        border-radius: 8px;
                    }
                    
                    .print-btn {
                        padding: 10px 20px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 0 10px;
                    }
                    
                    .print-btn:hover {
                        background: #2980b9;
                    }
                    
                    .no-print {
                        display: none;
                    }
                }
                
                @media screen {
                    body {
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                        padding: 20px;
                        max-width: 1000px;
                        margin: 0 auto;
                        background: #f8f9fa;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 3px double #2C3E50;
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .header h1 {
                        font-size: 28px;
                        margin: 10px 0;
                        color: #2C3E50;
                    }
                    
                    .header h2 {
                        font-size: 22px;
                        margin: 5px 0;
                        color: #3498DB;
                    }
                    
                    .info-box {
                        display: flex;
                        justify-content: space-between;
                        margin: 20px 0;
                        padding: 15px;
                        background: white;
                        border-radius: 8px;
                        font-size: 16px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .info-item {
                        text-align: center;
                        flex: 1;
                        padding: 0 10px;
                    }
                    
                    .info-item strong {
                        display: block;
                        margin-bottom: 8px;
                        color: #2C3E50;
                        font-size: 14px;
                    }
                    
                    .attendance-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 25px 0;
                        font-size: 14px;
                        background: white;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    
                    .attendance-table th {
                        background: #2C3E50;
                        color: white;
                        padding: 12px;
                        border: 1px solid #ddd;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .attendance-table td {
                        padding: 10px;
                        border: 1px solid #ddd;
                        text-align: center;
                        vertical-align: middle;
                    }
                    
                    .attendance-table tr:nth-child(even) {
                        background: #F8F9FA;
                    }
                    
                    .attendance-table tr:hover {
                        background: #E8F4F8;
                    }
                    
                    .student-info {
                        text-align: right;
                        padding-right: 15px !important;
                    }
                    
                    .courses-list {
                        text-align: right;
                        font-size: 13px;
                        padding-right: 15px !important;
                    }
                    
                    .course-item {
                        margin: 4px 0;
                        padding: 3px;
                        border-bottom: 1px dotted #eee;
                    }
                    
                    .course-item:last-child {
                        border-bottom: none;
                    }
                    
                    .attendance-cell {
                        width: 150px;
                        background: #f8f9fa;
                    }
                    
                    .signature-cell {
                        height: 60px;
                        position: relative;
                        background: #f8f9fa;
                    }
                    
                    .signature-line {
                        position: absolute;
                        bottom: 10px;
                        right: 15px;
                        left: 15px;
                        height: 1px;
                        background: #666;
                    }
                    
                    .notes-cell {
                        height: 50px;
                        font-size: 13px;
                        text-align: right;
                        background: #f8f9fa;
                    }
                    
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #ddd;
                        text-align: center;
                        font-size: 14px;
                        color: #666;
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .print-actions {
                        text-align: center;
                        margin: 30px 0;
                        padding: 25px;
                        background: #F8F9FA;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .print-btn {
                        padding: 12px 25px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 0 10px;
                        transition: all 0.3s ease;
                    }
                    
                    .print-btn:hover {
                        background: #2980b9;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    
                    .print-btn:active {
                        transform: translateY(0);
                    }
                    
                    .back-btn {
                        background: #6c757d;
                    }
                    
                    .back-btn:hover {
                        background: #545b62;
                    }
                }
                
                .important-note {
                    background: #FFF3CD;
                    border-right: 4px solid #FFC107;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 5px;
                    font-size: 13px;
                }
                
                .page-break {
                    page-break-after: always;
                }
                
                .institution-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                }
                
                .institution-logo {
                    width: 80px;
                    height: 80px;
                    margin: 0 20px;
                    background: #eee;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: #2C3E50;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="institution-header">
                    <div class="institution-logo">
                        <i class="fas fa-university"></i>
                    </div>
                    <div>
                        <h1>كشف الحضور والغياب للطلاب</h1>
                        <h2>نظام إدارة تعارضات قاعات الامتحان</h2>
                    </div>
                    <div class="institution-logo">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                </div>
            </div>
            
            <div class="info-box">
                <div class="info-item">
                    <strong>الجلسة:</strong>
                    <span>${session}</span>
                </div>
                <div class="info-item">
                    <strong>التاريخ:</strong>
                    <span>${formatDateForFilter(date)}</span>
                </div>
                <div class="info-item">
                    <strong>اسم المراقب:</strong>
                    <span>${supervisor}</span>
                </div>
            </div>
            
            <div class="important-note">
                <strong><i class="fas fa-info-circle"></i> ملاحظة:</strong>
                الرجاء وضع علامة (✓) في خانة الحضور أو (✗) في خانة الغياب، مع التوقيع في الخانة المخصصة
            </div>
            
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th width="40">م</th>
                        <th width="100">رقم الطالب</th>
                        <th>اسم الطالب</th>
                        <th width="250">المساقات</th>
                        <th class="attendance-cell">الحضور</th>
                        <th class="attendance-cell">الغياب</th>
                        <th width="200">التوقيع</th>
                        <th width="250">ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${uniqueStudents.map((student, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${escapeHtml(student.studentId)}</td>
                            <td class="student-info">${escapeHtml(student.studentName)}</td>
                            <td class="courses-list">
                                ${student.courses.map(course => 
                                    `<div class="course-item">
                                        ${course.courseId} - ${course.courseName}
                                    </div>`
                                ).join('')}
                            </td>
                            <td class="attendance-cell">
                                <div style="font-size: 20px; color: #2ecc71;">□</div>
                            </td>
                            <td class="attendance-cell">
                                <div style="font-size: 20px; color: #e74c3c;">□</div>
                            </td>
                            <td class="signature-cell">
                                <div class="signature-line"></div>
                            </td>
                            <td class="notes-cell">
                                ________________________________
                            </td>
                        </tr>
                    `).join('')}
                    
                    <!-- صفوف إضافية فارغة -->
                    ${Array.from({length: Math.max(5, 15 - uniqueStudents.length)}).map((_, i) => `
                        <tr>
                            <td>${uniqueStudents.length + i + 1}</td>
                            <td></td>
                            <td class="student-info"></td>
                            <td class="courses-list"></td>
                            <td class="attendance-cell">
                                <div style="font-size: 20px; color: #2ecc71;">□</div>
                            </td>
                            <td class="attendance-cell">
                                <div style="font-size: 20px; color: #e74c3c;">□</div>
                            </td>
                            <td class="signature-cell">
                                <div class="signature-line"></div>
                            </td>
                            <td class="notes-cell">
                                ________________________________
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div style="text-align: right; width: 300px; border-top: 1px solid #000; padding-top: 5px;">
                        <strong>توقيع المراقب:</strong><br>
                        ${supervisor}
                    </div>
                    <div style="text-align: left; width: 300px; border-top: 1px solid #000; padding-top: 5px;">
                        <strong>التاريخ:</strong><br>
                        ${formatDateForFilter(date)}
                    </div>
                </div>
                <p>
                    <strong>تعليمات:</strong><br>
                    1. يتم وضع علامة (✓) في خانة الحضور للطالب الحاضر<br>
                    2. يتم ضع دائرة في خانة المساق الذي قدمه الطالب<br>
                    3. يتم وضع علامة (✗) في خانة الغياب للطالب الغائب<br>
                    4. توقيع المراقب في الخانة المخصصة أسفل الجدول<br>
                    5. يمكن كتابة أي ملاحظات في خانة الملاحظات
                </p>
                <hr style="margin: 15px 0;">
                <p>نظام تعارضات قاعات الامتحان - تم إنشاء الكشف في: ${new Date().toLocaleString('ar-SA')}</p>
            </div>
            
            <div class="print-actions no-print">
                <button class="print-btn" onclick="window.print()">
                    <i class="fas fa-print"></i> طباعة الكشف
                </button>
                <button class="print-btn back-btn" onclick="window.close()">
                    <i class="fas fa-times"></i> إغلاق النافذة
                </button>
            </div>
            
            <script>
                // دالة لتنسيق التاريخ
                function formatDateForFilter(dateString) {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                }
                
                // دالة لحماية النصوص
                function escapeHtml(text) {
                    if (!text) return '';
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }
                
                // إضافة أيقونات Font Awesome
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
                document.head.appendChild(link);
                
                // طباعة تلقائية بعد تحميل الصفحة
                window.onload = function() {
                    console.log('كشف الحضور جاهز للطباعة');
                };
            </script>
        </body>
        </html>
    `;
    
    // كتابة المحتوى في النافذة الجديدة
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // التركيز على النافذة الجديدة
    printWindow.focus();
    
    showToast('تم إنشاء كشف الحضور بنجاح', 'success');
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add toast to body
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
    
    // Add toast styles if not already added
    if (!document.getElementById('toastStyles')) {
        const toastStyles = document.createElement('style');
        toastStyles.id = 'toastStyles';
        toastStyles.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 1000;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
                border-right: 5px solid;
            }
            
            .toast-success {
                border-right-color: #2ecc71;
            }
            
            .toast-info {
                border-right-color: #3498db;
            }
            
            .toast-warning {
                border-right-color: #f39c12;
            }
            
            .toast-danger {
                border-right-color: #e74c3c;
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .toast-content i {
                font-size: 1.2rem;
            }
            
            .toast-success .toast-content i {
                color: #2ecc71;
            }
            
            .toast-info .toast-content i {
                color: #3498db;
            }
            
            .toast-warning .toast-content i {
                color: #f39c12;
            }
            
            .toast-danger .toast-content i {
                color: #e74c3c;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 1rem;
                padding: 0;
                margin-right: 10px;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(toastStyles);
    }
}

// Get appropriate icon for toast type
function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'danger': return 'times-circle';
        default: return 'info-circle';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);