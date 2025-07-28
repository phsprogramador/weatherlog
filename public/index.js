document.addEventListener('DOMContentLoaded', () => {
    const tempCtx = document.getElementById('temp-chart').getContext('2d');
    const humidityCtx = document.getElementById('humidity-chart').getContext('2d');
    const pressureCtx = document.getElementById('pressure-chart').getContext('2d');

    const tempChart = new Chart(tempCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ 
            label: 'Temperatura (°C)', 
            data: [], 
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.1
        }]},
        options: responsiveChartOptions('Temperatura')
    });
    
    const humidityChart = new Chart(humidityCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ 
            label: 'Umidade (%)', 
            data: [], 
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.1
        }]},
        options: responsiveChartOptions('Umidade')
    });
    
    const pressureChart = new Chart(pressureCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ 
            label: 'Pressão (hPa)', 
            data: [], 
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.1
        }]},
        options: responsiveChartOptions('Pressão')
    });    
    
    function responsiveChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: { size: 16 }
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        };
    }

    async function updateData() {
        try {
            const [currentData, hourlyData, extremesData] = await Promise.all([
                fetch('/api/data').then(res => res.json()),
                fetch('/api/hourly-avg').then(res => res.json()),
                fetch('/api/extremes').then(res => res.json())
            ]);
            
            updateCurrentReadings(currentData);
            updateHourlyAverages(hourlyData);
            updateExtremes(extremesData);
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
        }
    }
    
    async function fetchExtremes() {
        try {
            const response = await fetch('/api/extremes');
            if (!response.ok) throw new Error('Erro na rede');
            
            const data = await response.json();            
            
            const formatValue = (value) => value !== null ? value.toFixed(1) : '--';
            
            document.getElementById('temp-max').textContent = formatValue(data.temperature?.max);
            document.getElementById('temp-min').textContent = formatValue(data.temperature?.min);
            
            document.getElementById('humidity-max').textContent = formatValue(data.humidity?.max);
            document.getElementById('humidity-min').textContent = formatValue(data.humidity?.min);
            
            document.getElementById('pressure-max').textContent = formatValue(data.pressure?.max);
            document.getElementById('pressure-min').textContent = formatValue(data.pressure?.min);
            
        } catch (error) {
            console.error('Erro ao buscar extremos:', error);
            
            ['temp', 'humidity', 'pressure'].forEach(type => {
                document.getElementById(`${type}-max`).textContent = '--';
                document.getElementById(`${type}-min`).textContent = '--';
            });
        }
    }
    
    function updateCurrentReadings(data) {
        if (data && data.length > 0) {
            const latest = data[0];
            document.getElementById('temperature-value').textContent = latest.temperature?.toFixed(1) || '--';
            document.getElementById('humidity-value').textContent = latest.humidity?.toFixed(1) || '--';
            document.getElementById('pressure-value').textContent = latest.pressure?.toFixed(1) || '--';            
            
            const chartData = data.slice(0, 24).reverse();
            const labels = chartData.map(item => new Date(item.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
            
            updateChart(tempChart, labels, chartData.map(item => item.temperature));
            updateChart(humidityChart, labels, chartData.map(item => item.humidity));
            updateChart(pressureChart, labels, chartData.map(item => item.pressure));
        }
    }
    
    function updateChart(chart, labels, data) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
    }
    
    function updateHourlyAverages(data) {
        const tableBody = document.querySelector('#hourly-table tbody');
        tableBody.innerHTML = data.map(item => `
            <tr>
                <td>${formatHour(item.hora)}</td>
                <td>${item.temperatura?.toFixed(1) || '--'}</td>
                <td>${item.umidade?.toFixed(1) || '--'}</td>
                <td>${item.pressao?.toFixed(1) || '--'}</td>                
            </tr>
        `).join('');
    }

    function updateExtremes(data) {
        const format = val => val?.toFixed(1) || '--';    
        document.getElementById('temp-max').textContent = format(data.temperature?.max);
        document.getElementById('temp-min').textContent = format(data.temperature?.min);

        document.getElementById('humidity-max').textContent = format(data.humidity?.max);
        document.getElementById('humidity-min').textContent = format(data.humidity?.min);

        document.getElementById('pressure-max').textContent = format(data.pressure?.max);
        document.getElementById('pressure-min').textContent = format(data.pressure?.min);
    }
    
    function formatHour(dateTime) {
        return new Date(dateTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    }

    updateData();
    setInterval(updateData, 300000);
    
    async function downloadData() {
        try {
            const response = await fetch('/api/download-data');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dados-sensor_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Erro no download:', error);            
        }
    }
});