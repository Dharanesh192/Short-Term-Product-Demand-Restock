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
            <th>Product Name</th>
            <th>No of Products</th>
            <th>Units Sold</th>
            <th>Location</th>
        </tr>
    `;

    rows.forEach(r => {
        html += `
            <tr>
                <td>${r.Date}</td>
                <td>${r["Product Name"]}</td>
                <td>${r["No of Products"]}</td>
                <td>${r["Units Sold"]}</td>
                <td>${r.Location}</td>
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

    const data = chartDataCache.topDemandByMonthLocation;

    // ---------- BAR CHART (Product + Month + Location) ----------
    const barLabels = data.map(
        d => `${d["Product Name"]} - ${d.Month})`
    );

    const barValues = data.map(d => d["Units Sold"]);

    new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: barLabels,
            datasets: [{
                label: "Units Sold",
                data: barValues,
                backgroundColor: "#38bdf8"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 4000 },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: "Top Product Demand by Month & Location",
                    color: "#ffffff",
                    font: {
                        size: 18,
                        weight: "bold"
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        }
    });

    // ---------- PIE CHART (Product + Location Demand Share) ----------

const comboTotals = {};

// combine product + location
chartDataCache.topDemandByMonthLocation.forEach(d => {
    const key = `${d["Product Name"]} - ${d.Location}`;
    comboTotals[key] = (comboTotals[key] || 0) + d["Units Sold"];
});

const pieLabels = Object.keys(comboTotals);
const pieValues = Object.values(comboTotals);

new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
        labels: pieLabels,
        datasets: [{
            data: pieValues,
            backgroundColor: [
                "#22c55e", "#eab308", "#ef4444",
                "#38bdf8", "#a855f7", "#14b8a6",
                "#f97316", "#06b6d4"
            ]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 3000 , easing: "easeInOutQuad"},
        plugins: {
            title: {
                display: true,
                text: "Product-wise Demand Share by Location",
                color: "#ffffff",
                font: {
                    size: 18,
                    weight: "bold"
                }
            }
        }
    }
});

// ---------- LINE CHART (Location vs Units Sold | Hover = Product Name) ----------

    const labels = data.map(d => d.Location);              // X-axis
    const values = data.map(d => d["Units Sold"]);         // Y-axis
    const productNames = data.map(d => d["Product Name"]); // Tooltip

    new Chart(document.getElementById("lineChart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Units Sold",
                data: values,
                borderColor: "#22c55e",
                backgroundColor: "#22c55e",
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 2000 },
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Location-wise Demand Trend (Hover for Product)",
                    color: "#ffffff",
                    font: {
                        size: 18,
                        weight: "bold"
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const idx = context.dataIndex;
                            return [
                                `Product: ${productNames[idx]}`,
                                `Units Sold: ${context.parsed.y}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Location",
                        color: "#ffffff"
                    },
                    ticks: { color: "#ffffff" }
                },
                y: {
                    title: {
                        display: true,
                        text: "Units Sold",
                        color: "#ffffff"
                    },
                    ticks: { color: "#ffffff" }
                }
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