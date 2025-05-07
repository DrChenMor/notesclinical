document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const formColumn = document.getElementById('formColumn');
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
    const CUSTOM_SUGGESTIONS_KEY = 'noteinghamCustomSuggestions_v2';
    const UI_SETTINGS_KEY = 'noteinghamUISettings_v2';
    const LOCAL_DRAFT_KEY = 'noteinghamSOAPNoteDraft_v2';
    const CUSTOM_TEMPLATE_KEY = 'noteinghamCustomTemplate_v2';

    // --- Initial Data Structures ---
    // This will be populated by standard fields + custom fields from localStorage
    let masterFieldData = {}; 
    // This will store section metadata (standard + custom)
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
        clearTimeout(window.toastTimeout);
        toastMessage.textContent = message;
        toastMessage.className = 'show';
        if (type === 'error') toastMessage.style.backgroundColor = '#dc2626';
        else if (type === 'info') toastMessage.style.backgroundColor = '#2563eb';
        else toastMessage.style.backgroundColor = '#16a34a';
        window.toastTimeout = setTimeout(() => {
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

        // Add standard sections and fields
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

        // Add custom sections and fields
        const customTemplate = getCustomTemplate();
        customTemplate.sections.forEach(customSection => {
            const sectionMeta = { id: customSection.id, title: customSection.title, isCustom: true, fieldIds: [] };
            customSection.fields.forEach(customField => {
                masterFieldData[customField.id] = { 
                    label: customField.label, 
                    suggestions: [], // Custom fields start with no built-in suggestions
                    sectionId: customSection.id,
                    type: customField.type || 'textarea',
                    placeholder: customField.placeholder || ''
                };
                sectionMeta.fieldIds.push(customField.id);
            });
            masterSectionData.push(sectionMeta);
        });
    }
    
    function renderForm() {
        soapNoteForm.innerHTML = ''; // Clear existing form content

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

            sectionMeta.fieldIds.forEach((fieldId, index) => {
                const field = masterFieldData[fieldId];
                if (!field) return;

                const formFieldDiv = document.createElement('div');
                formFieldDiv.className = 'form-field';

                // Group first two text inputs in General Info into a grid
                if (sectionMeta.id === 'generalInfoSection' && field.type === 'text' && fieldCountInGrid < 2) {
                    if (!currentGridDiv) {
                        currentGridDiv = document.createElement('div');
                        currentGridDiv.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
                        sectionElement.appendChild(currentGridDiv);
                    }
                    currentGridDiv.appendChild(formFieldDiv);
                    fieldCountInGrid++;
                } else {
                    formFieldDiv.className += (index > 0 && fieldCountInGrid === 0) || fieldCountInGrid >=2 ? ' mt-4' : '';
                    sectionElement.appendChild(formFieldDiv);
                    currentGridDiv = null; // Reset grid if we move out of it
                }


                const labelEl = document.createElement('label');
                labelEl.htmlFor = fieldId;
                labelEl.textContent = field.label;
                formFieldDiv.appendChild(labelEl);

                let inputEl;
                if (field.type === 'textarea') {
                    inputEl = document.createElement('textarea');
                } else { // 'text' or fallback
                    inputEl = document.createElement('input');
                    inputEl.type = 'text';
                }
                inputEl.id = fieldId;
                inputEl.name = fieldId;
                inputEl.placeholder = field.placeholder;
                if(field.type === 'textarea') inputEl.rows = 3; // Default rows for textarea

                formFieldDiv.appendChild(inputEl);

                inputEl.addEventListener('focus', () => {
                    activeTextarea = inputEl;
                    updateHelperPanel(fieldId);
                    customSuggestionModule.style.display = 'block';
                    addCustomSuggestionTitle.textContent = `Add for: ${masterFieldData[fieldId]?.label || 'Current Field'}`;
                });
            });
            soapNoteForm.appendChild(sectionElement);
        });
        populateTargetSectionSelect();
        initSectionVisibilityControls(); // Re-init after rendering form
        applyUISettings(); // Apply visibility based on settings
    }

    function populateTargetSectionSelect() {
        targetSectionSelect.innerHTML = '';
        masterSectionData.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.title;
            targetSectionSelect.appendChild(option);
        });
    }

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
        buildMasterData(); // Rebuild master data with the new section
        renderForm();     // Re-render the entire form
        newSectionNameInput.value = '';
        showToast("New section added!", "success");
    });

    addNewFieldButton.addEventListener('click', () => {
        const fieldLabel = newFieldNameInput.value.trim();
        const selectedSectionId = targetSectionSelect.value;

        if (!fieldLabel) {
            showToast("Field label cannot be empty.", "info");
            return;
        }
        if (!selectedSectionId) {
            showToast("Please select a section.", "info");
            return;
        }

        const customTemplate = getCustomTemplate();
        let sectionToUpdate = customTemplate.sections.find(s => s.id === selectedSectionId);
        
        // If it's a standard section, we need to handle it differently or disallow adding fields this way for now
        // For simplicity, this version allows adding fields only to *custom* sections via this UI.
        // To add to standard sections, we'd need to modify `standardSections` or merge strategies.
        // For now, let's focus on custom sections. If not found in custom, it's an error or a standard one.

        if (!sectionToUpdate) { // If not a custom section, find in standard and "promote" to custom for field addition
            const standardSectionData = standardSections.find(s => s.id === selectedSectionId);
            if (standardSectionData) { // It's a standard section, create a custom representation
                sectionToUpdate = {
                    id: standardSectionData.id, // Keep original ID
                    title: standardSectionData.title,
                    fields: [], // Standard fields are not duplicated here, only custom additions
                    isStandardBase: true // Mark that it's based on a standard section
                };
                // Check if this standard section base already exists in customTemplate to avoid duplicates
                if (!customTemplate.sections.find(s => s.id === sectionToUpdate.id)) {
                     customTemplate.sections.push(sectionToUpdate);
                } else {
                    sectionToUpdate = customTemplate.sections.find(s => s.id === sectionToUpdate.id);
                }
            } else {
                 showToast("Selected section not found.", "error");
                 return;
            }
        }


        const newField = {
            id: generateUniqueId('field_'),
            label: fieldLabel,
            type: 'textarea', // Default new fields to textarea
            placeholder: `Enter ${fieldLabel}...`
        };
        sectionToUpdate.fields.push(newField);
        saveCustomTemplate(customTemplate);
        buildMasterData();
        renderForm();
        newFieldNameInput.value = '';
        showToast("New field added to section!", "success");
    });

    // --- Tab Navigation for Helper Panel ---
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Deactivate all
                tabButtons.forEach(btn => {
                    btn.classList.remove('active-tab', 'border-sky-500', 'text-sky-600');
                    btn.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                });
                tabContents.forEach(content => content.classList.remove('active'));

                // Activate clicked
                button.classList.add('active-tab', 'border-sky-500', 'text-sky-600');
                button.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                const targetContentId = button.dataset.tabTarget;
                document.getElementById(targetContentId).classList.add('active');
            });
        });
        // Set initial active tab based on HTML class 'active-tab' on button and 'active' on content
         if(displayOptionsTabButton.classList.contains('active-tab')) document.getElementById(displayOptionsTabButton.dataset.tabTarget).classList.add('active');
    }
    

    // --- Download/Upload & Draft Management (Logic largely same, check IDs and ensure functions exist) ---
    function generateFilename(baseName, extension) {
        const dateEl = document.getElementById('gi_date');
        const clientIdEl = document.getElementById('gi_client_id');
        let dateStr = dateEl && dateEl.value ? dateEl.value.replace(/-/g, '') : new Date().toISOString().slice(0,10).replace(/-/g, '');
        if (!/^\d{8}$/.test(dateStr) && !/^\d{4}\d{2}\d{2}$/.test(dateStr)) { // Check for YYYYMMDD or YYYY-MM-DD after stripping
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
    
    downloadNoteButton.addEventListener('click', () => {
        let htmlNote = `<html><head><meta charset="UTF-8"><title>SOAP Note</title><style>body{font-family:Arial,sans-serif;} h3{margin-top:1em;margin-bottom:0.5em;} p{margin:0.2em 0;}</style></head><body>`;
        const uiSettings = loadUISettings();
        let contentAdded = false;

        masterSectionData.forEach(sectionMeta => {
            if (uiSettings.sectionsVisible && typeof uiSettings.sectionsVisible[sectionMeta.id] !== 'undefined' && !uiSettings.sectionsVisible[sectionMeta.id]) {
                return; // Skip hidden section
            }

            let sectionContent = `<h3><strong>${sectionMeta.title}:</strong></h3>`;
            let fieldsAddedToSection = false;

            sectionMeta.fieldIds.forEach(fieldId => {
                const field = masterFieldData[fieldId];
                const element = document.getElementById(fieldId);
                const value = element ? element.value.trim().replace(/\n/g, '<br>') : '';
                if (value) {
                    fieldsAddedToSection = true;
                    contentAdded = true;
                    // Simpler formatting for all fields within a section
                    sectionContent += `<p><strong>${field.label}:</strong> ${value}</p>`;
                }
            });
            
            if(fieldsAddedToSection) {
                htmlNote += sectionContent;
                // Add a larger break after a section that had content, except for the last one.
                 htmlNote += "<br>";
            }
        });
        htmlNote += "</body></html>";

        if (!contentAdded) {
            showToast("Note is empty or all visible sections are empty. Nothing to download.", "error");
            return;
        }
        const filename = generateFilename('Note', 'doc');
        triggerDownload(filename, htmlNote, 'application/msword');
        showToast("Note downloaded as .doc file!", "success");
    });

    downloadDraftButton.addEventListener('click', () => {
        const dataToSave = getFormData();
        if (Object.values(dataToSave).every(val => val.trim() === "")) {
             showToast("Nothing to download. Form is empty.", "info");
             return;
        }
        const jsonData = JSON.stringify(dataToSave, null, 2);
        const filename = generateFilename('Draft', 'json');
        triggerDownload(filename, jsonData, 'application/json');
        showToast("Draft downloaded as .json file!", "success");
    });

    uploadDraftButton.addEventListener('click', () => {
        uploadDraftInput.click();
    });
    uploadDraftInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const currentData = getFormData();
        if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Uploading a draft will overwrite current content. Continue?")) {
             event.target.value = null; return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                setFormData(jsonData); // This needs to handle potentially non-existent custom fields gracefully
                showToast("Draft uploaded successfully!", "success");
            } catch (err) {
                console.error("Error parsing uploaded draft:", err);
                showToast("Failed to upload draft. Invalid JSON file.", "error");
            } finally {
                event.target.value = null;
            }
        };
        reader.onerror = () => { showToast("Error reading file.", "error"); event.target.value = null; };
        reader.readAsText(file);
    });

    // --- Custom Suggestions, Field Focus, Helper Panel (Largely same logic, ensure using masterFieldData) ---
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
    addCustomSuggestionButton.addEventListener('click', () => {
        if (!activeTextarea || !activeTextarea.id) { showToast("No field selected.", "error"); return; }
        const suggestionText = customSuggestionInput.value.trim();
        if (!suggestionText) { showToast("Suggestion cannot be empty.", "info"); return; }
        if (addCustomSuggestionForField(activeTextarea.id, suggestionText)) {
            showToast("Custom suggestion added!", "success");
            customSuggestionInput.value = '';
            updateHelperPanel(activeTextarea.id);
        } else {
            showToast("Suggestion already exists for this field.", "info");
        }
    });

    clearActiveFieldButton.addEventListener('click', () => {
        if (activeTextarea) {
            activeTextarea.value = '';
            showToast(`Field "${masterFieldData[activeTextarea.id]?.label || 'Current'}" cleared.`, 'info');
            activeTextarea.focus();
        } else {
            showToast('No field is currently active.', 'info');
        }
    });

    function updateHelperPanel(fieldId) {
        const fieldMeta = masterFieldData[fieldId];
        if (!fieldMeta) {
            helperPanelSubtitle.textContent = "For: (No field selected)";
            suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">Click on a field to see suggestions.</p>';
            customSuggestionModule.style.display = 'none';
            return;
        }
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
            suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">No suggestions yet. Add your own!</p>';
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
            deleteBtn.title = 'Delete custom suggestion';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete suggestion: "${text}"?`)) {
                    deleteCustomSuggestionForField(fieldId, text);
                    updateHelperPanel(fieldId);
                    showToast("Custom suggestion deleted.", "info");
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

    // --- Form Data Get/Set (Updated to use masterFieldData keys) ---
    function getFormData() {
        const data = {};
        Object.keys(masterFieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        return data;
    }
    function setFormData(data) {
        Object.keys(masterFieldData).forEach(id => { // Iterate over known fields
            const element = document.getElementById(id);
            if (element && typeof data[id] !== 'undefined') { // Only set if field exists in form AND data
                element.value = data[id] || '';
            }
        });
        // If data contains fields not in masterFieldData (e.g. from an old template), they are ignored.
    }

    // --- Local Storage Draft (Largely same) ---
    saveDraftButton.addEventListener('click', () => {
        try {
            const dataToSave = getFormData();
            if (Object.values(dataToSave).every(val => val.trim() === "")) { showToast("Form is empty.", "info"); return; }
            localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(dataToSave));
            showToast("Draft saved locally!");
        } catch (e) { console.error("Error saving draft:", e); showToast("Could not save draft.", "error"); }
    });
    loadDraftButton.addEventListener('click', () => {
        const currentData = getFormData();
        if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Loading will overwrite. Continue?")) return;
        try {
            const savedData = localStorage.getItem(LOCAL_DRAFT_KEY);
            if (savedData) {
                setFormData(JSON.parse(savedData));
                showToast("Draft loaded!");
            } else {
                showToast("No local draft found.", "info");
            }
        } catch (e) { console.error("Error loading draft:", e); showToast("Could not load draft.", "error"); }
    });
    
    // --- Clear/Reset Form (Largely same) ---
    const clearTheForm = () => {
        // Don't call form.reset() as it might not clear dynamically added fields well.
        // Instead, iterate through masterFieldData and clear them.
        Object.keys(masterFieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        helperPanelSubtitle.textContent = "For: (No field selected)";
        suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">Click on a field...</p>';
        customSuggestionModule.style.display = 'none';
        activeTextarea = null;
        const firstStandardFieldId = standardSections[0]?.fields[0]?.id;
        if (firstStandardFieldId && document.getElementById(firstStandardFieldId)) document.getElementById(firstStandardFieldId).focus();
    };
    clearFormButton.addEventListener('click', () => { if (confirm("Clear entire form?")) { clearTheForm(); showToast("Form cleared."); } });
    resetNoteButton.addEventListener('click', () => { if (confirm("Start new note (clears form)?")) { clearTheForm(); showToast("New note. Form cleared."); } });

    // --- UI Settings (Density & Section Visibility - Updated for dynamic sections) ---
    function loadUISettings() {
        const settings = localStorage.getItem(UI_SETTINGS_KEY);
        // Default visibility for standard sections
        let defaultSectionsVisible = {};
        standardSections.forEach(s => defaultSectionsVisible[s.id] = true);
        
        const defaults = { 
            layout: 'normal', 
            sectionsVisible: defaultSectionsVisible
        };

        if (settings) {
            const loaded = JSON.parse(settings);
            // Merge defaults for any new standard sections not in saved settings
            let mergedSectionsVisible = {...defaultSectionsVisible, ...(loaded.sectionsVisible || {})};
            // Ensure all current master sections have a visibility setting
            masterSectionData.forEach(section => {
                if (typeof mergedSectionsVisible[section.id] === 'undefined') {
                    mergedSectionsVisible[section.id] = true; // Default new custom sections to visible
                }
            });
            loaded.sectionsVisible = mergedSectionsVisible;
            return { ...defaults, ...loaded };
        }
        // For first load, ensure custom sections get default visibility
        masterSectionData.forEach(section => {
            if (section.isCustom && typeof defaults.sectionsVisible[section.id] === 'undefined') {
                 defaults.sectionsVisible[section.id] = true;
            }
        });
        return defaults;
    }

    function saveUISetting(key, value) {
        const settings = loadUISettings();
        settings[key] = value;
        localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
    }

    function applyUISettings() {
        const settings = loadUISettings();
        // Apply layout
        document.body.classList.remove('layout-compact', 'layout-normal', 'layout-expanded');
        document.body.classList.add(`layout-${settings.layout || 'normal'}`);
        document.querySelectorAll('.btn-density').forEach(btn => {
            btn.classList.remove('active', 'bg-sky-600', 'text-white');
             btn.classList.add('btn-secondary'); // ensure base style
            if (btn.dataset.density === (settings.layout || 'normal')) {
                btn.classList.add('active', 'bg-sky-600', 'text-white');
                 btn.classList.remove('btn-secondary');
            }
        });

        // Apply section visibility
        Object.entries(settings.sectionsVisible).forEach(([sectionId, isVisible]) => {
            const sectionElement = document.getElementById(sectionId);
            const checkbox = document.querySelector(`#visibleSectionsControlsContainer input[data-section-id="${sectionId}"]`);
            if (sectionElement) sectionElement.classList.toggle('hidden-section', !isVisible);
            if (checkbox) checkbox.checked = !!isVisible; // Ensure boolean
        });
    }

    function initSectionVisibilityControls() {
        visibleSectionsControlsContainer.innerHTML = ''; // Clear old controls
        masterSectionData.forEach(section => {
            const div = document.createElement('div'); div.className = 'flex items-center';
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
            checkbox.id = `toggle-${section.id}`; checkbox.dataset.sectionId = section.id;
            checkbox.className = 'mr-2 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500';
            // Checked state will be set by applyUISettings
            
            const label = document.createElement('label'); label.htmlFor = `toggle-${section.id}`;
            label.textContent = section.title; label.className = 'text-sm text-slate-700';
            div.appendChild(checkbox); div.appendChild(label);
            visibleSectionsControlsContainer.appendChild(div);

            checkbox.addEventListener('change', (e) => {
                const currentSettings = loadUISettings();
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
    buildMasterData(); // Build initial master data from standard and custom templates
    renderForm();      // Render the form based on master data
    setupTabs();       // Setup tab functionality
    initDensityControls(); // Init density buttons (visibility controls are called in renderForm->applyUISettings)
    // applyUISettings(); // Call this again to ensure correct state based on potentially updated masterSectionData
    
    const firstStandardFieldId = standardSections[0]?.fields[0]?.id;
    if (firstStandardFieldId) {
        const firstEl = document.getElementById(firstStandardFieldId);
        if (firstEl) firstEl.focus();
    }
    if (!activeTextarea) {
        customSuggestionModule.style.display = 'none';
        helperPanelSubtitle.textContent = "For: (No field selected)";
    }
});
