const fileInput = document.getElementById("fileInput");
const loader = document.getElementById("loader");
const chartSection = document.getElementById("chartSection");
const dataSection = document.getElementById("dataSection");
const dataTable = document.getElementById("dataTable");
const suggestionSection = document.getElementById("suggestion");
const suggestionText = document.getElementById("suggestionText");

fileInput.addEventListener("change", () => {
    loader.style.display = "block";

    setTimeout(() => {
        loader.style.display = "none";
        dataSection.style.display = "block";
        chartSection.style.display = "block";
        suggestionSection.style.display = "block";
        showDummyTable();
        document.querySelector(".chart-section").classList.add("show");
        showSuggestion();
    }, 2000);
});

function showDummyTable() {
    dataTable.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Product</th>
            <th>Quantity Sold</th>
        </tr>
        <tr><td>2024-01-01</td><td>Laptop</td><td>40</td></tr>
        <tr><td>2024-01-02</td><td>Mouse</td><td>55</td></tr>
        <tr><td>2024-01-03</td><td>Keyboard</td><td>48</td></tr>
    `;
}

function showCharts() {
    // Bar Chart
    new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: ["Day 1", "Day 2", "Day 3"],
            datasets: [
                {
                    label: "Actual Sales",
                    data: [40, 55, 48],
                    backgroundColor: "#38bdf8"
                },
                {
                    label: "Predicted Sales",
                    data: [45, 50, 52],
                    backgroundColor: "#22c55e"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 4000
            }
        }
    });

    // Pie Chart
    new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
        labels: ["High Demand", "Medium Demand", "Low Demand"],
        datasets: [{
            data: [45, 35, 20],
            backgroundColor: ["#22c55e", "#eab308", "#ef4444"],
            borderWidth: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            animateRotate: true,
            duration: 4000,
        },
    }});

}

function showSuggestion() {
    suggestionSection.style.display = "block";
    suggestionText.innerHTML =
        "📢 Based on predicted demand, it is recommended to <b>increase stock by 20%</b> for the upcoming period to avoid understock situations.";
}

let chartsRendered = false;

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !chartsRendered) {
                chartsRendered = true;
                showCharts();   // 🔥 trigger animation here
            }
        });
    },
    {
        threshold: 0.5   // 50% visible
    }
);

observer.observe(chartSection);
