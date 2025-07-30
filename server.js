const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const BME280 = require('bme280-sensor');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'sensor_data.db');
const archiveDir = path.join(__dirname, 'archives');
const tempDir = path.join(__dirname, 'temp');

const app = express();
const PORT = 3000;
const seaLevelRise = 830.40;

const bme280 = new BME280({ i2cBusNumber: 1, i2cAddress: 0x76 });

const db = new sqlite3.Database('./sensor_data.db');

[archiveDir, tempDir].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir); });

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature REAL,
      humidity REAL,
      pressure REAL,
      timestamp DATETIME
    )`);

  db.run('CREATE INDEX IF NOT EXISTS idx_temperature ON sensor_data(temperature)');
  db.run('CREATE INDEX IF NOT EXISTS idx_humidity ON sensor_data(humidity)');
  db.run('CREATE INDEX IF NOT EXISTS idx_pressure ON sensor_data(pressure)');

});

async function adjustToSeaLevel(pressure_hPa, temperature_C) {
    return pressure_hPa * Math.pow(1 - (0.0065 * seaLevelRise) / (temperature_C + 0.0065 * seaLevelRise + 273.15), -5.257);
}

async function initSensor() {
  try {
    await bme280.init();
    await readSensorData();
    setInterval(readSensorData, 300000);
  } catch (err) {
    console.error('Falha ao inicializar sensor:', err);
  }
}

async function readSensorData() {
  try {
    const data = await bme280.readSensorData();
    const { temperature_C, humidity, pressure_hPa } = data;

    let adjustedPressure = await adjustToSeaLevel(pressure_hPa, temperature_C);

    db.run(
      'INSERT INTO sensor_data (temperature, humidity, pressure, timestamp) VALUES (?, ?, ?, strftime("%Y-%m-%d %H:%M:00", "now", "localtime"))',
      [temperature_C.toFixed(2), humidity.toFixed(2), adjustedPressure.toFixed(2)],
      (err) => {
        if (err) console.error('Erro ao salvar dados:', err);
        else console.log('Dados salvos:', { temperature_C, humidity, adjustedPressure });
      }
    );
  } catch (err) {
    console.error('Erro ao ler sensor:', err);
  }
}

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/api/download-archive', express.static(archiveDir, { etag: false, lastModified: false, cacheControl: false, maxAge: 0 }));

app.get('/api/data', (req, res) => {
  db.all(
    'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.get('/api/hourly-avg', (req, res) => {
    db.all(`
        SELECT 
            strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
            ROUND(AVG(temperature), 2) as avg_temp,
            ROUND(AVG(humidity), 2) as avg_humidity,
            ROUND(AVG(pressure), 2) as avg_pressure,
            COUNT(*) as readings
        FROM sensor_data
        WHERE timestamp >= datetime('now', '-48 hours')
        GROUP BY strftime('%Y-%m-%d %H', timestamp)
        ORDER BY hour DESC
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }        
        
        const formattedData = rows.map(row => ({
            hora: row.hour,
            temperatura: row.avg_temp,
            umidade: row.avg_humidity,
            pressao: row.avg_pressure,
            leituras: row.readings
        }));
        
        res.json(formattedData);
    });
});

app.get('/api/extremes', (req, res) => {
    db.get(
        `SELECT 
            MAX(temperature) as temp_max, 
            MIN(temperature) as temp_min,
            MAX(humidity) as humidity_max,
            MIN(humidity) as humidity_min,
            MAX(pressure) as pressure_max,
            MIN(pressure) as pressure_min
        FROM sensor_data
        WHERE timestamp >= datetime('now', '-1 day')`,
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }            
            
            const defaults = {
                temp_max: null,
                temp_min: null,
                humidity_max: null,
                humidity_min: null,
                pressure_max: null,
                pressure_min: null
            };
            
            const result = { ...defaults, ...row };
            
            res.json({
                temperature: {
                    max: result.temp_max,
                    min: result.temp_min
                },
                humidity: {
                    max: result.humidity_max,
                    min: result.humidity_min
                },
                pressure: {
                    max: result.pressure_max,
                    min: result.pressure_min
                }
            });
        }
    );
});

app.get('/api/generate-backup', (req, res) => {

    const now = new Date();
    const gmt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const filename = `backup_${gmt.toISOString().replace(/-/g, '').replace(/:/g, '').replace(/T/, '-').split('.')[0]}.db`;

    const tempFilePath = path.join(archiveDir, filename);
    
    fs.copyFile(dbPath, tempFilePath, (err) => {
        if (err) { return res.status(500).json({ error: err.message }); }        
        res.json({ filename });
    });

    [archiveDir, tempDir].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir);});
});

app.get('/api/download-archive/:filename', (req, res) => {
    const filename = req.params.filename;
    const dir = req.query.delete ? tempDir : archiveDir;
    const filePath = path.join(dir, filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('Arquivo não encontrado:', filePath);
            return res.status(404).send('Arquivo não encontrado');
        }

        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Erro ao fazer download:', err);
                return res.sendStatus(500);
            }

            if (req.query.delete) {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Erro ao excluir arquivo temporário:', unlinkErr);
                });
            }
        });
    });
});

app.delete('/api/delete-archive/:filename', (req, res) => {
    const filePath = path.join(archiveDir, req.params.filename);
    
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/list-archives', (req, res) => {
    fs.readdir(archiveDir, (err, files) => {
        if (err) return res.status(500).json({ error: err.message });
        
        Promise.all(files.map(file => {
            return new Promise((resolve) => {
                fs.stat(path.join(archiveDir, file), (statErr, stats) => {
                    resolve({
                        name: file,
                        size: (stats.size / (1024 * 1024)).toFixed(2)
                    });
                });
            });
        })).then(fileData => res.json(fileData));
    });
});

app.post('/api/purge-data', (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    db.run(
        'DELETE FROM sensor_data WHERE timestamp < ?',
        [sixMonthsAgo.toISOString()],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                db.run('VACUUM');
                res.json({ deleted: this.changes });
            }
        }
    );
});

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://http://192.168.0.170:${PORT}`);
  initSensor();
});