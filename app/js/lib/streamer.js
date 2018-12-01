'use strict';

const Streamer = {
    client: null,
    streaminfo: {},
    getInstance: () => {
        if (Streamer.client === null) {
            Streamer.client = new (require('webtorrent'))({
                maxConns: 40,
                tracker: [
                'udp://tracker.leechers-paradise.org:6969/announce',
                'udp://tracker.coppersurfer.tk:6969/announce',
                'udp://glotorrents.pw:6969/announce','udp://exodus.desync.com:6969/announce',
                'udp://tracker.opentrackr.org:1337/announce',
                'udp://9.rarbg.com:2710/announce',        
                'udp://tracker.openbittorrent.com:80',       
                'udp://tracker.publicbt.com:80/announce',        
                'udp://tracker.empire-js.us:1337',       
                'wss://tracker.openwebtorrent.com',       
                'wss://tracker.fastcast.nz',        
                'wss://tracker.btorrent.xyz'
                ],
                dht: true
            });
        }
        return Streamer.client;
    },
    start: (magnet, index) => {
        if (Streamer.client) Streamer.stop();
        console.info('Streamer - loading', magnet.split('&')[0]);

        return Streamer.fetchTorrent(magnet).then(torrent => {
            console.info('Streamer connected', torrent);

            Streamer.handleTorrent(torrent, index);
            Streamer.handleStreaminfo(torrent);

            return Streamer.createServer(torrent);
        });
    },
    stop: () => {
        clearInterval(Streamer.streaminfo.updateInterval);
        nw.Window.get().setProgressBar(0);
        Streamer.streaminfo = {};

        if (Streamer.client) {
            Streamer.client.destroy();
            Streamer.client = null;
            console.info('Streamer stopped');
        }        
    },
    magnetTimeout: 10000,
    fetchTorrent: (magnet) => {
        return new Promise((resolve, reject) => {
            let client = Streamer.getInstance();
            let torrent = client.add(magnet, {
                path: Cache.dir
            });

            let timeout = setTimeout(() => {
                reject(new Error('Streamer - magnet timed out'));
            }, Streamer.magnetTimeout);

            torrent.on('metadata', () => {
                clearTimeout(timeout);
                return resolve(torrent);
            });
            torrent.on('error', reject);
            client.on('error', reject);
        });
    },
    handleTorrent: (torrent, index) => {
        if (!index) {
            index = 0;

            // sort files by size
            torrent.files = torrent.files.sort((a, b) => {
                if (a.length > b.length) return -1;
                if (a.length < b.length) return 1;
                return 0;
            });
        }

        // don't download anything (still a bug: https://github.com/webtorrent/webtorrent/issues/164)
        torrent.deselect(0, torrent.pieces.length - 1, false);
        torrent.files.forEach(file => file.deselect());

        // download only the largest file
        torrent.files[index].select();

        Streamer.streaminfo.file_index = index;
        Streamer.streaminfo.file_name = torrent.files[index].name;
        Streamer.streaminfo.file_size = torrent.files[index].length;
    },
    handleStreaminfo: (torrent) => {
        Streamer.streaminfo.torrent = torrent;
        Streamer.streaminfo.updateInterval = setInterval(() => {
            Streamer.updateInfos(Streamer.streaminfo.torrent);
        }, 1000);
    },
    createServer: (torrent, port) => {
        return new Promise(resolve => {
            let serverPort = port || 9000;

            try {
                torrent.createServer().listen(serverPort);

                Streamer.streaminfo.url = 'http://127.0.0.1:' + serverPort + '/' + Streamer.streaminfo.file_index;

                resolve(Streamer.streaminfo.url);
            } catch (e) {
                setTimeout(() => {
                    let rand = Math.floor(Math.random() * (65535 - 1024)) + 1024;
                    return Streamer.createServer(rand).then(resolve);
                }, 100);
            }
        });
    },
    updateInfos: (torrent) => {
        let downloaded = torrent.files[Streamer.streaminfo.file_index].downloaded || 0;

        let percent = (100 / Streamer.streaminfo.file_size) * downloaded;
        if (percent >= 100) percent = 100;

        let time_left = Math.round((Streamer.streaminfo.file_size - downloaded) / torrent.downloadSpeed);
        if (isNaN(time_left) || time_left < 0) {
            time_left = 0;
        } else if (!isFinite(time_left)) {
            time_left = undefined;
        }
        
        Streamer.streaminfo.stats = {
            total_peers: torrent.numPeers,
            download_speed: torrent.downloadSpeed,
            upload_speed: torrent.uploadSpeed,
            downloaded_bytes: downloaded,
            remaining_time: time_left,
            downloaded_percent: percent
        };
    }
}
