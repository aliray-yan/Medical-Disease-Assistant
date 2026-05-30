/**
 * Admin Dashboard JavaScript
 * Handles admin-specific functionality
 */

let diseaseChart = null;
let monthlyChart = null;

/**
 * Load admin dashboard data
 */
async function loadAdminDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load dashboard');

        const data = await response.json();
        renderAdminDashboard(data);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

/**
 * Render admin dashboard data
 * @param {object} data - Dashboard data
 */
function renderAdminDashboard(data) {
    // Update stats
    document.getElementById('totalPatients').textContent = data.total_patients;
    document.getElementById('totalDoctors').textContent = data.total_doctors;
    document.getElementById('totalPredictions').textContent = data.total_predictions;
    document.getElementById('todayActivity').textContent = data.predictions_today + data.appointments_today;

    // Render disease distribution chart
    renderDiseaseChart(data.common_diseases);

    // Render monthly activity chart
    renderMonthlyChart(data.monthly_stats);

    // Render recent predictions table
    renderRecentPredictionsTable(data.recent_predictions);
}

/**
 * Render disease distribution pie chart
 * @param {Array} diseases - Disease distribution data
 */
function renderDiseaseChart(diseases) {
    const ctx = document.getElementById('diseaseChart');
    if (!ctx) return;

    // Destroy existing chart
    if (diseaseChart) {
        diseaseChart.destroy();
    }

    const labels = diseases.slice(0, 8).map(d => d.disease);
    const values = diseases.slice(0, 8).map(d => d.count);
    const colors = [
        '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
        '#ef4444', '#06b6d4', '#ec4899', '#84cc16'
    ];

    diseaseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

/**
 * Render monthly activity line chart
 * @param {Array} stats - Monthly statistics
 */
function renderMonthlyChart(stats) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    // Destroy existing chart
    if (monthlyChart) {
        monthlyChart.destroy();
    }

    const labels = stats.map(s => s.month);
    const predictions = stats.map(s => s.predictions);
    const appointments = stats.map(s => s.appointments);

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Predictions',
                    data: predictions,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Appointments',
                    data: appointments,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Render recent predictions table
 * @param {Array} predictions - Recent predictions
 */
function renderRecentPredictionsTable(predictions) {
    const tbody = document.getElementById('recentPredictionsTable');
    if (!tbody) return;

    if (predictions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-8 text-gray-500">
                    No predictions yet
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = predictions.map(pred => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user text-primary text-sm"></i>
                    </div>
                    <span class="font-medium text-gray-800">${pred.patient_name}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-800">${pred.disease}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getConfidenceClass(pred.confidence)}">
                    ${(pred.confidence * 100).toFixed(1)}%
                </span>
            </td>
            <td class="px-6 py-4 text-gray-500 text-sm">${formatDate(pred.date)}</td>
        </tr>
    `).join('');
}

/**
 * Load all patients with their data
 */
async function loadAllPatients(search = '') {
    try {
        let url = `${API_URL}/api/admin/patients`;
        if (search) url += `?search=${encodeURIComponent(search)}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load patients');

        return await response.json();
    } catch (error) {
        console.error('Error loading patients:', error);
        throw error;
    }
}

/**
 * Load all doctors
 */
async function loadAllDoctors() {
    try {
        const response = await fetch(`${API_URL}/api/admin/doctors`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load doctors');

        return await response.json();
    } catch (error) {
        console.error('Error loading doctors:', error);
        throw error;
    }
}

/**
 * Add new doctor
 * @param {object} doctorData - Doctor information
 */
async function addDoctor(doctorData) {
    try {
        const response = await fetch(`${API_URL}/api/admin/doctors`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(doctorData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add doctor');
        }

        showToast('Doctor added successfully', 'success');
        return await response.json();
    } catch (error) {
        console.error('Error adding doctor:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

/**
 * Delete doctor
 * @param {number} doctorId - Doctor ID
 */
async function deleteDoctor(doctorId) {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/doctors/${doctorId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete doctor');

        showToast('Doctor deleted successfully', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting doctor:', error);
        showToast(error.message, 'error');
        return false;
    }
}

/**
 * Load all predictions
 */
async function loadAllPredictions() {
    try {
        const response = await fetch(`${API_URL}/api/admin/predictions`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load predictions');

        return await response.json();
    } catch (error) {
        console.error('Error loading predictions:', error);
        throw error;
    }
}

/**
 * Load all referrals
 */
async function loadAllReferrals() {
    try {
        const response = await fetch(`${API_URL}/api/admin/referrals`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load referrals');

        return await response.json();
    } catch (error) {
        console.error('Error loading referrals:', error);
        throw error;
    }
}

/**
 * Toggle patient account status
 * @param {number} patientId - Patient ID
 */
async function togglePatientStatus(patientId) {
    try {
        const response = await fetch(`${API_URL}/api/admin/patients/${patientId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to update status');

        const data = await response.json();
        showToast(data.message, 'success');
        return data;
    } catch (error) {
        console.error('Error updating status:', error);
        showToast(error.message, 'error');
        throw error;
    }
}