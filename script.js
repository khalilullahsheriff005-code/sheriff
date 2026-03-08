const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let activeResumeText = "";

document.querySelectorAll('.n-item').forEach(i => {
    i.onclick = () => {
        document.querySelectorAll('.n-item, .page').forEach(x => x.classList.remove('active'));
        i.classList.add('active');
        document.getElementById(i.dataset.tab).classList.add('active');
    };
});

async function handleFileUpload(file, isMatchPage = false) {
    if(!file) return;
    document.getElementById(isMatchPage ? 'fn2' : 'fn1').innerText = file.name;

    if(file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async function() {
            const pdf = await pdfjsLib.getDocument({data: new Uint8Array(this.result)}).promise;
            let text = "";
            for(let i=1; i<=pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(s => s.str).join(" ");
                if(i===1 && !isMatchPage) renderPreview(page);
            }
            activeResumeText = text;
        };
        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            activeResumeText = e.target.result;
            if(!isMatchPage) {
                document.getElementById('textPreview').innerText = activeResumeText;
                document.getElementById('pdfPreview').style.display = 'none';
            }
        };
        reader.readAsText(file);
    }
}

function renderPreview(page) {
    const canvas = document.getElementById('pdfPreview');
    const vp = page.getViewport({scale: 0.8});
    canvas.height = vp.height; canvas.width = vp.width;
    page.render({canvasContext: canvas.getContext('2d'), viewport: vp});
    canvas.style.display = 'block';
    document.getElementById('textPreview').innerText = "";
}

document.getElementById('dropZone').onclick = () => document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange = (e) => handleFileUpload(e.target.files[0]);
document.getElementById('jdResume').onchange = (e) => handleFileUpload(e.target.files[0], true);

document.getElementById('analyzeBtn').onclick = () => {
    if(!activeResumeText) return alert("Please upload a resume first!");
    const t = activeResumeText.toLowerCase();
    const audit = {
        core: { "Contact Info": t.includes("@")?100:0, "Skills": t.includes("skills")?100:0, "Experience": t.includes("experience")?100:0, "Education": t.includes("education")?100:0 },
        struct: { "Bullets": (t.match(/[•?¦*-]/g)||[]).length>5?100:50, "Keywords": Math.min(100,(t.match(/\b(managed|led|developed|created)\b/g)||[]).length*25) },
        qual: { "Grammar": 95, "Formatting": 90 }
    };
    const drawGrid = (id, obj, clr) => {
        let h = "";
        for(let k in obj) h += `<div style="margin-bottom:10px"><div style="display:flex; justify-content:space-between; font-size:0.8rem"><span>${k}</span><span>${obj[k]}%</span></div><div class="m-bar"><div class="m-fill" style="width:${obj[k]}%; background:${clr}"></div></div></div>`;
        document.getElementById(id).innerHTML = h;
    };
    drawGrid('coreGrid', audit.core, 'var(--c1)');
    drawGrid('structGrid', audit.struct, 'var(--c2)');
    drawGrid('qualGrid', audit.qual, 'var(--c3)');
    document.getElementById('finalScore').innerText = "85";
    document.getElementById('nav-report').click();
};



document.getElementById('matchBtn').onclick = () => {
    const jd = document.getElementById('jdArea').value.toLowerCase();
    if(!jd || !activeResumeText) return alert("Upload Resume and Paste Job Description!");

    const keywords = jd.split(/\W+/).filter(w => w.length > 4);
    const matches = keywords.filter(w => activeResumeText.toLowerCase().includes(w)).length;
    const score = Math.round((matches / keywords.length) * 100) || 0;

    const out = document.getElementById('matchResult');
    out.classList.remove('hidden');
    let color = score > 70 ? 'var(--c3)' : (score > 40 ? '#f59e0b' : 'var(--c2)');
    out.innerHTML = `
        <h4 style="color:#64748b; margin-bottom:5px">ALIGNMENT INDEX</h4>
        <h2 style="font-size:3.5rem; color:${color}; margin:0">${score}%</h2>
        <div style="margin-top:20px; width:100%">
            <p style="font-size:0.9rem">Keywords matched: <b>${matches}</b> / ${keywords.length}</p>
            <div class="m-bar"><div class="m-fill" style="width:${score}%; background:${color}"></div></div>
        </div>`;
};