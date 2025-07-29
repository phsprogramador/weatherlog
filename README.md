# 🌦️ Projeto de Estudo: Monitor Ambiental com Raspberry Pi

![Dashboard](https://github.com/phsprogramador/weatherlog/blob/main/public/img/screenshot_index.jpg)

![Dashboard](https://github.com/phsprogramador/weatherlog/blob/main/public/img/screenshot_management.jpg)


## 📌 Objetivo

Projeto educativo para monitoramento ambiental utilizando Raspberry Pi Zero 2 W e sensor BMP280, desenvolvido com Node.js para:

- Aprender sobre IoT e eletrônica básica  
- Coletar dados atmosféricos em tempo real  
- Praticar desenvolvimento full-stack (Node.js + SQLite + Frontend)
- Estudar padrões meteorológicos locais  

## 🛠️ Hardware Utilizado

| Componente       | Especificações                   |
|------------------|----------------------------------|
| Placa            | Raspberry Pi Zero 2 W            |
| Sensor           | BMP280 (Temperatura + Pressão)   |
| Conexão          | Interface I2C                    |
| Alimentação      | Fonte 5V 2.5A                    |

## 📊 Dados Coletados

- Temperatura ambiente (°C)  
- Pressão atmosférica (hPa)  
- Umidade relativa do ar (%)

## ⚙️ Dependências Técnicas

### Backend (Node.js)

```bash
npm install express sqlite3 bme280-sensor
```

### Frontend

```html
<!-- CDNs no HTML -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

## 🚀 Como Executar

### Configuração Inicial

```bash
sudo raspi-config
# Ativar Interface I2C
```

### Clonar Repositório

```bash
git clone https://github.com/seu-usuario/weatherlog.git
cd weatherlog
```

### Instalar Dependências

```bash
npm install
```

### Iniciar Serviço

```bash
node server.js
# Acessar: http://localhost:3000
```

## 🏗️ Estrutura do Projeto

```
/
├── public/                           # Frontend
│   ├── css/                          # Sheet styles CSS
│   │   ├──  all.min.css              # Ícones Font Awesome
│   │   ├──  bootstrap.min.css        # Framework CSS
│   │   ├──  styles.css               # Estilos personalizados
│   ├── img/                          # Pasta de imagens
│   │   ├──  fav.ico                  # Ícone da aplicação  
│   ├── js/                           # JavaScript library
│   │   ├──  bootstrap.bundle.min.js  # Bootstrap
│   │   ├──  chart.js                 # Visualização de gráficos
│   │   ├──  fonticons.js             # Suporte a ícones
│   │   ├──  sql-wasm.js              # SQLite no navegador 
│   │   ├──  sql-wasm.wasm            # SQLite no navegador 
│   ├── index.html                    # Dashboard principal
│   ├── index.js                      # Lógica do dashboard
│   ├── management.html               # Gerenciamento de dados
│   └── management.js                 # Lógica do gerenciamento de dados
├── server.js                         # Backend Node.js
├── sensor_data.db                    # Banco de dados SQLite
└── README.md                         # Documentação do projeto
```

## 📚 Aprendizados

- Integração de sensores com Raspberry Pi  
- Desenvolvimento de APIs REST com Express.js  
- Armazenamento local com SQLite  
- Visualização de dados com Chart.js  
- Deploy de aplicações IoT

## 🔮 Melhorias Futuras

- Adicionar anemometro
- Adicionar pluviometro
- Adicionar histórico sazonal  

## 📄 Licença

MIT License
