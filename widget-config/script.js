const widgets = [
    { id: 1, name: 'Widget name 1', type: 'Code based' },
    { id: 2, name: 'Widget name 2', type: 'Graphic' },
    { id: 3, name: 'Widget name 3', type: 'Code based' },
    { id: 4, name: 'Widget name 4', type: 'Graphic' },
    { id: 5, name: 'Widget name 5', type: 'Code based' },
    { id: 6, name: 'Widget name 6', type: 'Graphic' },
    { id: 7, name: 'Widget name 7', type: 'Code based' },
];

let selectedWidget = null;
let currentSubstep = 1; // 1: List, 2: Config

const tableBody = document.getElementById('widget-table-body');
const searchInput = document.getElementById('widget-search');
const continueBtn = document.getElementById('continue-btn');
const listView = document.getElementById('widget-list-view');
const configView = document.getElementById('widget-config-view');
const backLink = document.getElementById('back-to-list');
const step2Status = document.getElementById('step-2-status');

function renderWidgets(filter = '') {
    tableBody.innerHTML = '';
    const filtered = widgets.filter(w => w.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(widget => {
        const row = document.createElement('tr');
        row.className = 'widget-row';
        if (selectedWidget && selectedWidget.id === widget.id) {
            row.classList.add('selected');
        }

        row.innerHTML = `
            <td>
                <div class="widget-name-cell">
                    <div class="widget-icon"></div>
                    ${widget.name}
                    <span class="material-icons-outlined" style="font-size: 16px; color: #9CA3AF; margin-left: 4px;">info</span>
                </div>
            </td>
            <td>
                <span class="badge ${widget.type === 'Graphic' ? 'badge-graphic' : 'badge-code'}">${widget.type}</span>
            </td>
        `;

        row.onclick = () => selectWidget(widget);
        tableBody.appendChild(row);
    });
}

function selectWidget(widget) {
    selectedWidget = widget;
    continueBtn.disabled = false;
    renderWidgets(searchInput.value);
}

function goToSubstep2() {
    if (!selectedWidget) return;

    if (selectedWidget.type === 'Code based') {
        currentSubstep = 2;
        
        // Update Substep 2.1 state
        const ss1 = document.getElementById('substep-2-1');
        ss1.classList.remove('active');
        ss1.classList.add('completed', 'collapsed');
        listView.classList.add('hidden');

        // Update Substep 2.2 state
        const ss2 = document.getElementById('substep-2-2');
        ss2.classList.remove('disabled');
        ss2.classList.add('active');
        configView.classList.remove('hidden');

        step2Status.innerText = 'Configuring ' + selectedWidget.name;
        
        // Ensure Step 2 is expanded
        const step2 = document.getElementById('step-2');
        step2.classList.remove('collapsed');
        document.getElementById('step-2-chevron').innerText = 'expand_more';
    } else {
        completeStep2();
    }
}

function completeStep2() {
    const step2 = document.getElementById('step-2');
    
    // Mark substeps
    document.getElementById('substep-2-1').classList.add('completed', 'collapsed');
    document.getElementById('substep-2-1').classList.remove('active');
    document.getElementById('substep-2-2').classList.add('completed', 'collapsed');
    document.getElementById('substep-2-2').classList.remove('active', 'disabled');

    // Mark Step 2 as completed and COLLAPSE it
    step2.classList.add('completed', 'collapsed');
    step2.classList.remove('active');
    step2.querySelector('.step-number').innerHTML = '<span class="material-icons-outlined" style="font-size: 18px;">check</span>';
    
    // Update chevron to point right when collapsed
    document.getElementById('step-2-chevron').innerText = 'chevron_right';

    const step3 = document.getElementById('step-3');
    step3.classList.remove('disabled');
    step3.classList.add('active');
    step2Status.innerText = 'Completed: ' + selectedWidget.name;
    
    document.getElementById('action-bar-2').classList.add('hidden');
}

function goToSubstep1() {
    currentSubstep = 1;

    const ss1 = document.getElementById('substep-2-1');
    ss1.classList.add('active');
    ss1.classList.remove('completed', 'collapsed');
    listView.classList.remove('hidden');

    const ss2 = document.getElementById('substep-2-2');
    ss2.classList.add('disabled');
    ss2.classList.remove('active', 'completed', 'collapsed');
    configView.classList.add('hidden');

    step2Status.innerText = 'In progress';
    
    // Ensure Step 2 is expanded
    const step2 = document.getElementById('step-2');
    step2.classList.remove('collapsed');
    document.getElementById('step-2-chevron').innerText = 'expand_more';
}

function toggleStep2() {
    const step2 = document.getElementById('step-2');
    const chevron = document.getElementById('step-2-chevron');
    
    if (step2.classList.contains('collapsed')) {
        step2.classList.remove('collapsed');
        chevron.innerText = 'expand_more';
    } else {
        step2.classList.add('collapsed');
        chevron.innerText = 'chevron_right';
    }
}

// Event Listeners
document.getElementById('step-info-2').addEventListener('click', toggleStep2);
searchInput.addEventListener('input', (e) => {
    renderWidgets(e.target.value);
});

continueBtn.addEventListener('click', () => {
    if (currentSubstep === 1) {
        goToSubstep2();
    } else {
        completeStep2();
    }
});

// Initialize
renderWidgets();
