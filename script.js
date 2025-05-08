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
    const clearActiveFieldButton = document.getElementById('clearActiveFieldButton');
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

    const professionSelect = document.getElementById('professionSelect');
    professionSelect.addEventListener('change', () => {
      // 1) swap in the chosen template (falls back to therapist)
      standardSections = professionTemplates[professionSelect.value] || professionTemplates.therapist;
      // 2) rebuild & rerender the form
      buildMasterData();
      renderForm();
      setupHelperPanelTabs();   // re-attach tab logic if needed
      initDensityControls();    // re-apply UI settings
    });

    // --- State & Keys ---
    let activeTextarea = null;
    let toastTimeout; 

    const CUSTOM_SUGGESTIONS_KEY = 'noteinghamCustomSuggestions_v6';
    const UI_SETTINGS_KEY = 'noteinghamUISettings_v6';
    const LOCAL_DRAFT_KEY = 'noteinghamSOAPNoteDraft_v6';
    const CUSTOM_TEMPLATE_KEY = 'noteinghamCustomTemplate_v6';

    let masterFieldData = {}; 
    let masterSectionData = [];

    let standardSections = [ /* ... Full standardSections array as previously provided ... */ 
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

    const professionTemplates = {
      therapist: [...standardSections],  // clone your current array
      doctor: [
        {
          id: 'chiefComplaint', title: 'Chief Complaint', fields: [
            {
              id: 'cc_statement',
              label: 'Patient Statement',
              type: 'textarea',
              placeholder: 'e.g. “I’ve had chest pain…”',
              suggestions: [
                "Patient complains of [symptom] for [duration].",
                "Onset was [when], character is [quality]."
              ]
            }
          ]
        },
        {
          id: 'history', title: 'History of Present Illness', fields: [
            {
              id: 'hpi', label: 'HPI Details', type: 'textarea',
              placeholder: 'Detail the story of present illness…',
              suggestions: [
                "Symptoms started [timeframe] after [event].",
                "Aggravating factors: [list]. Relieving factors: [list]."
              ]
            }
          ]
        },
        // … add PMHx, Meds, Exam, Plan, etc …
      ],
      dentist_osce: [
        // grab fields from your “Template for OSCEs.docx”
        { id: 'cc',      title: 'Chief Complaint',  fields:[ /* … */ ] },
        { id: 'empathy', title: 'Empathy',           fields:[ /* … */ ] },
        { id: 'shipt',   title: 'S-H-I-P-T',          fields:[ /* … */ ] },
        // …and so on
      ],
      // you can add more: nurse, socialWorker, etc.
    };

    // All other JavaScript functions (generateUniqueId, showToast, template management, form rendering, downloads, suggestions, etc.)
    // remain the same as in the previous FULL CORRECTED JavaScript.
    // The key change is in `setupHelperPanelTabs` and ensuring event listeners are correctly attached to the new tab buttons.

    function setupHelperPanelTabs() {
        const tabButtons = [suggestionsHelperTabButton, templateEditorHelperTabButton].filter(Boolean); // Filter out null if an ID is wrong
        const tabContents = [suggestionsHelperTabContent, templateEditorHelperTabContent].filter(Boolean);

        if (tabButtons.length === 0 || tabContents.length === 0 || tabButtons.length !== tabContents.length) {
            console.error("Helper panel tab buttons or content not found or mismatch.");
            return;
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Deactivate all tabs
                tabButtons.forEach(btn => {
                    btn.classList.remove('active-tab', 'border-sky-500', 'text-sky-600');
                    btn.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                });
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });

                // Activate clicked tab
                button.classList.add('active-tab', 'border-sky-500', 'text-sky-600');
                button.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                
                const targetContentId = button.dataset.tabTarget;
                const targetContentElement = document.getElementById(targetContentId);
                if (targetContentElement) {
                    targetContentElement.classList.add('active');
                } else {
                    console.error(`Target content not found for tab: ${targetContentId}`);
                }
            });
        });

        // Ensure default active tab is set if specified in HTML or default to suggestions
        let activeTabSet = false;
        tabButtons.forEach(button => {
            if (button.classList.contains('active-tab')) {
                const targetContentElement = document.getElementById(button.dataset.tabTarget);
                if (targetContentElement) targetContentElement.classList.add('active');
                activeTabSet = true;
            }
        });
        if (!activeTabSet && suggestionsHelperTabButton) {
            suggestionsHelperTabButton.click(); // Default to suggestions tab
        }
    }


    // --- Helper Functions (Full Code) ---
    function generateUniqueId(prefix = 'id_') { 
        return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    function showToast(message, type = 'success') { 
        clearTimeout(toastTimeout); 
        toastMessage.textContent = message; toastMessage.className = 'show';
        if (type === 'error') toastMessage.style.backgroundColor = '#dc2626';
        else if (type === 'info') toastMessage.style.backgroundColor = '#2563eb';
        else toastMessage.style.backgroundColor = '#16a34a';
        toastTimeout = setTimeout(() => { toastMessage.className = toastMessage.className.replace('show', ''); }, 3000);
    }

    // --- Dynamic Form Rendering & Template Management (Full Code) ---
    function getCustomTemplate() { 
        const template = localStorage.getItem(CUSTOM_TEMPLATE_KEY);
        return template ? JSON.parse(template) : { sections: [] };
    }
    function saveCustomTemplate(customTemplate) { 
        localStorage.setItem(CUSTOM_TEMPLATE_KEY, JSON.stringify(customTemplate));
    }
    function buildMasterData() { 
        masterFieldData = {}; masterSectionData = [];
        standardSections.forEach(section => {
            const sectionMeta = { id: section.id, title: section.title, isCustom: false, fieldIds: [] };
            section.fields.forEach(field => {
                masterFieldData[field.id] = { 
                    label: field.label, suggestions: field.suggestions || [], sectionId: section.id,
                    type: field.type, placeholder: field.placeholder || ''
                };
                sectionMeta.fieldIds.push(field.id);
            });
            masterSectionData.push(sectionMeta);
        });
        const customTemplate = getCustomTemplate();
        customTemplate.sections.forEach(customSection => {
            let sectionMeta = masterSectionData.find(s => s.id === customSection.id);
            if (!sectionMeta) { 
                sectionMeta = { id: customSection.id, title: customSection.title, isCustom: true, fieldIds: [] };
                masterSectionData.push(sectionMeta);
            } else { 
                sectionMeta.isCustom = true; 
                if(customSection.title && customSection.title !== sectionMeta.title) sectionMeta.title = customSection.title; 
            }
            customSection.fields.forEach(customField => {
                if (masterFieldData[customField.id]) { console.warn(`Custom field ID ${customField.id} collides. Skipping.`); return; }
                masterFieldData[customField.id] = { 
                    label: customField.label, suggestions: [], sectionId: customSection.id,
                    type: customField.type || 'textarea', placeholder: customField.placeholder || `Enter ${customField.label}...`
                };
                if (!sectionMeta.fieldIds.includes(customField.id)) sectionMeta.fieldIds.push(customField.id);
            });
        });
    }
    function renderForm() { 
        if (!soapNoteForm) { console.error("soapNoteForm not found!"); return; }
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
            sectionMeta.fieldIds.forEach((fieldId) => {
                const field = masterFieldData[fieldId];
                if (!field) { console.warn(`Field data missing: ${fieldId}`); return; }
                const formFieldDiv = document.createElement('div'); formFieldDiv.className = 'form-field';
                let addedToGrid = false;
                if (sectionMeta.id === 'generalInfoSection' && field.type === 'text' && fieldCountInGrid < 2) {
                    if (!currentGridDiv) {
                        currentGridDiv = document.createElement('div'); currentGridDiv.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
                        const h3El = sectionElement.querySelector('h3'); sectionElement.insertBefore(currentGridDiv, h3El.nextElementSibling);
                    }
                    currentGridDiv.appendChild(formFieldDiv); fieldCountInGrid++; addedToGrid = true;
                } else {
                    const isFirstFieldInNonGrid = sectionElement.querySelectorAll('.form-field').length === 0 && !currentGridDiv;
                     if (!isFirstFieldInNonGrid && ! (sectionElement.lastChild === currentGridDiv && currentGridDiv && currentGridDiv.contains(formFieldDiv)) ) {
                         formFieldDiv.classList.add('mt-4');
                    }
                    sectionElement.appendChild(formFieldDiv);
                }
                const labelEl = document.createElement('label');
                labelEl.htmlFor = fieldId; labelEl.textContent = field.label; formFieldDiv.appendChild(labelEl);
                let inputEl;
                if (field.type === 'textarea') inputEl = document.createElement('textarea');
                else { inputEl = document.createElement('input'); inputEl.type = 'text'; }
                inputEl.id = fieldId; inputEl.name = fieldId; inputEl.placeholder = field.placeholder;
                inputEl.classList.add('form-input'); formFieldDiv.appendChild(inputEl);
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
    function handleDeleteCustomSection(sectionId, sectionTitle) { 
        if (!confirm(`Delete section "${sectionTitle}"? This cannot be undone.`)) return;
        const customTemplate = getCustomTemplate();
        customTemplate.sections = customTemplate.sections.filter(s => s.id !== sectionId);
        saveCustomTemplate(customTemplate);
        const suggestions = getCustomSuggestions();
        const sectionMeta = masterSectionData.find(s => s.id === sectionId);
        if (sectionMeta) sectionMeta.fieldIds.forEach(fieldId => delete suggestions[fieldId]);
        saveCustomSuggestions(suggestions);
        buildMasterData(); renderForm();
        showToast(`Section "${sectionTitle}" deleted.`, 'success');
    }
    function populateTargetSectionSelect() { 
        if (!targetSectionSelect) return;
        targetSectionSelect.innerHTML = '';
        masterSectionData.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id; option.textContent = section.title;
            targetSectionSelect.appendChild(option);
        });
    }
    if (addNewSectionButton) { 
        addNewSectionButton.addEventListener('click', () => {
            const sectionName = newSectionNameInput.value.trim();
            if (!sectionName) { showToast("Section title empty.", "info"); return; }
            const customTemplate = getCustomTemplate();
            const newSection = { id: generateUniqueId('section_'), title: sectionName, fields: [] };
            customTemplate.sections.push(newSection); saveCustomTemplate(customTemplate);
            buildMasterData(); renderForm(); newSectionNameInput.value = '';
            showToast("New section added!", "success");
        });
    }
    if (addNewFieldButton) { 
        addNewFieldButton.addEventListener('click', () => {
            const fieldLabel = newFieldNameInput.value.trim(); const selectedSectionId = targetSectionSelect.value;
            if (!fieldLabel) { showToast("Field label empty.", "info"); return; }
            if (!selectedSectionId) { showToast("Select a section.", "info"); return; }
            const customTemplate = getCustomTemplate();
            let sectionInCustomTemplate = customTemplate.sections.find(s => s.id === selectedSectionId);
            if (!sectionInCustomTemplate) {
                const standardSectionInfo = standardSections.find(s => s.id === selectedSectionId);
                if (standardSectionInfo) {
                    sectionInCustomTemplate = { id: standardSectionInfo.id, title: standardSectionInfo.title, fields: [], isStandardBase: true };
                    customTemplate.sections.push(sectionInCustomTemplate);
                } else { showToast("Target section not found.", "error"); return; }
            }
            const newField = { id: generateUniqueId('field_'), label: fieldLabel, type: 'textarea', placeholder: `Enter ${fieldLabel}...` };
            sectionInCustomTemplate.fields.push(newField); saveCustomTemplate(customTemplate);
            buildMasterData(); renderForm(); newFieldNameInput.value = '';
            showToast("New field added!", "success");
        });
    }
    
    // --- Download/Upload & Draft Management (Full Code) ---
    function generateFilename(baseName, extension) { 
        const dateEl = document.getElementById('gi_date'); const clientIdEl = document.getElementById('gi_client_id');
        let dateStr = dateEl && dateEl.value ? dateEl.value.replace(/-/g, '') : new Date().toISOString().slice(0,10).replace(/-/g, '');
        if (!/^\d{8}$/.test(dateStr) && !/^\d{4}\d{2}\d{2}$/.test(dateStr)) dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
        let clientIdStr = clientIdEl && clientIdEl.value ? clientIdEl.value.replace(/[^a-zA-Z0-9_.-]/g, '') : 'NoClient';
        if (!clientIdStr) clientIdStr = 'NoClient';
        return `NoteingHam_${baseName}_${dateStr}_${clientIdStr}.${extension}`;
    }
    function triggerDownload(filename, data, mimeType) { 
        const blob = new Blob([data], { type: mimeType }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    if (downloadNoteButton) { 
        downloadNoteButton.addEventListener('click', () => {
            let htmlNote = `<html><head><meta charset="UTF-8"><title>SOAP Note</title><style>body{font-family:Arial,sans-serif;} h3{margin-top:1em;margin-bottom:0.5em;} p{margin:0.2em 0;}</style></head><body>`;
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

    const copyNoteButton = document.getElementById('copyNoteButton');
    copyNoteButton.addEventListener('click', () => {
      // reuse your download-note HTML builder, but copy instead of download
      let htmlNote = `<html><head><meta charset="UTF-8"><title>SOAP Note</title>
        <style>body{font-family:Arial,sans-serif;} h3{margin-top:1em;margin-bottom:0.5em;}
               p{margin:0.2em 0;}</style>
        </head><body>`;
    
      let contentAdded = false;
      const uiSettings = loadUISettings();
      masterSectionData.forEach(sectionMeta => {
        if (uiSettings.sectionsVisible[sectionMeta.id] === false) return;
        let sectionHtml = `<h3><strong>${sectionMeta.title}</strong></h3>`;
        let anyField = false;
        sectionMeta.fieldIds.forEach(fid => {
          const field = masterFieldData[fid];
          const val = document.getElementById(fid)?.value.trim();
          if (val) {
            anyField = true;
            contentAdded = true;
            sectionHtml += `<p><strong>${field.label}:</strong> ${val}</p>`;
          }
        });
        if (anyField) htmlNote += sectionHtml;
      });
    
      htmlNote += `</body></html>`;
    
      if (!contentAdded) return showToast("Nothing to copy.", "info");
    
      // Copy to clipboard
      navigator.clipboard.writeText(htmlNote)
        .then(() => showToast("Note copied! 📋", "success"))
        .catch(() => showToast("Copy failed.", "error"));
    });

    if (downloadDraftButton) { 
        downloadDraftButton.addEventListener('click', () => {
            const dataToSave = getFormData();
            if (Object.values(dataToSave).every(val => val.trim() === "")) { showToast("Nothing to download.", "info"); return; }
            const jsonData = JSON.stringify(dataToSave, null, 2); const filename = generateFilename('Draft', 'json');
            triggerDownload(filename, jsonData, 'application/json'); showToast("Draft downloaded!", "success");
        });
    }
    if (uploadDraftButton) { 
        uploadDraftButton.addEventListener('click', () => uploadDraftInput.click() );
    }
    if (uploadDraftInput) { 
        uploadDraftInput.addEventListener('change', (event) => {
            const file = event.target.files[0]; if (!file) return;
            const currentData = getFormData();
            if (Object.values(currentData).some(val => val.trim() !== "") && !confirm("Overwrite current?")) { event.target.value = null; return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    buildMasterData(); renderForm(); setFormData(jsonData); 
                    showToast("Draft uploaded!", "success");
                } catch (err) { console.error("Err parsing draft:", err); showToast("Invalid JSON.", "error"); } 
                finally { event.target.value = null; }
            };
            reader.onerror = () => { showToast("Error reading file.", "error"); event.target.value = null; };
            reader.readAsText(file);
        });
    }

    // --- Custom Suggestions, Field Focus, Helper Panel (Full Code) ---
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
            allSuggestions[fieldId].push(suggestionText); saveCustomSuggestions(allSuggestions); return true;
        } return false;
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
                showToast("Custom suggestion added!", "success"); customSuggestionInput.value = ''; updateHelperPanel(activeTextarea.id);
            } else { showToast("Suggestion exists.", "info"); }
        });
    }
    if (clearActiveFieldButton) { 
        clearActiveFieldButton.addEventListener('click', () => {
            if (activeTextarea) {
                activeTextarea.value = '';
                showToast(`Field "${masterFieldData[activeTextarea.id]?.label || 'Current'}" cleared.`, 'info');
                activeTextarea.focus();
            } else { showToast('No field active.', 'info'); }
        });
    }
    function updateHelperPanel(fieldId) { 
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
    function createSuggestionButton(text, isCustom, fieldId) { 
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
    function insertSuggestion(text) { 
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
    function getFormData() { 
        const data = {};
        Object.keys(masterFieldData).forEach(id => { const element = document.getElementById(id); if (element) data[id] = element.value; });
        return data;
    }
    function setFormData(data) { 
        Object.keys(masterFieldData).forEach(id => {
            const element = document.getElementById(id);
            if (element && typeof data[id] !== 'undefined') element.value = data[id] || '';
        });
    }

    // --- Local Storage Draft (Full Code) ---
    if (saveDraftButton) { 
        saveDraftButton.addEventListener('click', () => {
            try {
                const dataToSave = getFormData();
                if (Object.values(dataToSave).every(val => val.trim() === "")) { showToast("Form empty.", "info"); return; }
                localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(dataToSave)); showToast("Draft saved locally!");
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
                    buildMasterData(); renderForm(); setFormData(JSON.parse(savedData)); showToast("Draft loaded!");
                } else { showToast("No local draft.", "info"); }
            } catch (e) { console.error("Err load draft:", e); showToast("Could not load.", "error"); }
        });
    }
    
    // --- Clear/Reset Form (Full Code) ---
    const clearTheForm = () => { 
        Object.keys(masterFieldData).forEach(id => { const element = document.getElementById(id); if (element) element.value = ''; });
        if(helperPanelSubtitle) helperPanelSubtitle.textContent = "For: (No field selected)";
        if(suggestionsContainer) suggestionsContainer.innerHTML = '<p class="text-slate-500 text-sm">Click on a field...</p>';
        if(customSuggestionModule) customSuggestionModule.style.display = 'none'; activeTextarea = null;
        const firstStandardFieldId = standardSections[0]?.fields[0]?.id;
        if (firstStandardFieldId && document.getElementById(firstStandardFieldId)) document.getElementById(firstStandardFieldId).focus();
    };
    if (clearFormButton) { 
        clearFormButton.addEventListener('click', () => { if (confirm("Clear entire form?")) { clearTheForm(); showToast("Form cleared."); } });
    }
    if (resetNoteButton) { 
        resetNoteButton.addEventListener('click', () => { if (confirm("Start new (clears form)?")) { clearTheForm(); showToast("New note. Form cleared."); } });
    }

    // --- UI Settings (Density & Section Visibility - Full Code) ---
    function loadUISettings() { 
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
    function saveUISetting(key, value) { 
        const settings = loadUISettings();
        settings[key] = value; localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
    }
    function applyUISettings() { 
        const settings = loadUISettings();
        document.body.classList.remove('layout-compact', 'layout-normal', 'layout-expanded');
        document.body.classList.add(`layout-${settings.layout || 'normal'}`);
        document.querySelectorAll('.btn-density').forEach(btn => { // Adjusted selector for density buttons in top bar
            btn.classList.remove('bg-sky-600', 'text-white', 'hover:bg-sky-700', 'border-sky-600', 'active');
            btn.classList.add('bg-white', 'border-slate-300', 'text-slate-700', 'hover:bg-slate-50'); // Default outline style
            if (btn.dataset.density === (settings.layout || 'normal')) {
                btn.classList.add('bg-sky-600', 'text-white', 'hover:bg-sky-700', 'border-sky-600', 'active');
                btn.classList.remove('bg-white', 'border-slate-300', 'text-slate-700', 'hover:bg-slate-50');
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
    }
    function initDensityControls() { 
         document.querySelectorAll('.top-controls-bar .btn-density').forEach(button => { // More specific selector
            button.addEventListener('click', () => {
                saveUISetting('layout', button.dataset.density); applyUISettings();
            });
        });
    }
    if (toggleVisibleSectionsButton && visibleSectionsPopover) { 
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
    buildMasterData(); 
    renderForm();      
    setupHelperPanelTabs(); 
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
