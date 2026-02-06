const fileInput = document.getElementById("fileInput");
const loader = document.getElementById("loader");
const chartSection = document.getElementById("chartSection");
const dataSection = document.getElementById("dataSection");
const dataTable = document.getElementById("dataTable");
const suggestionSection = document.getElementById("suggestion");
const suggestionText = document.getElementById("suggestionText");

let chartsRendered = false;
let chartDataCache = null;

// ---------------- FILE UPLOAD ----------------
fileInput.addEventListener("change", async () => {

    const file = fileInput.files[0];
    if (!file) return;

    loader.style.display = "block";

    const formData = new FormData();
    formData.append("file", file); // 🔥 MUST match Flask key

    try {
        const response = await fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        chartDataCache = data;

        setTimeout(() => {
        loader.style.display = "none";
        dataSection.style.display = "block";
        chartSection.style.display = "block";
        suggestionSection.style.display = "block";
        }, 1000);

        populateTable(data.tableData);
        populateSuggestions(data.restockSuggestions);

        document.querySelector(".chart-section").classList.add("show");

    } catch (error) {
        loader.style.display = "none";
        alert("Error uploading file");
        console.error(error);
    }
});

// ---------------- TABLE ----------------
function populateTable(rows) {

    let html = `
        <tr>
            <th>Date</th>
            <th>Product ID</th>
            <th>Category</th>
            <th>Price</th>
            <th>Units Sold</th>
        </tr>
    `;

    rows.forEach(r => {
        html += `
            <tr>
                <td>${r.Date}</td>
                <td>${r["Product ID"]}</td>
                <td>${r.Category}</td>
                <td>${r.Price}</td>
                <td>${r["Units Sold"]}</td>
            </tr>
        `;
    });

    dataTable.innerHTML = html;
}

const monthOrder = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12
};

// ---------------- SUGGESTIONS ----------------
function populateSuggestions(list) {
    suggestionText.innerHTML = "<ul class='suggestion-list'></ul>";
    const ul = suggestionText.querySelector(".suggestion-list");

    const sortedList = list.sort((a, b) => {
        return monthOrder[a.month] - monthOrder[b.month];
    });

    sortedList.slice(0, 10).forEach(s => {  
        ul.innerHTML += `<li>${s.message}</li>`;
    });
}


// ---------------- CHARTS ----------------
function showCharts() {

    if (!chartDataCache) return;

    // -------- BAR CHART (Top Products) --------
    const barLabels = chartDataCache.topProducts.map(p => p["Product ID"]);
    const barValues = chartDataCache.topProducts.map(p => p["Units Sold"]);

    new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: barLabels,
            datasets: [{
                label: "Total Units Sold",
                data: barValues,
                backgroundColor: "#38bdf8"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 3000 }
        }
    });

    // -------- PIE CHART (Demand Share) --------
    const pieLabels = barLabels;
    const pieValues = barValues;

    new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
            labels: pieLabels,
            datasets: [{
                data: pieValues,
                backgroundColor: ["#22c55e", "#eab308", "#ef4444", "#38bdf8", "#a855f7"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateRotate: true,
                duration: 3500
            }
        }
    });
}

// ---------------- SCROLL TRIGGER ----------------
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !chartsRendered) {
                chartsRendered = true;
                showCharts();
            }
        });
    },
    { threshold: 0.5 }
);

observer.observe(chartSection);
