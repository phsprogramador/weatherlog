document.addEventListener('DOMContentLoaded', () => {    
    loadArchiveList();    
    
    document.getElementById('generate-backup').addEventListener('click', generateBackup);
    document.getElementById('manual-purge').addEventListener('click', executeManualPurge);
});

async function loadArchiveList() {
    try {
        const response = await fetch('/api/list-archives');
        const archives = await response.json();
        const list = document.getElementById('archive-list');
        
        list.innerHTML = archives.map(archive => `
            <div class="archive-item">
                <span>${archive.name} (${archive.size} MB)</span>
                <div>
                    <button onclick="downloadArchive('${archive.name}')">Download</button>
                    <button onclick="deleteArchive('${archive.name}')">Excluir</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
    }
}

async function generateBackup() {
    const status = document.getElementById('backup-status');
    status.textContent = "Gerando backup...";
    
    try {
        const response = await fetch('/api/generate-backup');
        if (response.ok) {
            const data = await response.json();
            status.textContent = `Backup gerado: ${data.filename}`;
            loadArchiveList();
        }
    } catch (error) {
        status.textContent = "Erro ao gerar backup";
        console.error(error);
    }
}

async function executeManualPurge() {
    const status = document.getElementById('purge-status');
    status.textContent = "Executando expurgo...";
    
    try {
        const response = await fetch('/api/purge-data', { method: 'POST' });
        if (response.ok) {
            const result = await response.json();
            status.textContent = `Expurgo completo: ${result.deleted} registros removidos`;
        }
    } catch (error) {
        status.textContent = "Erro ao executar expurgo";
        console.error(error);
    }
}

async function downloadArchive(filename) {
    try {        
        const link = document.createElement('a');
        link.href = `/api/download-archive/${filename}?delete=true`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(loadArchiveList, 2500);
    } catch (error) {
        console.error('Erro no download:', error);
    }
}

async function deleteArchive(filename) {
    if (confirm(`Tem certeza que deseja excluir permanentemente ${filename}?`)) {
        try {
            await fetch(`/api/delete-archive/${filename}`, { method: 'DELETE' });
            loadArchiveList();
        } catch (error) {
            console.error('Erro ao excluir:', error);
        }
    }
}