const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');
const chalk = require('chalk');

const tokens = fs.readFileSync('tokens.txt', 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
if (tokens.length === 0) {
    console.log("Token Bulunamadi tokens.txt");
    process.exit(1);
}

let games = [];
try {
    const gameData = JSON.parse(fs.readFileSync('game.json', 'utf8')).randomGameAr;
    if (Array.isArray(gameData)) {
        games = gameData.map(gameName => ({
            name: gameName,
            id: "782685898163617802"
        }));
        console.log(chalk.blue(`[📝] ${games.length} oyun yüklendi`));
    } else {
        console.error(chalk.red('[❌] game.json dosyası hatalı format içeriyor!'));
    }
} catch (error) {
    console.error(chalk.red('[❌] game.json dosyası okunamadı:', error));
}



const songs = JSON.parse(fs.readFileSync('spotify.json', 'utf8')).songs;

const CHUNK_SIZE = 100;
const DELAY_BETWEEN_CHUNKS = 250;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.clear();
console.log(chalk.blue(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           ███╗   ██╗███████╗██████╗ 
           ████╗  ██║██╔════╝██╔══██╗
           ██╔██╗ ██║█████╗  ██████╔╝
           ██║╚██╗██║██╔══╝  ██╔═══╝ 
           ██║ ╚████║███████╗██║     
           ╚═╝  ╚═══╝╚══════╝╚═╝     
       Neptune Token Onliner v2.0 Beta
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`));

function getRandomActivity() {
    if (Math.random() > 0.5 && games.length > 0) {
        const game = games[Math.floor(Math.random() * games.length)];
        console.log(chalk.magenta(`[🎮] ${game.name} oyunu başlatıldı`));
        return {
            application_id: "782685898163617802",
            name: game.name,
            type: 0,
            state: "Playing",
            details: game.name,
            assets: {
                large_text: `Playing ${game.name}`
            },
            timestamps: {
                start: Date.now()
            }
        };
    } else {
        const song = songs[Math.floor(Math.random() * songs.length)];
        console.log(chalk.cyan(`[🎵] ${song.details} şarkısı çalınıyor`));
        return {
            name: song.details,
            type: 2,
            details: song.details,
            state: song.state,
            assets: {
                large_text: song.largeText,
                large_image: song.largeImage
            },
            timestamps: {
                start: Date.now(),
                end: Date.now() + (song.length * 1000)
            }
        };
    }
}

function generateFingerprint() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

function getRandomUserAgent() {
    const userAgents = fs.readFileSync('useragents.txt', 'utf8').split('\n').filter(line => line.trim().length > 0);
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function generateClientInfo() {
    return {
        client_build_number: Math.floor(Math.random() * (200000 - 160000) + 160000),
        client_version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 9)}`,
        os_version: `${Math.floor(Math.random() * 5) + 10}.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 5)}`,
        os: os.platform(),
        browser: "Chrome",
        browser_user_agent: getRandomUserAgent(),
        browser_version: `${Math.floor(Math.random() * 20) + 80}.0.${Math.floor(Math.random() * 5000)}.${Math.floor(Math.random() * 200)}`,
        os_arch: os.arch(),
        system_locale: "tr-TR",
        client_performance_memory: {
            jsHeapSizeLimit: 4294705152,
            totalJSHeapSize: Math.floor(Math.random() * 100000000),
            usedJSHeapSize: Math.floor(Math.random() * 50000000)
        }
    };
}

function online(token) {
    let ws;
    let heartbeatInterval;
    let sessionId = null;
    let reconnectAttempts = 0;
    let isReconnecting = false;
    let isConnected = false;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const INITIAL_RECONNECT_DELAY = 5000;
    const MAX_RECONNECT_DELAY = 30000;

    function getReconnectDelay() {
        return Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    }

    function clearHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    }

    function connect() {
        if (isReconnecting || isConnected) return;
        
        const clientInfo = generateClientInfo();
        const fingerprint = generateFingerprint();
        
        ws = new WebSocket("wss://gateway.discord.gg/?v=9&encoding=json");
        
        ws.on('open', () => {
            isConnected = true;
            reconnectAttempts = 0;
            console.log(chalk.green(`[🌊] Token Aktif: ${token.substring(0, 10)}...`));
            
            const activity = getRandomActivity();
            ws.send(JSON.stringify({
                op: 2,
                d: {
                    token: token,
                    capabilities: 16381,
                    properties: {
                        os: clientInfo.os,
                        browser: clientInfo.browser,
                        device: "",
                        system_locale: clientInfo.system_locale,
                        browser_user_agent: clientInfo.browser_user_agent,
                        browser_version: clientInfo.browser_version,
                        os_version: clientInfo.os_version,
                        client_build_number: clientInfo.client_build_number,
                        client_version: clientInfo.client_version,
                        os_arch: clientInfo.os_arch
                    },
                    presence: {
                        activities: [activity],
                        status: getRandomStatus(),
                        since: Date.now(),
                        afk: false
                    },
                    compress: false,
                    client_state: {
                        guild_versions: {},
                        highest_last_message_id: "0",
                        read_state_version: 0,
                        user_guild_settings_version: -1,
                        user_settings_version: -1,
                        private_channels_version: "0"
                    },
                    client_info: {
                        client_build_number: clientInfo.client_build_number,
                        client_version: clientInfo.client_version,
                        fingerprint: fingerprint
                    }
                }
            }));
        });

        ws.on('message', (data) => {
            const payload = JSON.parse(data);
            
            switch (payload.op) {
                case 10:
                    clearHeartbeat();
                    heartbeatInterval = setInterval(() => {
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ op: 1, d: null }));
                        }
                    }, payload.d.heartbeat_interval);
                    break;
                case 11:
                    
                    break;
                case 0:
                    if (payload.t === 'READY') {
                        sessionId = payload.d.session_id;
                    }
                    break;
            }
        });

        ws.on('error', (error) => {
            if (!isReconnecting) {
                console.log(chalk.red(`[⚠️] Bağlantı Hatası: ${token.substring(0, 10)}... - ${error.message}`));
                cleanup();
                reconnect();
            }
        });

        ws.on('close', () => {
            if (!isReconnecting && isConnected) {
                console.log(chalk.yellow(`[🔌] Bağlantı Kesildi: ${token.substring(0, 10)}...`));
                cleanup();
                reconnect();
            }
        });
    }

    function cleanup() {
        isConnected = false;
        clearHeartbeat();
        if (ws) {
            ws.removeAllListeners();
            try {
                ws.terminate();
            } catch (err) {}
            ws = null;
        }
    }

    function reconnect() {
        if (isReconnecting) return;
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log(chalk.red(`[❌] Maksimum yeniden bağlantı denemesi aşıldı: ${token.substring(0, 10)}...`));
            cleanup();
            return;
        }

        isReconnecting = true;
        reconnectAttempts++;

        const delay = getReconnectDelay();
        console.log(chalk.yellow(`[🔄] Yeniden bağlanılıyor ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} - ${delay/1000} saniye içinde...`));

        setTimeout(() => {
            isReconnecting = false;
            connect();
        }, delay);
    }

    function getRandomStatus() {
        return ["online", "dnd", "idle"][Math.floor(Math.random() * 3)];
    }

    connect();
}

async function startTokens() {
    const chunks = [];
    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
        chunks.push(tokens.slice(i, i + CHUNK_SIZE));
    }

    console.log(chalk.blue(`[📊] Toplam ${tokens.length} token ${chunks.length} parçada başlatılıyor`));

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(chalk.cyan(`[🔄] Parça ${i + 1}/${chunks.length} başlatılıyor (${chunk.length} token)`));
        
        chunk.forEach(token => {
            setTimeout(() => online(token), Math.random() * 1000);
        });

        if (i < chunks.length - 1) {
            await sleep(DELAY_BETWEEN_CHUNKS);
        }
    }
}

console.log(chalk.magenta('[🚀] Token Onliner Başlatılıyor...'));
startTokens().then(() => {
    console.log(chalk.green(`
    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃  [✅] Tüm tokenler aktifleştirildi! ┃
    ┃  [💙] Neptune Developments          ┃
    ┃  [🌐] discord.gg/neptunedev        ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`));
});

setInterval(() => {
    const time = new Date().toLocaleTimeString('tr-TR');
    const date = new Date().toLocaleDateString('tr-TR');
    console.log(chalk.cyan(`
    [⏰] Saat: ${time}
    [📅] Tarih: ${date}
    [💫] Neptune Token Onliner Aktif
    [👥] Toplam Token: ${tokens.length}`));
}, 30000);

process.on('unhandledRejection', (error) => {
    console.error(chalk.red('[💥] Beklenmeyen Hata:', error));
});
