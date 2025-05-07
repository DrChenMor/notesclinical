document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (Ensure all are fetched AFTER DOM is loaded) ---
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
    const clearActiveFieldButton = document.getElementById('clearActiveFieldButton');
    const toastMessage = document.getElementById('toast-message');
    const displayOptionsTabButton = document.getElementById('displayOptionsTabButton');
    const templateEditorTabButton = document.getElementById('templateEditorTabButton');
    const displayOptionsTabContent = document.getElementById('displayOptionsTabContent');
    const templateEditorTabContent = document.getElementById('templateEditorTabContent');
    const newSectionNameInput = document.getElementById('newSectionNameInput');
    const addNewSectionButton = document.getElementById('addNewSectionButton');
    const targetSectionSelect = document.getElementById('targetSectionSelect');
    const newFieldNameInput = document.getElementById('newFieldNameInput');
    const addNewFieldButton = document.getElementById('addNewFieldButton');
    const visibleSectionsControlsContainer = document.getElementById('visibleSectionsControlsContainer');

    // --- State & Keys ---
    let activeTextarea = null;
    let toastTimeout; // Declare toastTimeout here to be accessible by showToast

    const CUSTOM_SUGGESTIONS_KEY = 'noteinghamCustomSuggestions_v3'; // Incremented version
    const UI_SETTINGS_KEY = 'noteinghamUISettings_v3';
    const LOCAL_DRAFT_KEY = 'noteinghamSOAPNoteDraft_v3';
    const CUSTOM_TEMPLATE_KEY = 'noteinghamCustomTemplate_v3';

    // --- Initial Data Structures ---
    let masterFieldData = {}; 
    let masterSectionData = [];

    const standardSections = [
        { id: 'generalInfoSection', title: 'General Information', fields: [
            { id: 'gi_date', label: 'Date', type: 'text', placeholder: 'YYYY-MM-DD', suggestions: ["Today's date: " + new Date().toISOString().slice(0,10), "Date of session: "] },
            { id: 'gi_client_id', label: 'Client ID / Name', type: 'text', placeholder: 'e.g., 12345 or Initials', suggestions: ["Client ID: ", "Client Initials: "] },
            { id: 'gi_session_focus', label: 'Session Focus / Main Topic', type: 'textarea', placeholder: 'e.g., Review of coping strategies for anxiety', suggestions: ["Session focused on reviewing coping strategies for [issue].", "Exploration of [topic, e.g., recent stressors]."] }
        ]},
        { id: 'subjectiveSection', title: 'S (Subjective)', fields: [
            { id: 's_main_concerns', label: "Client's Main Concerns, Statements, Presenting Issues", type: 'textarea', placeholder: "Client states, '...' or primary issues reported", suggestions: ["Client states, \"[Quote client's words here]\"."] },
            { id: 's_mood_symptoms', label: "Reported Mood, Symptoms (sleep, appetite), Stress Levels", type: 'textarea', placeholder: "e.g., Mood: Anxious. Sleep: Poor. Stress: High.", suggestions: ["Client reported mood as [e.g., anxious, depressed, stable, fair, 7/10]."] },
            { id: 's_risk', label: "Suicidal/Homicidal Ideation (Client Report)", type: 'textarea', placeholder: "e.g., Denied SI/HI. Reported fleeting thoughts of...", suggestions: ["Client denied any suicidal or homicidal ideation, intent, or plan."] }
        ]},
        { id: 'objectiveSection', title: 'O (Objective)', fields: [
            { id: 'o_presentation', label: "Appearance, Behavior, Attitude, Motor Activity, Eye Contact", type: 'textarea', placeholder: "e.g., Well-groomed, cooperative, restless, good eye contact", suggestions: ["Client presented as [e.g., well-groomed, casually dressed, disheveled]."] },
            { id: 'o_affect_mood_speech', label: "Observed Affect, Mood, Speech Characteristics", type: 'textarea', placeholder: "e.g., Affect: Congruent. Mood: Euthymic. Speech: Normal rate.", suggestions: ["Affect observed as [e.g., congruent with mood, constricted, flat, labile, broad]."] },
            { id: 'o_thought_orientation', label: "Thought Process/Content, Orientation", type: 'textarea', placeholder: "e.g., Thought process: Logical. Oriented x4.", suggestions: ["Thought process appeared [e.g., logical, coherent, tangential, circumstantial, disorganized]."] }
        ]},
        { id: 'assessmentSection', title: 'A (Assessment)', fields: [
            { id: 'a_summary_impressions', label: "Summary of Progress, Clinical Impressions, Response to Treatment", type: 'textarea', placeholder: "e.g., Making good progress with CBT. Symptoms of GAD appear reduced.", suggestions: ["Client appears to be making [e.g., good, some, limited] progress towards therapeutic goals."] },
            { id: 'a_strengths_challenges', label: "Client Strengths and Challenges/Barriers", type: 'textarea', placeholder: "e.g., Strengths: Motivated. Challenges: Limited social support.", suggestions: ["Client's strengths include [e.g., motivation, insight, strong support system, resilience]."] },
            { id: 'a_risk_level_justification', label: "Risk Assessment (Level and Justification)", type: 'textarea', placeholder: "e.g., Low risk for self-harm, no active SI/HI, protective factors present.", suggestions: ["Risk of harm to self assessed as [e.g., low, moderate, high] due to [justification]."] }
        ]},
        { id: 'planSection', title: 'P (Plan)', fields: [
            { id: 'p_interventions_response', label: "Interventions Used This Session & Client's Response", type: 'textarea', placeholder: "e.g., Utilized psychoeducation on anxiety. Client was receptive.", suggestions: ["Interventions utilized this session included [e.g., CBT, MI, psychoeducation, supportive listening, problem-solving]."] },
            { id: 'p_focus_homework', label: "Focus for Next Session, Homework Assigned", type: 'textarea', placeholder: "e.g., Next session: Review thought records. Homework: Complete daily mood log.", suggestions: ["Focus for next session will be to [e.g., review homework, explore X further, introduce Y skill]."] },
            { id: 'p_safety_referrals_appt', label: "Safety Planning, Referrals, Next Appointment", type: 'textarea', placeholder: "e.g., Safety plan reviewed. No new referrals. Next appt: YYYY-MM-DD.", suggestions: ["Safety plan was reviewed and [e.g., remains appropriate, was updated to include X]."] }
        ]}
    ];

    // --- Helper Functions ---
    function generateUniqueId(prefix = 'id_') {
        return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout); // Corrected: use toastTimeout directly
        toastMessage.textContent = message;
        toastMessage.className = 'show';
        if (type === 'error') toastMessage.style.backgroundColor = '#dc2626';
        else if (type === 'info') toastMessage.style.backgroundColor = '#2563eb';
        else toastMessage.style.backgroundColor = '#16a34a';
        toastTimeout = setTimeout(() => {
            toastMessage.className = toastMessage.className.replace('show', '');
        }, 3000);
    }

    // --- Dynamic Form Rendering & Template Management ---
    function getCustomTemplate() {
        const template = localStorage.getItem(CUSTOM_TEMPLATE_KEY);
        return template ? JSON.parse(template) : { sections: [] };
    }

    function saveCustomTemplate(customTemplate) {
        localStorage.setItem(CUSTOM_TEMPLATE_KEY, JSON.stringify(customTemplate));
    }

    function buildMasterData() {
        masterFieldData = {};
        masterSectionData = [];

        standardSections.forEach(section => {
            const sectionMeta = { id: section.id, title: section.title, isCustom: false, fieldIds: [] };
            section.fields.forEach(field => {
                masterFieldData[field.id] = { 
                    label: field.label, 
                    suggestions: field.suggestions || [], 
                    sectionId: section.id,
                    type: field.type,
                    placeholder: field.placeholder || ''
                };
                sectionMeta.fieldIds.push(field.id);
            });
            masterSectionData.push(sectionMeta);
        });

        const customTemplate = getCustomTemplate();
        customTemplate.sections.forEach(customSection => {
             // If custom section ID clashes with a standard one, it might have been a standard section with custom fields added.
            // We need to merge fields carefully or decide on a strategy.
            // For now, assume custom section IDs are unique or they "override" standard structure if ID matches.
            let sectionMeta = masterSectionData.find(s => s.id === customSection.id);
            if (!sectionMeta) { // New custom section
                sectionMeta = { id: customSection.id, title: customSection.title, isCustom: true, fieldIds: [] };
                masterSectionData.push(sectionMeta);
            } else { // Potentially adding custom fields to a representation of a standard section
                sectionMeta.isCustom = true; // Mark it as having custom modifications
                if(customSection.title && customSection.title !== sectionMeta.title) sectionMeta.title = customSection.title; // Allow custom title override
            }
            
            customSection.fields.forEach(customField => {
                // Ensure custom field ID is unique within the entire form
                if (masterFieldData[customField.id]) {
                    console.warn(`Custom field ID ${customField.id} collides with an existing field. Skipping.`);
                    return;
                }
                masterFieldData[customField.id] = { 
                    label: customField.label, 
                    suggestions: [], 
                    sectionId: customSection.id,
                    type: customField.type || 'textarea',
                    placeholder: customField.placeholder || `Enter ${customField.label}...`
                };
                if (!sectionMeta.fieldIds.includes(customField.id)) {
                    sectionMeta.fieldIds.push(customField.id);
                }
            });
        });
    }
    
    function renderForm() {
        soapNoteForm.innerHTML = ''; 

        masterSectionData.forEach(sectionMeta => {
            const sectionElement = document.createElement('section');
            sectionElement.id = sectionMeta.id;
            sectionElement.className = 'form-section';
            sectionElement.setAttribute('aria-labelledby', `${sectionMeta.id}-header`);

            const h3 = document.createElement('h3');
            h3.id = `${sectionMeta.id}-header`;
            h3.textContent = sectionMeta.title;
            sectionElement.appendChild(h3);

            let fieldCountInGrid = 0;
            let currentGridDiv = null;

            sectionMeta.fieldIds.forEach((fieldId) => {
                const field = masterFieldData[fieldId];
                if (!field) {
                    console.warn(`Field data not found for ID: ${fieldId} in section ${sectionMeta.title}`);
                    return;
                }

                const formFieldDiv = document.createElement('div');
                formFieldDiv.className = 'form-field';

                let addedToGrid = false;
                if (sectionMeta.id === 'generalInfoSection' && field.type === 'text' && fieldCountInGrid < 2) {
                    if (!currentGridDiv) {
                        currentGridDiv = document.createElement('div');
                        currentGridDiv.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
                        // Insert grid div after h3 if it's the first grid, or after previous non-grid field
                        const h3El = sectionElement.querySelector('h3');
                        if (h3El.nextSibling) {
                            sectionElement.insertBefore(currentGridDiv, h3El.nextSibling);
                        } else {
                            sectionElement.appendChild(currentGridDiv);
                        }
                    }
                    currentGridDiv.appendChild(formFieldDiv);
                    fieldCountInGrid++;
                    addedToGrid = true;
                } else {
                    // Add margin top if it's not the first field overall in the section OR if it follows a grid
                    const isFirstFieldInNonGrid = sectionElement.querySelectorAll('.form-field').length === 0 && !currentGridDiv;
                    if (!isFirstFieldInNonGrid) {
                         formFieldDiv.classList.add('mt-4');
                    }
                    sectionElement.appendChild(formFieldDiv);
                }


                const labelEl = document.createElement('label');
                labelEl.htmlFor = fieldId;
                labelEl.textContent = field.label;
                formFieldDiv.appendChild(labelEl);

                let inputEl;
                if (field.type === 'textarea') {
                    inputEl = document.createElement('textarea');
                } else { 
                    inputEl = document.createElement('input');
                    inputEl.type = 'text';
                }
                inputEl.id = fieldId;
                inputEl.name = fieldId;
                inputEl.placeholder = field.placeholder;

                formFieldDiv.appendChild(inputEl);

                inputEl.addEventListener('focus', () => {
                    activeTextarea = inputEl;
                    updateHelperPanel(fieldId);
                    if (customSuggestionModule) customSuggestionModule.style.display = 'block';
                    if (addCustomSuggestionTitle) addCustomSuggestionTitle.textContent = `Add for: ${masterFieldData[fieldId]?.label || 'Current Field'}`;
                });
            });
            soapNoteForm.appendChild(sectionElement);
        });
        populateTargetSectionSelect();
        initSectionVisibilityControls(); 
        applyUISettings(); 
    }

    function populateTargetSectionSelect() {
        if (!targetSectionSelect) return;
        targetSectionSelect.innerHTML = '';
        masterSectionData.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.title;
            targetSectionSelect.appendChild(option);
        });
    }

    if (addNewSectionButton) {
        addNewSectionButton.addEventListener('click', () => {
            const sectionName = newSectionNameInput.value.trim();
            if (!sectionName) {
                showToast("Section title cannot be empty.", "info");
                return;
            }
            const customTemplate = getCustomTemplate();
            const newSection = {
                id: generateUniqueId('section_'),
                title: sectionName,
                fields: []
            };
            customTemplate.sections.push(newSection);
            saveCustomTemplate(customTemplate);
            buildMasterData(); 
            renderForm();     
            newSectionNameInput.value = '';
            showToast("New section added!", "success");
        });
    }

    if (addNewFieldButton) {
        addNewFieldButton.addEventListener('click', () => {
            const fieldLabel = newFieldNameInput.value.trim();
            const selectedSectionId = targetSectionSelect.value;

            if (!fieldLabel) { showToast("Field label cannot be empty.", "info"); return; }
            if (!selectedSectionId) { showToast("Please select a section.", "info"); return; }

            const customTemplate = getCustomTemplate();
            let sectionInCustomTemplate = customTemplate.sections.find(s => s.id === selectedSectionId);
            
            if (!sectionInCustomTemplate) {
                // If section is standard, create its representation in custom template to add fields
                const standardSectionInfo = standardSections.find(s => s.id === selectedSectionId);
                if (standardSectionInfo) {
                    sectionInCustomTemplate = {
                        id: standardSectionInfo.id,
                        title: standardSectionInfo.title, // Keep original title unless user explicitly changes it later
                        fields: [], // This will hold ONLY custom fields for this standard section
                        isStandardBase: true 
                    };
                    customTemplate.sections.push(sectionInCustomTemplate);
                } else {
                    showToast("Target section not found.", "error"); return; // Should not happen if select is populated correctly
                }
            }

            const newField = {
                id: generateUniqueId('field_'),
                label: fieldLabel,
                type: 'textarea', 
                placeholder: `Enter ${fieldLabel}...`
            };
            sectionInCustomTemplate.fields.push(newField);
            saveCustomTemplate(customTemplate);
            buildMasterData();
            renderForm();
            newFieldNameInput.value = '';
            showToast("New field added to section!", "success");
        });
    }

    // --- Tab Navigation for Helper Panel ---
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        if (tabButtons.length === 0 || tabContents.length === 0) return;

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => {
                    btn.classList.remove('active-tab', 'border-sky-500', 'text-sky-700');
                    btn.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                });
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active-tab', 'border-sky-500', 'text-sky-700');
                button.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                const targetContentId = button.dataset.tabTarget;
                if (document.getElementById(targetContentId)) {
                    document.getElementById(targetContentId).classList.add('active');
                }
            });
        });
         // Ensure initial state if classes are already set in HTML
        const initiallyActiveButton = document.querySelector('.tab-button.active-tab');
        if (initiallyActiveButton) {
            const targetId = initiallyActiveButton.dataset.tabTarget;
            if(document.getElementById(targetId)) document.getElementById(targetId).classList.add('active');
        }
    }
    
    // --- Download/Upload & Draft Management ---
    function generateFilename(baseName, extension) {
        const dateEl = document.getElementById('gi_date');
        const clientIdEl = document.getElementById('gi_client_id');
        let dateStr = dateEl && dateEl.value ? dateEl.value.replace(/-/g, '') : new Date().toISOString().slice(0,10).replace(/-/g, '');
        if (!/^\d{8}$/.test(dateStr) && !/^\d{4}\d{2}\d{2}$/.test(dateStr)) { 
            dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
        }
        let clientIdStr = clientIdEl && clientIdEl.value ? clientIdEl.value.replace(/[^a-zA-Z0-9_.-]/g, '') : 'NoClient';
        if (!clientIdStr) clientIdStr = 'NoClient';
        return `NoteingHam_${baseName}_${dateStr}_${clientIdStr}.${extension}`;
    }

    function triggerDownload(filename, data, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    if (downloadNoteButton) {
        downloadNoteButton.addEventListener('click', () => {
            let htmlNote = `<html><head><meta charset="UTF-8"><title>SOAP Note</title><style>body{font-family:Arial,sans-serif;} h3{margin-top:1em;margin-bottom:0.5em;} p{margin:0.2em 0;}</style></head><body>`;
            const uiSettings = loadUISettings();
            let contentAdded = false;

            masterSectionData.forEach(sectionMeta => {
                if (uiSettings.sectionsVisible && typeof uiSettings.sectionsVisible[sectionMeta.id] !== 'undefined' && !uiSettings.sectionsVisible[sectionMeta.id]) {
                    return; 
                }
                let sectionContent = `<h3><strong>${sectionMeta.title}:</strong></h3>`;
                let fieldsAddedToSection = false;
                sectionMeta.fieldIds.forEach(fieldId => {
                    const field = masterFieldData[fieldId];
                    const element = document.getElementById(fieldId);
                    const value = element ? element.value.trim().replace(/\n/g, '<br>') : '';
                    if (value) {
                        fieldsAddedToSection = true; contentAdded = true;
                        sectionContent += `<p><strong>${field.label}:</strong> ${value}</p>`;
                    }
                });
                if(fieldsAddedToSection) htmlNote += sectionContent + "<br>";
            });
            htmlNote += "</body></html>";

            if (!contentAdded) { showToast("Note is empty.", "error"); return; }
            const filename = generateFilename('Note', 'doc');
            triggerDownload(filename, htmlNote, 'application/msword');
            showToast("Note downloaded as .doc!", "success");
        });
    }

    if (downloadDraftButton) {
        downloadDraftButton.addEventListener('click', () => {
            const dataToSave = getFormData();
            if (Object.values(dataToSave).every(val => val.trim() === "")) { showToast("Nothing to download.", "info"); return; }
            const jsonData = JSON.stringify(dataToSave, null, 2);
            const filename = generateFilename('Draft', 'json');
            triggerDownload(filename, jsonData, 'application/json');
            showToast("Draft downloaded as .json!", "success");
        });
    }

    if (uploadDraftButton) {
        uploadDraftButton.addEventListener('click', () => uploadDraftInput.click() );
    }
    if (uploadDraftInput) {
        uploadDraftInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const currentData = getFormData();
            if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Overwrite current content?")) {
                 event.target.value = null; return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    // Before setting form data, ensure master data reflects any custom structure potentially in the draft
                    // This is tricky. For now, assume `setFormData` will only fill existing fields.
                    // A more robust solution would parse `jsonData` for unknown field IDs and try to dynamically create them IF they follow a pattern.
                    // Or, the draft should ideally also store custom template structure if it deviates significantly.
                    setFormData(jsonData); 
                    showToast("Draft uploaded!", "success");
                } catch (err) {
                    console.error("Error parsing draft:", err);
                    showToast("Invalid JSON file.", "error");
                } finally {
                    event.target.value = null;
                }
            };
            reader.onerror = () => { showToast("Error reading file.", "error"); event.target.value = null; };
            reader.readAsText(file);
        });
    }

    // --- Custom Suggestions, Field Focus, Helper Panel ---
    function getCustomSuggestions() {
        const suggestions = localStorage.getItem(CUSTOM_SUGGESTIONS_KEY);
        return suggestions ? JSON.parse(suggestions) : {};
    }
    function saveCustomSuggestions(allSuggestions) {
        localStorage.setItem(CUSTOM_SUGGESTIONS_KEY, JSON.stringify(allSuggestions));
    }
    function addCustomSuggestionForField(fieldId, suggestionText) {
        const allSuggestions = getCustomSuggestions();
        if (!allSuggestions[fieldId]) allSuggestions[fieldId] = [];
        if (!allSuggestions[fieldId].includes(suggestionText)) {
            allSuggestions[fieldId].push(suggestionText);
            saveCustomSuggestions(allSuggestions);
            return true;
        }
        return false;
    }
    function deleteCustomSuggestionForField(fieldId, suggestionText) {
        const allSuggestions = getCustomSuggestions();
        if (allSuggestions[fieldId]) {
            allSuggestions[fieldId] = allSuggestions[fieldId].filter(s => s !== suggestionText);
            if (allSuggestions[fieldId].length === 0) delete allSuggestions[fieldId];
            saveCustomSuggestions(allSuggestions);
        }
    }
    if (addCustomSuggestionButton) {
        addCustomSuggestionButton.addEventListener('click', () => {
            if (!activeTextarea || !activeTextarea.id) { showToast("No field selected.", "error"); return; }
            const suggestionText = customSuggestionInput.value.trim();
            if (!suggestionText) { showToast("Suggestion empty.", "info"); return; }
            if (addCustomSuggestionForField(activeTextarea.id, suggestionText)) {
                showToast("Custom suggestion added!", "success");
                customSuggestionInput.value = '';
                updateHelperPanel(activeTextarea.id);
            } else {
                showToast("Suggestion already exists.", "info");
            }
        });
    }

    if (clearActiveFieldButton) {
        clearActiveFieldButton.addEventListener('click', () => {
            if (activeTextarea) {
                activeTextarea.value = '';
                showToast(`Field "${masterFieldData[activeTextarea.id]?.label || 'Current'}" cleared.`, 'info');
                activeTextarea.focus();
            } else {
                showToast('No field active.', 'info');
            }
        });
    }

    function updateHelperPanel(fieldId) {
        const fieldMeta = masterFieldData[fieldId];
        if (!fieldMeta || !helperPanelSubtitle || !suggestionsContainer) return;
        helperPanelSubtitle.textContent = `For: ${fieldMeta.label}`;
        suggestionsContainer.innerHTML = '';
        const customSuggestions = getCustomSuggestions();
        const fieldCustomSuggestions = customSuggestions[fieldId] || [];
        let hasSuggestions = false;
        if (fieldMeta.suggestions && fieldMeta.suggestions.length > 0) {
            hasSuggestions = true;
            fieldMeta.suggestions.forEach(text => suggestionsContainer.appendChild(createSuggestionButton(text, false, fieldId)));
        }
        if (fieldCustomSuggestions.length > 0) {
            hasSuggestions = true;
            fieldCustomSuggestions.forEach(text => suggestionsContainer.appendChild(createSuggestionButton(text, true, fieldId)));
        }
        if (!hasSuggestions) {
            suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">No suggestions. Add your own!</p>';
        }
    }

    function createSuggestionButton(text, isCustom, fieldId) {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn' + (isCustom ? ' suggestion-btn-custom' : '');
        const textSpan = document.createElement('span');
        textSpan.textContent = text; textSpan.style.flexGrow = "1";
        btn.appendChild(textSpan);
        if (isCustom) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×'; deleteBtn.className = 'delete-suggestion-btn';
            deleteBtn.title = 'Delete suggestion';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete: "${text}"?`)) {
                    deleteCustomSuggestionForField(fieldId, text);
                    updateHelperPanel(fieldId);
                    showToast("Suggestion deleted.", "info");
                }
            };
            btn.appendChild(deleteBtn);
        }
        btn.addEventListener('click', () => insertSuggestion(text));
        return btn;
    }

    function insertSuggestion(text) {
        if (!activeTextarea) return;
        const currentVal = activeTextarea.value; const cursorPos = activeTextarea.selectionStart;
        let prefix = "";
        if (cursorPos > 0 && !/[\s\n]$/.test(currentVal.substring(0, cursorPos))) prefix = " ";
        else if (currentVal.length > 0 && !currentVal.endsWith('\n') && !currentVal.endsWith('\n\n') && !text.startsWith('- ')) {
            if (!currentVal.endsWith('\n')) prefix = "\n";
        }
        const textToInsert = prefix + text;
        activeTextarea.value = currentVal.substring(0, cursorPos) + textToInsert + currentVal.substring(activeTextarea.selectionEnd);
        activeTextarea.focus();
        activeTextarea.selectionStart = activeTextarea.selectionEnd = cursorPos + textToInsert.length;
    }

    function getFormData() {
        const data = {};
        Object.keys(masterFieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        return data;
    }
    function setFormData(data) {
        Object.keys(masterFieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element && typeof data[id] !== 'undefined') {
                element.value = data[id] || '';
            }
        });
    }

    if (saveDraftButton) {
        saveDraftButton.addEventListener('click', () => {
            try {
                const dataToSave = getFormData();
                if (Object.values(dataToSave).every(val => val.trim() === "")) { showToast("Form empty.", "info"); return; }
                localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(dataToSave));
                showToast("Draft saved locally!");
            } catch (e) { console.error("Err save draft:", e); showToast("Could not save.", "error"); }
        });
    }
    if (loadDraftButton) {
        loadDraftButton.addEventListener('click', () => {
            const currentData = getFormData();
            if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Overwrite current?")) return;
            try {
                const savedData = localStorage.getItem(LOCAL_DRAFT_KEY);
                if (savedData) {
                    setFormData(JSON.parse(savedData));
                    showToast("Draft loaded!");
                } else {
                    showToast("No local draft.", "info");
                }
            } catch (e) { console.error("Err load draft:", e); showToast("Could not load.", "error"); }
        });
    }
    
    const clearTheForm = () => {
        Object.keys(masterFieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        if(helperPanelSubtitle) helperPanelSubtitle.textContent = "For: (No field selected)";
        if(suggestionsContainer) suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">Click on a field...</p>';
        if(customSuggestionModule) customSuggestionModule.style.display = 'none';
        activeTextarea = null;
        const firstStandardFieldId = standardSections[0]?.fields[0]?.id;
        if (firstStandardFieldId && document.getElementById(firstStandardFieldId)) document.getElementById(firstStandardFieldId).focus();
    };
    if (clearFormButton) {
        clearFormButton.addEventListener('click', () => { if (confirm("Clear entire form?")) { clearTheForm(); showToast("Form cleared."); } });
    }
    if (resetNoteButton) {
        resetNoteButton.addEventListener('click', () => { if (confirm("Start new (clears form)?")) { clearTheForm(); showToast("New note. Form cleared."); } });
    }

    function loadUISettings() {
        const settings = localStorage.getItem(UI_SETTINGS_KEY);
        let defaultSectionsVisible = {};
        masterSectionData.forEach(s => defaultSectionsVisible[s.id] = true); // Default all known sections to visible
        
        const defaults = { layout: 'normal', sectionsVisible: defaultSectionsVisible };

        if (settings) {
            const loaded = JSON.parse(settings);
            let mergedSectionsVisible = {...defaultSectionsVisible, ...(loaded.sectionsVisible || {})};
            masterSectionData.forEach(section => { // Ensure all current sections have a setting
                if (typeof mergedSectionsVisible[section.id] === 'undefined') {
                    mergedSectionsVisible[section.id] = true; 
                }
            });
            loaded.sectionsVisible = mergedSectionsVisible;
            return { ...defaults, ...loaded };
        }
        return defaults;
    }

    function saveUISetting(key, value) {
        const settings = loadUISettings();
        settings[key] = value;
        localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
    }

    function applyUISettings() {
        const settings = loadUISettings();
        document.body.classList.remove('layout-compact', 'layout-normal', 'layout-expanded');
        document.body.classList.add(`layout-${settings.layout || 'normal'}`);
        document.querySelectorAll('.btn-density').forEach(btn => {
            btn.classList.remove('active', 'bg-sky-600', 'text-white');
             btn.classList.add('btn-secondary');
            if (btn.dataset.density === (settings.layout || 'normal')) {
                btn.classList.add('active', 'bg-sky-600', 'text-white');
                 btn.classList.remove('btn-secondary');
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

    function initSectionVisibilityControls() {
        if (!visibleSectionsControlsContainer) return;
        visibleSectionsControlsContainer.innerHTML = ''; 
        masterSectionData.forEach(section => {
            const div = document.createElement('div'); div.className = 'flex items-center';
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
            checkbox.id = `toggle-${section.id}`; checkbox.dataset.sectionId = section.id;
            checkbox.className = 'mr-2 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500';
            
            const label = document.createElement('label'); label.htmlFor = `toggle-${section.id}`;
            label.textContent = section.title; label.className = 'text-sm text-slate-700';
            div.appendChild(checkbox); div.appendChild(label);
            visibleSectionsControlsContainer.appendChild(div);

            checkbox.addEventListener('change', (e) => {
                const currentSettings = loadUISettings();
                if(!currentSettings.sectionsVisible) currentSettings.sectionsVisible = {};
                currentSettings.sectionsVisible[section.id] = e.target.checked;
                saveUISetting('sectionsVisible', currentSettings.sectionsVisible);
                applyUISettings();
            });
        });
    }
    
    function initDensityControls() {
         document.querySelectorAll('.btn-density').forEach(button => {
            button.addEventListener('click', () => {
                saveUISetting('layout', button.dataset.density);
                applyUISettings();
            });
        });
    }

    // --- Initial Load ---
    buildMasterData(); 
    renderForm();      
    setupTabs();       
    initDensityControls(); 
    
    const firstStandardFieldId = standardSections[0]?.fields[0]?.id;
    if (firstStandardFieldId) {
        const firstEl = document.getElementById(firstStandardFieldId);
        if (firstEl) firstEl.focus();
    }
    if (!activeTextarea && customSuggestionModule) {
        customSuggestionModule.style.display = 'none';
        if(helperPanelSubtitle) helperPanelSubtitle.textContent = "For: (No field selected)";
    }
});
