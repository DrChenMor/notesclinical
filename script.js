document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const soapNoteForm = document.getElementById('soapNoteForm');
    const helperPanelTitle = document.getElementById('helperPanelTitle');
    const helperPanelSubtitle = document.getElementById('helperPanelSubtitle');
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    const customSuggestionModule = document.getElementById('customSuggestionModule');
    const addCustomSuggestionTitle = document.getElementById('addCustomSuggestionTitle');
    const customSuggestionInput = document.getElementById('customSuggestionInput');
    const addCustomSuggestionButton = document.getElementById('addCustomSuggestionButton');
    const downloadNoteButton = document.getElementById('downloadNoteButton');
    const downloadDraftButton = document.getElementById('downloadDraftButton');
    const uploadDraftButton = document.getElementById('uploadDraftButton');
    const uploadDraftInput = document.getElementById('uploadDraftInput');
    const saveDraftButton = document.getElementById('saveDraftButton');
    const loadDraftButton = document.getElementById('loadDraftButton');
    const clearFormButton = document.getElementById('clearFormButton');
    const resetNoteButton = document.getElementById('resetNoteButton');
    const toastMessage = document.getElementById('toast-message');
    const newSectionNameInput = document.getElementById('newSectionNameInput');
    const addNewSectionButton = document.getElementById('addNewSectionButton');
    const targetSectionSelect = document.getElementById('targetSectionSelect');
    const newFieldNameInput = document.getElementById('newFieldNameInput');
    const addNewFieldButton = document.getElementById('addNewFieldButton');
    const toggleVisibleSectionsButton = document.getElementById('toggleVisibleSectionsButton');
    const visibleSectionsPopover = document.getElementById('visibleSectionsPopover');
    const visibleSectionsControlsContainer = document.getElementById('visibleSectionsControlsContainer');
    const suggestionsHelperTabButton = document.getElementById('suggestionsHelperTabButton');
    const templateEditorHelperTabButton = document.getElementById('templateEditorHelperTabButton');
    const suggestionsHelperTabContent = document.getElementById('suggestionsHelperTabContent');
    const templateEditorHelperTabContent = document.getElementById('templateEditorHelperTabContent');
    const templateSelector = document.getElementById('templateSelector'); 
    const saveTemplateChangesButton = document.getElementById('saveTemplateChangesButton'); 
    const saveAsNewTemplateButton = document.getElementById('saveAsNewTemplateButton'); 
    const currentTemplateNameSpan = document.getElementById('currentTemplateNameSpan'); 

    // --- State & Keys ---
    let activeTextarea = null;
    let toastTimeout; 
    const APP_PREFIX = 'noteingham_alpha_'; 
    const CUSTOM_SUGGESTIONS_KEY = APP_PREFIX + 'customSuggestions_v11'; // Bump version
    const UI_SETTINGS_KEY = APP_PREFIX + 'uiSettings_v11';
    const LOCAL_DRAFT_KEY = APP_PREFIX + 'localDraft_v11'; 
    const TEMPLATES_KEY = APP_PREFIX + 'templates_v11'; 
    const CURRENT_TEMPLATE_ID_KEY = APP_PREFIX + 'currentTemplateId_v11'; 
    
    let masterFieldData = {}; 
    let masterSectionData = [];
    let allTemplates = {}; 
    let currentTemplateId = null; 

    // --- Default Templates Definition (MUST be defined before use) ---
    const standardSectionsDefinitionForDefault = [ // Renamed to avoid conflict if needed later
        { id: 'generalInfoSection', title: 'General Information', fields: [
            { id: 'gi_date', label: 'Date', type: 'text', placeholder: 'YYYY-MM-DD', suggestions: ["Today's date: " + new Date().toISOString().slice(0,10), "Date of session: "] },
            { id: 'gi_client_id', label: 'Client ID / Name', type: 'text', placeholder: 'e.g., 12345 or Initials', suggestions: ["Client ID: ", "Client Initials: "] },
            { id: 'gi_session_focus', label: 'Session Focus / Main Topic', type: 'textarea', placeholder: 'e.g., Review of coping strategies for anxiety', suggestions: ["Session focused on reviewing coping strategies for [issue].", "Exploration of [topic, e.g., recent stressors].", "Follow-up on [previous topic/homework].", "Psychoeducation regarding [condition/skill].", "Goal setting for [area]."] }
        ]},
        { id: 'subjectiveSection', title: 'S (Subjective)', fields: [
            { id: 's_main_concerns', label: "Client's Main Concerns, Statements, Presenting Issues", type: 'textarea', placeholder: "Client states, '...' or primary issues reported", suggestions: ["Client states, \"[Quote client's words here]\".", "Client reported primary concerns regarding [topic1] and [topic2].", "The main issue discussed was [issue].", "Client expressed distress about [situation].", "Client presented with concerns about [symptom/problem]."] },
            { id: 's_mood_symptoms', label: "Reported Mood, Symptoms (sleep, appetite), Stress Levels", type: 'textarea', placeholder: "e.g., Mood: Anxious. Sleep: Poor. Stress: High.", suggestions: ["Client reported mood as [e.g., anxious, depressed, stable, fair, 7/10].", "Sleep reported as [e.g., poor, adequate, 6 hours, restless].", "Appetite reported as [e.g., good, decreased, increased].", "Energy levels described as [e.g., low, moderate, good].", "Reported experiencing [symptom, e.g., headaches, irritability, lack of motivation].", "Stress level reported as [e.g., high, manageable, X/10]."] },
            { id: 's_risk', label: "Suicidal/Homicidal Ideation (Client Report)", type: 'textarea', placeholder: "e.g., Denied SI/HI. Reported fleeting thoughts of...", suggestions: ["Client denied any suicidal or homicidal ideation, intent, or plan.", "Client reported fleeting thoughts of [suicide/self-harm] but denied intent or plan.", "No SI/HI reported by client.", "Client was directly asked about SI/HI and denied.", "Safety plan discussed in relation to reported thoughts."] }
        ]},
        { id: 'objectiveSection', title: 'O (Objective)', fields: [
            { id: 'o_presentation', label: "Appearance, Behavior, Attitude, Motor Activity, Eye Contact", type: 'textarea', placeholder: "e.g., Well-groomed, cooperative, restless, good eye contact", suggestions: ["Client presented as [e.g., well-groomed, casually dressed, disheveled].", "Behavior was [e.g., cooperative, restless, withdrawn, engaged].", "Attitude towards therapist was [e.g., open, guarded, friendly].", "Motor activity was [e.g., within normal limits, agitated, slowed].", "Eye contact was [e.g., good, fair, poor, fleeting]."] },
            { id: 'o_affect_mood_speech', label: "Observed Affect, Mood, Speech Characteristics", type: 'textarea', placeholder: "e.g., Affect: Congruent. Mood: Euthymic. Speech: Normal rate.", suggestions: ["Affect observed as [e.g., congruent with mood, constricted, flat, labile, broad].", "Observed mood appeared [e.g., euthymic, anxious, dysphoric, irritable].", "Speech was [e.g., clear and coherent, pressured, slow, soft, loud, normal rate and rhythm].", "Vocal tone was [e.g., monotonous, expressive]."] },
            { id: 'o_thought_orientation', label: "Thought Process/Content, Orientation", type: 'textarea', placeholder: "e.g., Thought process: Logical. Oriented x4.", suggestions: ["Thought process appeared [e.g., logical, coherent, tangential, circumstantial, disorganized].", "Thought content revealed [e.g., no evidence of delusions or hallucinations, preoccupation with X].", "Client was alert and oriented to [person, place, time, situation - specify, e.g., x3, x4].", "Cognitive functioning appeared [e.g., intact, impaired in X area].", "Insight judged to be [e.g., good, fair, poor, limited].", "Judgment appeared [e.g., good, fair, impaired]."] }
        ]},
        { id: 'assessmentSection', title: 'A (Assessment)', fields: [
            { id: 'a_summary_impressions', label: "Summary of Progress, Clinical Impressions, Response to Treatment", type: 'textarea', placeholder: "e.g., Making good progress with CBT. Symptoms of GAD appear reduced.", suggestions: ["Client appears to be making [e.g., good, some, limited] progress towards therapeutic goals.", "Clinical impressions are consistent with [diagnosis/working hypothesis, e.g., GAD, MDD, Adjustment Disorder].", "Client responded [e.g., positively, with difficulty] to interventions.", "Symptoms of [condition] appear to be [e.g., improving, worsening, stable].", "Current presentation suggests [summary statement]."] },
            { id: 'a_strengths_challenges', label: "Client Strengths and Challenges/Barriers", type: 'textarea', placeholder: "e.g., Strengths: Motivated. Challenges: Limited social support.", suggestions: ["Client's strengths include [e.g., motivation, insight, strong support system, resilience].", "Identified challenges include [e.g., negative self-talk, difficulty with emotional regulation, lack of resources].", "Barriers to progress may include [barrier1, barrier2].", "Protective factors noted: [factor1, factor2]."] },
            { id: 'a_risk_level_justification', label: "Risk Assessment (Level and Justification)", type: 'textarea', placeholder: "e.g., Low risk for self-harm, no active SI/HI, protective factors present.", suggestions: ["Risk of harm to self assessed as [e.g., low, moderate, high] due to [justification].", "Risk of harm to others assessed as [e.g., low, moderate, high] due to [justification].", "No current indicators of acute risk.", "Protective factors such as [factor1, factor2] mitigate risk.", "Risk factors include [factor1, factor2].", "Safety plan remains appropriate / was updated."] }
        ]},
        { id: 'planSection', title: 'P (Plan)', fields: [
            { id: 'p_interventions_response', label: "Interventions Used This Session & Client's Response", type: 'textarea', placeholder: "e.g., Utilized psychoeducation on anxiety. Client was receptive.", suggestions: ["Interventions utilized this session included [e.g., CBT, MI, psychoeducation, supportive listening, problem-solving].", "Client was receptive to [intervention] and [describe response, e.g., actively participated, appeared to understand].", "Practiced [skill, e.g., grounding techniques, communication skills].", "Explored [topic, e.g., cognitive distortions related to X].", "Provided validation and support for [client's experience]."] },
            { id: 'p_focus_homework', label: "Focus for Next Session, Homework Assigned", type: 'textarea', placeholder: "e.g., Next session: Review thought records. Homework: Complete daily mood log.", suggestions: ["Focus for next session will be to [e.g., review homework, explore X further, introduce Y skill].", "Homework assigned: [e.g., complete thought record, practice mindfulness daily, journal about X].", "Client agreed to [specific action before next session].", "No homework assigned this session."] },
            { id: 'p_safety_referrals_appt', label: "Safety Planning, Referrals, Next Appointment", type: 'textarea', placeholder: "e.g., Safety plan reviewed. No new referrals. Next appt: YYYY-MM-DD.", suggestions: ["Safety plan was reviewed and [e.g., remains appropriate, was updated to include X].", "Referral to [e.g., psychiatrist, support group, dietician] was [e.g., discussed, made, declined by client].", "Client to follow up with [specialist/service].", "Next appointment scheduled for [date] at [time].", "Continue weekly/bi-weekly sessions."] }
        ]}
    ];

    function getDefaultTemplates() {
        const defaultSoapTemplate = { 
            id: 'default_soap_v1', 
            name: "SOAP Note (Default)", 
            sections: standardSectionsDefinitionForDefault // Use the definition here
        };
        // Add other base templates later
        // e.g., const dentalTemplate = { id: 'dental_v1', name: 'Dental Basic', sections: [...] }
        return { 
            [defaultSoapTemplate.id]: defaultSoapTemplate,
            // [dentalTemplate.id]: dentalTemplate 
        };
    }

    // --- Helper Functions ---
    function generateUniqueId(prefix = 'id_') { /* ... Full code ... */ 
        return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    function showToast(message, type = 'success') { /* ... Full code ... */ 
        clearTimeout(toastTimeout); 
        toastMessage.textContent = message; toastMessage.className = 'show';
        if (type === 'error') toastMessage.style.backgroundColor = '#dc2626';
        else if (type === 'info') toastMessage.style.backgroundColor = '#2563eb';
        else toastMessage.style.backgroundColor = '#16a34a';
        toastTimeout = setTimeout(() => { toastMessage.className = toastMessage.className.replace('show', ''); }, 3000);
    }

    // --- Template Loading/Saving ---
    function loadTemplates() { /* ... Full code ... */ 
        const storedTemplates = localStorage.getItem(TEMPLATES_KEY);
        if (storedTemplates) { allTemplates = JSON.parse(storedTemplates); } 
        else { allTemplates = getDefaultTemplates(); saveTemplates(); }
        if (Object.keys(allTemplates).length === 0) { allTemplates = getDefaultTemplates(); saveTemplates(); }
    }
    function saveTemplates() { /* ... Full code ... */ 
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(allTemplates));
    }

    // --- Template Selection ---
    function populateTemplateSelector() { /* ... Full code ... */ 
        if (!templateSelector) return;
        templateSelector.innerHTML = ''; 
        Object.keys(allTemplates).forEach(templateId => {
            const option = document.createElement('option');
            option.value = templateId; option.textContent = allTemplates[templateId].name;
            if (templateId === currentTemplateId) option.selected = true;
            templateSelector.appendChild(option);
        });
    }
    if (templateSelector) { /* ... Full code ... */ 
        templateSelector.addEventListener('change', (e) => {
            const selectedTemplateId = e.target.value;
            if (selectedTemplateId && selectedTemplateId !== currentTemplateId) {
                const currentData = getFormData();
                let hasContent = Object.values(currentData).some(val => val.trim() !== "");
                if (!hasContent || confirm("Switching templates will clear current content. Continue?")) {
                    clearTheForm(false); 
                    currentTemplateId = selectedTemplateId;
                    localStorage.setItem(CURRENT_TEMPLATE_ID_KEY, currentTemplateId);
                    loadAndRenderTemplate(currentTemplateId);
                    showToast(`Template "${allTemplates[currentTemplateId].name}" loaded.`, 'info');
                } else { templateSelector.value = currentTemplateId; }
            }
        });
    }

    // --- Core Rendering Logic ---
    function loadAndRenderTemplate(templateId) { /* ... Full code ... */ 
        const templateDefinition = allTemplates[templateId];
        if (!templateDefinition) {
            console.error(`Template not found: ${templateId}`); showToast(`Error: Template not found.`, "error");
            const defaultId = Object.keys(allTemplates)[0];
             if(defaultId) {
                 currentTemplateId = defaultId; localStorage.setItem(CURRENT_TEMPLATE_ID_KEY, currentTemplateId);
                 templateSelector.value = currentTemplateId; loadAndRenderTemplate(currentTemplateId); 
             } return;
        }
        buildMasterData(templateDefinition); 
        renderForm(); 
        if(currentTemplateNameSpan) currentTemplateNameSpan.textContent = templateDefinition.name;
    }
    function buildMasterData(templateDefinition) { 
        masterFieldData = {}; masterSectionData = []; 
        if (!templateDefinition || !templateDefinition.sections) { console.error("Invalid template definition"); return; }

        // Need a reliable way to check if a section was originally standard
        const defaultTemplate = getDefaultTemplates()['default_soap_v1']; // Assuming this ID exists
        const standardSectionIds = defaultTemplate ? defaultTemplate.sections.map(s => s.id) : [];

        templateDefinition.sections.forEach(section => {
            const isOriginallyStandard = standardSectionIds.includes(section.id);
            // A section is considered custom if it's not in the original standard list OR if it has an explicit isCustom flag (future use)
            const sectionMeta = { 
                 id: section.id, title: section.title, 
                 isCustom: !isOriginallyStandard || section.isCustom === true, // Check flag too
                 fieldIds: [] 
             };
            (section.fields || []).forEach(field => { // Add safety check for fields array
                masterFieldData[field.id] = { 
                    label: field.label, suggestions: field.suggestions || [], sectionId: section.id,
                    type: field.type || 'textarea', placeholder: field.placeholder || ''
                };
                sectionMeta.fieldIds.push(field.id);
            });
            masterSectionData.push(sectionMeta);
        });
    }
    function renderForm() { /* ... Full code - Ensure .form-input-base IS added ... */ 
        if (!soapNoteForm) { console.error("soapNoteForm element not found!"); return; }
        soapNoteForm.innerHTML = ''; 
        masterSectionData.forEach(sectionMeta => {
            const sectionElement = document.createElement('section');
            sectionElement.id = sectionMeta.id; sectionElement.className = 'form-section'; 
            if (sectionMeta.isCustom) sectionElement.classList.add('custom-section'); 
            sectionElement.setAttribute('aria-labelledby', `${sectionMeta.id}-header`);
            const h3 = document.createElement('h3');
            h3.id = `${sectionMeta.id}-header`; h3.textContent = sectionMeta.title;
            sectionElement.appendChild(h3);
            if (sectionMeta.isCustom) {
                const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '×';
                deleteBtn.className = 'delete-section-btn'; deleteBtn.title = 'Delete custom section';
                deleteBtn.type = 'button'; 
                deleteBtn.addEventListener('click', () => handleDeleteCustomSection(sectionMeta.id, sectionMeta.title));
                sectionElement.appendChild(deleteBtn);
            }
            let fieldCountInGrid = 0; let currentGridDiv = null;
            (sectionMeta.fieldIds || []).forEach((fieldId) => { // Safety check
                const field = masterFieldData[fieldId];
                if (!field) { console.warn(`Field data missing: ${fieldId} in section ${sectionMeta.id}`); return; }
                const formFieldDiv = document.createElement('div'); formFieldDiv.className = 'form-field'; 
                let addedToGrid = false;
                if (sectionMeta.id === 'generalInfoSection' && field.type === 'text' && fieldCountInGrid < 2) {
                    if (!currentGridDiv) {
                        currentGridDiv = document.createElement('div'); currentGridDiv.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
                        const h3El = sectionElement.querySelector('h3'); sectionElement.insertBefore(currentGridDiv, h3El.nextElementSibling);
                    }
                    currentGridDiv.appendChild(formFieldDiv); fieldCountInGrid++; addedToGrid = true;
                } else {
                     const isFirstNonH3Element = sectionElement.children.length <= (sectionMeta.isCustom ? 2 : 1); 
                     if (!isFirstNonH3Element) formFieldDiv.classList.add('mt-4');
                    sectionElement.appendChild(formFieldDiv);
                }
                const labelEl = document.createElement('label');
                labelEl.htmlFor = fieldId; labelEl.textContent = field.label; formFieldDiv.appendChild(labelEl);
                let inputEl;
                if (field.type === 'textarea') inputEl = document.createElement('textarea');
                else { inputEl = document.createElement('input'); inputEl.type = 'text'; }
                inputEl.id = fieldId; inputEl.name = fieldId; inputEl.placeholder = field.placeholder;
                inputEl.classList.add('form-input-base'); // ADD STYLING CLASS
                formFieldDiv.appendChild(inputEl);
                inputEl.addEventListener('focus', () => {
                    activeTextarea = inputEl; updateHelperPanel(fieldId);
                    if (customSuggestionModule) customSuggestionModule.style.display = 'block';
                    if (addCustomSuggestionTitle) addCustomSuggestionTitle.textContent = `Add for: ${masterFieldData[fieldId]?.label || 'Field'}`;
                    if (suggestionsHelperTabButton) suggestionsHelperTabButton.click(); 
                });
            });
            soapNoteForm.appendChild(sectionElement);
        });
        populateTargetSectionSelect(); initSectionVisibilityControls(); applyUISettings(); 
    }

    // --- Template Customization Functions ---
    function getCurrentTemplateDefinition() { /* ... Full code ... */ 
         if (!currentTemplateId || !allTemplates[currentTemplateId]) {
             console.error("Cannot get current template: ID or template missing."); return null;
         } return allTemplates[currentTemplateId];
    }
    function handleDeleteCustomSection(sectionId, sectionTitle) { /* ... Full code ... */ 
        if (!confirm(`Delete section "${sectionTitle}" from template "${allTemplates[currentTemplateId].name}"? This cannot be undone.`)) return;
        const currentTemplate = getCurrentTemplateDefinition(); if (!currentTemplate) return;
        currentTemplate.sections = currentTemplate.sections.filter(s => s.id !== sectionId);
        saveTemplates(); 
        const suggestions = getCustomSuggestions();
        const sectionMeta = masterSectionData.find(s => s.id === sectionId); 
        if (sectionMeta) sectionMeta.fieldIds.forEach(fieldId => delete suggestions[fieldId]);
        saveCustomSuggestions(suggestions);
        loadAndRenderTemplate(currentTemplateId); 
        showToast(`Section "${sectionTitle}" deleted.`, 'success');
    }
    function populateTargetSectionSelect() { /* ... Full code ... */ 
        if (!targetSectionSelect) return; targetSectionSelect.innerHTML = '';
        masterSectionData.forEach(section => { // Use masterSectionData for current view
            const option = document.createElement('option');
            option.value = section.id; option.textContent = section.title;
            targetSectionSelect.appendChild(option);
        });
    }
    if (addNewSectionButton) { /* ... Full code ... */ 
        addNewSectionButton.addEventListener('click', () => {
            const sectionName = newSectionNameInput.value.trim();
            if (!sectionName) { showToast("Section title empty.", "info"); return; }
            const currentTemplate = getCurrentTemplateDefinition(); if (!currentTemplate) return;
            const newSection = { id: generateUniqueId('section_'), title: sectionName, fields: [], isCustom: true }; 
            currentTemplate.sections.push(newSection); 
            // Changes are in memory (allTemplates object), explicit save needed via button
            buildMasterData(currentTemplate); renderForm(); 
            newSectionNameInput.value = '';
            showToast(`Section "${sectionName}" added (unsaved).`, 'info');
        });
    }
    if (addNewFieldButton) { /* ... Full code ... */ 
        addNewFieldButton.addEventListener('click', () => {
            const fieldLabel = newFieldNameInput.value.trim(); const selectedSectionId = targetSectionSelect.value;
            if (!fieldLabel) { showToast("Field label empty.", "info"); return; }
            if (!selectedSectionId) { showToast("Select a section.", "info"); return; }
            const currentTemplate = getCurrentTemplateDefinition(); if (!currentTemplate) return;
            let targetSection = currentTemplate.sections.find(s => s.id === selectedSectionId);
            if (!targetSection) { showToast("Target section not found.", "error"); return; }
            const newField = { id: generateUniqueId('field_'), label: fieldLabel, type: 'textarea', placeholder: `Enter ${fieldLabel}...` };
            if (!targetSection.fields) targetSection.fields = []; // Ensure fields array exists
            targetSection.fields.push(newField); 
             // Changes are in memory (allTemplates object), explicit save needed via button
            buildMasterData(currentTemplate); renderForm(); 
            newFieldNameInput.value = '';
            showToast(`Field "${fieldLabel}" added (unsaved).`, 'info');
        });
    }
    if (saveTemplateChangesButton) { /* ... Full code ... */ 
        saveTemplateChangesButton.addEventListener('click', () => {
            if (!currentTemplateId || !allTemplates[currentTemplateId]) { showToast("No active template.", "error"); return; }
            saveTemplates(); 
            showToast(`Changes to template "${allTemplates[currentTemplateId].name}" saved.`, 'success');
        });
    }
    if (saveAsNewTemplateButton) { /* ... Full code ... */ 
        saveAsNewTemplateButton.addEventListener('click', () => {
            const currentTemplate = getCurrentTemplateDefinition(); if (!currentTemplate) return;
            const newTemplateName = prompt("Enter name for new template:", `${currentTemplate.name} (Copy)`);
            if (!newTemplateName || newTemplateName.trim() === "") { showToast("Name empty.", "info"); return; }
            const newTemplate = JSON.parse(JSON.stringify(currentTemplate)); 
            newTemplate.id = generateUniqueId('template_user_'); 
            newTemplate.name = newTemplateName.trim();
            // Ensure sections/fields in the clone are marked appropriately if needed (e.g., remove isStandardBase flags?)
            // For simplicity now, just clone.
            allTemplates[newTemplate.id] = newTemplate; 
            saveTemplates(); 
            currentTemplateId = newTemplate.id; localStorage.setItem(CURRENT_TEMPLATE_ID_KEY, currentTemplateId);
            populateTemplateSelector(); templateSelector.value = currentTemplateId; 
            loadAndRenderTemplate(currentTemplateId); 
            showToast(`Template saved as "${newTemplate.name}".`, 'success');
        });
    }
    
    // --- Helper Panel Tab Navigation (Full Code) ---
    function setupHelperPanelTabs() { /* ... Full code ... */ 
        const tabButtons = [suggestionsHelperTabButton, templateEditorHelperTabButton].filter(Boolean); 
        const tabContents = [suggestionsHelperTabContent, templateEditorHelperTabContent].filter(Boolean);
        if (tabButtons.length === 0 || tabContents.length === 0 || tabButtons.length !== tabContents.length) {
             console.error("Helper panel tab elements mismatch."); return;
        }
        const activeClasses = ['active-tab', 'border-sky-500', 'text-sky-600'];
        const inactiveClasses = ['border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300'];

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault(); 
                tabButtons.forEach(btn => { btn.classList.remove(...activeClasses); btn.classList.add(...inactiveClasses); });
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add(...activeClasses); button.classList.remove(...inactiveClasses);
                const targetContentId = button.dataset.tabTarget;
                const targetContentElement = document.getElementById(targetContentId);
                if (targetContentElement) targetContentElement.classList.add('active');
                else console.error(`Target content not found: ${targetContentId}`);
            });
        });
         let activeTabFound = false;
         tabButtons.forEach(button => {
             if(button.classList.contains('active-tab')) {
                 const targetContentElement = document.getElementById(button.dataset.tabTarget);
                 if (targetContentElement) targetContentElement.classList.add('active');
                 activeTabFound = true;
                 button.classList.remove(...inactiveClasses); 
             } else {
                  button.classList.add(...inactiveClasses); 
                  button.classList.remove(...activeClasses);
             }
         });
         if(!activeTabFound && suggestionsHelperTabButton) {
             suggestionsHelperTabButton.classList.add(...activeClasses);
             suggestionsHelperTabButton.classList.remove(...inactiveClasses);
             if(suggestionsHelperTabContent) suggestionsHelperTabContent.classList.add('active');
         }
    }

    // --- Download/Upload & Draft Management (Full Code) ---
    function generateFilename(baseName, extension) { /* ... Full code ... */ 
        const dateEl = document.getElementById('gi_date'); const clientIdEl = document.getElementById('gi_client_id');
        let dateStr = dateEl && dateEl.value ? dateEl.value.replace(/-/g, '') : new Date().toISOString().slice(0,10).replace(/-/g, '');
        if (!/^\d{8}$/.test(dateStr) && !/^\d{4}\d{2}\d{2}$/.test(dateStr)) dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
        let clientIdStr = clientIdEl && clientIdEl.value ? clientIdEl.value.replace(/[^a-zA-Z0-9_.-]/g, '') : 'NoClient';
        if (!clientIdStr) clientIdStr = 'NoClient';
        return `NoteingHam_${baseName}_${dateStr}_${clientIdStr}.${extension}`;
    }
    function triggerDownload(filename, data, mimeType) { /* ... Full code ... */ 
        const blob = new Blob([data], { type: mimeType }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    if (downloadNoteButton) { /* ... Full code ... */ 
        downloadNoteButton.addEventListener('click', () => {
            let htmlNote = `<html><head><meta charset="UTF-8"><title>Note - ${allTemplates[currentTemplateId]?.name || 'Untitled'}</title><style>body{font-family:Arial,sans-serif;} h3{margin-top:1em;margin-bottom:0.5em;} p{margin:0.2em 0;}</style></head><body>`;
            htmlNote += `<h1>${allTemplates[currentTemplateId]?.name || 'Note'}</h1><hr>`; 
            const uiSettings = loadUISettings(); let contentAdded = false;
            masterSectionData.forEach(sectionMeta => { 
                if (uiSettings.sectionsVisible && typeof uiSettings.sectionsVisible[sectionMeta.id] !== 'undefined' && !uiSettings.sectionsVisible[sectionMeta.id]) return; 
                let sectionContent = `<h3><strong>${sectionMeta.title}:</strong></h3>`; let fieldsAddedToSection = false;
                sectionMeta.fieldIds.forEach(fieldId => {
                    const field = masterFieldData[fieldId]; const element = document.getElementById(fieldId);
                    const value = element ? element.value.trim().replace(/\n/g, '<br>') : '';
                    if (value) { fieldsAddedToSection = true; contentAdded = true; sectionContent += `<p><strong>${field.label}:</strong> ${value}</p>`; }
                });
                if(fieldsAddedToSection) htmlNote += sectionContent + "<br>";
            });
            htmlNote += "</body></html>";
            if (!contentAdded) { showToast("Note is empty.", "error"); return; }
            const filename = generateFilename('Note', 'doc'); triggerDownload(filename, htmlNote, 'application/msword');
            showToast("Note downloaded!", "success");
        });
    }
    if (downloadDraftButton) { /* ... Full code ... */ 
        downloadDraftButton.addEventListener('click', () => {
            const dataToSave = { templateId: currentTemplateId, formData: getFormData() };
            if (Object.values(dataToSave.formData).every(val => val.trim() === "")) { showToast("Nothing to download.", "info"); return; }
            const jsonData = JSON.stringify(dataToSave, null, 2); const filename = generateFilename('Draft', 'json');
            triggerDownload(filename, jsonData, 'application/json'); showToast("Draft downloaded!", "success");
        });
    }
    if (uploadDraftButton) { /* ... Full code ... */ 
        uploadDraftButton.addEventListener('click', () => uploadDraftInput.click() );
    }
    if (uploadDraftInput) { /* ... Full code ... */ 
        uploadDraftInput.addEventListener('change', (event) => {
            const file = event.target.files[0]; if (!file) return;
            const currentData = getFormData();
            if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Overwrite current note content?")) { event.target.value = null; return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const draftData = JSON.parse(e.target.result);
                    if (draftData.templateId && allTemplates[draftData.templateId]) {
                         if (draftData.templateId !== currentTemplateId) {
                              currentTemplateId = draftData.templateId; localStorage.setItem(CURRENT_TEMPLATE_ID_KEY, currentTemplateId);
                              populateTemplateSelector(); templateSelector.value = currentTemplateId;
                         }
                         loadAndRenderTemplate(currentTemplateId); setFormData(draftData.formData); 
                         showToast("Draft uploaded & template loaded!", "success");
                    } else if (draftData.formData) {
                         setFormData(draftData.formData); 
                         showToast("Draft content loaded into current template.", "warning");
                    } else { showToast("Invalid draft file format.", "error"); }
                } catch (err) { console.error("Err parsing draft:", err); showToast("Invalid JSON.", "error"); } 
                finally { event.target.value = null; }
            };
            reader.onerror = () => { showToast("Error reading file.", "error"); event.target.value = null; };
            reader.readAsText(file);
        });
    }

    // --- Custom Suggestions, Field Focus, Helper Panel (Full Code) ---
    function getCustomSuggestions() { /* ... Full code ... */ 
        const suggestions = localStorage.getItem(CUSTOM_SUGGESTIONS_KEY);
        return suggestions ? JSON.parse(suggestions) : {};
    }
    function saveCustomSuggestions(allSuggestions) { /* ... Full code ... */ 
        localStorage.setItem(CUSTOM_SUGGESTIONS_KEY, JSON.stringify(allSuggestions));
    }
    function addCustomSuggestionForField(fieldId, suggestionText) { /* ... Full code ... */ 
        const allSuggestions = getCustomSuggestions();
        if (!allSuggestions[fieldId]) allSuggestions[fieldId] = [];
        if (!allSuggestions[fieldId].includes(suggestionText)) {
            allSuggestions[fieldId].push(suggestionText); saveCustomSuggestions(allSuggestions); return true;
        } return false;
    }
    function deleteCustomSuggestionForField(fieldId, suggestionText) { /* ... Full code ... */ 
        const allSuggestions = getCustomSuggestions();
        if (allSuggestions[fieldId]) {
            allSuggestions[fieldId] = allSuggestions[fieldId].filter(s => s !== suggestionText);
            if (allSuggestions[fieldId].length === 0) delete allSuggestions[fieldId];
            saveCustomSuggestions(allSuggestions);
        }
    }
    if (addCustomSuggestionButton) { /* ... Full code ... */ 
        addCustomSuggestionButton.addEventListener('click', () => {
            if (!activeTextarea || !activeTextarea.id) { showToast("No field selected.", "error"); return; }
            const suggestionText = customSuggestionInput.value.trim();
            if (!suggestionText) { showToast("Suggestion empty.", "info"); return; }
            if (addCustomSuggestionForField(activeTextarea.id, suggestionText)) {
                showToast("Custom suggestion added!", "success"); customSuggestionInput.value = ''; updateHelperPanel(activeTextarea.id);
            } else { showToast("Suggestion exists.", "info"); }
        });
    }
    // Removed Clear Active Field Button Listener
    
    function updateHelperPanel(fieldId) { /* ... Full code ... */ 
        const fieldMeta = masterFieldData[fieldId];
        if (!fieldMeta || !helperPanelSubtitle || !suggestionsContainer) return;
        helperPanelSubtitle.textContent = `For: ${fieldMeta.label}`;
        suggestionsContainer.innerHTML = ''; const customSuggestions = getCustomSuggestions();
        const fieldCustomSuggestions = customSuggestions[fieldId] || []; let hasSuggestions = false;
        if (fieldMeta.suggestions && fieldMeta.suggestions.length > 0) {
            hasSuggestions = true;
            fieldMeta.suggestions.forEach(text => suggestionsContainer.appendChild(createSuggestionButton(text, false, fieldId)));
        }
        if (fieldCustomSuggestions.length > 0) {
            hasSuggestions = true;
            fieldCustomSuggestions.forEach(text => suggestionsContainer.appendChild(createSuggestionButton(text, true, fieldId)));
        }
        if (!hasSuggestions) suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">No suggestions. Add your own!</p>';
    }
    function createSuggestionButton(text, isCustom, fieldId) { /* ... Full code ... */ 
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn' + (isCustom ? ' suggestion-btn-custom' : '');
        const textSpan = document.createElement('span');
        textSpan.textContent = text; textSpan.style.flexGrow = "1"; btn.appendChild(textSpan);
        if (isCustom) {
            const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '×'; 
            deleteBtn.className = 'delete-suggestion-btn'; deleteBtn.title = 'Delete suggestion';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete: "${text}"?`)) {
                    deleteCustomSuggestionForField(fieldId, text); updateHelperPanel(fieldId); showToast("Suggestion deleted.", "info");
                }
            };
            btn.appendChild(deleteBtn);
        }
        btn.addEventListener('click', () => insertSuggestion(text)); return btn;
    }
    function insertSuggestion(text) { /* ... Full code ... */ 
        if (!activeTextarea) return;
        const currentVal = activeTextarea.value; const cursorPos = activeTextarea.selectionStart; let prefix = "";
        if (cursorPos > 0 && !/[\s\n]$/.test(currentVal.substring(0, cursorPos))) prefix = " ";
        else if (currentVal.length > 0 && !currentVal.endsWith('\n') && !currentVal.endsWith('\n\n') && !text.startsWith('- ')) {
            if (!currentVal.endsWith('\n')) prefix = "\n";
        }
        const textToInsert = prefix + text;
        activeTextarea.value = currentVal.substring(0, cursorPos) + textToInsert + currentVal.substring(activeTextarea.selectionEnd);
        activeTextarea.focus(); activeTextarea.selectionStart = activeTextarea.selectionEnd = cursorPos + textToInsert.length;
    }

    // --- Form Data Get/Set (Full Code) ---
    function getFormData() { /* ... Full code ... */ 
        const data = {};
        Object.keys(masterFieldData).forEach(id => { const element = document.getElementById(id); if (element) data[id] = element.value; });
        return data;
    }
    function setFormData(data) { /* ... Full code ... */ 
        Object.keys(masterFieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element && typeof data[id] !== 'undefined') element.value = data[id] || '';
        });
    }

    // --- Local Storage Draft (Full Code) ---
    if (saveDraftButton) { /* ... Full code ... */ 
        saveDraftButton.addEventListener('click', () => {
            try {
                const draftContent = { templateId: currentTemplateId, formData: getFormData() };
                if (Object.values(draftContent.formData).every(val => val.trim() === "")) { showToast("Form empty.", "info"); return; }
                localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draftContent)); showToast("Draft saved locally!");
            } catch (e) { console.error("Err save draft:", e); showToast("Could not save.", "error"); }
        });
    }
    if (loadDraftButton) { /* ... Full code ... */ 
        loadDraftButton.addEventListener('click', () => {
            const currentData = getFormData();
            if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Overwrite current note content?")) return;
            try {
                const savedDraftString = localStorage.getItem(LOCAL_DRAFT_KEY);
                if (savedDraftString) {
                    const savedDraft = JSON.parse(savedDraftString);
                    if (savedDraft.templateId && savedDraft.templateId !== currentTemplateId && allTemplates[savedDraft.templateId]) {
                        if (confirm(`Draft uses "${allTemplates[savedDraft.templateId]?.name || 'other'}". Switch template & load?`)) {
                            currentTemplateId = savedDraft.templateId; localStorage.setItem(CURRENT_TEMPLATE_ID_KEY, currentTemplateId);
                            populateTemplateSelector(); templateSelector.value = currentTemplateId;
                            loadAndRenderTemplate(currentTemplateId); setFormData(savedDraft.formData); 
                            showToast("Template switched & draft loaded!");
                        } else { showToast("Draft load cancelled.", "info"); }
                    } else if (savedDraft.formData) {
                         setFormData(savedDraft.formData); showToast("Draft loaded!");
                    } else { showToast("Invalid draft data.", "error"); }
                } else { showToast("No local draft.", "info"); }
            } catch (e) { console.error("Err load draft:", e); showToast("Could not load draft.", "error"); }
        });
    }
    
    // --- Clear/Reset Form (Full Code) ---
    const clearTheForm = (promptUser = true) => { /* ... Full code ... */ 
        if (promptUser && !confirm("Clear entire form content?")) return false; 
        Object.keys(masterFieldData).forEach(id => { const element = document.getElementById(id); if (element) element.value = ''; });
        if(helperPanelSubtitle) helperPanelSubtitle.textContent = "For: (No field selected)";
        if(suggestionsContainer) suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">Click on a field...</p>';
        if(customSuggestionModule) customSuggestionModule.style.display = 'none'; activeTextarea = null;
        return true; 
    };
    if (clearFormButton) { /* ... Full code ... */ 
        clearFormButton.addEventListener('click', () => { if (clearTheForm(true)) showToast("Form cleared."); });
    }
    if (resetNoteButton) { /* ... Full code ... */ 
        resetNoteButton.addEventListener('click', () => { if (clearTheForm(true)) showToast("New note. Form cleared."); });
    }

    // --- UI Settings (Density & Section Visibility - Full Code) ---
    function loadUISettings() { /* ... Full code ... */ 
        const settings = localStorage.getItem(UI_SETTINGS_KEY);
        let defaultSectionsVisible = {}; masterSectionData.forEach(s => defaultSectionsVisible[s.id] = true); 
        const defaults = { layout: 'normal', sectionsVisible: defaultSectionsVisible };
        if (settings) {
            const loaded = JSON.parse(settings);
            let mergedSectionsVisible = {...defaultSectionsVisible, ...(loaded.sectionsVisible || {})};
            masterSectionData.forEach(section => { if (typeof mergedSectionsVisible[section.id] === 'undefined') mergedSectionsVisible[section.id] = true; });
            loaded.sectionsVisible = mergedSectionsVisible; return { ...defaults, ...loaded };
        } return defaults;
    }
    function saveUISetting(key, value) { /* ... Full code ... */ 
        const settings = loadUISettings();
        settings[key] = value; localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
    }
    function applyUISettings() { /* ... Full code ... */ 
        const settings = loadUISettings();
        document.body.className = document.body.className.replace(/layout-\w+/g, ''); // Remove old layout classes
        document.body.classList.add(`layout-${settings.layout || 'normal'}`);
        document.querySelectorAll('.top-controls-bar .btn-density').forEach(btn => { 
            const isActive = btn.dataset.density === (settings.layout || 'normal');
            btn.classList.toggle('active', isActive);
            if (isActive) {
                 btn.classList.add('bg-sky-600', 'text-white', 'hover:bg-sky-700', 'border-sky-600');
                 btn.classList.remove('bg-white', 'border-slate-300', 'text-slate-700', 'hover:bg-slate-50');
             } else {
                 btn.classList.remove('bg-sky-600', 'text-white', 'hover:bg-sky-700', 'border-sky-600');
                 btn.classList.add('bg-white', 'border-slate-300', 'text-slate-700', 'hover:bg-slate-50');
             }
        });
        if (settings.sectionsVisible) {
            Object.entries(settings.sectionsVisible).forEach(([sectionId, isVisible]) => {
                const sectionElement = document.getElementById(sectionId);
                const checkbox = document.querySelector(`#visibleSectionsControlsContainer input[data-section-id="${sectionId}"]`);
                if (sectionElement) sectionElement.classList.toggle('hidden-section', !isVisible);
                if (checkbox) checkbox.checked = !!isVisible; 
            });
        }
    }
    function initSectionVisibilityControls() { /* ... Full code ... */ 
        if (!visibleSectionsControlsContainer) return;
        visibleSectionsControlsContainer.innerHTML = ''; 
        masterSectionData.forEach(section => {
            const div = document.createElement('div'); div.className = 'flex items-center';
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
            checkbox.id = `toggle-vis-${section.id}`; checkbox.dataset.sectionId = section.id; 
            checkbox.className = 'mr-2 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500';
            const label = document.createElement('label'); label.htmlFor = `toggle-vis-${section.id}`;
            label.textContent = section.title; label.className = 'text-sm text-slate-700 select-none';
            div.appendChild(checkbox); div.appendChild(label); visibleSectionsControlsContainer.appendChild(div);
            checkbox.addEventListener('change', (e) => {
                const currentSettings = loadUISettings();
                if(!currentSettings.sectionsVisible) currentSettings.sectionsVisible = {};
                currentSettings.sectionsVisible[section.id] = e.target.checked;
                saveUISetting('sectionsVisible', currentSettings.sectionsVisible); applyUISettings();
            });
        });
         // Apply settings AFTER controls are built to set initial check state
         applyUISettings();
    }
    function initDensityControls() { /* ... Full code ... */ 
         document.querySelectorAll('.top-controls-bar .btn-density').forEach(button => { 
            button.addEventListener('click', () => {
                saveUISetting('layout', button.dataset.density); applyUISettings();
            });
        });
    }
    if (toggleVisibleSectionsButton && visibleSectionsPopover) { /* ... Full code ... */ 
        toggleVisibleSectionsButton.addEventListener('click', (event) => {
            event.stopPropagation(); visibleSectionsPopover.classList.toggle('active');
        });
        document.addEventListener('click', (event) => {
            if (visibleSectionsPopover.classList.contains('active') && 
                !visibleSectionsPopover.contains(event.target) && event.target !== toggleVisibleSectionsButton) {
                visibleSectionsPopover.classList.remove('active');
            }
        });
    }

    // --- Initial Load ---
    initializeApp(); // Call the main initialization function

});
