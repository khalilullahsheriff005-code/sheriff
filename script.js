
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetId = item.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');
    });
});

let sharedResumeText = "";


function setupUploader(zoneId, inputId, labelId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    zone.onclick = () => input.click();
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById(labelId).innerText = " " + file.name;
            const reader = new FileReader();
            reader.onload = (ev) => {
                sharedResumeText = ev.target.result;
            };
            reader.readAsText(file);
        }
    };
}
setupUploader('scanZone', 'scanInput', 'scanFileName');
setupUploader('matchZone', 'matchInput', 'matchInput');


function auditResume() {
    if (!sharedResumeText) return alert("Please upload a resume first!");
    toggleLoader(true);
    
    setTimeout(() => {
        const text = sharedResumeText.toLowerCase();
        const auditData = [
            { label: "Contact Info", ok: /email|phone|linkedin|@|address/i.test(text) },
            { label: "Education", ok: /education|degree|university|college|bachelor|master/i.test(text) },
            { label: "Skills", ok: /skills|technologies|tools|competencies/i.test(text) },
            { label: "Summary", ok: /summary|objective|profile|about me/i.test(text) },
            { label: "Experience", ok: /experience|employment|work history|career/i.test(text) },
            { label: "Projects", ok: /projects|personal projects|portfolio/i.test(text) }
        ];

        const score = Math.round((auditData.filter(d => d.ok).length / 6) * 100);

        let html = `
            <div style="grid-column: 1/-1; text-align: center;" class="card">
                <h2 style="color: var(--primary); font-size: 3rem;">${score}%</h2>
                <p style="font-weight: 700;">Structural Completeness Match</p>
                <div class="progress-bar"><div class="progress-fill" style="width:${score}%"></div></div>
                <p>${auditData.filter(d => d.ok).length} of 6 essential sections detected.</p>
            </div>
        `;

        auditData.forEach(item => {
            html += `
                <div class="status-badge ${item.ok ? 'ok' : 'no'}">
                    <h4 style="margin:0 0 10px;">${item.label}</h4>
                    <p style="margin:0; font-weight:600; color:${item.ok ? 'var(--success)' : 'var(--danger)'}">
                        ${item.ok ? '? Detected' : '? Missing'}
                    </p>
                </div>`;
        });
        
        const resultDiv = document.getElementById('auditResult');
        resultDiv.innerHTML = html;
        resultDiv.classList.remove('hidden');
        toggleLoader(false);
        updateSuggestions(auditData);
    }, 1200);
}


function calculateMatchScore() {
    const jd = document.getElementById('jdInput').value.toLowerCase();
    if (!jd || !sharedResumeText) return alert("Upload resume AND paste JD first!");
    
    toggleLoader(true);
    setTimeout(() => {
        const resume = sharedResumeText.toLowerCase();
        const commonSkills = ["react", "node", "python", "javascript", "sql", "aws", "git", "java", "html", "css", "docker", "agile"];
        
        const jdWords = jd.match(/\b(\w+)\b/g) || [];
        const targetKeywords = [...new Set(jdWords)].filter(w => w.length > 4 || commonSkills.includes(w));
        
        const matched = targetKeywords.filter(k => resume.includes(k));
        const missing = targetKeywords.filter(k => !resume.includes(k));
        const matchScore = targetKeywords.length > 0 ? Math.round((matched.length / targetKeywords.length) * 100) : 0;

        document.getElementById('matchResultOutput').innerHTML = `
            <div style="text-align:center; margin-bottom:2rem;">
                <h2 style="color: var(--primary); font-size: 3rem;">${matchScore}%</h2>
                <p style="font-weight:700;">JD Keyword Match Score</p>
                <div class="progress-bar"><div class="progress-fill" style="width:${matchScore}%"></div></div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div style="background:#f0fdf4; padding:15px; border-radius:12px; border:1px solid #bbf7d0;">
                    <h5 style="margin-top:0; color:#166534;">Matched Skills</h5>
                    ${matched.slice(0, 10).map(m => `<span class="badge badge-ok">${m}</span>`).join('')}
                </div>
                <div style="background:#fef2f2; padding:15px; border-radius:12px; border:1px solid #fecaca;">
                    <h5 style="margin-top:0; color:#991b1b;">Missing Skills</h5>
                    ${missing.slice(0, 10).map(m => `<span class="badge badge-no">${m}</span>`).join('')}
                </div>
            </div>
        `;
        toggleLoader(false);
    }, 1800);
}


function updateSuggestions(data) {
    const missing = data.filter(d => !d.ok).map(d => d.label);
    const box = document.getElementById('suggestionCard');
    
    if (missing.length === 0) {
        box.innerHTML = "<h4>? Sheriff's Verified!</h4><p>Your resume has all the core sections needed for high ATS ranking.</p>";
    } else {
        box.innerHTML = `
            <h4 style="color:var(--primary);">?? Pro Tips to Improve Your Score:</h4>
            <ul style="line-height:2; margin-top:15px;">
                ${missing.map(m => `<li>Add a clear <b>${m}</b> section to pass structural filters.</li>`).join('')}
                <li>Avoid using tables, headers, or footers for critical contact info.</li>
                <li>Use standard fonts like Arial or Calibri for better bot-readability.</li>
            </ul>`;
    }
}

function toggleLoader(show) {
    document.getElementById('globalLoader').classList.toggle('hidden', !show);
}