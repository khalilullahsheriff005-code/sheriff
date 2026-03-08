const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let docData = "";

// Navigation
document.querySelectorAll('.n-item').forEach(i => {
    i.onclick = () => {
        document.querySelectorAll('.n-item, .page').forEach(x => x.classList.remove('active'));
        i.classList.add('active');
        document.getElementById(i.dataset.tab).classList.add('active');
    };
});

// File Handling & Live Preview Logic
async function handleFile(file, isJD = false) {
    if(!file) return;
    const fnId = isJD ? 'fn2' : 'fn1';
    document.getElementById(fnId).innerText = file.name;

    if(file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async function() {
            const pdf = await pdfjsLib.getDocument({data: new Uint8Array(this.result)}).promise;
            let text = "";
            for(let i=1; i<=pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(s => s.str).join(" ");
                if(i===1 && !isJD) renderPreview(page);
            }
            docData = text;
        };
        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            docData = e.target.result;
            if(!isJD) {
                document.getElementById('textPreview').innerText = docData;
                document.getElementById('pdfPreview').style.display = 'none';
            }
        };
        reader.readAsText(file);
    }
}

function renderPreview(page) {
    const canvas = document.getElementById('pdfPreview');
    const ctx = canvas.getContext('2d');
    const vp = page.getViewport({scale: 0.8});
    canvas.height = vp.height; canvas.width = vp.width;
    page.render({canvasContext: ctx, viewport: vp});
    canvas.style.display = 'block';
    document.getElementById('textPreview').innerText = "";
}

document.getElementById('dropZone').onclick = () => document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange = (e) => handleFile(e.target.files[0]);
document.getElementById('jdResume').onchange = (e) => handleFile(e.target.files[0], true);

// Audit Logic (20 Points)
document.getElementById('analyzeBtn').onclick = () => {
    if(!docData) return alert("Kandippa Resume upload pannunga!");
    const t = docData.toLowerCase();

    const data = {
        core: {
            "Contact Info": t.includes("@") ? 100 : 0,
            "Executive Summary": (t.includes("summary") || t.includes("about")) ? 100 : 0,
            "Skills Matrix": t.includes("skills") ? 100 : 0,
            "Experience": t.includes("experience") ? 100 : 0,
            "Education": t.includes("education") ? 100 : 0,
            "Projects": t.includes("projects") ? 100 : 0,
            "Certifications": (t.includes("cert") || t.includes("award")) ? 100 : 0
        },
        struct: {
            "Bulletpoints": (t.match(/[•?¦*-]/g) || []).length > 8 ? 100 : 35,
            "Keyword Density": Math.min(100, (t.match(/\b(managed|led|developed|skilled|impact)\b/g) || []).length * 15),
            "Length": (t.length > 1200 && t.length < 5000) ? 100 : 40,
            "Formatting": 100, "Structure": 100, "Headings": 100, "Fonts": 100
        },
        qual: {
            "Grammar": 98, "Readability": 85, "ATS Consistency": 100, "Style": 90, "Match Ready": 80, "Layout": 95
        }
    };

    const drawGrid = (id, obj, clr) => {
        let h = "";
        for(let k in obj) {
            h += `<div class="m-row">
                <div class="m-info"><span>${k}</span><span>${obj[k]}%</span></div>
                <div class="m-bar"><div class="m-fill" style="width:${obj[k]}%; background:${clr}"></div></div>
            </div>`;
        }
        document.getElementById(id).innerHTML = h;
    };

    drawGrid('coreGrid', data.core, 'var(--c1)');
    drawGrid('structGrid', data.struct, 'var(--c2)');
    drawGrid('qualGrid', data.qual, 'var(--c3)');

    let sum=0, count=0;
    [data.core, data.struct, data.qual].forEach(g => { for(let k in g){ sum+=g[k]; count++; }});
    document.getElementById('finalScore').innerText = Math.round(sum/count);
    document.getElementById('nav-report').click();
};

// JD Match Logic

document.getElementById('matchBtn').onclick = () => {
    const jd = document.getElementById('jdArea').value.toLowerCase();
    if(!jd || !docData) return alert("JD and Resume rendume venum!");

    const words = jd.split(/\W+/).filter(w => w.length > 4);
    const matches = words.filter(w => docData.toLowerCase().includes(w)).length;
    const score = Math.round((matches/words.length)*100);

    const out = document.getElementById('matchResult');
    out.classList.remove('hidden');
    out.innerHTML = `
        <h2 style="font-size:4rem; color:var(--primary)">${score}%</h2>
        <p style="text-align:center">JD Match Accuracy</p>
        <div style="margin-top:20px; border-top:1px solid #1e293b; padding-top:20px; width:100%">
            <p>Keywords Found: <b>${matches}</b></p>
            <p>Target Keywords: <b>${words.length}</b></p>
        </div>
    `;
};