document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('soapNoteForm');
    const helperPanelTitle = document.getElementById('helperPanelTitle');
    const helperPanelSubtitle = document.getElementById('helperPanelSubtitle');
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    
    const customSuggestionModule = document.getElementById('customSuggestionModule');
    const addCustomSuggestionTitle = document.getElementById('addCustomSuggestionTitle');
    const customSuggestionInput = document.getElementById('customSuggestionInput');
    const addCustomSuggestionButton = document.getElementById('addCustomSuggestionButton');

    // MODIFIED: Button IDs updated
    const downloadNoteButton = document.getElementById('downloadNoteButton');
    const downloadDraftButton = document.getElementById('downloadDraftButton');
    const uploadDraftButton = document.getElementById('uploadDraftButton');
    const uploadDraftInput = document.getElementById('uploadDraftInput');

    const saveDraftButton = document.getElementById('saveDraftButton'); // For localStorage
    const loadDraftButton = document.getElementById('loadDraftButton'); // For localStorage
    const clearFormButton = document.getElementById('clearFormButton');
    const resetNoteButton = document.getElementById('resetNoteButton');
    const clearActiveFieldButton = document.getElementById('clearActiveFieldButton');
    const toastMessage = document.getElementById('toast-message');

    let activeTextarea = null;
    const CUSTOM_SUGGESTIONS_KEY = 'noteinghamCustomSuggestions';
    const UI_SETTINGS_KEY = 'noteinghamUISettings';
    const LOCAL_DRAFT_KEY = 'noteinghamSOAPNoteDraft'; // Consistent key for local draft

    const fieldData = { /* Same as before */
        gi_date: { label: "Date", suggestions: ["Today's date: " + new Date().toISOString().slice(0,10), "Date of session: "], sectionId: "generalInfoSection" },
        gi_client_id: { label: "Client ID / Name", suggestions: ["Client ID: ", "Client Initials: "], sectionId: "generalInfoSection" },
        gi_session_focus: { label: "Session Focus", suggestions: ["Session focused on reviewing coping strategies for [issue].", "Exploration of [topic, e.g., recent stressors].", "Follow-up on [previous topic/homework].", "Psychoeducation regarding [condition/skill].", "Goal setting for [area]."], sectionId: "generalInfoSection" },
        s_main_concerns: { label: "Client's Main Concerns", suggestions: ["Client states, \"[Quote client's words here]\".", "Client reported primary concerns regarding [topic1] and [topic2].", "The main issue discussed was [issue].", "Client expressed distress about [situation].", "Client presented with concerns about [symptom/problem]."], sectionId: "subjectiveSection" },
        s_mood_symptoms: { label: "Reported Mood & Symptoms", suggestions: ["Client reported mood as [e.g., anxious, depressed, stable, fair, 7/10].", "Sleep reported as [e.g., poor, adequate, 6 hours, restless].", "Appetite reported as [e.g., good, decreased, increased].", "Energy levels described as [e.g., low, moderate, good].", "Reported experiencing [symptom, e.g., headaches, irritability, lack of motivation].", "Stress level reported as [e.g., high, manageable, X/10]."], sectionId: "subjectiveSection" },
        s_risk: { label: "Suicidal/Homicidal Ideation (Client Report)", suggestions: ["Client denied any suicidal or homicidal ideation, intent, or plan.", "Client reported fleeting thoughts of [suicide/self-harm] but denied intent or plan.", "No SI/HI reported by client.", "Client was directly asked about SI/HI and denied.", "Safety plan discussed in relation to reported thoughts."], sectionId: "subjectiveSection" },
        o_presentation: { label: "Appearance & Behavior", suggestions: ["Client presented as [e.g., well-groomed, casually dressed, disheveled].", "Behavior was [e.g., cooperative, restless, withdrawn, engaged].", "Attitude towards therapist was [e.g., open, guarded, friendly].", "Motor activity was [e.g., within normal limits, agitated, slowed].", "Eye contact was [e.g., good, fair, poor, fleeting]."], sectionId: "objectiveSection" },
        o_affect_mood_speech: { label: "Observed Affect, Mood & Speech", suggestions: ["Affect observed as [e.g., congruent with mood, constricted, flat, labile, broad].", "Observed mood appeared [e.g., euthymic, anxious, dysphoric, irritable].", "Speech was [e.g., clear and coherent, pressured, slow, soft, loud, normal rate and rhythm].", "Vocal tone was [e.g., monotonous, expressive]."], sectionId: "objectiveSection" },
        o_thought_orientation: { label: "Thought Process & Orientation", suggestions: ["Thought process appeared [e.g., logical, coherent, tangential, circumstantial, disorganized].", "Thought content revealed [e.g., no evidence of delusions or hallucinations, preoccupation with X].", "Client was alert and oriented to [person, place, time, situation - specify, e.g., x3, x4].", "Cognitive functioning appeared [e.g., intact, impaired in X area].", "Insight judged to be [e.g., good, fair, poor, limited].", "Judgment appeared [e.g., good, fair, impaired]."], sectionId: "objectiveSection" },
        a_summary_impressions: { label: "Summary & Clinical Impressions", suggestions: ["Client appears to be making [e.g., good, some, limited] progress towards therapeutic goals.", "Clinical impressions are consistent with [diagnosis/working hypothesis, e.g., GAD, MDD, Adjustment Disorder].", "Client responded [e.g., positively, with difficulty] to interventions.", "Symptoms of [condition] appear to be [e.g., improving, worsening, stable].", "Current presentation suggests [summary statement]."], sectionId: "assessmentSection" },
        a_strengths_challenges: { label: "Strengths & Challenges", suggestions: ["Client's strengths include [e.g., motivation, insight, strong support system, resilience].", "Identified challenges include [e.g., negative self-talk, difficulty with emotional regulation, lack of resources].", "Barriers to progress may include [barrier1, barrier2].", "Protective factors noted: [factor1, factor2]."], sectionId: "assessmentSection" },
        a_risk_level_justification: { label: "Risk Assessment", suggestions: ["Risk of harm to self assessed as [e.g., low, moderate, high] due to [justification].", "Risk of harm to others assessed as [e.g., low, moderate, high] due to [justification].", "No current indicators of acute risk.", "Protective factors such as [factor1, factor2] mitigate risk.", "Risk factors include [factor1, factor2].", "Safety plan remains appropriate / was updated."], sectionId: "assessmentSection" },
        p_interventions_response: { label: "Interventions & Response", suggestions: ["Interventions utilized this session included [e.g., CBT, MI, psychoeducation, supportive listening, problem-solving].", "Client was receptive to [intervention] and [describe response, e.g., actively participated, appeared to understand].", "Practiced [skill, e.g., grounding techniques, communication skills].", "Explored [topic, e.g., cognitive distortions related to X].", "Provided validation and support for [client's experience]."], sectionId: "planSection" },
        p_focus_homework: { label: "Next Session Focus & Homework", suggestions: ["Focus for next session will be to [e.g., review homework, explore X further, introduce Y skill].", "Homework assigned: [e.g., complete thought record, practice mindfulness daily, journal about X].", "Client agreed to [specific action before next session].", "No homework assigned this session."], sectionId: "planSection" },
        p_safety_referrals_appt: { label: "Safety, Referrals & Next Appointment", suggestions: ["Safety plan was reviewed and [e.g., remains appropriate, was updated to include X].", "Referral to [e.g., psychiatrist, support group, dietician] was [e.g., discussed, made, declined by client].", "Client to follow up with [specialist/service].", "Next appointment scheduled for [date] at [time].", "Continue weekly/bi-weekly sessions."], sectionId: "planSection" }
    };
    const formSections = [ /* Same as before */
        { id: "generalInfoSection", label: "General Info" }, { id: "subjectiveSection", label: "Subjective (S)" },
        { id: "objectiveSection", label: "Objective (O)" }, { id: "assessmentSection", label: "Assessment (A)" },
        { id: "planSection", label: "Plan (P)" }
    ];
    const fieldOrderForCompile = [ /* Same as before, used for .doc generation */
        { id: 'gi_date', label: 'Date', sectionId: "generalInfoSection" }, { id: 'gi_client_id', label: 'Client ID', sectionId: "generalInfoSection" }, { id: 'gi_session_focus', label: 'Session Focus', sectionId: "generalInfoSection", sectionBreak: true },
        { section: 'S (Subjective)', sectionId: "subjectiveSection" }, { id: 's_main_concerns', label: "Client's Main Concerns", sectionId: "subjectiveSection" }, { id: 's_mood_symptoms', label: "Reported Mood & Symptoms", sectionId: "subjectiveSection" }, { id: 's_risk', label: "Suicidal/Homicidal Ideation (Report)" , sectionId: "subjectiveSection", sectionBreak: true},
        { section: 'O (Objective)', sectionId: "objectiveSection" }, { id: 'o_presentation', label: "Appearance & Behavior", sectionId: "objectiveSection" }, { id: 'o_affect_mood_speech', label: "Observed Affect, Mood & Speech", sectionId: "objectiveSection" }, { id: 'o_thought_orientation', label: "Thought Process & Orientation", sectionId: "objectiveSection", sectionBreak: true },
        { section: 'A (Assessment)', sectionId: "assessmentSection" }, { id: 'a_summary_impressions', label: "Summary & Clinical Impressions", sectionId: "assessmentSection" }, { id: 'a_strengths_challenges', label: "Strengths & Challenges", sectionId: "assessmentSection" }, { id: 'a_risk_level_justification', label: "Risk Assessment", sectionId: "assessmentSection", sectionBreak: true },
        { section: 'P (Plan)', sectionId: "planSection" }, { id: 'p_interventions_response', label: "Interventions & Response", sectionId: "planSection" }, { id: 'p_focus_homework', label: "Next Session Focus & Homework", sectionId: "planSection" }, { id: 'p_safety_referrals_appt', label: "Safety, Referrals & Next Appointment", sectionId: "planSection" }
    ];

    // --- Helper: Generate Filename ---
    function generateFilename(baseName, extension) {
        const dateEl = document.getElementById('gi_date');
        const clientIdEl = document.getElementById('gi_client_id');
        
        let dateStr = dateEl && dateEl.value ? dateEl.value.replace(/-/g, '') : new Date().toISOString().slice(0,10).replace(/-/g, '');
        if (!/^\d{8}$/.test(dateStr)) dateStr = new Date().toISOString().slice(0,10).replace(/-/g, ''); // Fallback for invalid date

        let clientIdStr = clientIdEl && clientIdEl.value ? clientIdEl.value.replace(/[^a-zA-Z0-9_]/g, '') : 'NoClient';
        if (!clientIdStr) clientIdStr = 'NoClient';

        return `NoteingHam_${baseName}_${dateStr}_${clientIdStr}.${extension}`;
    }

    // --- Helper: Trigger Download ---
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
    
    // --- Download Note (.doc) ---
    downloadNoteButton.addEventListener('click', () => {
        let htmlNote = `<html><head><meta charset="UTF-8"><title>SOAP Note</title></head><body>`;
        const uiSettings = loadUISettings();
        
        let currentSectionHeader = "";
        let contentAdded = false;

        fieldOrderForCompile.forEach(item => {
            if (item.sectionId && uiSettings.sectionsVisible && uiSettings.sectionsVisible[item.sectionId] === false) {
                 return;
            }

            if (item.section) {
                if (currentSectionHeader !== item.section && (uiSettings.sectionsVisible[item.sectionId] !== false) ) {
                    if (contentAdded && !htmlNote.endsWith("<br><br>")) htmlNote += "<br>"; 
                    htmlNote += `<h3><strong>${item.section}:</strong></h3>`;
                    currentSectionHeader = item.section;
                }
            } else {
                const element = document.getElementById(item.id);
                const value = element ? element.value.trim().replace(/\n/g, '<br>') : ''; // Replace newlines with <br>
                if (value) {
                    contentAdded = true;
                    if (item.label.includes("Date") || item.label.includes("Client ID") || item.label.includes("Session Focus")) {
                         htmlNote += `<p><strong>${item.label}:</strong> ${value}</p>`;
                    } else {
                         htmlNote += `<p>- <strong>${item.label}:</strong> ${value}</p>`;
                    }
                }
                if (item.sectionBreak && contentAdded && !htmlNote.endsWith("<br><br>")) {
                     htmlNote += "<br>"; 
                }
            }
        });
        htmlNote += "</body></html>";

        if (!contentAdded) {
            showToast("Note is empty or all visible sections are empty. Nothing to download.", "error");
            return;
        }

        const filename = generateFilename('Note', 'doc');
        triggerDownload(filename, htmlNote, 'application/msword'); // application/msword or text/html
        showToast("Note downloaded as .doc file!", "success");
    });

    // --- Download Draft (.json) ---
    downloadDraftButton.addEventListener('click', () => {
        const dataToSave = getFormData();
        if (Object.values(dataToSave).every(val => val.trim() === "")) {
             showToast("Nothing to download. Form is empty.", "info");
             return;
        }
        const jsonData = JSON.stringify(dataToSave, null, 2); // Pretty print JSON
        const filename = generateFilename('Draft', 'json');
        triggerDownload(filename, jsonData, 'application/json');
        showToast("Draft downloaded as .json file!", "success");
    });

    // --- Upload Draft (.json) ---
    uploadDraftButton.addEventListener('click', () => {
        uploadDraftInput.click(); // Trigger hidden file input
    });

    uploadDraftInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const currentData = getFormData();
        if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Uploading a draft will overwrite current content. Continue?")) {
             event.target.value = null; // Reset file input
             return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                setFormData(jsonData);
                showToast("Draft uploaded successfully!", "success");
            } catch (err) {
                console.error("Error parsing uploaded draft:", err);
                showToast("Failed to upload draft. Invalid JSON file.", "error");
            } finally {
                event.target.value = null; // Reset file input for subsequent uploads
            }
        };
        reader.onerror = () => {
            showToast("Error reading file.", "error");
            event.target.value = null; 
        };
        reader.readAsText(file);
    });


    // --- Custom Suggestions Logic (largely same as before) ---
    function getCustomSuggestions() { /* ... same ... */ 
        const suggestions = localStorage.getItem(CUSTOM_SUGGESTIONS_KEY);
        return suggestions ? JSON.parse(suggestions) : {};
    }
    function saveCustomSuggestions(allSuggestions) { /* ... same ... */ 
        localStorage.setItem(CUSTOM_SUGGESTIONS_KEY, JSON.stringify(allSuggestions));
    }
    function addCustomSuggestionForField(fieldId, suggestionText) { /* ... same ... */ 
        const allSuggestions = getCustomSuggestions();
        if (!allSuggestions[fieldId]) allSuggestions[fieldId] = [];
        if (!allSuggestions[fieldId].includes(suggestionText)) {
            allSuggestions[fieldId].push(suggestionText);
            saveCustomSuggestions(allSuggestions);
            return true;
        }
        return false;
    }
    function deleteCustomSuggestionForField(fieldId, suggestionText) { /* ... same ... */ 
        const allSuggestions = getCustomSuggestions();
        if (allSuggestions[fieldId]) {
            allSuggestions[fieldId] = allSuggestions[fieldId].filter(s => s !== suggestionText);
            if (allSuggestions[fieldId].length === 0) delete allSuggestions[fieldId];
            saveCustomSuggestions(allSuggestions);
        }
    }
    addCustomSuggestionButton.addEventListener('click', () => { /* ... same ... */ 
        if (!activeTextarea || !activeTextarea.id) { showToast("No field selected.", "error"); return; }
        const suggestionText = customSuggestionInput.value.trim();
        if (!suggestionText) { showToast("Suggestion cannot be empty.", "info"); return; }
        if (addCustomSuggestionForField(activeTextarea.id, suggestionText)) {
            showToast("Custom suggestion added!", "success");
            customSuggestionInput.value = '';
            updateHelperPanel(activeTextarea.id);
        } else {
            showToast("Suggestion already exists.", "info");
        }
    });

    // --- Field Focus and Helper Panel Update (largely same) ---
    Object.keys(fieldData).forEach(fieldId => { /* ... same ... */ 
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('focus', () => {
                activeTextarea = element;
                updateHelperPanel(fieldId);
                customSuggestionModule.style.display = 'block';
                addCustomSuggestionTitle.textContent = `Add for: ${fieldData[fieldId]?.label || 'Current Field'}`;
            });
        }
    });
    clearActiveFieldButton.addEventListener('click', () => { /* ... same ... */ 
        if (activeTextarea) {
            activeTextarea.value = '';
            showToast(`Field "${fieldData[activeTextarea.id]?.label || 'Current'}" cleared.`, 'info');
            activeTextarea.focus();
        } else {
            showToast('No field is currently active.', 'info');
        }
    });
    function updateHelperPanel(fieldId) { /* ... same structure, ensure it calls createSuggestionButton ... */ 
        const data = fieldData[fieldId];
        if (!data) {
            helperPanelSubtitle.textContent = "For: (No field selected)";
            suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">No suggestions for this field.</p>';
            customSuggestionModule.style.display = 'none';
            return;
        }
        helperPanelSubtitle.textContent = `For: ${data.label}`;
        suggestionsContainer.innerHTML = ''; 
        const allFieldSuggestions = getCustomSuggestions();
        const customSuggestionsForField = allFieldSuggestions[fieldId] || [];
        let hasSuggestions = false;
        if (data.suggestions.length > 0) {
            hasSuggestions = true;
            data.suggestions.forEach(suggestionText => suggestionsContainer.appendChild(createSuggestionButton(suggestionText, false)));
        }
        if (customSuggestionsForField.length > 0) {
            hasSuggestions = true;
            customSuggestionsForField.forEach(suggestionText => suggestionsContainer.appendChild(createSuggestionButton(suggestionText, true, fieldId)));
        }
        if (!hasSuggestions) {
            suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">No suggestions yet. Add your own below!</p>';
        }
    }
    function createSuggestionButton(text, isCustom, fieldIdForDelete = null) { /* ... same ... */ 
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn' + (isCustom ? ' suggestion-btn-custom' : '');
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        textSpan.style.flexGrow = "1";
        btn.appendChild(textSpan);
        if (isCustom && fieldIdForDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×';
            deleteBtn.className = 'delete-suggestion-btn';
            deleteBtn.title = 'Delete custom suggestion';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete suggestion: "${text}"?`)) {
                    deleteCustomSuggestionForField(fieldIdForDelete, text);
                    updateHelperPanel(fieldIdForDelete);
                    showToast("Custom suggestion deleted.", "info");
                }
            };
            btn.appendChild(deleteBtn);
        }
        btn.addEventListener('click', () => insertSuggestion(text));
        return btn;
    }
    function insertSuggestion(text) { /* ... same ... */ 
        if (!activeTextarea) return;
        const currentVal = activeTextarea.value;
        const cursorPos = activeTextarea.selectionStart;
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

    // --- Form Data Get/Set (same) ---
    function getFormData() { /* ... same ... */ 
        const data = {};
        Object.keys(fieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        return data;
    }
    function setFormData(data) { /* ... same ... */ 
        Object.keys(data).forEach(id => {
            const element = document.getElementById(id);
            if (element && typeof data[id] !== 'undefined') element.value = data[id] || '';
        });
    }

    // --- Local Storage Draft Save/Load (same, uses LOCAL_DRAFT_KEY) ---
    saveDraftButton.addEventListener('click', () => { /* ... same, uses LOCAL_DRAFT_KEY ... */ 
        try {
            const dataToSave = getFormData();
            if (Object.values(dataToSave).every(val => val.trim() === "")) { showToast("Form is empty. Nothing to save.", "info"); return; }
            localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(dataToSave));
            showToast("Draft saved locally!");
        } catch (e) { console.error("Error saving to local storage:", e); showToast("Could not save draft.", "error"); }
    });
    loadDraftButton.addEventListener('click', () => { /* ... same, uses LOCAL_DRAFT_KEY ... */ 
        const currentData = getFormData();
        if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Loading a draft will overwrite current content. Continue?")) return;
        try {
            const savedData = localStorage.getItem(LOCAL_DRAFT_KEY);
            if (savedData) {
                setFormData(JSON.parse(savedData));
                showToast("Draft loaded from local storage!");
            } else {
                showToast("No saved local draft found.", "info");
            }
        } catch (e) { console.error("Error loading from local storage:", e); showToast("Could not load draft.", "error"); }
    });
    
    // --- Clear/Reset Form (same) ---
    const clearTheForm = () => { /* ... same ... */ 
        form.reset(); 
        Object.keys(fieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element && element.tagName === 'TEXTAREA') element.value = '';
        });
        helperPanelSubtitle.textContent = "For: (No field selected)";
        suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">Click on a field in the form to see relevant suggestions here.</p>';
        customSuggestionModule.style.display = 'none';
        activeTextarea = null;
        if (document.getElementById('gi_date')) document.getElementById('gi_date').focus();
    };
    clearFormButton.addEventListener('click', () => { /* ... same ... */ 
        if (confirm("Are you sure you want to clear the entire form? This cannot be undone.")) {
            clearTheForm();
            showToast("Form cleared.");
        }
    });
    resetNoteButton.addEventListener('click', () => { /* ... same ... */ 
         if (confirm("Are you sure you want to start a new note? This will clear the entire form.")) {
            clearTheForm();
            showToast("New note started. Form cleared.");
        }
    });

    // --- Toast Notification (same) ---
    let toastTimeout;
    function showToast(message, type = 'success') { /* ... same ... */ 
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toastMessage.className = 'show'; 
        if (type === 'error') toastMessage.style.backgroundColor = '#dc2626';
        else if (type === 'info') toastMessage.style.backgroundColor = '#2563eb';
        else toastMessage.style.backgroundColor = '#16a34a';
        toastTimeout = setTimeout(() => {
            toastMessage.className = toastMessage.className.replace('show', '');
        }, 3000);
    }
    
    // --- UI Settings (Density & Section Visibility - same) ---
    function loadUISettings() { /* ... same ... */ 
        const settings = localStorage.getItem(UI_SETTINGS_KEY);
        const defaults = { layout: 'normal', sectionsVisible: { generalInfoSection: true, subjectiveSection: true, objectiveSection: true, assessmentSection: true, planSection: true } };
        if (settings) {
            const loaded = JSON.parse(settings);
            Object.keys(defaults.sectionsVisible).forEach(key => { if (loaded.sectionsVisible && typeof loaded.sectionsVisible[key] === 'undefined') loaded.sectionsVisible[key] = defaults.sectionsVisible[key]; });
            if(!loaded.sectionsVisible) loaded.sectionsVisible = defaults.sectionsVisible;
            return { ...defaults, ...loaded };
        }
        return defaults;
    }
    function saveUISetting(key, value) { /* ... same ... */ 
        const settings = loadUISettings();
        settings[key] = value;
        localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
    }
    function applyUISettings() { /* ... same ... */ 
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
        Object.entries(settings.sectionsVisible).forEach(([sectionId, isVisible]) => {
            const sectionElement = document.getElementById(sectionId);
            const checkbox = document.querySelector(`#visibleSectionsControlsContainer input[data-section-id="${sectionId}"]`);
            if (sectionElement) sectionElement.classList.toggle('hidden-section', !isVisible);
            if (checkbox) checkbox.checked = isVisible;
        });
    }
    function initUISettingsControls() { /* ... same ... */ 
        document.querySelectorAll('.btn-density').forEach(button => {
            button.addEventListener('click', () => {
                saveUISetting('layout', button.dataset.density);
                applyUISettings();
            });
        });
        const visibleSectionsControlsContainer = document.getElementById('visibleSectionsControlsContainer');
        formSections.forEach(section => {
            const div = document.createElement('div'); div.className = 'flex items-center';
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = `toggle-${section.id}`; checkbox.dataset.sectionId = section.id; checkbox.className = 'mr-2 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500';
            const label = document.createElement('label'); label.htmlFor = `toggle-${section.id}`; label.textContent = section.label; label.className = 'text-sm text-slate-700';
            div.appendChild(checkbox); div.appendChild(label); visibleSectionsControlsContainer.appendChild(div);
            checkbox.addEventListener('change', (e) => {
                const currentSettings = loadUISettings(); currentSettings.sectionsVisible[section.id] = e.target.checked;
                saveUISetting('sectionsVisible', currentSettings.sectionsVisible);
                applyUISettings();
            });
        });
    }

    // Initial Load
    initUISettingsControls();
    applyUISettings(); 
    const firstInput = document.getElementById('gi_date');
    if (firstInput) firstInput.focus();
    if (!activeTextarea) {
        customSuggestionModule.style.display = 'none';
        helperPanelSubtitle.textContent = "For: (No field selected)";
    }
});
