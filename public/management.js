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

        list.innerHTML = archives.map(archive => {
            const name = archive.name;
            const size = parseFloat(archive.size || 0).toFixed(2);

            const match = name.match(/backup_(\d{8})-(\d{6})/);
            let formattedDate = 'Desconhecida';

            if (match) {
                const datePart = match[1]; // YYYYMMDD
                const timePart = match[2]; // HHMMSS

                const year = datePart.substring(0, 4);
                const month = datePart.substring(4, 6);
                const day = datePart.substring(6, 8);

                const hour = timePart.substring(0, 2);
                const minute = timePart.substring(2, 4);
                const second = timePart.substring(4, 6);

                formattedDate = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
            }

            return `
                <tr>
                    <td>${name}</td>
                    <td>${formattedDate}</td>
                    <td>${size} MB</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="downloadArchive('${name}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteArchive('${name}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
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
        const url = `/api/download-archive/${filename}?delete=true&_=${Date.now()}`;
        const link = document.createElement('a');
        link.href = url;
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